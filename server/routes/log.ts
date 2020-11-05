import express from 'express';
import {getContext} from '../helpers';
import {getLogEntry} from '../helpers/log';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';


const router = express.Router();

router.get('/:controllerId', async (request: express.Request, response: express.Response): Promise<void> => {
    const {db, controllerId} = getContext(request);
    const result = await getLastUpdateEventLog(db, controllerId);

    response.json(result);
});

router.get('/:controllerId/stat', async (request: express.Request, response: express.Response): Promise<void> => {
    const {db, controllerId} = getContext(request);
    const result = await getUpdateEventLogStat(db, controllerId);

    response.json(result);
});

router.post('/:controllerId', async (request: express.Request, response: express.Response): Promise<void> => {
    const {db, body, controllerId} = getContext(request);
    const data = getLogEntry(body);

    if (data) {
        const result = await saveLog(db, controllerId, data);

        response.json(result);
    }

    response.json({success: false});
});


export default router;