import {getControllerIds} from '../../resolvers/controller';
import {getLastUpdateEventLogByControllerId} from '../../resolvers/log';
import {HELP_PLACEHOLDER} from '../../constants';

import type {BotContext} from '../index';


export const help = async ({reply}: BotContext): Promise<any> => reply(HELP_PLACEHOLDER);

export const stat = async ({scene}: BotContext): Promise<any> => scene.enter('stat');

export const setup = async ({scene}: BotContext): Promise<any> => scene.enter('setup');

export const manage = async ({scene}: BotContext): Promise<any> => scene.enter('controllerManager');

export const start = async ({db, chat, scene, reply}: BotContext): Promise<any> => {
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return reply(HELP_PLACEHOLDER);
};

export const now = async ({db, chat, reply}: BotContext): Promise<any> => {
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});
    const resultPromises = controllerIds.map(controllerId => getLastUpdateEventLogByControllerId({db, controllerId}));
    const results = await Promise.all(resultPromises);
    const result = results.map(({text}) => text);

    return reply(result.join('\n\r'));
};