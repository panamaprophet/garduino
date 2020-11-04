import type {ControllerConfigRaw} from '../helpers/config';


export const LOG_EVENT: { [key: string]: string } = {
    UPDATE: 'events/update',
    CONNECT: 'events/connect',
    ERROR: 'events/error',
    SWITCH: 'events/switch',
    RUN: 'events/run',
};


export const HELP_PLACEHOLDER: string = `Greetings. These are the things i can do:

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