import WizardScene from 'telegraf/scenes/wizard';
import {getInlineKeyboard} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import {selectController} from '../common';
import type { BotContext } from '../../index';
import {
    actionHandler,
    ACTION_STAT_DAY,
    ACTION_STAT_WEEK,
} from './actions';


const SELECT_CONTROLLER_STEP_INDEX = 0;


const selectAction = async (ctx: BotContext): Promise<typeof WizardScene> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const selectedControllerId = ctx.update.callback_query?.data;
    const controllerIds = await getControllerIds(db, {chatId});

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    await ctx.reply('Select an action', getInlineKeyboard([ACTION_STAT_DAY, ACTION_STAT_WEEK]));

    return ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<typeof WizardScene> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const selectedAction = ctx.update.callback_query?.data;
    const {controllerId} = ctx.session;

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    if (!chatId) {
        return ctx.scene.leave();
    }

    const {text, image} = await actionHandler(selectedAction, {db, chatId, controllerId});

    if (image) {
        await ctx.replyWithPhoto({source: image});
    }

    if (text) {
        await ctx.reply(text);
    }

    return ctx.scene.leave();
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default new WizardScene('stat',
    selectController,
    selectAction,
    handleAction,
);