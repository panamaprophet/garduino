/**
  * @typedef {number[]} Time — [hours, minutes]
  * @property {number} 0 — hours
  * @property {number} 1 — minutes
  */


/**
 * @param {number} ms — milliseconds
 * @returns {number} minutes
 */
const getMinutesFromMs = ms => ((ms / (1000 * 60)) % 60);

/**
 * @param {number} ms — milliseconds
 * @returns {number} hours
 */
const getHoursFromMs = ms => ((ms / (1000 * 60 * 60)) % 24);

/**
 * @param {number} ms — milliseconds
 * @returns {Time}
 */
const getTimeFromMs = ms => [getHoursFromMs(ms), getMinutesFromMs(ms)];

/**
 * @param {string} string — time in format 'HH:mm'
 * @returns {Time} time in format [h, m]
 */
const getTimeFromString = string => string.split(':').map(Number);

/**
 * @param {Time} time
 * @returns {number} milliseconds
 */
const getMsFromTimeArray = ([hours, minutes]) => hours * 60 * 60 * 1000 + minutes * 60 * 1000;

/**
 * removes the excess time from hours and minutes
 * @param {Time} time
 * @returns {Time}
 */
const extractHoursAndMinutes = ([hours, minutes]) => [hours % 24 + (minutes / 60), minutes % 60];

/**
 * @param {Time} time
 * @returns {number}
 */
const extractDays = ([hours, minutes]) => (hours + minutes / 60) / 24;

/**
 * gets time between two times
 * @param {Time} a
 * @param {Time} b
 */
const getRemainTime = ([h, m], [hh, mm]) => [getRemainTimeForUnits(h, hh, 24), getRemainTimeForUnits(m, mm, 60)];

/**
 * gets time between two times
 * @param {Time} a
 * @param {Time} b
 * @param {number} units — amount of units [24,60,...]
 */
const getRemainTimeForUnits = (a, b, units) => ((a > b) ? (getRemainTimeForUnits(a, units) + (a - b)) : b - a);

// @todo: ease it up
const getCurrentState = ([onHours, onMinutes], [offHours, offMinutes], [currentHours, currentMinutes], hasNextDaySwitching) => (
    (onHours < currentHours || (onHours === currentHours && onMinutes <= currentMinutes)) && 
    (
      offHours > currentHours ||
      (offHours === currentHours && offMinutes > currentMinutes) ||
      (offHours < currentHours && hasNextDaySwitching) ||
      (offHours === currentHours && offMinutes < currentMinutes && hasNextDaySwitching)
    )
  );


module.exports = {
    getCurrentState,
    getMsFromTimeArray,
    getRemainTime,
    getTimeFromString,
    getTimeFromMs,
    extractDays,
    extractHoursAndMinutes,
};