import { format, subDays, subWeeks } from 'date-fns';
import { processData } from '../../../helpers';
import { getUpdateEvents } from '../../../resolvers/log';
import { ActionContext } from 'types';


export const ACTION_STAT_WEEK = 'main/stat/week';

export const ACTION_STAT_DAY = 'main/stat/day';


const getStat = async ({ controllerId }: ActionContext, dateFrom: Date) => {
    const data = await getUpdateEvents(controllerId, dateFrom);
    const { minHumidity, maxHumidity, minTemperature, maxTemperature, dates } = processData(data);

    const text = [
        `\\#${controllerId}`,
        `${format(dates[0], 'dd\\.MM\\.yy HH:mm')} — ${format(dates[dates.length - 1], 'dd\\.MM\\.yy HH:mm')}:`,
        `T\\=*${minTemperature.temperature}* / *${maxTemperature.temperature}* °C`,
        `H\\=*${minHumidity.humidity}* / *${maxHumidity.humidity}* %`,
    ].join('  ·  ');

    return { text };
};

const getDayStat = (context: ActionContext) => getStat(context, subDays(Date.now(), 1));

const getWeekStat = (context: ActionContext) => getStat(context, subWeeks(Date.now(), 1));


export const actionHandler = (action: string | undefined, context: ActionContext) => {
    switch (action) {
        case ACTION_STAT_WEEK:
            return getWeekStat(context);
        case ACTION_STAT_DAY:
            return getDayStat(context);
        default:
            return {
                text: 'action is not supported',
            };
    }
};
