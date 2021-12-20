import {Scenes} from 'telegraf';
import {getConfig} from '../../../resolvers/config';
import {getControllerIds} from '../../../resolvers/controller';
import {formatConfig} from '../../../helpers/config';
import {getInlineKeyboard} from '../../helpers';
import type {BotContext} from '../../index';
import {selectController} from '../common';
import {
    actionHandler,
    ACTION_LIGHT_ONTIME,
    ACTION_FAN_ONTIME,
    ACTION_LIGHT_DURATION,
    ACTION_FAN_DURATION,
    ACTION_TEMPERATURE_THRESHOLD,
} from './actions';


const SELECT_CONTROLLER_STEP_INDEX = 0;

const SELECT_ACTION_STEP_INDEX = 1;

const selectAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    const selectedControllerId = ctx.callbackQuery?.data;

    const controllerIds = await getControllerIds(db, {chatId});

    if (!selectedControllerId || !controllerIds.includes(selectedControllerId)) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    ctx.session.controllerId = selectedControllerId;

    const currentSettings = await getConfig(db, selectedControllerId);

    if (!currentSettings) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    const text = formatConfig(currentSettings);

    await ctx.reply(text, getInlineKeyboard([
        ACTION_LIGHT_ONTIME,
        ACTION_FAN_ONTIME,
        ACTION_LIGHT_DURATION,
        ACTION_FAN_DURATION,
        ACTION_TEMPERATURE_THRESHOLD,
    ]));

    ctx.wizard.next();
};

const collectValue = async (ctx: BotContext): Promise<void> => {
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1471
    ctx.session.action = ctx.callbackQuery?.data;

    await ctx.reply('Provide new value');

    ctx.wizard.next();
};

const handleAction = async (ctx: BotContext): Promise<void> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const {controllerId, action} = ctx.session;
    // @ts-ignore: https://github.com/telegraf/telegraf/issues/1388
    const value = ctx.message?.text;

    if (!controllerId) {
        ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
        return;
    }

    if (!action) {
        ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
        return;
    }

    if (!chatId) {
        ctx.scene.leave();
        return;
    }

    const {success} = await actionHandler(action, {db, chatId, controllerId, value});
    const response = success ? 'Success' : 'Fail';

    await ctx.reply(response);

    ctx.scene.leave();
};


export default new Scenes.WizardScene('setup',
    selectController,
    selectAction,
    collectValue,
    handleAction,
);