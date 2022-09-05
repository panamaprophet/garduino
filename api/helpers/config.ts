import { addMilliseconds, compareDesc, differenceInMilliseconds, subDays } from 'date-fns';
import { ConfigEntity, ConfigEntityRaw, ControllerConfigRaw } from 'types';


const getTimeFromString = (time: string) => time.split(':').map(item => Number(item));

const pad = (n: number, symbol = '0', length = 2) => n.toString().padStart(length, symbol);

export const getConfigEntity = (config: ConfigEntityRaw, refDate: Date = new Date()): ConfigEntity => {
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


const isRawConfigEntity = (data: unknown): data is ConfigEntityRaw =>
    (data !== null) &&
    (typeof data === 'object') &&
    ('onTime' in data) &&
    ('duration' in data);


export const extractConfig = (data: { [k: string]: unknown }): ControllerConfigRaw => {
    const {
        controllerId,
        chatId,
        light,
        temperatureThreshold,
    } = data;

    if (!controllerId || !chatId) {
        throw new Error('configuration extraction error: no valid controller or chat id');
    }

    if (!isRawConfigEntity(light)) {
        throw new Error('configuration extraction error: light configuration is not an object');
    }

    return {
        light,
        chatId: Number(chatId),
        controllerId: String(controllerId),
        temperatureThreshold: Number(temperatureThreshold),
    };
};

export const formatConfig = (data: ControllerConfigRaw): string => {
    return [
        `Light On = ${data.light.onTime} UTC`,
        `Duration = ${data.light.duration} ms`,
        '',
        `Temperature threshold = ${data.temperatureThreshold}°C`,
    ].join('\n');
};
