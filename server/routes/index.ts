import Router from '@koa/router';
import ConfigRouter from './config';
import LogRouter from './log';
import StatusRouter from './status';


const router = new Router({
    prefix: '/api',
});

router.use('/log', LogRouter.routes());
router.use('/config', ConfigRouter.routes());
router.use('/status', StatusRouter.routes());
router.get('/', ctx => ctx.body = 'OK');


export default router;
