import WizardScene from 'telegraf/scenes/wizard';
import type {Message} from 'telegraf/typings/telegram-types';
import {getControllerIds} from '../../resolvers/controller';
import {getLastUpdateEventLogByControllerId} from '../../resolvers/log';
import {HELP_PLACEHOLDER} from '../../constants';
import type {BotContext} from '..';


export const help = async ({reply}: BotContext): Promise<Message> => reply(HELP_PLACEHOLDER);

export const stat = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('stat');

export const setup = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('setup');

export const manage = async ({scene}: BotContext): Promise<typeof WizardScene> => scene.enter('controllerManager');

export const start = async ({db, chat, scene, reply}: BotContext): Promise<Message | typeof WizardScene> => {
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

    if (controllerIds.length > 0) {
        const resultPromises = controllerIds.map(controllerId => getLastUpdateEventLogByControllerId(db, controllerId));
        const results = await Promise.all(resultPromises);

        return reply(results.join('\n\r'));
    }

    return reply(JSON.stringify({ error: 'no controllers found' }));
};