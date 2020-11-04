import {last} from 'ramda';
import {format, subDays, subWeeks} from 'date-fns';

import {processData} from '../../../helpers';
import {getUpdateEventLogStat} from '../../../resolvers/log';
import {createSvgChart, svg2png} from '../../../helpers/chart';

import type {ActionContext, ActionResult} from '../../index';


export const ACTION_STAT_WEEK: string = 'main/stat/week';

export const ACTION_STAT_DAY: string = 'main/stat/day';


/**
 * @returns {Promise<ActionResult>}
 */
const getStat = async ({db, controllerId}: ActionContext, dateFrom: Date): Promise<ActionResult> => {
    const data = await getUpdateEventLogStat(db, controllerId, dateFrom);
    const {minHumidity, maxHumidity, minTemperature, maxTemperature, ...chartData} = processData(data);
    const svgChart = createSvgChart({...chartData});
    const pngChart = await svg2png(svgChart);

    const text = [
        `${chartData.date[0]} — ${last(chartData.date)}`,
        '',
        `max humidity: ${maxHumidity.humidity}% on ${format(maxHumidity.date, 'dd.MM.yy HH:mm')}`,
        `max temperature: ${maxTemperature.temperature}°C on ${format(maxTemperature.date, 'dd.MM.yy HH:mm')}`,
        '',
        `min humidity: ${minHumidity.humidity}% on ${format(minHumidity.date, 'dd.MM.yy HH:mm')}`,
        `min temperature: ${minTemperature.temperature}°C on ${format(minTemperature.date, 'dd.MM.yy HH:mm')}`,
    ].join('\n');

    return {
        text,
        image: pngChart,
    };
};

const getDayStat = (context: ActionContext): Promise<ActionResult> => getStat(context, subDays(Date.now(), 1));

const getWeekStat = (context: ActionContext): Promise<ActionResult> => getStat(context, subWeeks(Date.now(), 1));


export const actionHandler = async (action: string | undefined, context: ActionContext) => {
    switch (action) {
        case ACTION_STAT_WEEK:
            return await getWeekStat(context);
        case ACTION_STAT_DAY:
            return await getDayStat(context);
        default:
            return {
                text: 'action is not supported',
            };
    };
};