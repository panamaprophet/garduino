const {getSensorDataByKey} = require('../../helpers');
const {getLastUpdateEventLog} = require('../../resolvers/log');


const getLastUpdateEventLogByControllerId = async (db, controllerId) => {
    const eventData = await getLastUpdateEventLog(db, controllerId);
    const {payload} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

    return response;
};


module.exports = {
    getLastUpdateEventLogByControllerId,
}