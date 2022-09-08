import { Scenes, Markup, MiddlewareFn } from 'telegraf';
import { getInlineKeyboard, isTextMessage } from '../../helpers';
import { getControllerIds } from '../../../resolvers/controller';
import { BotContext } from 'types';
import { actionHandler, ACTION_CONTROLLER_ADD, ACTION_CONTROLLER_REMOVE } from './actions';


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
        const { chat } = ctx;
        const chatId = chat?.id;
        const controllerIds = await getControllerIds({ chatId });

        await ctx.reply('Select controller to remove', getInlineKeyboard(controllerIds));
    }

    return ctx.wizard.next();
};

const handleAction: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const { action } = ctx.session;
    const controllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!chatId || !controllerId) {
        return ctx.scene.leave();
    }

    return actionHandler(action, { chatId, controllerId })
        .then(({ success }) => success ? 'Success' : 'Fail')
        .then(response => ctx.replyWithMarkdownV2(response, Markup.removeKeyboard()))
        .then(() => ctx.scene.leave());
};


export default new Scenes.WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);
