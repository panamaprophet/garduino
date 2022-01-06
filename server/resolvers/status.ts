import {WebSocket} from 'ws';
import {getWebSocketServerPayload} from '../websocket/index';


const WEBSOCKET_RESPONSE_TIMEOUT = 5000;


export const getControllerStatus = (controllerId: string, ws: WebSocket) => {
    return new Promise((resolve) => {
        let timeoutId: NodeJS.Timeout;

        const getWebSocketResponse = async (arrayBuffer: ArrayBuffer) => {
            clearTimeout(timeoutId);

            ws.off('message', getWebSocketResponse);

            resolve(getWebSocketServerPayload(arrayBuffer));
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
            action: 'actions/status',
            payload: { controllerId },
        }));
    });
};