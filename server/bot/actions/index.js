const {getSensorDataByKey} = require('../../helpers');
const {getLastUpdateEventLog} = require('../../resolvers/log');


const getLastUpdateEventLogByControllerId = async ({db, controllerId}) => {
    const eventData = await getLastUpdateEventLog(db, controllerId);
    const {payload} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

    return response;
};


const ACTION_NOW = 'main/now';

const ACTION_STAT = 'main/stat';


const actionHandler = async (action, context) => {
    switch (action) {
        case ACTION_NOW:
            return await getLastUpdateEventLogByControllerId(context);
        case ACTION_STAT:
            return 'not implemented';
        default:
            return 'action is not supported';
    };
};


module.exports = {
    ACTION_NOW,
    ACTION_STAT,
    actionHandler,
};