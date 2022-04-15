import { MiddlewareFn } from 'telegraf';
import { getControllerIds } from '../../resolvers/controller';
import { getControllerStatus } from '../../resolvers/status';
import { getStatusFormatted } from '../helpers';
import { BotContext } from 'types';
import { WEBSOCKET_ACTIONS } from '../../constants';


const HELP_PLACEHOLDER =
    `Greetings. These are the things i can do:\n\r\n\r` +
    `   /help — show this message\n\r` +
    `   /now — check current state or get stat\n\r` +
    `   /setup — edit controller configuration\n\r` +
    `   /manage - edit controllers list`;


export const help: MiddlewareFn<BotContext> = ctx => ctx.reply(HELP_PLACEHOLDER);

export const stat: MiddlewareFn<BotContext> = ({ scene }) => scene.enter('stat');

export const setup: MiddlewareFn<BotContext> = ({ scene }) => scene.enter('setup');

export const manage: MiddlewareFn<BotContext> = ({ scene }) => scene.enter('controllerManager');

export const start: MiddlewareFn<BotContext> = async ctx => {
    const { chat, scene } = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds({ chatId });

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return ctx.reply(HELP_PLACEHOLDER);
};

export const now: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds({ chatId });

    if (controllerIds.length > 0) {
        const resultPromises = controllerIds.map(controllerId => {
            const ws = ctx.ws.cache.get(controllerId);

            return ws
                ? getControllerStatus(controllerId, ws)
                : {
                    controllerId,
                    error: { message: 'controller offline' },
                };
        });

        return Promise
            .all(resultPromises)
            .then(results => results.map((result, index) => getStatusFormatted({ ...result, controllerId: controllerIds[index] })))
            .then(results => results.join('\n\r'))
            .then(result => ctx.replyWithMarkdownV2(result));
    }

    return ctx.reply('controller not found');
};

export const reboot: MiddlewareFn<BotContext> = async ctx => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const [controllerId] = await getControllerIds({ chatId });

    if (!controllerId) {
        return ctx.reply('controller not found');
    }

    if (!ctx.ws.cache.has(controllerId)) {
        return ctx.reply('controller offline');
    }

    ctx.ws.cache.get(controllerId)?.send(JSON.stringify({
        action: WEBSOCKET_ACTIONS.REBOOT,
        payload: { controllerId },
    }));

    return ctx.reply(`#${controllerId} was rebooted`);
};
