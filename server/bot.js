const WizardScene = require('telegraf/scenes/wizard');
const {Stage} = require('telegraf');

const {getContext, getSensorDataByKey} = require('./helpers');
const {getInlineKeyboard} = require('./helpers/bot');
const {getLastUpdateEventLog} = require('./resolvers/log');
const {getControllerIds} = require('./resolvers/controller');


const getLastUpdateEventLogByControllerId = async (db, controllerId) => {
    const eventData = await getLastUpdateEventLog(db, controllerId);
    const {payload} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

    return response;
};


const createMainScene = db => new WizardScene('now',
    // get controllers list
    async ctx => {
        const controllerIds = await getControllerIds(db);
        const buttons = controllerIds.map(controllerId => ({
            title: controllerId,
            action: controllerId,
        }));

        ctx.session.controllerId = null;
        ctx.session.controllerIds = controllerIds;
        ctx.reply('Select a controller', getInlineKeyboard(buttons));

        return ctx.wizard.next();
    },
    // set controller
    async ctx => {
        const selectedControllerId = ctx.update.callback_query.data;
        const controllerIds = await getControllerIds(db);

        console.log('SELECTED CONTROLLER', selectedControllerId);

        if (!controllerIds.includes(selectedControllerId)) {
            return ctx.wizard.back();
        }

        ctx.session.controllerId = selectedControllerId;

        const actions = ['stat', 'now', 'setup'].map(action => ({
            title: action,
            action: action,
        }));

        ctx.session.actions = actions;
        ctx.reply('Select an action', getInlineKeyboard(actions));

        return ctx.wizard.next();
    },
    // set command
    async ctx => {
        console.log('REQUEST', ctx);

        const selectedAction = ctx.update.callback_query.data;

        if (!['stat', 'now', 'setup'].includes(selectedAction)) {
            return ctx.wizard.back();
        }

        ctx.session.selectedAction = selectedAction;

        const {controllerId} = ctx.session;
        const response = await processAction(ctx, selectedAction, controllerId);
        await ctx.reply(response);

        return ctx.scene.leave();
    },
);


const processAction = async ({db}, action, controllerId) => {
    switch (action) {
        case 'now':
            return await getLastUpdateEventLogByControllerId(db, controllerId);
        default:
            return 'unknown action';
    }
};


const createStage = (...scenes) => {
    return new Stage(scenes);
}


module.exports = {
    createMainScene,
    createStage,
};
