import express from 'express';

import {getContext} from '../helpers';
import {getLogEntry} from '../helpers/log';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';

const router = express.Router();


router.get('/:controllerId', async (request: express.Request, response: express.Response): Promise<any> => {
    const {db, controllerId} = getContext(request);
    const result = await getLastUpdateEventLog(db, controllerId);

    response.json(result);
});

router.get('/:controllerId/stat', async (request: express.Request, response: express.Response): Promise<any> => {
    const {db, controllerId} = getContext(request);
    const result = await getUpdateEventLogStat(db, controllerId);

    response.json(result);
});

router.post('/:controllerId', async (request: express.Request, response: express.Response): Promise<any> => {
    const {db, body, controllerId} = getContext(request);

    if (!body) {
        return response.json({success: false});
    }

    const data = getLogEntry(body);
    const result = await saveLog(db, controllerId, data);

    response.json(result);
});

export default router;