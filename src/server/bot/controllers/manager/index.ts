import {Scenes, Markup, MiddlewareFn} from 'telegraf';
import {getInlineKeyboard, isTextMessage} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import type {BotContext} from '../../index';
import {
    actionHandler,
    ACTION_CONTROLLER_ADD,
    ACTION_CONTROLLER_REMOVE,
} from './actions';


const SELECT_ACTION_STEP_INDEX = 0;


const selectAction: MiddlewareFn<BotContext> = async ctx => {
    await ctx.reply('Select action', getInlineKeyboard([
        ACTION_CONTROLLER_ADD,
        ACTION_CONTROLLER_REMOVE,
    ]));

    return ctx.wizard.next();
};

const collectValue: MiddlewareFn<BotContext> = async ctx => {
    const selectedAction = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!selectedAction || ![ACTION_CONTROLLER_ADD, ACTION_CONTROLLER_REMOVE].includes(selectedAction)) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    ctx.session.action = selectedAction;

    if (selectedAction === ACTION_CONTROLLER_ADD) {
        await ctx.reply('Provide new controller Id');
    }

    if (selectedAction === ACTION_CONTROLLER_REMOVE) {
        const {db, chat} = ctx;
        const chatId = chat?.id;
        const controllerIds = await getControllerIds(db, {chatId});

        await ctx.reply('Select controller to remove', getInlineKeyboard(controllerIds));
    }

    return ctx.wizard.next();
};

const handleAction: MiddlewareFn<BotContext> = async ctx => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {action} = ctx.session;
    const controllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    if (!chatId) {
        return ctx.scene.leave();
    }

    const {success} = await actionHandler(action, {db, chatId, controllerId});
    const response = success ? 'Success' : 'Fail';

    await ctx.reply(response, Markup.removeKeyboard());

    return ctx.scene.leave();
};


export default new Scenes.WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);