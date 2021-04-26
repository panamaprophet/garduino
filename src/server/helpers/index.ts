import express from 'express';
import mongodb from 'mongodb';
import type {LogEntityRaw} from './log';


export type EventType = 'CONFIG' | 'UPDATE' | 'ERROR' | 'SWITCH' | 'RUN';

export type EventData = {
    key: string,
    value: string | number,
};

type RequestContext = {
    db: mongodb.Db,
    controllerId: string,
    params?: Record<string, unknown>,
    body?: LogEntityRaw,
};

export type SensorLogEntity = {
    humidity: number,
    temperature: number,
    date: number,
};

type SensorLogEntityAggregated = {
    date: number[],
    temperature: number[],
    humidity: number[],
    maxHumidity: SensorLogEntity,
    minHumidity: SensorLogEntity,
    maxTemperature: SensorLogEntity,
    minTemperature: SensorLogEntity,
};


export const getContext = (request: express.Request): RequestContext => ({
    db: request.app.locals.db as mongodb.Db,
    params: request.params,
    body: request.body as LogEntityRaw,
    controllerId: request.params.controllerId,
});

export const getSensorDataByKey = (haystack: EventData[], needle: string): EventData[] => haystack.filter(({key}) => key === needle);

export const range = (from: number, to: number, step = 1): number[] => {
    const result = [];

    for (let i = from; i <= to; i += step) {
        result.push(i);
    }

    return result;
};

export const reduceItemsCountBy = <T>(items: T[], limit: number): T[] => {
    if (items.length <= limit) {
        return items;
    }

    const result = items.filter((_, index) => index % limit === 0);

    return result;
};

export const processData = (data: SensorLogEntity[]): SensorLogEntityAggregated => {
    const initData = {
        date: [],
        temperature: [],
        humidity: [],
        maxHumidity: data[0],
        minHumidity: data[0],
        minTemperature: data[0],
        maxTemperature: data[0],
    };

    return data.reduce((result: SensorLogEntityAggregated, item: SensorLogEntity, index: number) => {
        if (result.maxHumidity.humidity < item.humidity) {
            result.maxHumidity = item;
        }

        if (result.minHumidity.humidity > item.humidity) {
            result.minHumidity = item;
        }

        if (result.maxTemperature.temperature < item.temperature) {
            result.maxTemperature = item;
        }

        if (result.minTemperature.temperature > item.temperature) {
            result.minTemperature = item;
        }

        if (index % 2 === 0) {
            return result;
        }

        result.date.push(item.date);
        result.temperature.push(item.temperature);
        result.humidity.push(item.humidity);

        return result;
    }, initData);
};


// function distributedCopy(items, n) {
//     const result = [items[0]];
//     const totalItems = items.length - 2;
//     const interval = Math.floor(totalItems / (n - 2));
//
//     for (let i = 1; i < n - 1; i++) {
//         result.push(items[i * interval]);
//     }
//
//     result.push(items[items.length - 1]);
//
//     return result;
// }
