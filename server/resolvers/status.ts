import {WebSocket} from 'ws';
import {getWebSocketServerPayload} from '../websocket/index';


const WEBSOCKET_RESPONSE_TIMEOUT = 5000;
const WEBSOCKET_ACTIONS = {
    STATUS: 'actions/status',
};



export const getControllerStatus = (controllerId: string, ws: WebSocket): Promise<{[k: string]: any}> => {
    return new Promise((resolve) => {
        let timeoutId: NodeJS.Timeout;

        const getWebSocketResponse = async (arrayBuffer: ArrayBuffer) => {
            const response = getWebSocketServerPayload(arrayBuffer);

            if (response.controllerId !== controllerId) {
                return;
            }

            if (response.action !== WEBSOCKET_ACTIONS.STATUS) {
                return;
            }

            ws.off('message', getWebSocketResponse);
            clearTimeout(timeoutId);

            resolve(response.payload);
        };

        timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            ws.off('message', getWebSocketResponse);

            resolve({
                success: false,
                error: { message: `no response received in ${WEBSOCKET_RESPONSE_TIMEOUT}ms` },
            });
        }, WEBSOCKET_RESPONSE_TIMEOUT);

        ws.on('message', getWebSocketResponse);

        ws.send(JSON.stringify({
            action: WEBSOCKET_ACTIONS.STATUS,
            payload: { controllerId },
        }));
    });
};