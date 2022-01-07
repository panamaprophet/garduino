import {parse, addMilliseconds, compareDesc, differenceInMilliseconds} from 'date-fns';
import {identity} from 'ramda';


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


export const getConfigEntity = ({duration, onTime: onTimeString}: ConfigEntityRaw): ConfigEntity => {
    const currentDate = Date.now();
    const onTime = parse(onTimeString, 'HH:mm', currentDate);
    const offTime = addMilliseconds(onTime, duration);
    const isOn = compareDesc(onTime, currentDate) >= 0 && compareDesc(offTime, currentDate) < 0;
    const msBeforeSwitch = differenceInMilliseconds(isOn ? offTime : onTime, currentDate);

    console.log(onTime);
    console.log(offTime);
    console.log(isOn);
    console.log(msBeforeSwitch);
    console.log('===');

    return {
        isOn,
        duration,
        msBeforeSwitch,
    };
};

// @todo: add validation
export const extractConfig = identity;

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