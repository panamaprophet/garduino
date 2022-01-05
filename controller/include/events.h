#pragma once

#include <map>
#include <vector>
#include <functional>
#include <Arduino.h>


namespace events
{
    enum EventType {
        NONE,
        CONFIG,
        UPDATE,
        ERROR,
        SWITCH,
        RUN,
    };

    typedef std::map<String, String> EventPayload;
    typedef std::function<void(EventPayload)> EventHandler;

    std::vector<std::pair<EventType, EventPayload>> events;
    std::vector<std::pair<EventType, EventHandler>> eventListeners;

    String stringifyPayload(EventPayload payload, String eventId) {
        String payloadString = "[";

        for (auto i = payload.begin(); i != payload.end(); ++i) {
            payloadString += "{\"key\":\"" + i -> first + "\", \"value\": \"" + i -> second + "\"}";

            if (std::next(i) != payload.end()) {
                payloadString += ",";
            }
        }

        payloadString += "]";

        return "{\"event\":\"" + eventId + "\",\"payload\":" + payloadString + "}";
    };

    void emit(EventType event, EventPayload payload = {}) {
        events.push_back({ event, payload });
    };

    void listen(EventType event, const EventHandler & callback) {
        eventListeners.push_back({ event, callback });
    };

    void next() {
        if (events.size() == 0) {
            return;
        }

        const auto & event = events[0];
        const auto & eventType = event.first;
        const auto & eventPayload = event.second;

        auto eventListenerIterator = std::find_if(
            eventListeners.begin(),
            eventListeners.end(),
            [ & eventType ](const std::pair<EventType, EventHandler> item) {
                return item.first == eventType;
            }
        );

        if (eventListenerIterator != eventListeners.end()) {
            eventListenerIterator -> second(eventPayload);
        }

        events.erase(std::begin(events));
    }
}
