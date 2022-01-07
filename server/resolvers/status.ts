import {WebSocket} from 'ws';
import {getWebSocketServerPayload} from '../websocket/index';
import {StatusResponse} from 'types';


const WEBSOCKET_RESPONSE_TIMEOUT = 5000;
const WEBSOCKET_ACTIONS = {
    STATUS: 'actions/status',
};


export const getControllerStatus = (controllerId: string, ws: WebSocket): Promise<StatusResponse> => {
    return new Promise((resolve) => {
        const getWebSocketResponse = (arrayBuffer: ArrayBuffer) => {
            const response = getWebSocketServerPayload(arrayBuffer);

            if (
                response === null ||
                response.controllerId !== controllerId ||
                response.action !== WEBSOCKET_ACTIONS.STATUS
            ) {
                return;
            }

            ws.off('message', getWebSocketResponse);
            clearTimeout(timeoutId);

            resolve(response.payload as StatusResponse);
        };

        const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            ws.off('message', getWebSocketResponse);

            resolve({
                controllerId,
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