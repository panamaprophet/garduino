const {last} = require('ramda');
const {format, subDays, subWeeks} = require('date-fns');
const {getSensorDataByKey} = require('../../helpers');
const {getLastUpdateEventLog, getUpdateEventLogStat} = require('../../resolvers/log');
const {createSvgChart, svg2png} = require('../../helpers/chart');


const ACTION_NOW = 'main/now';

const ACTION_STAT_WEEK = 'main/stat/week';

const ACTION_STAT_DAY = 'main/stat/day';

/**
 * @typedef {Object} ActionResult
 * @property {String} text
 * @property {Buffer} [image]
 */

/**
 * @returns {Promise<ActionResult>}
 */
const getLastUpdateEventLogByControllerId = async ({db, controllerId}) => {
    const eventData = await getLastUpdateEventLog(db, controllerId);
    const {payload} = eventData;
    const [humidity] = getSensorDataByKey(payload, 'humidity');
    const [temperature] = getSensorDataByKey(payload, 'temperature');
    const response = `Humidity: ${humidity.value}%, Temperature: ${temperature.value}°C`;

    return {
        text: response,
    };
};

/**
 * @returns {Promise<ActionResult>}
 */
const getStat = async ({db, controllerId}, dateFrom) => {
    const data = await getUpdateEventLogStat(db, controllerId, dateFrom);

    const chartData = data.reduce((result, item, index) => {
        if (index % 2 === 0) {
            return result;
        }

        result.date.push(format(item.date, 'dd.MM.yy HH:mm'));
        result.temperature.push(item.temperature);
        result.humidity.push(item.humidity);

        return result;
    }, {
        date: [],
        temperature: [],
        humidity: [],
    });

    const svgChart = createSvgChart(chartData);
    const pngChart = await svg2png(svgChart);

    return {
        image: pngChart,
        text: `${chartData.date[0]} — ${last(chartData.date)}`,
    };
};

const getDayStat = context => getStat(context, subDays(Date.now(), 1));

const getWeekStat = context => getStat(context, subWeeks(Date.now(), 1));


const actionHandler = async (action, context) => {
    switch (action) {
        case ACTION_NOW:
            return await getLastUpdateEventLogByControllerId(context);
        case ACTION_STAT_WEEK:
            return await getWeekStat(context);
        case ACTION_STAT_DAY:
            return await getDayStat(context);
        default:
            return 'action is not supported';
    };
};


module.exports = {
    ACTION_NOW,
    ACTION_STAT_WEEK,
    ACTION_STAT_DAY,
    actionHandler,
};