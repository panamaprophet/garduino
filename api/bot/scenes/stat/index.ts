import { MiddlewareFn, Scenes, Markup } from 'telegraf';
import { getInlineKeyboard, isTextMessage } from '../../helpers';
import { getControllerIds } from '../../../resolvers/controller';
import { selectController } from '../common';
import { actionHandler, ACTION_STAT_DAY, ACTION_STAT_WEEK } from './actions';
import { BotContext } from 'types';


const SELECT_CONTROLLER_STEP_INDEX = 0;


const selectAction: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const selectedControllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';
    const controllerIds = await getControllerIds({ chatId });

    if (!controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    await ctx.reply('Select an action', getInlineKeyboard([ACTION_STAT_DAY, ACTION_STAT_WEEK]));

    return ctx.wizard.next();
};

const handleAction: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const action = isTextMessage(ctx.message) ? ctx.message.text : null;
    const { controllerId } = ctx.session;

    if (!controllerId || !chatId || !action) {
        return ctx.scene.leave();
    }

    return actionHandler(action, { chatId, controllerId })
        .then(result => ctx.replyWithMarkdownV2(result, Markup.removeKeyboard()))
        .then(() => ctx.scene.leave());
};


export default new Scenes.WizardScene('stat',
    selectController,
    selectAction,
    handleAction,
);
