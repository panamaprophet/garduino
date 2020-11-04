import stream from 'stream';
import mongodb from 'mongodb';
import {session, Stage, Telegraf, Context, Middleware} from 'telegraf';
import {SceneContextMessageUpdate} from 'telegraf/typings/stage';
import {StatSceneController} from './controllers/stat';
import {SetupSceneController} from './controllers/setup';
import {ControllerManagerController} from './controllers/manager';
import * as commands from './commands';


type BotParams = {
    token: string,
    webHookPath: string,
};

type BaseBotContext = Context & SceneContextMessageUpdate;

export interface BotContext extends BaseBotContext {
    db: mongodb.Db,
    chatId: number,
    wizard: any,
    session: any,
};

export type ActionContext = {
    db: mongodb.Db,
    chatId: number | undefined,
    controllerId: string,
    value?: string | null,
};

export type ActionResult = {
    text?: string,
    image?: stream.Readable | Error,
    success?: boolean,
}

const getCommandByKey = (key: string, obj: Record<string, Middleware<BotContext>>) => obj[key];

export const createBotInstance = (db: mongodb.Db, {token, webHookPath}: BotParams): Telegraf<BotContext> => {
    const bot = new Telegraf<BotContext>(token);
    const stage = new Stage<BotContext>([
        StatSceneController,
        SetupSceneController,
        ControllerManagerController,
    ], {ttl: 10});

    bot.telegram.setWebhook(webHookPath);
    bot.context.db = db;

    bot.use(session());
    bot.use(stage.middleware());

    Object.keys(commands).forEach(key => bot.command(key, getCommandByKey(key, commands)));

    return bot;
};