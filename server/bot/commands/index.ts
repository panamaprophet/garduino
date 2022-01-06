import {MiddlewareFn} from 'telegraf';
import {formatDistance} from 'date-fns';
import {getControllerIds} from '../../resolvers/controller';
import {getControllerStatus} from '../../resolvers/status';
import {HELP_PLACEHOLDER} from '../../constants';
import type {BotContext} from '..';


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


const getStatusFormatted = (data: {[k: string]: any }) =>
    `#${data.controllerId}\n\r\n\r` +

    `T = ${data.temperature} °C\n\r` + 
    `H = ${data.humidity} %\n\r\n\r` + 

    `Light is ${data.light.isOn ? 'on' : 'off'} (${formatDistance(0, Number(data.light.msBeforeSwitch))} remains)\n\r\n\r` +

    (data.lastError
        ? `Last error = ${data.lastError}`
        : '');


export const now: MiddlewareFn<BotContext> = async ctx => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        const resultPromises = controllerIds.map(controllerId => {
            const ws = ctx.ws.cache.get(controllerId);

            return ws
                ? getControllerStatus(controllerId, ws)
                : {
                    success: false,
                    error: { message: `no controller with id #${controllerId} is connected via ws` },
                };
            });

        return Promise
            .all(resultPromises)
            .then(results => results.map((result, index) => getStatusFormatted({...result, controllerId: controllerIds[index]})))
            .then(results => results.join('\n\r'))
            .then(result => ctx.reply(result));
    }

    return ctx.reply(JSON.stringify({ error: 'no controllers found' }));
};