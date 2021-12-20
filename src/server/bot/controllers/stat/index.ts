import {MiddlewareFn, Scenes} from 'telegraf';
import {getInlineKeyboard, isTextMessage} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import {selectController} from '../common';
import type {BotContext} from '../../index';
import {actionHandler, ACTION_STAT_DAY, ACTION_STAT_WEEK} from './actions';
import {Markup} from 'telegraf';


const SELECT_CONTROLLER_STEP_INDEX = 0;


const selectAction: MiddlewareFn<BotContext> = async (ctx: BotContext) => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const selectedControllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';
    const controllerIds = await getControllerIds(db, {chatId});

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    ctx.session.controllerId = selectedControllerId;

    ctx.reply('Select an action', getInlineKeyboard([ACTION_STAT_DAY, ACTION_STAT_WEEK]));
    ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const selectedAction = isTextMessage(ctx?.message) ? ctx.message.text : '';
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
        ctx.replyWithPhoto({source: image});
    }

    if (text) {
        ctx.reply(text, Markup.removeKeyboard());
    }

    ctx.scene.leave();
};


export default new Scenes.WizardScene('stat',
    selectController,
    selectAction,
    handleAction,
);