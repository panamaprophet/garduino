import express from 'express';
import {getContext} from '../helpers/index';
import {getLogEntry} from '../helpers/log';
import {getErrorMessage, isErrorEvent} from '../helpers/errors';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';
import {sendMessage} from '../bot/helpers';


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
    const context = getContext(request);
    const {db, body, controllerId} = context;
    const data = getLogEntry(body);

    if (!data) {
        response.json({success: false});

        return;
    }

    if (isErrorEvent(data.event)) {
        const errorMessage = getErrorMessage(controllerId, data);

        sendMessage(context, errorMessage);
    }

    const result = await saveLog(db, controllerId, data);

    response.json(result);
});


export default router;