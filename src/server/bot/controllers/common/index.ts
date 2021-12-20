import {getControllerIds} from '../../../resolvers/controller';
import {getInlineKeyboard} from '../../helpers';
import type {BotContext} from '../../index';


export const selectController = async (ctx: BotContext) => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length === 0) {
        await ctx.reply('No controllers presented');

        ctx.scene.leave();
    }

    await ctx.reply('Select controller', getInlineKeyboard(controllerIds));

    ctx.wizard.next();
};