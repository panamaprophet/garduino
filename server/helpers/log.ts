import {LOG_EVENT} from '../constants';
import {EventType, LogEntity, LogEntityRaw} from 'types';


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
        event,
        payload,
        date: new Date(),
    };
};