const {getContext, getSensorDataByKey} = require('../helpers');
const {getLastUpdateEventLog} = require('./log');


const help = async ({reply}) => {
    const response = 
    `Greetings. These are the things i can do:
  
    /help — show this message
    /now — show current params of sensors
    /stat — show data overview
    /setup — edit configuration`;
  
    reply(response);
};

const now = async ({request, reply}) => {
    const {db, controllerId} = getContext(request);
    const eventData = await getLastUpdateEventLog(db, controllerId);
    const payload = JSON.parse(eventData.payload);
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

    return reply(response);
};

const stat = async ({reply}) => {
    reply('statistics');
};

const setup = async ({reply}) => {
    reply('light schedule');
};


module.exports = {
    help, 
    now, 
    stat, 
    setup,
};