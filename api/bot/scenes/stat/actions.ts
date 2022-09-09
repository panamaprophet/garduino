import { subDays, subWeeks } from 'date-fns';
import { getRangeBy } from '../../../helpers';
import { getUpdateEvents } from '../../../resolvers/log';
import { formatStatistics } from '../../../helpers/formatters';
import { ActionContext } from 'types';


export const ACTION_STAT_WEEK = 'main/stat/week';

export const ACTION_STAT_DAY = 'main/stat/day';


const getStat = async ({ controllerId }: ActionContext, dateFrom: Date) =>
    getUpdateEvents(controllerId, dateFrom)
        .then((data) => {
            const [minHumidity, maxHumidity] = getRangeBy('humidity', data);
            const [minTemperature, maxTemperature] = getRangeBy('temperature', data);

            const startDate = data[0].date;
            const endDate = data[data.length - 1].date;

            return formatStatistics(controllerId, { minHumidity, maxHumidity, minTemperature, maxTemperature, startDate, endDate });
        });

const getDayStat = (context: ActionContext) => getStat(context, subDays(Date.now(), 1));

const getWeekStat = (context: ActionContext) => getStat(context, subWeeks(Date.now(), 1));


export const actionHandler = (action: string, context: ActionContext) => {
    switch (action) {
        case ACTION_STAT_WEEK:
            return getWeekStat(context);
        case ACTION_STAT_DAY:
            return getDayStat(context);
        default:
            throw new Error(`action is not supported: ${String(action)}`);
    }
};
