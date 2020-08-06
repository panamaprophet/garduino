const express = require('express');
const {getContext} = require('../helpers');
const {getLogEntry} = require('../helpers/log');
const {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} = require('../resolvers/log');

const router = express.Router();


router.get('/:controllerId', async (request, response) => {
    const {db, controllerId} = getContext(request);
    const result = await getLastUpdateEventLog(db, controllerId);

    response.json(result);
});

router.get('/:controllerId/stat', async (request, response) => {
    const {db, controllerId} = getContext(request);
    const result = await getUpdateEventLogStat(db, controllerId);

    response.json(result);
});

router.post('/:controllerId', async (request, response) => {
    const {db, body, controllerId} = getContext(request);
    const data = getLogEntry(body);
    const result = await saveLog(db, controllerId, data);

    response.json(result);
});


module.exports = router;