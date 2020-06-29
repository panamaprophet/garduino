const { Telegraf } = require('telegraf');


const createBot = (token, webHookPath) => {
    const bot = new Telegraf(token);

    bot.telegram.setWebhook(webHookPath);

    return bot;
};

const actionHelp = ctx => {
    const response = 
    `Greetings. These are the things i can do:
  
    /help — show this message
    /now — show current params of sensors
    /stat — show data overview
    /light — show/edit light schedule`;
  
    ctx.reply(response);
};

const actionNow = getData => async ctx => {
    const { temperature, humidity } = await getData();
    const response = `Humidity: ${humidity}%, Temperature: ${temperature}°C`;

    return ctx.reply(response);
};

const actionStat = ctx => {
    ctx.reply('statistics');
};

const actionLight = ctx => {
    ctx.reply('light schedule');
};


module.exports = {
    createBot,
    actionHelp,
    actionLight,
    actionNow,
    actionStat,
};