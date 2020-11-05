import {getControllerIds} from '../../resolvers/controller';
import {getLastUpdateEventLogByControllerId} from '../../resolvers/log';
import {HELP_PLACEHOLDER} from '../../constants';

import type {BotContext} from '../index';
import type {Message} from 'telegraf/typings/telegram-types';
import WizardScene from 'telegraf/scenes/wizard';


export const help = async ({reply}: BotContext): Promise<Message> => reply(HELP_PLACEHOLDER);

export const stat = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('stat');

export const setup = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('setup');

export const manage = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('controllerManager');

export const start = async ({db, chat, scene, reply}: BotContext): Promise<Message> => {
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length > 0) {
        return scene.enter('controllerManager');
    }

    return reply(HELP_PLACEHOLDER);
};

export const now = async ({db, chat, reply}: BotContext): Promise<Message> => {
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});
    const resultPromises = controllerIds.map(controllerId => getLastUpdateEventLogByControllerId(db, controllerId));
    const results = await Promise.all(resultPromises);

    return reply(results.join('\n\r'));
};