const WizardScene = require('telegraf/scenes/wizard');
const {getLastUpdateEventLogByControllerId} = require('../actions');
const {getInlineKeyboard} = require('../helpers');
const {getControllerIds} = require('../../resolvers/controller');


const ACTIONS = ['now', 'stat', 'setup'];


const processAction = async ({db}, action, controllerId) => {
    switch (action) {
        case 'now':
            return await getLastUpdateEventLogByControllerId(db, controllerId);
        default:
            return 'unknown action';
    }
};


const MainSceneController = new WizardScene('now',
    // select a controller
    async ctx => {
        const {db} = ctx;
        const controllerIds = await getControllerIds(db);

        ctx.reply('Select a controller', getInlineKeyboard(controllerIds));

        return ctx.wizard.next();
    },
    // select an action
    async ctx => {
        const {db} = ctx;
        const selectedControllerId = ctx.update.callback_query.data;
        const controllerIds = await getControllerIds(db);

        if (!controllerIds.includes(selectedControllerId)) {
            return ctx.wizard.back();
        }

        ctx.session.controllerId = selectedControllerId;

        ctx.reply('Select an action', getInlineKeyboard(ACTIONS));

        return ctx.wizard.next();
    },
    // run action
    async ctx => {
        const selectedAction = ctx.update.callback_query.data;
        const {controllerId} = ctx.session;

        if (!controllerId) {
            return ctx.wizard.selectStep(0);
        }

        if (!ACTIONS.includes(selectedAction)) {
            return ctx.wizard.back();
        }

        const response = await processAction(ctx, selectedAction, controllerId);

        ctx.reply(response);

        return ctx.scene.leave();
    },
);


module.exports = {
    MainSceneController,
};
