import Koa from 'koa';

// import express from 'express';
import mongodb from 'mongodb';
import {createBotInstance} from './bot';
import config from './config';
import router from './routes';


const getMongoClient = (config: any) => {
    const uri = `mongodb+srv://${config.user}:${config.pass}@${config.host}/${config.database}?retryWrites=true&w=majority`;
    const client = new mongodb.MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});

    return client.connect();
};


(async function () {
    const app = new Koa();
    const client = await getMongoClient(config.db);
    const db = client.db();

    app.context.db = db;

    app.listen(config.port);
})();




// client.connect().then(async () => {
//     const db = client.db();
//     const bot = await createBotInstance(db, config.bot);

//     // app.locals.db = db;
//     // app.locals.bot = bot;

//     // app.use(express.json());
//     // app.use(bot.webhookCallback(config.bot.webHookPath));
//     // app.use('/api', router);

//     await bot.launch();

//     app.listen(config.port, () => console.log(`server launched on :${config.port}`));
// }, () => {
//     console.log('connection error');
// });
