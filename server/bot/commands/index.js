const HELP_PLACEHOLDER = `Greetings. These are the things i can do:

/help — show this message
/now — show current params of sensors
/stat — show data overview
/setup — edit configuration`;


const help = async ({reply}) => reply(HELP_PLACEHOLDER);

const now = async ({scene}) => scene.enter('now');

const setup = async ({scene}) => scene.enter('setup');


module.exports = {
    now,
    setup,
    help,
    start: help,
};
