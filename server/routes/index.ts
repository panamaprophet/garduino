import express from 'express';
import ConfigRouter from './config';
import LogRouter from './log';

const router = express.Router();


router.use('/log', LogRouter);
router.use('/config', ConfigRouter);
router.get('/', (request: express.Request, response: express.Response) => response.send('OK'));


export default router;
