import Router from '@koa/router';
import { getControllerStatus } from '../resolvers/status';
import { ICustomAppContext } from 'types';


const router = new Router();

router.get('/', async (ctx: ICustomAppContext) => {
    const { controllerId } = ctx.params;
    const { cache } = ctx.ws;
    const controllerWs = cache.get(controllerId);

    ctx.body = controllerWs ? await getControllerStatus(controllerId, controllerWs) : { success: false };
});


export default router;