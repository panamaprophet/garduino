import { Scenes, Markup, MiddlewareFn } from 'telegraf';
import { getControllerConfiguration, getControllerIds } from '../../../resolvers/controller';
import { formatConfig } from '../../../helpers/formatters';
import { getInlineKeyboard, isTextMessage } from '../../helpers';
import { BotContext } from 'types';
import { selectController } from '../common';
import { actionHandler, ACTION_LIGHT_ONTIME, ACTION_LIGHT_DURATION, ACTION_TEMPERATURE_THRESHOLD } from './actions';


const SELECT_CONTROLLER_STEP_INDEX = 0;


const selectAction: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const selectedControllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';
    const controllerIds = await getControllerIds({ chatId });

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    const currentSettings = await getControllerConfiguration(selectedControllerId);

    if (!currentSettings) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    const text = formatConfig(currentSettings);

    await ctx.reply(text, getInlineKeyboard([
        ACTION_LIGHT_ONTIME,
        ACTION_LIGHT_DURATION,
        ACTION_TEMPERATURE_THRESHOLD,
    ]));

    return ctx.wizard.next();
};

const collectValue: MiddlewareFn<BotContext> = async ctx => {
    ctx.session.action = isTextMessage(ctx?.message) ? ctx.message.text : '';

    await ctx.reply('Provide new value');

    return ctx.wizard.next();
};

const handleAction: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const { controllerId, action } = ctx.session;
    const value = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!controllerId || !action || !chatId) {
        return ctx.scene.leave();
    }

    return actionHandler(action, { chatId, controllerId, value })
        .then(({ success }) => success ? 'Success' : 'Fail')
        .then(response => ctx.replyWithMarkdownV2(response, Markup.removeKeyboard()))
        .then(() => ctx.scene.leave());
};


export default new Scenes.WizardScene('setup',
    selectController,
    selectAction,
    collectValue,
    handleAction,
);
