const {getControllerIds} = require('../../../resolvers/controller');
const {getInlineKeyboard} = require('../../helpers');


const selectController = async ctx => {
    const {db, chat: {id: chatId}} = ctx;
    const controllerIds = await getControllerIds(db, {chatId});

    if (controllerIds.length === 0) {
        await ctx.reply('No controllers presented');
        return ctx.scene.leave();
    }

    ctx.reply('Select controller', getInlineKeyboard(controllerIds));
    return ctx.wizard.next();
};


module.exports = {
    selectController,
};