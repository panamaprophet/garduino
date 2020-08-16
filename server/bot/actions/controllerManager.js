const {addController, removeController} = require('../../resolvers/controller');
const {DEFAULT_CONFIG} = require('../../constants');


const ACTION_CONTROLLER_ADD = 'setup/controller/add';

const ACTION_CONTROLLER_REMOVE = 'setup/controller/remove';


const add = async ({db, chatId, controllerId}) => addController(db, controllerId, chatId, DEFAULT_CONFIG);

const remove = async ({db, chatId, controllerId}) => removeController(db, controllerId, chatId);


const actionHandler = async (action, context) => {
    switch (action) {
        case ACTION_CONTROLLER_ADD:
            return await add(context);
        case ACTION_CONTROLLER_REMOVE:
            return await remove(context);
        default:
            return 'action is not supported';
    }
};


module.exports = {
    ACTION_CONTROLLER_ADD,
    ACTION_CONTROLLER_REMOVE,
    actionHandler,
};