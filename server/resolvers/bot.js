const {getLastUpdateEventLog} = require('./log');


const resolveHelp = connection => ctx => {
    const response = 
    `Greetings. These are the things i can do:
  
    /help — show this message
    /now — show current params of sensors
    /stat — show data overview
    /light — show/edit light schedule`;
  
    ctx.reply(response);
};

const resolveLastData = connection => {
    const getLastUpdateEventLogFromDb = getLastUpdateEventLog(connection);
    const getSensorDataByKey = (haystack, needle) => haystack.filter(({key}) => key === needle);

    return async ctx => {
        const eventData = await getLastUpdateEventLogFromDb();
        const payload = JSON.parse(eventData.payload);
        const [humidity] = getSensorDataByKey(payload, 'humidity');
        const [temperature] = getSensorDataByKey(payload, 'temperature');
        const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

        return ctx.reply(response);
    };
};

const resolveStatistics = connection => ctx => {
    ctx.reply('statistics');
};

const resolveLightSchedule = connection => ctx => {
    ctx.reply('light schedule');
};


module.exports = {
    resolveHelp, 
    resolveLastData, 
    resolveStatistics, 
    resolveLightSchedule,
};