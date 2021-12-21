import Koa from 'koa';
import koaBody from 'koa-body';
import router from './routes';
import {getBot} from './bot';
import {getMongoClient} from './db';
import {getConfig} from './config';


void (async () => {
    const config = getConfig();
    const app = new Koa();
    const client = await getMongoClient(config.db);
    const db = client.db();
    const [bot, botMiddleware] = await getBot(db, config.bot);

    app.context.db = db;
    app.context.bot = bot;

    app.use(koaBody());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.use(botMiddleware);

    app.listen(process.env.SERVER_PORT);

    console.log('started');
})();