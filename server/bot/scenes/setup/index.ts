import {Scenes, Markup, MiddlewareFn} from 'telegraf';
import {getConfig} from '../../../resolvers/config';
import {getControllerIds} from '../../../resolvers/controller';
import {formatConfig} from '../../../helpers/config';
import {getInlineKeyboard, isTextMessage} from '../../helpers';
import {BotContext} from 'types';
import {selectController} from '../common';
import {actionHandler, ACTION_LIGHT_ONTIME, ACTION_FAN_ONTIME, ACTION_LIGHT_DURATION, ACTION_FAN_DURATION, ACTION_TEMPERATURE_THRESHOLD} from './actions';


const SELECT_CONTROLLER_STEP_INDEX = 0;

const SELECT_ACTION_STEP_INDEX = 1;


const selectAction: MiddlewareFn<BotContext> = async ctx => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const selectedControllerId = isTextMessage(ctx?.message) ? ctx.message.text : '';
    const controllerIds = await getControllerIds(db, {chatId});

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    const currentSettings = await getConfig(db, selectedControllerId);

    if (!currentSettings) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    const text = formatConfig(currentSettings);

    await ctx.reply(text, getInlineKeyboard([
        ACTION_LIGHT_ONTIME,
        ACTION_FAN_ONTIME,
        ACTION_LIGHT_DURATION,
        ACTION_FAN_DURATION,
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
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {controllerId, action} = ctx.session;
    const value = isTextMessage(ctx?.message) ? ctx.message.text : '';

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    if (!action) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    if (!chatId) {
        return ctx.scene.leave();
    }

    const {success} = await actionHandler(action, {db, chatId, controllerId, value});
    const response = success ? 'Success' : 'Fail';

    await ctx.reply(response, Markup.removeKeyboard());

    return ctx.scene.leave();
};


export default new Scenes.WizardScene('setup',
    selectController,
    selectAction,
    collectValue,
    handleAction,
);