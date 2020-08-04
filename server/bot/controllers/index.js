const WizardScene = require('telegraf/scenes/wizard');
const {
    actionHandler,
    ACTION_NOW,
    ACTION_STAT,
} = require('../actions');
const {getInlineKeyboard} = require('../helpers');
const {getControllerIds} = require('../../resolvers/controller');


const SELECT_CONTROLLER_STEP_INDEX = 0;


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

    ctx.reply('Select an action', getInlineKeyboard([ACTION_NOW, ACTION_STAT]));

    return ctx.wizard.next();
};

const handleAction = async ctx => {
    const {db} = ctx;
    const selectedAction = ctx.update.callback_query.data;
    const {controllerId} = ctx.session;

    if (!controllerId) {
        return ctx.wizard.selectStep(SELECT_CONTROLLER_STEP_INDEX);
    }

    const result = await actionHandler(selectedAction, {db, controllerId});

    ctx.reply(result);

    return ctx.scene.leave();
};


module.exports = new WizardScene('now',
    selectController,
    selectAction,
    handleAction,
);