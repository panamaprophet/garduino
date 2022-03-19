import { LogEntity, LogEntityRaw } from 'types';


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
