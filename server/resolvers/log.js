const {LOG_EVENT} = require('../constants');


const getLog = async (db, controllerId, conditions = {}) => {
    const result = await db.collection('log').findOne(
        {controllerId, ...conditions},
        {sort: {$natural: -1}}
    );

    return result;
};

const getLastUpdateEventLog = (db, controllerId) => {
    return getLog(db, controllerId, {event: LOG_EVENT.UPDATE});
};

const saveLog = async (db, controllerId, data) => {
    const {result} = await db.collection('log').insertOne({controllerId, ...data});

    return {
        success: Boolean(result.ok),
    };
};


module.exports = {
    getLog,
    getLastUpdateEventLog,
    saveLog,
};