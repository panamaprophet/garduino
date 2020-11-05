import {subWeeks, format} from 'date-fns';
import type {Db} from 'mongodb';
import {LOG_EVENT} from '../constants';
import {getSensorDataByKey} from '../helpers/index';
import type {SensorLogEntity} from '../helpers/index';
import type {LogEntity} from '../helpers/log';


const getDefaultDateFrom = (): Date => subWeeks(Date.now(), 1);


export const getLog = async (db: Db, controllerId: string, conditions = {}): Promise<LogEntity | null> => {
    const result = await db.collection('log').findOne<LogEntity>(
        {controllerId, ...conditions},
        {sort: {$natural: -1}}
    );

    return result;
};

export const getLastUpdateEventLog = (db: Db, controllerId: string): Promise<LogEntity | null> => {
    return getLog(db, controllerId, {event: LOG_EVENT.UPDATE});
};

export const getLastUpdateEventLogByControllerId = async (db: Db, controllerId: string): Promise<string | null> => {
    const eventData = await getLastUpdateEventLog(db, controllerId);

    if (!eventData) {
        return null;
    }

    const {payload, date} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const formattedDate = format(date, 'dd.MM.yy HH:mm');

    const response = `#${controllerId} @ ${formattedDate}\n\r\n\rTemperature: ${temperature.value}°C\n\rHumidity: ${humidity.value}%`;

    return response;
};

export const saveLog = async (db: Db, controllerId: string, data: LogEntity): Promise<{success: boolean}> => {
    const {result} = await db.collection('log').insertOne({controllerId, ...data});

    return {
        success: Boolean(result.ok),
    };
};

export const getUpdateEventLogStat = async (db: Db, controllerId: string, dateFrom: Date | null = null): Promise<SensorLogEntity[]> => {
    const result = await db.collection('log').aggregate<SensorLogEntity>([
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