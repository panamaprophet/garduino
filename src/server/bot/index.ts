import stream from 'stream';
import mongodb from 'mongodb';
import {session, Scenes, Telegraf, Context, Middleware} from 'telegraf';
import StatSceneController from './controllers/stat';
import SetupSceneController from './controllers/setup';
import ControllerManagerController from './controllers/manager';
import * as commands from './commands';


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

// will be available under ctx.scene.session[.prop]
export interface BotSceneSession extends Scenes.WizardSessionData {}

// will be available under ctx.session[.prop]
export interface BotSession extends Scenes.SceneSession<BotSceneSession> {
    controllerId: string,
    action: string,
}

// will be available under ctx[.prop]
export interface BotContext extends Context {
    db: mongodb.Db,
    session: BotSession,
    scene: Scenes.SceneContextScene<BotContext, BotSceneSession>,
    wizard: Scenes.WizardContextWizard<BotContext>,
}


const getCommandByKey = (key: string, obj: { [k: string]: Middleware<BotContext> }) => obj[key];

export const createBotInstance = async (db: mongodb.Db, {token, path}: Record<string, string>): Promise<Telegraf<BotContext>> => {
    const bot = new Telegraf<BotContext>(token);

    const stage = new Scenes.Stage<BotContext>([
        StatSceneController,
        SetupSceneController,
        ControllerManagerController,
    ], {ttl: 10});

    await bot.telegram.setWebhook(path);

    bot.context.db = db;
    bot.use(session());
    bot.use(stage.middleware());

    Object.keys(commands).forEach(key => bot.command(key, getCommandByKey(key, commands)));

    return bot;
};