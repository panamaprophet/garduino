import {EventType} from 'types';


export const LOG_EVENT: Record<EventType, string> = {
    'CONFIG': 'events/config',
    'UPDATE': 'events/update',
    'ERROR': 'events/error',
    'SWITCH': 'events/switch',
    'RUN': 'events/run',
};

export const WEBSOCKET_RESPONSE_TIMEOUT = 5000;

export const WEBSOCKET_ACTIONS = {
    STATUS: 'actions/status',
    REBOOT: 'actions/reboot',
};