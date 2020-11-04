import {LOG_EVENT} from '../constants';


export type LogEntityRaw = {
    event: string,
    payload: Array<object>,
};

type LogEntity = {
    event: string,
    date: Date,
    payload: Array<object>,
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