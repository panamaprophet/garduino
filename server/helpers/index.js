const {parse, addMilliseconds, compareDesc, differenceInMilliseconds} = require('date-fns');

const {CONFIG_FIELDS} = require('../constants');


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


/**
 * @param {number} duration — in milliseconds
 * @param {string} onTimeString — switch on time in milliseconds from the start of the day
 * @returns {GarduinoConfigEntity}
 */
const getConfigEntity = (duration, onTimeString) => {
    const currentDate = new Date();
    const onTime = parse(onTimeString, 'HH:mm', currentDate);
    const offTime = addMilliseconds(onTime, duration);
    const isOn = compareDesc(onTime, currentDate) >= 0 && compareDesc(offTime, currentDate) < 0;
    const msBeforeSwitch = differenceInMilliseconds(isOn ? offTime : onTime, currentDate);

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
    extractConfig,
    getConfigEntity,
    getWhereStatement,
};