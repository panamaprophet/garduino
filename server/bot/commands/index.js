const {getControllerIds} = require('../../resolvers/controller');
const {getLastUpdateEventLogByControllerId} = require('../../resolvers/log');
const {HELP_PLACEHOLDER} = require('../../constants');


const help = async ({reply}) => reply(HELP_PLACEHOLDER);

const stat = async ({scene}) => scene.enter('stat');

const setup = async ({scene}) => scene.enter('setup');

const manage = async ({scene}) => scene.enter('controllerManager');

const start = async ({db, chat: {id: chatId}, scene, reply}) => {
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return reply(HELP_PLACEHOLDER);
};

const now = async ({db, chat: {id: chatId}, reply}) => {
    const controllerIds = await getControllerIds(db, {chatId});
    const resultPromises = controllerIds.map(controllerId => getLastUpdateEventLogByControllerId({db, controllerId}));
    const results = await Promise.all(resultPromises);
    const result = results.map(({text}) => text);

    return reply(result.join('\n\r'));
};


module.exports = {
    stat,
    setup,
    help,
    start,
    manage,
    now,
};
