const {format} = require("date-fns");
const {LOG_EVENT} = require("../constants");


const getLogEvent = event => LOG_EVENT[event];

const getLogEntry = ({event, payload = []}) => {
    if (!event) {
        return null;
    }

    return {
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        event: getLogEvent(event),
        payload,
    };
};


module.exports = {
    getLogEntry,
    getLogEvent,
}