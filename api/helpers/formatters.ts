import { ControllerConfigRaw } from 'types';


export const formatConfig = (data: ControllerConfigRaw): string => {
    return [
        `Light On = ${data.light.onTime} UTC`,
        `Duration = ${data.light.duration} ms`,
        '',
        `Temperature threshold = ${data.temperatureThreshold}°C`,
    ].join('\n');
};

export const formatErrorMessage = (controllerId: string, message: string) => `\\#${controllerId}'  ·  'Error \\= *${message}*`;
