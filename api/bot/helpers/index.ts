import { Markup, Telegraf } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { Message } from 'telegraf/typings/core/types/typegram';
import { getConfig } from '../../resolvers/config';
import { StatusResponse, StatusResponseError, BotContext } from 'types';
import { isObject } from 'helpers';


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

export const sendMessage = async ({ bot, controllerId }: {
    bot: Telegraf<BotContext>,
    controllerId: string,
}, message: string): Promise<Message.TextMessage | null> => {
    const config = await getConfig(controllerId);

    return config?.chatId
        ? bot.telegram.sendMessage(config.chatId, message, { parse_mode: "MarkdownV2" })
        : null;
};

export const isTextMessage = (message: unknown): message is Message.TextMessage => isObject(message) && message.text !== undefined;

export const isStatusResponseError = (response: StatusResponse): response is StatusResponseError => isObject(response) && response.error !== undefined;




