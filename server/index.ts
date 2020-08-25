const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const {createBotInstance} = require('./bot');

const config = require('./config');
const app = express();
const uri = `mongodb+srv://${config.db.user}:${config.db.pass}@${config.db.host}/${config.db.database}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});


client.connect().then((client: typeof MongoClient) => {
    const db = client.db();
    const bot = createBotInstance(db, config.bot);

    app.locals.db = db;

    app.use(express.json());
    app.use(bot.webhookCallback(config.bot.webHookPath));
    app.use('/api', require('./routes'));

    bot.launch();
    app.listen(config.port, () => console.log(`server launched on :${config.port}`));
});
