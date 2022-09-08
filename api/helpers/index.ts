import { SensorLogEntity, SensorLogEntityAggregated } from 'types';
import { CRITICAL_ERRORS } from '../constants';


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
        dates: [],
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

        result.dates.push(item.date);
        result.temperature.push(item.temperature);
        result.humidity.push(item.humidity);

        return result;
    }, initData);
};

export const isCriticalError = (error: string): boolean => CRITICAL_ERRORS.includes(error);

export const isObject = <T extends { [k: string]: unknown }>(obj: any): obj is T => (typeof obj === 'object' || typeof obj === 'function') && (obj !== null) && !Array.isArray(obj);

export const flattenObject = <T extends { [k: string]: unknown }>(obj: T) => {
    const keys = Object.keys(obj);
    const result: { [k: string]: unknown } = {};

    for (const key of keys) {
        if (!isObject(obj[key])) {
            result[key] = obj[key];

            continue;
        }

        const flatObject = flattenObject(obj[key] as T);
        const pairs = Object.entries(flatObject);
        const prefixedPairs = pairs.map(([k, v]) => [key + '.' + k, v]);

        Object.assign(result, Object.fromEntries(prefixedPairs));
    }

    return result;
};
