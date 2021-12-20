import {Scenes, Markup} from 'telegraf';
import {getInlineKeyboard, isTextMessage} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import type {BotContext} from '../../index';
import {
    actionHandler,
    ACTION_CONTROLLER_ADD,
    ACTION_CONTROLLER_REMOVE,
} from './actions';


const SELECT_ACTION_STEP_INDEX = 0;


const selectAction = async (ctx: BotContext): Promise<void> => {
    await ctx.reply('Select action', getInlineKeyboard([
        ACTION_CONTROLLER_ADD,
        ACTION_CONTROLLER_REMOVE,
    ]));

    ctx.wizard.next();
};

const collectValue = async (ctx: BotContext): Promise<void> => {
    const selectedAction = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!selectedAction || ![ACTION_CONTROLLER_ADD, ACTION_CONTROLLER_REMOVE].includes(selectedAction)) {
        ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
        return;
    }

    ctx.session.action = selectedAction;

    if (selectedAction === ACTION_CONTROLLER_ADD) {
        ctx.reply('Provide new controller Id');
    }

    if (selectedAction === ACTION_CONTROLLER_REMOVE) {
        const {db, chat} = ctx;
        const chatId = chat?.id;
        const controllerIds = await getControllerIds(db, {chatId});

        ctx.reply('Select controller to remove', getInlineKeyboard(controllerIds));
    }

    ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {action} = ctx.session;
    const controllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!controllerId) {
        ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
        return;
    }

    if (!chatId) {
        ctx.scene.leave();
        return;
    }

    const {success} = await actionHandler(action, {db, chatId, controllerId});
    const response = success ? 'Success' : 'Fail';

    ctx.reply(response, Markup.removeKeyboard());
    ctx.scene.leave();
};


export default new Scenes.WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);