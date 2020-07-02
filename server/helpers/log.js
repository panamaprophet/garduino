const LogType = {
    INFO: 'types/info',
    WARNING: 'types/warning',
    ERROR: 'types/error',
};

const LogSource = {
    SENSOR: 'sources/sensor',
    CONTROLLER: 'sources/controller',
};

const LogEvent = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
};


const getLogType = type => LogType[type];

const getLogSource = source => LogSource[source];

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
    source,
    event,
    payload = [],
}) => {
    if (!type || !source || !event) {
        return null;
    }

    return {
        timestamp: getCurrentDateTime(),
        type: getLogType(type),
        source: getLogSource(source),
        event: getLogEvent(event),
        payload: JSON.stringify(payload),
    };
};


module.exports = {
    getLogEntry,
}