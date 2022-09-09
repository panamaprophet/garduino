import { addMilliseconds, compareDesc, differenceInMilliseconds, subDays } from 'date-fns';
import { isObject } from '../helpers';
import {
    ControllerStatus,
    ControllerConfigurationSerialized,
    ControllerEvent,
    ControllerEventPayload,
    ModuleConfiguration,
    ModuleConfigurationSerialized,
} from '../types';


const getTimeFromString = (time: string) => time.split(':').map(item => Number(item));

const pad = (n: number, symbol = '0', length = 2) => n.toString().padStart(length, symbol);

const isRawConfigEntity = (data: unknown): data is ModuleConfigurationSerialized => (
    isObject(data) &&
    'onTime' in data &&
    'duration' in data
);

const isControllerStatus = (data: unknown): data is ControllerStatus => (
    isObject(data) &&
    isObject(data.light) &&
    'humidity' in data &&
    'temperature' in data &&
    'lastError' in data
);


export const mapDataToControllerConfiguration = (data: unknown): ControllerConfigurationSerialized => {
    if (!isObject(data)) {
        throw new Error('configuration extraction error: data is not an object');
    }

    if (!data.controllerId || !data.chatId) {
        throw new Error('configuration extraction error: no valid controller or chat id');
    }

    if (!isRawConfigEntity(data.light)) {
        throw new Error('configuration extraction error: light configuration is not an object');
    }

    return {
        light: data.light,
        chatId: Number(data.chatId),
        controllerId: String(data.controllerId),
    };
};

export const mapDataToModuleConfiguration = (config: ModuleConfigurationSerialized, refDate = new Date()): ModuleConfiguration => {
    const { duration } = config;
    const [onHours, onMinutes] = getTimeFromString(config.onTime);
    const dateString = `${refDate.getFullYear()}-${pad(refDate.getMonth() + 1)}-${pad(refDate.getDate())}T${pad(onHours)}:${pad(onMinutes)}Z`;

    let onTime = new Date(dateString);
    let offTime = addMilliseconds(onTime, duration);

    const offHours = offTime.getHours();

    if (offHours < onHours && offHours > refDate.getHours()) {
        onTime = subDays(onTime, 1);
        offTime = subDays(offTime, 1);
    }

    const isOn = compareDesc(onTime, refDate) >= 0 && compareDesc(offTime, refDate) < 0;
    const msBeforeSwitch = differenceInMilliseconds(isOn ? offTime : onTime, refDate);

    return {
        isOn,
        duration,
        msBeforeSwitch,
    };
};

export const mapDataToLogEntity = (data: unknown): ControllerEvent => {
    if (!isObject(data)) {
        throw new Error('log extraction error: data is not an object');
    }

    if (!data.event) {
        throw new Error('log extraction error: data is not an event');
    }

    const payload = Array.isArray(data.payload) ? data.payload : [];

    return {
        date: new Date(),
        event: String(data.event),
        payload: Object.fromEntries(payload) as ControllerEventPayload,
    };
};

export const mapDataToControllerStatus = (data: unknown) => {
    if (isControllerStatus(data)) {
        return data;
    }

    throw new Error('object is not a controller status');
};
