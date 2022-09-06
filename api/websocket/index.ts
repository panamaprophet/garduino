import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';


interface WebSocketPayload {
    action: string,
    controllerId: string,
    payload: {
        controllerId: string,
    },
}


export const getWebSocketServerPayload = (arrayBuffer: ArrayBuffer): WebSocketPayload | null => {
    let payload = null;

    try {
        payload = JSON.parse(arrayBuffer.toString()) as WebSocketPayload;
    } catch (error) {
        console.log('error on parsing ws payload attempt', error);
    }

    return payload;
};

export const getWebSocketServer = (server: Server): [WebSocketServer, Map<string, WebSocket>] => {
    const wss = new WebSocketServer({ server });
    const cache = new Map<string, WebSocket>();

    wss.on('connection', (ws) => {
        console.log('[ws] new connection');

        ws.on('close', () => {
            const cacheEntries = Array.from(cache.entries());
            const cacheEntry = cacheEntries.find(item => item[1] === ws);

            if (cacheEntry) {
                console.log('[ws] removing from cache', cacheEntry[0]);
                cache.delete(cacheEntry[0]);
            }
        });

        const cacheByControllerId = (message: ArrayBuffer) => {
            const messagePayload = getWebSocketServerPayload(message);

            if (!messagePayload) {
                return;
            }

            const { controllerId } = messagePayload.payload;

            if (controllerId) {
                cache.set(controllerId, ws);
                ws.off('message', cacheByControllerId);

                console.log('[ws] cached:', controllerId);
            }
        };

        ws.on('message', cacheByControllerId);
    });

    return [wss, cache];
};
