const {getLastAvailableData} = require('./sensors');


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
    const getLastAvailableDataFromDb = getLastAvailableData(connection);

    return async ctx => {
        const { temperature, humidity } = await getLastAvailableDataFromDb();
        const response = `Humidity: ${humidity}%, Temperature: ${temperature}°C`;

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