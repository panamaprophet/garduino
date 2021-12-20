import {Scenes} from 'telegraf';
import {getInlineKeyboard} from '../../helpers';
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
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    const selectedAction = ctx.callbackQuery?.data;

    if (!selectedAction || ![ACTION_CONTROLLER_ADD, ACTION_CONTROLLER_REMOVE].includes(selectedAction)) {
        ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
        return;
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

    ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {action} = ctx.session;
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1388
    const controllerId = (action === ACTION_CONTROLLER_ADD) ? ctx.message?.text : ctx.callbackQuery?.data;

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

    await ctx.reply(response);

    ctx.scene.leave();
};


export default new Scenes.WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);