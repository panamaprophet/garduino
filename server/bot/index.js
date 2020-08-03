const {session, Stage, Telegraf} = require('telegraf');
const {createMainSceneController} = require('./controllers');
const commands = require('./commands');


const createBotInstance = (db, {token, webHookPath}) => {
    const bot = new Telegraf(token);
    const stage = new Stage([
        createMainSceneController(db),
    ]);

    bot.telegram.setWebhook(webHookPath);
    bot.context.db = db;

    bot.use(session());
    bot.use(stage.middleware());

    Object.keys(commands).forEach(key => bot.command(key, commands[key]));

    return bot;
};


module.exports = {
    createBotInstance,
};