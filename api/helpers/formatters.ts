import { format, formatDistanceStrict } from 'date-fns';
import { ControllerConfigurationSerialized, ControllerStatus } from 'types';


export const formatConfig = (data: ControllerConfigurationSerialized) => {
    return [
        `Light On = ${data.light.onTime} UTC`,
        `Duration = ${data.light.duration} ms`,
        '',
        `Temperature threshold = ${data.light.temperatureThreshold}°C`,
    ].join('\n');
};

export const formatErrorMessage = (controllerId: string, message: string) => `\\#${controllerId}  ·  Error \\= *${message}*`;

export const formatControllerStatus = (
    controllerId: string,
    status: ControllerStatus,
) => {
    const { light, temperature, humidity, lastError } = status;
    const timeBeforeSwitch = formatDistanceStrict(0, light.msBeforeSwitch);

    return (
        `\\#${controllerId}  ·  T\\=*${temperature}*°C  ·  H\\=*${humidity}*%  ·  ` +
        `Light will stay *${light.isOn ? 'on' : 'off'}* for ${timeBeforeSwitch}  ·  ` +
        (lastError ? `Last error \\= *${lastError}*` : 'No errors')
    );
};

export const formatControllerStatusError = (
    controllerId: string,
    reason: string
) => {
    return `\\#${controllerId}\n\r\n\rError \\= *${reason}*`;
};

export const formatStatistics = (controllerId: string, params: { [k: string]: number }) => {
    const { minTemperature, maxTemperature, maxHumidity, minHumidity } = params;

    const startDate = format(params.startDate, 'dd\\.MM\\.yy HH:mm');
    const endDate = format(params.endDate, 'dd\\.MM\\.yy HH:mm');

    return [
        `\\#${controllerId}`,
        `${startDate} — ${endDate}:`,
        `T\\=*${minTemperature}* / *${maxTemperature}* °C`,
        `H\\=*${minHumidity}* / *${maxHumidity}* %`,
    ].join('  ·  ');
};
