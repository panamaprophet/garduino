const LOG_EVENT = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
    SWITCH: 'events/switch',
    RUN: 'events/run',
};


const HELP_PLACEHOLDER = `Greetings. These are the things i can do:

/help — show this message
/now — check current state or get stat
/setup — edit controller configuration
/manage - edit controllers list`;


const DEFAULT_CONFIG = {
    light: {
        onTime: '09:00',
        duration: 43200000,
    },
    fan: {
        onTime: '09:00',
        duration: 43200000,
    },
    temperatureThreshold: 35,
};


module.exports = {
    LOG_EVENT,
    HELP_PLACEHOLDER,
    DEFAULT_CONFIG,
};