import { formatDistanceStrict } from 'date-fns';
import { Markup, Telegraf } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { Message } from 'telegraf/typings/core/types/typegram';
import { getConfig } from '../../resolvers/config';
import { StatusResponse, StatusResponseError, StatusResponseSuccess, BotContext } from 'types';
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

export const isTextMessage = (message: Message | undefined): message is Message.TextMessage => isObject(message) && message.text !== undefined;

export const isStatusResponseError = (response: StatusResponse): response is StatusResponseError => isObject(response) && response.error !== undefined;

const formatErrorResponse = (data: StatusResponseError) => (
    `\\#${data.controllerId}\n\r\n\r` +
    `Error: *${data.error.message}*`
);

const formatSuccessResponse = (data: StatusResponseSuccess) => {
    const { temperature, humidity, controllerId, light, lastError } = data;
    const timeBeforeSwitch = formatDistanceStrict(0, light.msBeforeSwitch);
    const lightStatusString = `Light will stay *${light.isOn ? 'on' : 'off'}* for ${timeBeforeSwitch}`;
    const lastErrorString = lastError ? `Last error \\= *${lastError.payload.error}*` : null;

    return [
        `\\#${controllerId}`,
        `T\\=*${temperature}*°C`,
        `H\\=*${humidity}*%`,
        lightStatusString,
        lastErrorString,
    ]
    .filter(item => !!item)
    .join('  ·  ');
};

export const getStatusFormatted = (data: StatusResponse): string => isStatusResponseError(data) ? formatErrorResponse(data) : formatSuccessResponse(data);
