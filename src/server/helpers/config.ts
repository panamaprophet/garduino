import {parse, addMilliseconds, compareDesc, differenceInMilliseconds} from 'date-fns';


type ConfigEntityRaw = {
    duration: number,
    onTime: string,
};

type ConfigEntity = {
    isOn: boolean,
    duration: number,
    msBeforeSwitch: number,
}

export type ControllerConfigRaw = {
    controllerId?: string,
    chatId?: number,
    light: ConfigEntityRaw,
    fan: ConfigEntityRaw,
    temperatureThreshold: number,
};

type ControllerConfig = {
    light: ConfigEntity,
    fan: ConfigEntity,
    temperatureThreshold: number,
};

type ControllerConfigFlat = {
    temperatureThreshold: number,
    isLightOn: boolean,
    isFanOn: boolean,
    lightCycleDurationMs: number,
    fanCycleDurationMs: number,
    msBeforeLightSwitch: number,
    msBeforeFanSwitch: number,
};


export const getConfigEntity = ({duration, onTime: onTimeString}: ConfigEntityRaw): ConfigEntity => {
    const currentDate = Date.now();
    const onTime = parse(onTimeString, 'HH:mm', currentDate);
    const offTime = addMilliseconds(onTime, duration);
    const isOn = compareDesc(onTime, currentDate) >= 0 && compareDesc(offTime, currentDate) < 0;
    const msBeforeSwitch = differenceInMilliseconds(isOn ? offTime : onTime, currentDate);

    return {
        isOn,
        duration,
        msBeforeSwitch,
    };
};

// @todo: add validation
export const extractConfig = <T>(data: T): T => data;

/**
 * @param {ControllerConfig} controllerConfig - nested configuration
 * @returns {ControllerConfigFlat} - configuration with flat structure
 */
export const flattenConfig = ({light, fan, temperatureThreshold}: ControllerConfig): ControllerConfigFlat => ({
    temperatureThreshold,
    isLightOn: light.isOn,
    lightCycleDurationMs: light.duration,
    msBeforeLightSwitch: light.msBeforeSwitch,
    isFanOn: fan.isOn,
    fanCycleDurationMs: fan.duration,
    msBeforeFanSwitch: fan.msBeforeSwitch,
});

export const formatConfig = (data: ControllerConfigRaw): string => {
    return [
        'Light:',
        `On time = ${data.light.onTime} UTC`,
        `Duration = ${data.light.duration} ms`,
        '',
        'Fan:',
        `On time = ${data.fan.onTime} UTC`,
        `Duration = ${data.fan.duration} ms`,
        '',
        `Temperature threshold = ${data.temperatureThreshold}°C`,
    ].join('\n');
};