import {LOG_EVENT} from '../constants';
import type {EventData, EventType} from './index';


export type LogEntityRaw = {
    event: EventType,
    payload: EventData[],
};

export type LogEntity = {
    event: string,
    date: Date,
    payload: EventData[],
};

export const getLogEvent = (event: EventType): string => LOG_EVENT[event];

export const getLogEntry = (entity?: LogEntityRaw): LogEntity | null => {
    const {
        event,
        payload = [],
    } = entity || {};

    if (!event || !entity) {
        return null;
    }

    return {
        payload,
        date: new Date(),
        event: getLogEvent(event),
    };
};