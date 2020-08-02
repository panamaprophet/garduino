const {Telegraf, Markup} = require('telegraf');


const createBot = ({token, webHookPath}, commands = {}) => {
    const bot = new Telegraf(token);

    bot.telegram.setWebhook(webHookPath);
    Object.keys(commands).forEach(key => bot.command(key, commands[key]));

    return bot;
};

const getInlineKeyboard = options => {
    const keyboard = Markup.inlineKeyboard(options.map(option => {
        return Markup.callbackButton(option.title, option.action);
    }))
    .oneTime()
    .resize()
    .extra()

    return keyboard;
};


module.exports = {
    createBot,
    getInlineKeyboard,
};
