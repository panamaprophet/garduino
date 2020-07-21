const {format} = require("date-fns");

const {LOG_EVENT} = require("../constants");


const getLogEvent = event => LOG_EVENT[event];


/**
 * @typedef {Object} LogEntry
 * 
 * @property {LogSource} source
 * @property {LogEvent} event
 * @property {number} timestamp
 * @property {string} payload — serialized json
 */


/**
 * @returns {LogEntry|null}
 */
const getLogEntry = ({
    event,
    payload = [],
}) => {
    if (!event) {
        return null;
    }

    return {
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        event: getLogEvent(event),
        payload: JSON.stringify(payload),
    };
};


module.exports = {
    getLogEntry,
    getLogEvent,
}