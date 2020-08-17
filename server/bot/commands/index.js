const {getControllerIds} = require('../../resolvers/controller');
const {HELP_PLACEHOLDER} = require('../../constants');


const help = async ({reply}) => reply(HELP_PLACEHOLDER);

const now = async ({scene}) => scene.enter('now');

const setup = async ({scene}) => scene.enter('setup');

const manage = async ({scene}) => scene.enter('controllerManager');

const start = async ({db, chat: {id: chatId}, scene, reply}) => {
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return reply(HELP_PLACEHOLDER);
};


module.exports = {
    now,
    setup,
    help,
    start,
    manage,
};
