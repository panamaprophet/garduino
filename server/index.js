const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const {createBot} = require('./helpers/bot');
const config = require('./config');
const app = express();
const uri = `mongodb+srv://${config.db.user}:${config.db.pass}@${config.db.host}/${config.db.database}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect().then(client => {
    const db = client.db();
    const bot = createBot(config.bot, require('./resolvers/bot'));

    app.locals.db = db;

    app.use(express.json());
    app.use(bot.webhookCallback(config.telegram.webHookPath));
    app.use('/api', require('./routes'));

    app.listen(config.port, () => console.log(`server launched on :${config.port}`));
});