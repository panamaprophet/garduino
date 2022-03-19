import mongodb from 'mongodb';
import { Telegraf } from 'telegraf';
import Router from '@koa/router';
import { getLogEntry } from '../helpers/log';
import { isCriticalError, isErrorEvent } from '../helpers/index';
import { getLastUpdateEvent, saveEvent, getUpdateEvents, getErrorEvents } from '../resolvers/log';
import { sendMessage } from '../bot/helpers';
import { BotContext, ICustomAppContext } from 'types';


const router = new Router();

router.get('/', async (ctx: ICustomAppContext) => {
    const { controllerId } = ctx.params;

    ctx.body = await getLastUpdateEvent(ctx.db, controllerId);
});

router.get('/stat', async (ctx) => {
    const { controllerId } = ctx.params;

    ctx.body = await getUpdateEvents(ctx.db, controllerId);
});

router.get('/errors', async (ctx) => {
    const { controllerId } = ctx.params;
    const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateTo = new Date();

    ctx.body = await getErrorEvents(
        ctx.db,
        controllerId,
        { dateFrom, dateTo }
    );
});

router.post('/', async (ctx) => {
    const { controllerId } = ctx.params;
    const data = getLogEntry(ctx.request.body);
    const bot = ctx.bot as Telegraf<BotContext>;
    const db = ctx.db as mongodb.Db;

    if (!data) {
        ctx.body = { success: false };
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

    const result = await saveEvent(db, controllerId, data);

    ctx.body = result;
});


export default router;
