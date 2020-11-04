import {LOG_EVENT} from '../constants';


type LogEntityRaw = {
    event: string,
    payload: Array<object>,
};

type LogEntity = {
    event: string,
    date: Date,
    payload: Array<object>,
};


const getLogEvent = (event: string): string => LOG_EVENT[event];

const getLogEntry = ({event, payload = []}: LogEntityRaw): LogEntity | null => {
    if (!event) {
        return null;
    }

    return {
        payload,
        date: new Date(),
        event: getLogEvent(event),
    };
};


module.exports = {
    getLogEntry,
    getLogEvent,
}