import { subWeeks } from 'date-fns';
import { LOG_EVENT } from '../constants';
import { ControllerEvent } from 'types';
import { getDb } from '../db';
import { returnDefault } from 'helpers';


const getDefaultDateFrom = (): Date => subWeeks(Date.now(), 1);


export const getEvent = (controllerId: string, conditions = {}) => {
    return getDb()
        .then(db => db.collection('log').findOne<ControllerEvent>(
            { controllerId, ...conditions },
            { sort: { $natural: -1 } }
        ))
        .catch(returnDefault(null));
};

export const saveEvent = (controllerId: string, data: ControllerEvent) => {
    return getDb()
        .then(db => db.collection<ControllerEvent & { controllerId: string }>('log').insertOne({ controllerId, ...data }))
        .then(() => ({ success: true }))
        .catch(returnDefault({ success: false }));
};

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

export const getUpdateEvents = (controllerId: string, dateFrom?: Date) => {
    return getDb()
        .then(db => db.collection('log').aggregate<{ [k: string]: number }>([
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
