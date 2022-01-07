import Router from '@koa/router';
import ConfigRouter from './config';
import LogRouter from './log';
import StatusRouter from './status';


/**
 *      routes list:
 *
 *      /api/controllers/:controllerId/status
 *      /api/controllers/:controllerId/reboot
 *      /api/controllers/:controllerId/config
 *
 *      /api/controllers/:controllerId/log
 *      /api/controllers/:controllerId/log/stat
 *
 *      /api/bot
 */


const router = new Router({
    prefix: '/api',
});

router.use('/controllers/:controllerId/log', LogRouter.routes());
router.use('/controllers/:controllerId/config', ConfigRouter.routes());
router.use('/controllers/:controllerId/status', StatusRouter.routes());
router.get('/', ctx => ctx.body = 'OK');


export default router;
