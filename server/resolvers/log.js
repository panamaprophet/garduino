const {subWeeks} = require('date-fns');
const {LOG_EVENT} = require('../constants');


const getDefaultRange = () => subWeeks(Date.now(), 1);


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

const getUpdateEventLogStat = async (db, controllerId, date = null) => {
    const result = await db.collection('log').aggregate([
        {
            $match: {
                controllerId,
                event: LOG_EVENT.UPDATE,
                date: {
                    $gte: date || getDefaultRange(),
                },
            },
        }, {
            $project: {
                date: 1,
                humidity: {
                    $filter: {
                        input: '$payload',
                        as: 'item',
                        cond: {$eq: ['$$item.key', 'humidity']},
                    },
                },
                temperature: {
                    $filter: {
                        input: '$payload',
                        as: 'item',
                        cond: {$eq: ['$$item.key', 'temperature']},
                    },
                },
            },
        }, {
            $unwind: {path: '$humidity'},
        }, {
            $unwind: {path: '$temperature'},
        }, {
            $project: {
                _id: 0,
                date: 1,
                humidity: {
                    $convert: {input: '$humidity.value', to: 'double'}
                },
                temperature: {
                    $convert: {input: '$temperature.value', to: 'double'}
                },
            },
        }, {
            $sort: {
                date: 1,
            },
        },
    ]).toArray();

    return result;
};


module.exports = {
    getLog,
    getLastUpdateEventLog,
    getUpdateEventLogStat,
    saveLog,
};