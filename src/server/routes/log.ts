import Router from '@koa/router';
import {getLogEntry} from '../helpers/log';
import {getErrorMessage, isErrorEvent} from '../helpers/errors';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';
import {sendMessage} from '../bot/helpers';


const router = new Router();

router.get('/:controllerId', async (ctx) => {
    const {controllerId} = ctx.params;
    const result = await getLastUpdateEventLog(ctx.db, controllerId);

    ctx.body = result;
});

router.get('/:controllerId/stat', async (ctx) => {
    const {controllerId} = ctx.params;
    const result = await getUpdateEventLogStat(ctx.db, controllerId);

    ctx.body = result;
});

router.post('/:controllerId', async (ctx) => {
    const {controllerId} = ctx.params;
    const data = getLogEntry(ctx.request.body);
    const {db, bot} = ctx;

    if (!data) {
        ctx.body = {success: false};
        return;
    }

    if (isErrorEvent(data.event)) {
        const errorMessage = getErrorMessage(controllerId, data);

        sendMessage({controllerId, db, bot}, errorMessage);
    }

    const result = await saveLog(db, controllerId, data);

    ctx.body = result;
});


export default router;