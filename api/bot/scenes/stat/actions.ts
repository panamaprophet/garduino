import {format, subDays, subWeeks} from 'date-fns';
import {processData} from '../../../helpers';
import {getUpdateEventLogStat} from '../../../resolvers/log';
import {ActionContext, ActionResult} from 'types';


export const ACTION_STAT_WEEK = 'main/stat/week';

export const ACTION_STAT_DAY = 'main/stat/day';


/**
 * @returns {Promise<ActionResult>}
 */
const getStat = async ({db, controllerId}: ActionContext, dateFrom: Date): Promise<ActionResult> => {
    const data = await getUpdateEventLogStat(db, controllerId, dateFrom);
    const { minHumidity, maxHumidity, minTemperature, maxTemperature, dates } = processData(data);

    const text = [
        `\\#${controllerId}`,
        `${format(dates[0], 'dd\\.MM\\.yy HH:mm')} — ${format(dates[dates.length - 1], 'dd\\.MM\\.yy HH:mm')}:`,
        `T\\=*${minTemperature.temperature}* / *${maxTemperature.temperature}* °C`,
        `H\\=*${minHumidity.humidity}* / *${maxHumidity.humidity}* %`,
    ].join('  ·  ');

    return { text };
};

const getDayStat = (context: ActionContext): Promise<ActionResult> => getStat(context, subDays(Date.now(), 1));

const getWeekStat = (context: ActionContext): Promise<ActionResult> => getStat(context, subWeeks(Date.now(), 1));


export const actionHandler = async (action: string | undefined, context: ActionContext): Promise<ActionResult> => {
    switch (action) {
        case ACTION_STAT_WEEK:
            return await getWeekStat(context);
        case ACTION_STAT_DAY:
            return await getDayStat(context);
        default:
            return {
                text: 'action is not supported',
            };
    }
};
