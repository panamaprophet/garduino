import {getControllerIds} from '../../resolvers/controller';
import {getLastUpdateEventLogByControllerId} from '../../resolvers/log';
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
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        const resultPromises = controllerIds.map(controllerId => getLastUpdateEventLogByControllerId(db, controllerId));
        const results = await Promise.all(resultPromises);

        return ctx.reply(results.join('\n\r'));
    }

    return ctx.reply(JSON.stringify({ error: 'no controllers found' }));
};