import { subWeeks } from 'date-fns';
import type { Db } from 'mongodb';
import { LOG_EVENT } from '../constants';
import { SensorLogEntity, LogEntity } from 'types';


const getDefaultDateFrom = (): Date => subWeeks(Date.now(), 1);


export const getEvent = async (db: Db, controllerId: string, conditions = {}): Promise<LogEntity | null> => {
    const result = await db.collection('log').findOne<LogEntity>(
        {controllerId, ...conditions},
        {sort: {$natural: -1}}
    );

    return result;
};

export const saveEvent = async (db: Db, controllerId: string, data: LogEntity): Promise<{success: boolean}> => {
    const {result} = await db.collection('log').insertOne({controllerId, ...data});

    return {
        success: Boolean(result.ok),
    };
};

export const getErrorEvents = async (db: Db, controllerId: string, { dateFrom, dateTo }: { [k: string]: Date }): Promise<unknown[]> => {
    const result = await db.collection('log').aggregate<unknown>([
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
    ]).toArray();

    return result;
};

export const getUpdateEvents = async (db: Db, controllerId: string, dateFrom: Date | null = null): Promise<SensorLogEntity[]> => {
    const result = await db.collection('log').aggregate<SensorLogEntity>([
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
    ]).toArray();

    return result;
};

export const getLastUpdateEvent = (db: Db, controllerId: string): Promise<LogEntity | null> => {
    return getEvent(db, controllerId, { event: LOG_EVENT.UPDATE });
};

export const getLastErrorEvent = (db: Db, controllerId: string): Promise<LogEntity | null> => {
    return getEvent(db, controllerId, { event: LOG_EVENT.ERROR });
};
