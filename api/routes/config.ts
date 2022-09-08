import Router from '@koa/router';
import { isObject } from 'helpers';
import { getControllerConfiguration, updateControllerConfiguration } from 'resolvers/controller';


const router = new Router();

router.get('/', async (ctx) => {
    const { controllerId } = ctx.params;

    ctx.body = await getControllerConfiguration(controllerId) || { success: false };
});

router.post('/', async (ctx) => {
    const { controllerId } = ctx.params;
    const changes = isObject(ctx.request.body) ? ctx.request.body : {};

    ctx.body = await updateControllerConfiguration(controllerId, changes) || { success: false };
});


export default router;
