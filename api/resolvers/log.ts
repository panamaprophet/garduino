import { subWeeks } from 'date-fns';
import { LOG_EVENT } from '../constants';
import { SensorLogEntity, LogEntity } from 'types';
import { getDb } from '../db';


const getDefaultDateFrom = (): Date => subWeeks(Date.now(), 1);


export const getEvent = (controllerId: string, conditions = {}) =>
    getDb()
        .then(db => db.collection('log').findOne<LogEntity>(
            { controllerId, ...conditions },
            { sort: { $natural: -1 } }
        ))
        .catch(error => {
            console.error('getEvent', error);

            return null;
        });

export const saveEvent = (controllerId: string, data: LogEntity) =>
    getDb()
        .then(db => db.collection('log').insertOne({ controllerId, ...data }))
        .then(() => ({ success: true }))
        .catch(error => {
            console.error('saveEvent', error);

            return { success: false };
        });

export const getErrorEvents = (controllerId: string, { dateFrom, dateTo }: { [k: string]: Date }) => {
    return getDb()
        .then(db => db.collection('log').aggregate<{ value: string, date: Date }>([
            {
                $match: {
                    controllerId,
                    event: LOG_EVENT.ERROR,
                    date: {
                        $gte: dateFrom,
                        $lte: dateTo,
                    },
                },
            },
            { $sort: { _id: -1 } },
            { $unwind: { path: '$payload' } },
            { $addFields: { value: '$payload.value' } },
            { $project: { value: 1, date: 1 } },
        ]).toArray());
};

export const getUpdateEvents = (controllerId: string, dateFrom: Date | null = null) => {
    return getDb()
        .then(db => db.collection('log').aggregate<SensorLogEntity>([
            {
                $match: {
                    controllerId,
                    event: LOG_EVENT.UPDATE,
                    date: { $gte: dateFrom || getDefaultDateFrom() },
                },
            }, {
                $project: {
                    date: 1,
                    humidity: {
                        $filter: {
                            input: '$payload',
                            as: 'item',
                            cond: { $eq: ['$$item.key', 'humidity'] },
                        },
                    },
                    temperature: {
                        $filter: {
                            input: '$payload',
                            as: 'item',
                            cond: { $eq: ['$$item.key', 'temperature'] },
                        },
                    },
                },
            },
            { $unwind: { path: '$humidity' } },
            { $unwind: { path: '$temperature' } },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    humidity: { $convert: { input: '$humidity.value', to: 'double' } },
                    temperature: { $convert: { input: '$temperature.value', to: 'double' } },
                },
            },
            { $sort: { date: 1 } },
        ]).toArray());
};

export const getLastUpdateEvent = (controllerId: string) => getEvent(controllerId, { event: LOG_EVENT.UPDATE });

export const getLastErrorEvent = (controllerId: string) => getEvent(controllerId, { event: LOG_EVENT.ERROR });
