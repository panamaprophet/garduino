const LogType = {
    INFO: 'types/info',
    WARNING: 'types/warning',
    ERROR: 'types/error',
};

const LogEvent = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
};


const getLogType = type => LogType[type];

const getLogEvent = event => LogEvent[event];

/**
 * @typedef {Object} LogEntry
 * 
 * @property {LogType} type
 * @property {LogSource} source
 * @property {LogEvent} event
 * @property {number} timestamp
 * @property {string} payload — serialized json
 */

const getCurrentDateTime = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/**
 * @returns {LogEntry}
 */
const getLogEntry = ({
    type, 
    event,
    payload = [],
}) => {
    if (!type || !event) {
        return null;
    }

    return {
        timestamp: getCurrentDateTime(),
        type: getLogType(type),
        event: getLogEvent(event),
        payload: JSON.stringify(payload),
    };
};


module.exports = {
    getLogEntry,
}