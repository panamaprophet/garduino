/**
 * @returns {Promise<String[]>}
 */
const getControllerIds = async (db, options = {}) => {
    const result = await db.collection('config').find(options).project({controllerId: 1}).toArray();

    if (!result) {
        return [];
    }

    return result.map(({controllerId}) => controllerId);
};

const addController = async (db, controllerId, chatId, configuration) => {
    const {result} = await db.collection('config').insertOne({
        controllerId,
        chatId,
        ...configuration,
    });

    return {
        success: Boolean(result.ok),
    };
};

const removeController = async (db, controllerId, chatId) => {
    const {result} = await db.collection('config').deleteOne({controllerId, chatId});

    return {
        success: Boolean(result.ok),
    };
};


module.exports = {
    getControllerIds,
    addController,
    removeController,
};