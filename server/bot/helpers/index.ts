import mongodb from 'mongodb';
import {Markup, Telegraf} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {Message} from 'telegraf/typings/core/types/typegram';
import {getConfig} from '../../resolvers/config';
import { BotContext } from 'bot';


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

export const sendMessage = async ({ bot, db, controllerId }: {
    bot: Telegraf<BotContext>,
    db: mongodb.Db,
    controllerId: string,
}, message: string): Promise<Message.TextMessage | null> => {
    const config = await getConfig(db, controllerId);

    return config?.chatId
        ? bot.telegram.sendMessage(config.chatId, message)
        : null;
}

export const isTextMessage = (message: Message | undefined): message is Message.TextMessage => (message as Message.TextMessage).text !== undefined;