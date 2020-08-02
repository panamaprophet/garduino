const session = require('telegraf/session');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const {createBot} = require('./helpers/bot');
const {createStage, createMainScene} = require('./bot');
const botResolvers = require('./resolvers/bot');
const config = require('./config');
const app = express();
const uri = `mongodb+srv://${config.db.user}:${config.db.pass}@${config.db.host}/${config.db.database}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect().then(client => {
    const db = client.db();
    const bot = createBot(config.bot); // require('./resolvers/bot'));
    const mainScene = createMainScene(db);
    const stage = createStage(mainScene);

    bot.context.db = db;
    app.locals.db = db;

    bot.use(session());
    bot.use(stage.middleware());
    Object.keys(botResolvers).forEach(key => bot.command(key, botResolvers[key]));

    bot.launch();

    app.use(express.json());
    app.use(bot.webhookCallback(config.bot.webHookPath));
    app.use('/api', require('./routes'));

    app.listen(config.port, () => console.log(`server launched on :${config.port}`));
});
