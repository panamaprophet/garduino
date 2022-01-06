import {WebSocket} from 'ws';
import {getWebSocketServerPayload} from '../websocket/index';


const WEBSOCKET_RESPONSE_TIMEOUT = 5000;


export const getControllerStatus = async (controllerId: string, ws?: WebSocket) => {
    console.log(controllerId, ws);

    if (!ws) {
        return {
            success: false,
            error: { message: `no controller with id #${controllerId} is connected via ws` },
        };
    }

    return new Promise((resolve) => {
        let timeoutId: NodeJS.Timeout;

        const getWebSocketResponse = async (arrayBuffer: ArrayBuffer) => {
            clearTimeout(timeoutId);

            ws.off('message', getWebSocketResponse);

            const payload = getWebSocketServerPayload(arrayBuffer);

            resolve(payload);
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

        ws.send('{"action": "actions/status"}');
    });
};