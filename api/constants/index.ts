import { EventType } from 'types';


export const LOG_EVENT: Record<EventType, string> = {
    'CONFIG': 'events/config',
    'UPDATE': 'events/update',
    'ERROR': 'events/error',
    'SWITCH': 'events/switch',
    'RUN': 'events/run',
};

export const SENSOR_READ_ERRORS = {
    TIMEOUT: 'TO',
    CHECKSUM: 'CS',
    DATA_READ: 'DATA',
    NEGATIVE_ACKNOWLEDGEMENT: 'NACK',
};

export const JSON_PARSE_ERRORS = {
    EMPTY_INPUT: 'EmptyInput',
    INVALID_DATA: 'InvalidData',
    INCOMPLETE_DATA: 'IncompleteData',
    NO_MEMORY: 'NoMemory',
    TOO_DEEP: 'TooDeep',
};

export const CRITICAL_ERRORS = [
    SENSOR_READ_ERRORS.TIMEOUT,
    ...Object.values(JSON_PARSE_ERRORS),
];

export const WEBSOCKET_RESPONSE_TIMEOUT = 5000;

export const WEBSOCKET_ACTIONS = {
    STATUS: 'actions/status',
    REBOOT: 'actions/reboot',
};
