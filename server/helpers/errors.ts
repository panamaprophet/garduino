import {format} from 'date-fns';
import {LOG_EVENT} from '../constants';
import {LogEntity} from 'types';


export const isErrorEvent = (event: string): boolean => event === LOG_EVENT.ERROR;

export const getErrorMessage = (controllerId: string, data: LogEntity): string => {
    const formattedDate = format(data.date, 'dd.MM.yy HH:mm');
    const header = `#${controllerId} @ ${formattedDate}`;
    const body = `Error: ${JSON.stringify(data.payload)}`;

    return `${header}\n\r${body}`;
}