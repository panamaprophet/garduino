import express from 'express';
import mongodb from 'mongodb';
import {createBotInstance} from './bot';
import config from './config';
import router from './routes';

const app = express();
const uri = `mongodb+srv://${config.db.user}:${config.db.pass}@${config.db.host}/${config.db.database}?retryWrites=true&w=majority`;
const client = new mongodb.MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});

client.connect().then((client: mongodb.MongoClient) => {
    const db = client.db();
    const bot = createBotInstance(db, config.bot);

    app.locals.db = db;

    app.use(express.json());
    app.use(bot.webhookCallback(config.bot.webHookPath));
    app.use('/api', router);

    bot.launch();
    app.listen(config.port, () => console.log(`server launched on :${config.port}`));
});
