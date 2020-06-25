const express = require('express');
const mysql = require('mysql');
const { Telegraf } = require('telegraf');
const config = require('./config');

const app = express();
const pool = mysql.createPool(config.db);
const bot = new Telegraf(config.telegram.token);

app.use(bot.webhookCallback('/api/bot'));
app.use(express.json());


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

    return reject({error});
  });
});

const addData = ({humidity, temperature}) => new Promise((resolve, reject) => {
  pool.query('INSERT INTO data SET ?', {humidity, temperature}, error => {
    if (error) {
      return reject({error});
    }

    return resolve({success: true});
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

  response.send(JSON.stringify(result));
});

app.listen(config.port, () => {
  console.log('server launched on :3000');
});