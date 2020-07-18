const CONFIG_FIELDS = [
    'lightCycleDurationMs',
    'fanCycleDurationMs',
    'lightCycleOnTime',
    'fanCycleOnTime'
];

const DEFAULT_LOG_FIELDS = [
    'type',
    'event',
    'timestamp',
    'payload',
];

const LOG_TYPE = {
    INFO: 'types/info',
    WARNING: 'types/warning',
    ERROR: 'types/error',
};

const LOG_EVENT = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
};


module.exports = {
    CONFIG_FIELDS,
    DEFAULT_LOG_FIELDS,
    LOG_TYPE,
    LOG_EVENT,
};