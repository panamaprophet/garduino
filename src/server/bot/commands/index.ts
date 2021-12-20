import {getControllerIds} from '../../resolvers/controller';
import {getLastUpdateEventLogByControllerId} from '../../resolvers/log';
import {HELP_PLACEHOLDER} from '../../constants';
import type {BotContext} from '..';


export const help = async (ctx: BotContext) => ctx.reply(HELP_PLACEHOLDER);

export const stat = async ({scene}: BotContext) => scene.enter('stat');

export const setup = async ({scene}: BotContext) => scene.enter('setup');

export const manage = async ({scene}: BotContext) => scene.enter('controllerManager');

export const start = async (ctx: BotContext) => {
    const {db, chat, scene} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return ctx.reply(HELP_PLACEHOLDER);
};

export const now = async (ctx: BotContext) => {
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