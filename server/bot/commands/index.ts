import {getControllerIds} from '../../resolvers/controller';
import {getControllerStatus} from '../../resolvers/status';
import {HELP_PLACEHOLDER} from '../../constants';
import type {BotContext} from '..';
import { MiddlewareFn } from 'telegraf';


export const help: MiddlewareFn<BotContext> = ctx => ctx.reply(HELP_PLACEHOLDER);

export const stat: MiddlewareFn<BotContext> = ({scene}) => scene.enter('stat');

export const setup: MiddlewareFn<BotContext> = ({scene}) => scene.enter('setup');

export const manage: MiddlewareFn<BotContext> = ({scene}) => scene.enter('controllerManager');

export const start: MiddlewareFn<BotContext> = async ctx => {
    const {db, chat, scene} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return ctx.reply(HELP_PLACEHOLDER);
};

export const now: MiddlewareFn<BotContext> = async ctx => {
    const {db, ws, chat} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        const resultPromises = controllerIds.map(controllerId => getControllerStatus(controllerId, ws.cache.get(controllerId)));
        const results = await Promise.all(resultPromises);

        return ctx.reply(JSON.stringify(results));
    }

    return ctx.reply(JSON.stringify({ error: 'no controllers found' }));
};