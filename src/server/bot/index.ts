import stream from 'stream';
import mongodb from 'mongodb';
import {session, Stage, Telegraf, Context, Middleware} from 'telegraf';
import {Scene, SceneContextMessageUpdate} from 'telegraf/typings/stage';
import StatSceneController from './controllers/stat';
import SetupSceneController from './controllers/setup';
import ControllerManagerController from './controllers/manager';
import * as commands from './commands';


type BotParams = {
    token: string,
    webHookPath: string,
};

type BaseBotContext = Context & SceneContextMessageUpdate;

export interface BotContext extends BaseBotContext {
    db: mongodb.Db,
    chatId: number,
    wizard: Scene<BaseBotContext> & {
        next: () => void,
        selectStep: (step: number) => void,
    },
    session: Record<string, string | undefined>,
}

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

const getCommandByKey = (key: string, obj: Record<string, Middleware<BotContext>>) => obj[key];

export const createBotInstance = async (db: mongodb.Db, {token, webHookPath}: BotParams): Promise<Telegraf<BotContext>> => {
    const bot = new Telegraf<BotContext>(token);
    const stage = new Stage<BotContext>([
        StatSceneController,
        SetupSceneController,
        ControllerManagerController,
    ], {ttl: 10});

    await bot.telegram.setWebhook(webHookPath);

    bot.context.db = db;
    bot.use(session());
    bot.use(stage.middleware());

    Object.keys(commands).forEach(key => bot.command(key, getCommandByKey(key, commands)));

    return bot;
};