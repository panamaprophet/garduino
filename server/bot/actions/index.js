const {last} = require('ramda');
const {getSensorDataByKey} = require('../../helpers');
const {getLastUpdateEventLog, getUpdateEventLogStat} = require('../../resolvers/log');
const {createSvgChart, svg2png} = require('../../helpers/chart');
const { format } = require('date-fns');



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
const getLastWeekStat = async ({db, controllerId}) => {
    const data = await getUpdateEventLogStat(db, controllerId);

    const chartData = data.reduce((result, item, index) => {
        if (index % 2 === 0) {
            return result;
        }

        result.date.push(item.date);
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

    const dateFrom = format(new Date(chartData.date[0]), 'dd.MM.yy');
    const dateTo = format(new Date(last(chartData.date)), 'dd.MM.yy');

    return {
        image: pngChart,
        text: `${dateFrom} — ${dateTo}`,
    };
}


const ACTION_NOW = 'main/now';

const ACTION_STAT = 'main/stat';


const actionHandler = async (action, context) => {
    switch (action) {
        case ACTION_NOW:
            return await getLastUpdateEventLogByControllerId(context);
        case ACTION_STAT:
            return await getLastWeekStat(context);
        default:
            return 'action is not supported';
    };
};


module.exports = {
    ACTION_NOW,
    ACTION_STAT,
    actionHandler,
};