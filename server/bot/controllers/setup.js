const WizardScene = require('telegraf/scenes/wizard');
const {
    actionHandler, 
    ACTION_LIGHT_ONTIME, 
    ACTION_FAN_ONTIME, 
    ACTION_LIGHT_DURATION,
    ACTION_FAN_DURATION,
    ACTION_TEMPERATURE_THRESHOLD,
} = require('../actions/setup');
const {getInlineKeyboard} = require('../helpers');
const {getConfig} = require('../../resolvers/config');
const {getControllerIds} = require('../../resolvers/controller');


const SELECT_CONTROLLER_STEP_INDEX = 0;
const SELECT_ACTION_STEP_INDEX = 1;


const selectController = async ctx => {
    const {db} = ctx;
    const controllerIds = await getControllerIds(db);

    ctx.reply('Select a controller', getInlineKeyboard(controllerIds));

    return ctx.wizard.next();
};

const selectAction = async ctx => {
    const {db} = ctx;
    const selectedControllerId = ctx.update.callback_query.data;
    const controllerIds = await getControllerIds(db);

    if (!controllerIds.includes(selectedControllerId)) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    ctx.session.controllerId = selectedControllerId;

    const currentSettings = await getConfig(db, selectedControllerId);

    const text = `
        Current config:

        ${JSON.stringify(currentSettings)}

        Select setting to modify:
    `;

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
    const {db} = ctx;
    const {controllerId, action} = ctx.session;
    const {text: value} = ctx.message;

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    if (!action) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    const result = await actionHandler(action, {db, controllerId, value});

    ctx.reply(result);

    return ctx.scene.leave();
};


module.exports = new WizardScene('setup', 
    selectController,
    selectAction,
    collectValue,
    handleAction,
);