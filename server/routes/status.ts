import Router from '@koa/router';
import {getWebSocketServerPayload} from '../websocket/index';

const router = new Router();


router.get('/:controllerId', async (ctx) => {
    const { controllerId } = ctx.params;

    ctx.body = await new Promise((resolve) => {
        if (!ctx.ws.cache.has(controllerId)) {
            return resolve({
                success: false,
                error: `no controller with #${controllerId} was found`,
            });
        }

        const ws = ctx.ws.cache.get(controllerId);

        const getWebSocketResponse = async (arrayBuffer: ArrayBuffer) => {
            const payload = getWebSocketServerPayload(arrayBuffer);

            ws.off('message', getWebSocketResponse);

            resolve(payload);
        };

        ws.on('message', getWebSocketResponse);
        ws.send(JSON.stringify({"action": "actions/status"}));
    });
});


export default router;