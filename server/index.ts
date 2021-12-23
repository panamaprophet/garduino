import {createServer} from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';
import router from './routes';
import {getBot} from './bot';
import {getMongoDb} from './db';
import {getWebSocketServer} from './websocket';
import {getConfig} from './config';


void (async () => {
    const config = getConfig();
    const app = new Koa();
    const server = createServer(app.callback());
    const [db] = await getMongoDb(config.db);
    const [bot, botMiddleware] = await getBot(db, config.bot);
    const [ws, cache] = getWebSocketServer(server);

    app.use(koaBody());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.use(botMiddleware);

    app.context.db = db;
    app.context.bot = bot;
    app.context.ws = { ws, cache };

    server.listen(process.env.SERVER_PORT);

    console.log('started');
})();