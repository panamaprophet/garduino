#pragma once

#include <WebSocketsClient.h>
#include <include/request.h>


namespace websocket
{
    const unsigned int WS_HEARTBEAT_INTERVAL       = 30 * 1000;
    const unsigned int WS_HEARTBEAT_TIMEOUT        = 3 * 1000;
    const unsigned int WS_HEARTBEAT_MAX_RETRIES    = 3;
    const unsigned int WS_PORT                     = 80;
    const unsigned int WS_RECONNECT_INTERVAL       = 5000;

    typedef std::function<void(WStype_t type, uint8_t * payload, size_t length)> WebSocketOnEventCallback;

    WebSocketsClient ws;

    void connect(String hostname, WebSocketOnEventCallback onWebSocketEvent) {
        ws.onEvent(onWebSocketEvent);
        ws.setReconnectInterval(WS_RECONNECT_INTERVAL);
        ws.enableHeartbeat(WS_HEARTBEAT_INTERVAL, WS_HEARTBEAT_TIMEOUT, WS_HEARTBEAT_MAX_RETRIES);
        ws.begin(hostname, WS_PORT, "/");
    }

    bool sendText(String message) {
        return ws.sendTXT(message);
    }

    const auto loop = []() {
        ws.loop();
    };
}
