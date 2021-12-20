import Router from '@koa/router';
import ConfigRouter from './config';
import LogRouter from './log';


const router = new Router(); // express.Router();

router.use('/log', LogRouter);
router.use('/config', ConfigRouter);
router.get('/', ctx => ctx.body = 'OK'); //response.send('OK'));


export default router;
