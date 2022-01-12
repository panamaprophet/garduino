import {parse, addMilliseconds, compareDesc, differenceInMilliseconds, subDays} from 'date-fns';
import {identity} from 'ramda';
import {ConfigEntity, ConfigEntityRaw, ControllerConfigRaw} from 'types';


const getHoursFromTimeString = (time: string) => Number(time.split(':')[0]);

export const getConfigEntity = ({duration, onTime: onTimeString}: ConfigEntityRaw): ConfigEntity => {
    const currentDate = Date.now();
    const onHours = getHoursFromTimeString(onTimeString);
    const durationHours = (duration / 1000 / 60 / 60);

    const onTime = subDays(
        parse(onTimeString, 'HH:mm', currentDate), 
        onHours + durationHours > 24 ? 1 : 0
    );

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