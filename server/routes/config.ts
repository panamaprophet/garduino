import express from 'express';
import {mergeDeepRight} from 'ramda';

import {getConfig, setConfig} from '../resolvers/config';
import {extractConfig, getConfigEntity, flattenConfig} from '../helpers/config';
import {getContext} from '../helpers/index';

const router = express.Router();


router.get('/:controllerId', async (request: express.Request, response: express.Response): Promise<any> => {
    const {db, controllerId} = getContext(request);

    const {temperatureThreshold, ...config} = await getConfig(db, controllerId);
    const light = getConfigEntity(config.light);
    const fan = getConfigEntity(config.fan);
    const result = flattenConfig({light, fan, temperatureThreshold});

    response.json(result);
});

router.post('/:controllerId', async (request: express.Request, response: express.Response): Promise<any> => {
    const {db, body, controllerId} = getContext(request);

    const updatedParams = extractConfig(body) || {};
    const currentConfig = await getConfig(db, controllerId);
    const updatedConfig = mergeDeepRight(currentConfig, updatedParams);
    const result = await setConfig(db, controllerId, updatedConfig);

    response.json(result);
});


export default router;