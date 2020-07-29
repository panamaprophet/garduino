const {Telegraf} = require('telegraf');


const createBot = ({token, webHookPath}, commands = {}) => {
    const bot = new Telegraf(token);

    bot.telegram.setWebhook(webHookPath);
    Object.keys(commands).forEach(key => bot.command(key, commands[key]));

    return bot;
};


module.exports = {
    createBot,
};