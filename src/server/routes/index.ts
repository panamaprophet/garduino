import Router from '@koa/router';
import ConfigRouter from './config';
import LogRouter from './log';


const router = new Router();

router.use('/log', LogRouter.routes(), LogRouter.allowedMethods());
router.use('/config', ConfigRouter.routes(), ConfigRouter.allowedMethods());
router.get('/', ctx => ctx.body = 'OK');


export default router;
