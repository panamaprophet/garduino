import {Server} from 'http';
import {WebSocketServer, WebSocket} from 'ws';


export const getWebSocketServerPayload = (arrayBuffer: ArrayBuffer) => {
    let payload = null;

    try {
        payload = JSON.parse(arrayBuffer.toString());
    } catch (error) {
        console.log('error on parsing ws payload attempt', error);
    }

    return payload;
};

export const getWebSocketServer = (server: Server) => {
    const ws = new WebSocketServer({ server });
    const cache = new Map();

    ws.on('connection', stream => {
        console.log('[ws] new connection opened');

        stream.on('close', () => {
            const cacheEntries: [string, WebSocket][] = Array.from(cache.entries());
            const cacheEntry = cacheEntries.find(([_, value]) => value === stream);

            if (cacheEntry) {
                cache.delete(cacheEntry[0]);
            }
        });

        const cacheByControllerId = (message: ArrayBuffer) => {
            const messagePayload = getWebSocketServerPayload(message);
            const {controllerId} = messagePayload?.payload;

            console.log('[ws] caching:', controllerId);

            if (controllerId) {
                cache.set(controllerId, stream);
                stream.off('message', cacheByControllerId);

                console.log('[ws] cached:', controllerId);
            }
        };

        stream.on('message', cacheByControllerId);
    });

    return [ws, cache];
};