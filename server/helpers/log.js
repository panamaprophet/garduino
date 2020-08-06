const {LOG_EVENT} = require("../constants");


const getLogEvent = event => LOG_EVENT[event];

const getLogEntry = ({event, payload = []}) => {
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