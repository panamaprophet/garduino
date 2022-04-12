import { createServer } from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';
import router from './routes';
import { getBot } from './bot';
import { getMongoDb } from './db';
import { getWebSocketServer } from './websocket';
import { getConfig } from './config';
import { ICustomAppContext, ICustomAppState } from 'types';


void (async () => {
    const config = getConfig();
    const app = new Koa<ICustomAppState, ICustomAppContext>();
    const server = createServer(app.callback());
    const [db] = await getMongoDb(config.db);
    const [ws, cache] = getWebSocketServer(server);
    const [bot, botMiddleware] = await getBot(db, { ws, cache }, config.bot);

    app.use(koaBody());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.use(botMiddleware);

    app.context.db = db;
    app.context.bot = bot;
    app.context.ws = { ws, cache };

    server.listen(config.port);

    console.log('started');
})();
