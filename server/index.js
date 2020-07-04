const express = require('express');
const mysql = require('mysql');

const config = require('./config');
const {setConfig, getConfig} = require('./resolvers/config');
const {resolveHelp, resolveLastData, resolveLightSchedule, resolveStatistics} = require('./resolvers/bot');
const {saveLog, getLastUpdateEventLog} = require('./resolvers/log');
const {createBot} = require('./helpers/bot');

const app = express();
const pool = mysql.createPool(config.db);

const getConfigFromDb = getConfig(pool);
const setConfigToDb = setConfig(pool);
const saveLogToDb = saveLog(pool);
const getLogFromDb = getLastUpdateEventLog(pool);

const bot = createBot(
    config.telegram.token, 
    config.hostname + config.telegram.webHookPath, 
    {
        help: resolveHelp(pool),
        now: resolveLastData(pool),
        stat: resolveStatistics(pool),
        light: resolveLightSchedule(pool),
    }
);

app.use(bot.webhookCallback(config.telegram.webHookPath));
app.use(express.json());

app.route('/api')
    .get((request, response) => {
        response.send('OK');
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

app.route('/api/log')
    .get(async ({body}, response) => {
        const {timestamp = null} = body;
        const result = await getLogFromDb(timestamp);

        response.json(result);
    })
    .post(async ({body}, response) => {
        const result = await saveLogToDb(body);

        response.json(result);
    });

app.listen(config.port, () => console.log('server launched on :3000'));