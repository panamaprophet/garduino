import {LOG_EVENT} from '../constants';
import type {EventData} from './index';

export type LogEntityRaw = {
    event: string,
    payload: EventData[],
};

export type LogEntity = {
    event: string,
    date: Date,
    payload: Array<EventData>,
};


export const getLogEvent = (event: string): string => LOG_EVENT[event];

export const getLogEntry = ({event, payload = []}: LogEntityRaw): LogEntity | null => {
    if (!event) {
        return null;
    }

    return {
        payload,
        date: new Date(),
        event: getLogEvent(event),
    };
};