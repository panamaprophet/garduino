import Koa from 'koa';
import koaBody from 'koa-body';
import router from './routes';
import {createBotInstance} from './bot';
import {getMongoClient} from './db';
import {getConfig} from './config';


(async function () {
    const config = getConfig();
    const app = new Koa();
    const client = await getMongoClient(config.db);
    const db = client.db();
    const bot = await createBotInstance(db, config.bot);

    app.context.db = db;
    app.context.bot = bot;

    app.use(koaBody());
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(process.env.SERVER_PORT);
})();