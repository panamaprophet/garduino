const express = require('express');
const mysql = require('mysql');
const { Telegraf } = require('telegraf');
const config = require('./config');

const app = express();
const pool = mysql.createPool(config.db);
const bot = new Telegraf(config.telegram.token);

app.use(bot.webhookCallback('/api/bot'));
app.use(express.json());

/**
 * @typedef {Object} GarduinoConfigEntity
 * @property {boolean} isOn — current state of entity (represents controller's module state)
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

  const isOn = (
    (onHours < currentHours || (onHours === currentHours && onMinutes <= currentMinutes)) && 
    (
      offHours > currentHours ||
      (offHours === currentHours && offMinutes > currentMinutes) ||
      (offHours < currentHours && hasNextDaySwitching) ||
      (offHours === currentHours && offMinutes < currentMinutes && hasNextDaySwitching)
    )
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
 * @returns {Promise<GarduinoConfig|Error>}
 */
const getConfig = () => new Promise((resolve, reject) => {
  pool.query('SELECT lightCycleDurationMs, fanCycleDurationMs, lightCycleOnTime, fanCycleOnTime FROM config', (error, results) => {
    if (!error) {
      const { lightCycleDurationMs, fanCycleDurationMs, lightCycleOnTime, fanCycleOnTime } = results[0];
      const light = getConfigEntity(lightCycleDurationMs, lightCycleOnTime);
      const fan = getConfigEntity(fanCycleDurationMs, fanCycleOnTime);

      return resolve({ light, fan });
    }

    return reject(error);
  });
});

/**
 * @returns {Promise<GarduinoDataEntry|Error>}
 */
const getLastAvailableData = () => new Promise((resolve, reject) => {
  pool.query('SELECT timestamp, humidity, temperature from data ORDER BY timestamp DESC LIMIT 1', (error, results) => {
    if (!error) {
      const { temperature, humidity, timestamp } = results[0];

      return resolve({
        humidity,
        temperature,
        timestamp,
      });
    }

    return reject(error);
  });
});

/**
 * @returns {Promise<Object|Error>}
 */
const addData = ({humidity, temperature}) => new Promise((resolve, reject) => {
  pool.query('INSERT INTO data SET ?', {humidity, temperature}, error => {
    if (!error) {
        return resolve({success: true});
    }

    return reject(error);
  });
});


bot.telegram.setWebhook(config.hostname + '/api/bot');

bot.command('help', ctx => {
  const response = 
  `Greetings. These are the things i can do:

  /help — show this message
  /now — check current parameters
  /stat — overview the statistics
  /light — check or change light schedule`;

  ctx.reply(response);
});

bot.command('now', async ctx => {
  const { temperature, humidity } = await getLastAvailableData();
  const response = `Humidity: ${humidity}%, Temperature: ${temperature}°C`;

  return ctx.reply(response);
});

bot.command('stat', ctx => {
  ctx.reply('statistics');
});

bot.command('light', ctx => {
  ctx.reply('light schedule');
});

app.get('/api', (request, response) => {
  response.send('OK');
});

app.post('/api/params', async ({ body }, response) => {
  const result = await addData({
    humidity: parseFloat(body.humidity),
    temperature: parseFloat(body.temperature),
  });

  response.json(result);
});

app.get('/api/params', async (request, response) => {
  const config = await getConfig();

  response.json({
    isLightOn: config.light.isOn,
    isFanOn: config.fan.isOn,
    msBeforeLightSwitch: config.light.msBeforeSwitch,
    msBeforeFanSwitch: config.fan.msBeforeSwitch,
    lightCycleDurationMs: config.light.duration,
    fanCycleDurationMs: config.fan.duration,
  });
})

app.listen(config.port, () => {
  console.log('server launched on :3000');
});