const WizardScene = require('telegraf/scenes/wizard');
const {
    actionHandler,
    ACTION_CONTROLLER_ADD,
    ACTION_CONTROLLER_REMOVE,
} = require('../actions/controllerManager');
const {getInlineKeyboard} = require('../helpers');
const {getControllerIds} = require('../../resolvers/controller');


const SELECT_ACTION_STEP_INDEX = 0;


const selectAction = async ctx => {
    ctx.reply('Select action', getInlineKeyboard([
        ACTION_CONTROLLER_ADD,
        ACTION_CONTROLLER_REMOVE,
    ]));

    return ctx.wizard.next();
};

const collectValue = async ctx => {
    const selectedAction = ctx.update.callback_query.data;

    if ([ACTION_CONTROLLER_ADD, ACTION_CONTROLLER_REMOVE].includes(selectedAction) === false) {
        return ctx.wizard.selectStep(SELECT_ACTION_STEP_INDEX);
    }

    ctx.session.action = selectedAction;

    if (selectedAction === ACTION_CONTROLLER_ADD) {
        await ctx.reply('Provide new controller Id');
    }

    if (selectedAction === ACTION_CONTROLLER_REMOVE) {
        const {db, chat} = ctx;
        const {id: chatId} = chat;
        const controllerIds = await getControllerIds(db, {chatId});

        await ctx.reply('Select controller to remove', getInlineKeyboard(controllerIds));
    }

    return ctx.wizard.next();
};

const handleAction = async ctx => {
    const {db, chat} = ctx;
    const {id: chatId} = chat;
    const {action} = ctx.session;
    const controllerId = (action === ACTION_CONTROLLER_ADD)
        ? ctx.message.text
        : ctx.update.callback_query.data;

    const result = await actionHandler(action, {db, chatId, controllerId});

    await ctx.reply(result);

    return ctx.scene.leave();
};


module.exports = new WizardScene('controllerManager',
    selectAction,
    collectValue,
    handleAction,
);