const express = require('express');
const mysql = require('mysql');

const config = require('./config');
const {setConfig, getConfig} = require('./resolvers/config');
const {addData, getLastAvailableData} = require('./resolvers/sensors');
const {createBot, actionHelp, actionNow, actionStat, actionLight} = require('./helpers/bot');

const app = express();
const pool = mysql.createPool(config.db);
const bot = createBot(
    config.telegram.token, 
    config.hostname + config.telegram.webHookPath
);

const getConfigFromDb = getConfig(pool);
const setConfigToDb = setConfig(pool);
const addSensorDataToDb = addData(pool);
const getLastAvailableSensorDataFromDb = getLastAvailableData(pool);

app.use(bot.webhookCallback(config.telegram.webHookPath));
app.use(express.json());

bot.command('help', actionHelp);
bot.command('now', actionNow(getLastAvailableSensorDataFromDb));
bot.command('stat', actionStat);
bot.command('light', actionLight);

app.route('/api')
    .get((request, response) => {
        response.send('OK');
    });

app.route('/api/params')
    .get(async (request, response) => {
        const lastAvailableData = await getLastAvailableSensorDataFromDb();

        response.json(lastAvailableData);
    })
    .post(async ({body}, response) => {
        const result = await addSensorDataToDb({
            humidity: parseFloat(body.humidity),
            temperature: parseFloat(body.temperature),
        });

        response.json(result);
    });

app.route('/api/config')
    .get(async (request, response) => {
        const config = await getConfigFromDb();

        response.json({
            isLightOn: config.light.isOn,
            isFanOn: config.fan.isOn,
            msBeforeLightSwitch: config.light.msBeforeSwitch,
            msBeforeFanSwitch: config.fan.msBeforeSwitch,
            lightCycleDurationMs: config.light.duration,
            fanCycleDurationMs: config.fan.duration,
        });
    })
    .post(async ({body}, response) => {
        const result = await setConfigToDb(body);

        response.json(result);
    });

app.listen(config.port, () => console.log('server launched on :3000'));