import {getControllerIds} from '../../../resolvers/controller';
import {getInlineKeyboard} from '../../helpers';

import type {BotContext} from '../../index';
import WizardScene from 'telegraf/scenes/wizard';


export const selectController = async (ctx: BotContext): Promise<typeof WizardScene> => {
    const {db, chat} = ctx;
    const chatId = chat?.id;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length === 0) {
        await ctx.reply('No controllers presented');
        return ctx.scene.leave();
    }

    ctx.reply('Select controller', getInlineKeyboard(controllerIds));

    return ctx.wizard.next();
};