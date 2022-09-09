import { WEBSOCKET_ACTIONS } from '../constants';
import { WebSocket } from 'ws';


const promisifyWebsocketRequest = (ws: WebSocket, payload: any, options = { timeout: 5000 }) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        ws.off('message', callback);
        reject(`no response received in ${options.timeout}ms`);
    }, options.timeout);

    const callback = (arrayBuffer: ArrayBuffer) => {
        clearTimeout(timeoutId);
        ws.off('message', callback);
        resolve(JSON.parse(arrayBuffer.toString()));
    };

    ws.on('message', callback);
    ws.send(JSON.stringify(payload));
});


export const getControllerStatus = (controllerId: string, ws: WebSocket) => {
    const message = {
        action: WEBSOCKET_ACTIONS.STATUS,
        payload: { controllerId },
    };

    return promisifyWebsocketRequest(ws, message);
};
