import mongodb from 'mongodb';
import {Telegraf} from 'telegraf';
import Router from '@koa/router';
import {getLogEntry} from '../helpers/log';
import {getErrorMessage, isErrorEvent} from '../helpers/errors';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';
import {sendMessage} from '../bot/helpers';
import {BotContext} from '../bot/index';


const router = new Router();

router.get('/', async (ctx) => {
    const {controllerId} = ctx.params;
    const result = await getLastUpdateEventLog(ctx.db, controllerId);

    ctx.body = result;
});

router.get('/stat', async (ctx) => {
    const {controllerId} = ctx.params;
    const result = await getUpdateEventLogStat(ctx.db, controllerId);

    ctx.body = result;
});

router.post('/', async (ctx) => {
    const {controllerId} = ctx.params;
    const data = getLogEntry(ctx.request.body);
    const bot = ctx.bot as Telegraf<BotContext>;
    const db = ctx.db as mongodb.Db;

    if (!data) {
        ctx.body = {success: false};
        return;
    }

    if (isErrorEvent(data.event)) {
        const errorMessage = getErrorMessage(controllerId, data);

        await sendMessage({controllerId, db, bot}, errorMessage);
    }

    const result = await saveLog(db, controllerId, data);

    ctx.body = result;
});


export default router;