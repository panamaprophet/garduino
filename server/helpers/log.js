const {format} = require("date-fns");

const {LOG_TYPE, LOG_EVENT} = require("../constants");


const getLogType = type => LOG_TYPE[type];

const getLogEvent = event => LOG_EVENT[event];


/**
 * @typedef {Object} LogEntry
 * 
 * @property {LogType} type
 * @property {LogSource} source
 * @property {LogEvent} event
 * @property {number} timestamp
 * @property {string} payload — serialized json
 */


/**
 * @returns {LogEntry|null}
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
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        type: getLogType(type),
        event: getLogEvent(event),
        payload: JSON.stringify(payload),
    };
};


module.exports = {
    getLogEntry,
    getLogType,
    getLogEvent,
}