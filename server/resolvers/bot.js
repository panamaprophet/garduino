const { getContext } = require("../helpers");

const help = async ({reply}) => {
    const response = 
    `Greetings. These are the things i can do:
  
    /help — show this message
    /now — show current params of sensors
    /stat — show data overview
    /setup — edit configuration`;
  
    reply(response);
};

const now = async (ctx) => {
const {scene,request,db} = ctx;

    return scene.enter('now', {
        context: {db},
    });
};

const stat = async ({reply}) => {
    reply('statistics');
};

const setup = async ({reply}) => {
    reply('light schedule');
};


module.exports = {
    help, 
    now, 
    stat, 
    setup,
};
