import { isObject } from 'helpers';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';


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

        const cacheByControllerId = (arrayBuffer: ArrayBuffer) => {
            const message: unknown = JSON.parse(arrayBuffer.toString());

            if (!isObject(message)) {
                return;
            }

            cache.set(String(message.controllerId), ws);
            ws.off('message', cacheByControllerId);

            console.log('[ws] cached:', message.controllerId);
        };

        ws.on('message', cacheByControllerId);
    });

    return [wss, cache];
};
