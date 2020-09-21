const {subWeeks, format} = require('date-fns');
const {LOG_EVENT} = require('../constants');
const {getSensorDataByKey} = require('../helpers');


const getDefaultDateFrom = () => subWeeks(Date.now(), 1);


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

const getLastUpdateEventLogByControllerId = async ({db, controllerId}) => {
    const eventData = await getLastUpdateEventLog(db, controllerId);

    if (!eventData) {
        return {
            text: `No data for ${controllerId}`,
        };
    }

    const {payload, date} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const formattedDate = format(date, 'dd.MM.yy HH:mm');

    const response = `#${controllerId} @ ${formattedDate}\n\r\n\rTemperature: ${temperature.value}°C\n\rHumidity: ${humidity.value}%`;

    return {
        text: response,
    };
};

const saveLog = async (db, controllerId, data) => {
    const {result} = await db.collection('log').insertOne({controllerId, ...data});

    return {
        success: Boolean(result.ok),
    };
};

const getUpdateEventLogStat = async (db, controllerId, dateFrom = null) => {
    const result = await db.collection('log').aggregate([
        {
            $match: {
                controllerId,
                event: LOG_EVENT.UPDATE,
                date: {
                    $gte: dateFrom || getDefaultDateFrom(),
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
    getLastUpdateEventLogByControllerId,
    getUpdateEventLogStat,
    saveLog,
};