import { format, formatDistanceStrict } from 'date-fns';
import { isStatusResponseError } from 'bot/helpers';
import { ControllerConfigRaw, SensorLogEntityAggregated, StatusResponse, StatusResponseError, StatusResponseSuccess } from 'types';


export const formatConfig = (data: ControllerConfigRaw) => {
    return [
        `Light On = ${data.light.onTime} UTC`,
        `Duration = ${data.light.duration} ms`,
        '',
        `Temperature threshold = ${data.light.temperatureThreshold}°C`,
    ].join('\n');
};

export const formatErrorMessage = (controllerId: string, message: string) => `\\#${controllerId}  ·  Error \\= *${message}*`;

export const formatErrorResponse = (data: StatusResponseError) => `\\#${data.controllerId}\n\r\n\rError \\= *${data.error.message}*`;

export const formatSuccessResponse = (data: StatusResponseSuccess) => {
    const { temperature, humidity, controllerId, light, lastError } = data;
    const timeBeforeSwitch = formatDistanceStrict(0, light.msBeforeSwitch);
    const lightStatusString = `Light will stay *${light.isOn ? 'on' : 'off'}* for ${timeBeforeSwitch}`;
    const lastErrorString = lastError ? `Last error \\= *${lastError.payload.error}*` : null;

    return [
        `\\#${controllerId}`,
        `T\\=*${temperature}*°C`,
        `H\\=*${humidity}*%`,
        lightStatusString,
        lastErrorString,
    ]
    .filter(item => !!item)
    .join('  ·  ');
};

export const formatResponse = (data: StatusResponse) => isStatusResponseError(data) ? formatErrorResponse(data) : formatSuccessResponse(data);

export const formatStatistics = (controllerId: string, data: SensorLogEntityAggregated) => {
    const {
        dates,
        minTemperature: { temperature: minTemperature },
        maxTemperature: { temperature: maxTemperature },
        maxHumidity: { humidity: maxHumidity },
        minHumidity: { humidity: minHumidity },
    } = data;

    const startDate = format(dates[0], 'dd\\.MM\\.yy HH:mm');
    const endDate = format(dates[dates.length - 1], 'dd\\.MM\\.yy HH:mm');

    return [
        `\\#${controllerId}`,
        `${startDate} — ${endDate}:`,
        `T\\=*${minTemperature}* / *${maxTemperature}* °C`,
        `H\\=*${minHumidity}* / *${maxHumidity}* %`,
    ].join('  ·  ');
};
