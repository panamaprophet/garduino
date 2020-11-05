import {Markup} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';


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