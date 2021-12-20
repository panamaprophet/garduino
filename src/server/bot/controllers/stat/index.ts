import {Scenes} from 'telegraf';
import {getInlineKeyboard} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import {selectController} from '../common';
import type {BotContext} from '../../index';
import {actionHandler, ACTION_STAT_DAY, ACTION_STAT_WEEK} from './actions';


const SELECT_CONTROLLER_STEP_INDEX = 0;


const selectAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    const selectedControllerId = ctx.callbackQuery?.data;
    const controllerIds = await getControllerIds(db, {chatId});

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    ctx.session.controllerId = selectedControllerId;

    await ctx.reply('Select an action', getInlineKeyboard([ACTION_STAT_DAY, ACTION_STAT_WEEK]));

    ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    const selectedAction = ctx.callbackQuery?.data;
    const {controllerId} = ctx.session;

    if (!controllerId) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    if (!chatId) {
        ctx.scene.leave();
        return;
    }

    const {text, image} = await actionHandler(selectedAction, {db, chatId, controllerId});

    if (image) {
        await ctx.replyWithPhoto({source: image});
    }

    if (text) {
        await ctx.reply(text);
    }

    ctx.scene.leave();
};


export default new Scenes.WizardScene('stat',
    selectController,
    selectAction,
    handleAction,
);