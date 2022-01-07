import type {ControllerConfigRaw, EventType} from 'types';


export const LOG_EVENT: Record<EventType, string> = {
    'CONFIG': 'events/config',
    'UPDATE': 'events/update',
    'ERROR': 'events/error',
    'SWITCH': 'events/switch',
    'RUN': 'events/run',
};


export const HELP_PLACEHOLDER = `Greetings. These are the things i can do:

/help — show this message
/now — check current state or get stat
/setup — edit controller configuration
/manage - edit controllers list`;


export const DEFAULT_CONFIG: ControllerConfigRaw = {
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
