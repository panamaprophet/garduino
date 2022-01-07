import Router from '@koa/router';
import {getControllerStatus} from '../resolvers/status';


const router = new Router();

router.get('/', async (ctx) => {
    const { controllerId } = ctx.params;
    const { cache } = ctx.ws;

    ctx.body = await getControllerStatus(controllerId, cache.get(controllerId));
});


export default router;