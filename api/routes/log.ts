import { Telegraf } from 'telegraf';
import Router from '@koa/router';
import { mapDataToControllerEvent } from '../helpers/validation';
import { formatErrorMessage } from '../helpers/formatters';
import { isCriticalError } from '../helpers/index';
import { getLastUpdateEvent, saveEvent, getUpdateEvents, getErrorEvents } from '../resolvers/log';
import { sendMessage } from '../bot/helpers';
import { BotContext, ICustomAppContext } from 'types';


const router = new Router();

router.get('/', async (ctx: ICustomAppContext) => {
    const { controllerId } = ctx.params;

    ctx.body = await getLastUpdateEvent(controllerId);
});

router.get('/stat', async (ctx) => {
    const { controllerId } = ctx.params;

    ctx.body = await getUpdateEvents(controllerId);
});

router.get('/errors', async (ctx) => {
    const { controllerId } = ctx.params;
    const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateTo = new Date();

    ctx.body = await getErrorEvents(controllerId, { dateFrom, dateTo });
});

router.post('/', async (ctx) => {
    const { controllerId } = ctx.params;
    const data = mapDataToControllerEvent({ controllerId, ...ctx.request.body  });
    const bot = ctx.bot as Telegraf<BotContext>;

    if (!data) {
        ctx.body = { success: false };
        return;
    }

    const { payload } = data;
    const isError = 'error' in payload;
    const isCritical = isError && isCriticalError(payload.error);

    if (isCritical) {
        await sendMessage({
            controllerId,
            bot,
        }, formatErrorMessage(controllerId, payload.error));
    }

    ctx.body = await saveEvent(controllerId, data);
});


export default router;
