import mongodb from 'mongodb';
import {Telegraf} from 'telegraf';
import Router from '@koa/router';
import {getLogEntry} from '../helpers/log';
import { isCriticalError, isErrorEvent } from '../helpers/index';
import {getLastUpdateEventLog, saveLog, getUpdateEventLogStat} from '../resolvers/log';
import {sendMessage} from '../bot/helpers';
import {BotContext, ICustomAppContext} from 'types';


const router = new Router();

router.get('/', async (ctx: ICustomAppContext) => {
    const {controllerId} = ctx.params;

    ctx.body = await getLastUpdateEventLog(ctx.db, controllerId);
});

router.get('/stat', async (ctx) => {
    const {controllerId} = ctx.params;

    ctx.body = await getUpdateEventLogStat(ctx.db, controllerId);
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

    const { event, payload } = data;
    const [entry] = payload || [];
    const value = String(entry.value);

    if (isErrorEvent(event) && isCriticalError(value)) {
        await sendMessage({
            controllerId,
            db,
            bot,
        }, [
            `\\#${controllerId}`,
            `Error \\= *${data.payload[0].value}*`,
        ].join('  ·  '));
    }

    const result = await saveLog(db, controllerId, data);

    ctx.body = result;
});


export default router;
