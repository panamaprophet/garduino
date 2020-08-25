"use strict";
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var createBotInstance = require('./bot').createBotInstance;
var config = require('./config');
var app = express();
var uri = "mongodb+srv://" + config.db.user + ":" + config.db.pass + "@" + config.db.host + "/" + config.db.database + "?retryWrites=true&w=majority";
var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect().then(function (client) {
    var db = client.db();
    var bot = createBotInstance(db, config.bot);
    app.locals.db = db;
    app.use(express.json());
    app.use(bot.webhookCallback(config.bot.webHookPath));
    app.use('/api', require('./routes'));
    bot.launch();
    app.listen(config.port, function () { return console.log("server launched on :" + config.port); });
});
