const setConfig = async (db, controllerId, updatedParams) => {
    const {ok} = await db.collection('config').findOneAndUpdate({controllerId}, {$set: updatedParams});

    return {
        success: Boolean(ok),
    };
};

const getConfig = async (db, controllerId) => {
    const config = await db.collection('config').findOne({controllerId});

    return config;
};


module.exports = {
    getConfig,
    setConfig,
};