const CONFIG_FIELDS = [
    'lightCycleDurationMs',
    'fanCycleDurationMs',
    'lightCycleOnTime',
    'fanCycleOnTime'
];

const DEFAULT_LOG_FIELDS = [
    'event',
    'timestamp',
    'payload',
];

const LOG_EVENT = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
    SWITCH: 'events/switch',
    RUN: 'events/run',
};


module.exports = {
    CONFIG_FIELDS,
    DEFAULT_LOG_FIELDS,
    LOG_EVENT,
};