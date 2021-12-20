import {Markup} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {getConfig} from '../../resolvers/config';
import type {RequestContext} from '../../helpers/index';


export const getInlineKeyboard = (options: string[]): ExtraReplyMessage => {
    const buttons = options.map(option => {
        const title = option;
        const action = option;

        return Markup.button.callback(title, action);
    });

    return Markup
        .keyboard(buttons)
        .oneTime()
        .resize();
};

export const sendMessage = async ({ bot, db, controllerId }: RequestContext, message: string) => {
    const config = await getConfig(db, controllerId);

    return config?.chatId
        ? bot.telegram.sendMessage(config.chatId, message)
        : null;
}