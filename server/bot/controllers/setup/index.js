const WizardScene = require('telegraf/scenes/wizard');
const {getInlineKeyboard} = require('../../helpers');
const {getConfig} = require('../../../resolvers/config');
const {getControllerIds} = require('../../../resolvers/controller');
const {formatConfig} = require('../../../helpers/config');
const {selectController} = require('../common');
const {
    actionHandler,
    ACTION_LIGHT_ONTIME,
    ACTION_FAN_ONTIME,
    ACTION_LIGHT_DURATION,
    ACTION_FAN_DURATION,
    ACTION_TEMPERATURE_THRESHOLD,
} = require('./actions');


const SELECT_CONTROLLER_STEP_INDEX = 0;

const SELECT_ACTION_STEP_INDEX = 1;


const selectAction = async ctx => {
    const {db, chat: {id: chatId}} = ctx;
    const selectedControllerId = ctx.update.callback_query.data;

    const controllerIds = await getControllerIds(db, {chatId});

    if (!controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    const currentSettings = await getConfig(db, selectedControllerId);
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

const collectValue = async ctx => {
    ctx.session.action = ctx.update.callback_query.data;
    await ctx.reply('Provide new value');

    return ctx.wizard.next();
};

const handleAction = async ctx => {
    const {db, chat: {id: chatId}} = ctx;
    const {controllerId, action} = ctx.session;
    const {text: value} = ctx.message;

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    if (!action) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    const result = await actionHandler(action, {db, chatId, controllerId, value});

    ctx.reply(result);

    return ctx.scene.leave();
};


module.exports = new WizardScene('setup',
    selectController,
    selectAction,
    collectValue,
    handleAction,
);