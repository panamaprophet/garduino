const {Markup} = require('telegraf');


const getInlineKeyboard = options => {
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


module.exports = {
    getInlineKeyboard,
};
