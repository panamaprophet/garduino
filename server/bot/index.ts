import stream from 'stream';
import mongodb from 'mongodb';
import Koa from 'koa';
import {session, Scenes, Telegraf, Context, Middleware} from 'telegraf';
import StatSceneController from './controllers/stat';
import SetupSceneController from './controllers/setup';
import ControllerManagerController from './controllers/manager';
import * as commands from './commands';
import { WebSocket, WebSocketServer } from 'ws';


export type ActionContext = {
    db: mongodb.Db,
    chatId: number,
    controllerId: string,
    value?: string,
}

export type ActionResult = {
    text?: string,
    image?: stream.Readable,
    success?: boolean,
}

// will be available under ctx.session[.prop]
interface SceneSession extends Scenes.SceneSession<Scenes.WizardSessionData> {
    controllerId: string,
    action: string,
}

// will be available under ctx[.prop]
export interface BotContext extends Context {
    db: mongodb.Db,
    ws: {
        ws: WebSocketServer,
        cache: Map<string, WebSocket>,
    },
    session: SceneSession,
    scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>,
    wizard: Scenes.WizardContextWizard<BotContext>,
}


const getCommandByKey = (key: string, obj: { [k: string]: Middleware<BotContext> }) => obj[key];


export const getBot = async (db: mongodb.Db, ws: { ws: any, cache: any }, {token, path}: Record<string, string>): Promise<[Telegraf<BotContext>, Koa.Middleware]> => {
    const bot = new Telegraf<BotContext>(token);

    const stage = new Scenes.Stage<BotContext>([
        StatSceneController,
        SetupSceneController,
        ControllerManagerController,
    ], {ttl: 10});

    const url = `${path}/${bot.secretPathComponent()}`;

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