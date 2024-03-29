import { Middleware } from 'telegraf';
import { getControllerIds } from '../../../resolvers/controller';
import { getInlineKeyboard } from '../../helpers';
import { BotContext } from 'types';


export const selectController: Middleware<BotContext> = async (ctx: BotContext) => {
    const { chat } = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds({ chatId });

    if (controllerIds.length === 0) {
        await ctx.reply('No controllers presented');

        return ctx.scene.leave();
    }

    await ctx.reply('Select controller', getInlineKeyboard(controllerIds));

    return ctx.wizard.next();
};
