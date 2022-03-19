import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';


interface WebSocketPayload {
    action: string,
    controllerId: string,
    payload: unknown,
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
    const ws = new WebSocketServer({ server });
    const cache = new Map<string, WebSocket>();

    ws.on('connection', stream => {
        console.log('[ws] new connection opened');

        stream.on('close', () => {
            const cacheEntries: [string, WebSocket][] = Array.from(cache.entries());
            const cacheEntry = cacheEntries.find(item => item[1] === stream);

            if (cacheEntry) {
                cache.delete(cacheEntry[0]);
            }
        });

        const cacheByControllerId = (message: ArrayBuffer) => {
            const messagePayload = getWebSocketServerPayload(message);

            if (!messagePayload) {
                return;
            }

            const { controllerId } = messagePayload?.payload as {[k: string]: string};

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