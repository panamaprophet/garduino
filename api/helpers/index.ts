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


export const getMaximumBy = <T>(data: T[], k: keyof T): T => data.reduce((result, item) => item[k] > result[k] ? item : result, data[0]);

export const getMinimumBy = <T>(data: T[], k: keyof T): T => data.reduce((result, item) => item[k] < result[k] ? item : result, data[0]);

export const getRangeBy = <T>(key: keyof T, data: T[]) => {
    const max = getMaximumBy(data, key);
    const min = getMinimumBy(data, key);

    return [
        min[key],
        max[key]
    ];
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

export const returnDefault = <T>(result: T) => (error: Error): T => {
    console.log(`Error: ${error.name}. ${JSON.stringify(result)} will be returned`);

    return result;
};
