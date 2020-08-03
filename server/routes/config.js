const {mergeDeepRight} = require('ramda');
const express = require('express');
const {getConfig, setConfig} = require('../resolvers/config');
const {extractConfig, getConfigEntity, flattenConfig} = require('../helpers/config');
const {getContext} = require('../helpers/index');

const router = express.Router();


router.get('/:controllerId', async (request, response) => {
    const {db, controllerId} = getContext(request);

    const config = await getConfig(db, controllerId);
    const light = getConfigEntity(config.light);
    const fan = getConfigEntity(config.fan);
    const result = flattenConfig({light, fan});

    response.json(result);
});

router.post('/:controllerId', async (request, response) => {
    const {db, body, controllerId} = getContext(request);

    const updatedParams = extractConfig(body);
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, updatedParams);
    const result = await setConfig(db, controllerId, updatedConfig);

    response.json(result);
});


module.exports = router;