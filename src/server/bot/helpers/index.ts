import {Markup} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {getConfig} from '../../resolvers/config';
import type {RequestContext} from '../../helpers/index';


export const getInlineKeyboard = (options: string[]): ExtraReplyMessage => {
    const keyboard = Markup.inlineKeyboard(options.map(option => {
        const title = option;
        const action = option;

        return Markup.callbackButton(title, action);
    }))
    .oneTime()
    .resize()
    .extra()

    return keyboard;
};

export const sendMessage = async ({ bot, db, controllerId }: RequestContext, message: string) => {
    const config = await getConfig(db, controllerId);

    return config?.chatId
        ? bot.telegram.sendMessage(config.chatId, message)
        : null;
}