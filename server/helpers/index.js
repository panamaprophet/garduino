const {
    getCurrentState,
    getTimeFromMs,
    getTimeFromString,
    extractDays,
    extractHoursAndMinutes,
    getRemainTime,
    getMsFromTimeArray,
} = require('./time');


/**
 * @typedef {Object} GarduinoConfigEntity
 * @property {boolean} isOn — current state of entity (represents sensor state)
 * @property {number} duration — phase duration in ms
 * @property {number} msBeforeSwitch — remaining time before state switch in ms
 */

/**
 * @typedef {Object.<string,GarduinoConfigEntity>} GarduinoConfig
 */

 /**
 * @typedef {Object} GarduinoDataEntry
 * @property {number} humidity — humidity level in percent
 * @property {number} temperature — temperature in degree celsius
 * @property {number} timestamp — timestamp
 */


const CONFIG_FIELDS = [
    'lightCycleDurationMs',
    'fanCycleDurationMs',
    'lightCycleOnTime',
    'fanCycleOnTime'
];


/**
 * @param {number} duration — in milliseconds
 * @param {string} onTime — switch on time in milliseconds from the start of the day
 * @returns {GarduinoConfigEntity}
 */
const getConfigEntity = (duration, onTime) => {
    const currentDate = new Date();

    const [currentHours, currentMinutes] = [currentDate.getHours(), currentDate.getMinutes()];
    const [onHours, onMinutes] = getTimeFromString(onTime);
    const [durationHours, durationMinutes] = getTimeFromMs(duration);
    const offTime = [onHours + durationHours, onMinutes + durationMinutes];
    const [offHours, offMinutes] = extractHoursAndMinutes(offTime);
    const hasNextDaySwitching = extractDays(offTime) | 0;

    const isOn = getCurrentState(
        [onHours, onMinutes], 
        [offHours, offMinutes], 
        [currentHours, currentMinutes], 
        hasNextDaySwitching
    );

    const timeBeforeSwitch = getRemainTime([currentHours, currentMinutes], isOn ? [offHours, offMinutes] : [onHours, onMinutes]);
    const msBeforeSwitch = getMsFromTimeArray(timeBeforeSwitch);

    return {
        isOn,
        duration,
        msBeforeSwitch,
    };
}

/**
 * extract available config fields from raw data
 * @param {Object} data 
 */
const extractConfig = data => Object.keys(data).reduce((result, key) => {
    if (CONFIG_FIELDS.includes(key)) {
        result[key] = data[key];
    }

    return result;
}, {});

/**
 * returns where-statement as string
 * @param {Object} where 
 * @param {string} separator
 * 
 * @returns {string}
 */
var getWhereStatement = (where, separator = ' AND ') => {
    const keys = Object.keys(where);
    const result = [];

    if (Array.isArray(where)) {
        result.push(...where.map(getWhereStatement));
    } else {
        keys.forEach(key => {
            if (key === '$and') {
                result.push(getWhereStatement(where[key], ' AND '));
            } else if (key === '$or') {
                result.push(getWhereStatement(where[key], ' OR '));
            } else {
                result.push(`\`${key}\`="${where[key]}"`);
            }
        });
    }

    return keys.length > 1
        ? result.map(item => `(${item})`).join(separator)
        : result.join(separator);
};

module.exports = {
    CONFIG_FIELDS,

    extractConfig,
    getConfigEntity,
    getWhereStatement,
};