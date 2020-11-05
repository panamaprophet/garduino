import WizardScene from 'telegraf/scenes/wizard';
import {getInlineKeyboard} from '../../helpers';
import {getControllerIds} from '../../../resolvers/controller';
import {
    actionHandler,
    ACTION_CONTROLLER_ADD,
    ACTION_CONTROLLER_REMOVE,
} from './actions';

import type {BotContext} from '../../index';


const SELECT_ACTION_STEP_INDEX = 0;


const selectAction = async (ctx: BotContext): Promise<any> => {
    ctx.reply('Select action', getInlineKeyboard([
        ACTION_CONTROLLER_ADD,
        ACTION_CONTROLLER_REMOVE,
    ]));

    return ctx.wizard.next();
};

const collectValue = async (ctx: BotContext): Promise<any> => {
    const selectedAction = ctx.update.callback_query?.data;

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

const handleAction = async (ctx: BotContext): Promise<any> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {action} = ctx.session;
    const controllerId = (action === ACTION_CONTROLLER_ADD)
        ? ctx.message?.text
        : ctx.update.callback_query?.data;

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    if (!chatId) {
        return ctx.scene.leave();
    }

    const {success} = await actionHandler(action, {db, chatId, controllerId});
    const response = success ? 'Success' : 'Fail';

    await ctx.reply(response);

    return ctx.scene.leave();
};


export const ControllerManagerController = new WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);