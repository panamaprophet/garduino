import mongodb from 'mongodb';
import Koa from 'koa';
import {WebSocket, WebSocketServer} from 'ws';
import {Scenes, Telegraf, Middleware, session} from 'telegraf';
import {Stat, Setup, ControllerManager} from './scenes';
import * as commands from './commands';
import {BotContext} from 'types';


const getCommandByKey = (key: string, obj: { [k: string]: Middleware<BotContext> }) => obj[key];

export const getBot = async (
    db: mongodb.Db, 
    ws: { 
        ws: WebSocketServer, 
        cache: Map<string, WebSocket> 
    }, {
        token, 
        path,
    }: Record<string, string>): Promise<[
        Telegraf<BotContext>,
        Koa.Middleware
    ]> => {
        const bot = new Telegraf<BotContext>(token);
        const url = `${path}/${bot.secretPathComponent()}`;
        const stage = new Scenes.Stage<BotContext>([Stat, Setup, ControllerManager], {ttl: 10});

        await bot.telegram.setWebhook(url);

        bot.context.db = db;
        bot.context.ws = ws;
        bot.use(session()); // @todo: get rid of deprecated
        bot.use(stage.middleware());

        Object.keys(commands).forEach(key => bot.command(key, getCommandByKey(key, commands)));

        const middleware: Koa.Middleware = async (ctx, next) => {
            if (url.endsWith(ctx.url)) {
                await bot.handleUpdate(ctx.request.body);
                ctx.status = 200;
                return;
            }

            return next();
        };

        return [bot, middleware];
    };