const {last} = require('ramda');
const {format, subDays, subWeeks} = require('date-fns');
const {getSensorDataByKey, processData} = require('../../../helpers');
const {getLastUpdateEventLog, getUpdateEventLogStat} = require('../../../resolvers/log');
const {createSvgChart, svg2png} = require('../../../helpers/chart');


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

    if (!eventData) {
        return {
            text: `No data for ${controllerId}`,
        };
    }

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
    const {minHumidity, maxHumidity, minTemperature, maxTemperature, ...chartData} = processData(data);
    const svgChart = createSvgChart(chartData);
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