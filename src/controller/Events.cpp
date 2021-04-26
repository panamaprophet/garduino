#include <map>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <Context.h>


#define DOCUMENT_CAPACITY JSON_OBJECT_SIZE(20)


std::map<EventType, String> EventTypeToStringMap = {
    {EventType::CONFIG, "CONFIG"},
    {EventType::RUN, "RUN"},
    {EventType::SWITCH, "SWITCH"},
    {EventType::UPDATE, "UPDATE"},
    {EventType::ERROR, "ERROR"},
    {EventType::NONE, "NONE"},
};


String getPayloadString(const Event &event) {
    const String type = EventTypeToStringMap[event.type];

    String payload = "[";

    for (auto iterator = event.payload.begin(); iterator != event.payload.end(); ++iterator) {
        payload += "{\"key\":\"" + iterator -> first + "\", \"value\":\"" + iterator -> second + "\"}";

        if (std::next(iterator) != event.payload.end()) {
            payload += ",";
        }
    }

    payload += "]";

    return "{\"event\":\"" + type + "\",\"payload\":" + payload + "}";
}


String handleErrorEvent(Context &context, const Event &event) {
        const String payload = getPayloadString(event);
        const String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

        return response;
};

String handleUpdateEvent(Context &context, const Event &event) {
    const float temperature = (event.payload.find("temperature") -> second).toFloat();
    const float temperatureThreshold = context.configuration.temperatureThreshold;

    auto light = context.configuration.light;
    const auto fan = context.configuration.fan;

    const String payload = getPayloadString(event); // temperature, humidity
    const String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    if ((temperature >= temperatureThreshold) && light.isOn) {
        light.isEmergencyOff = true;
        light.isOn = false;

        context.events.push_back({
            EventType::SWITCH,
            {
                {"isLightOn", String(light.isOn)},
                {"isFanOn", String(fan.isOn)},
                {"isEmergencySwitch", String(light.isEmergencyOff)}
            }
        });
    }

    if ((temperature < temperatureThreshold) && light.isEmergencyOff) {
        light.isOn = true;

        context.events.push_back({
            EventType::SWITCH,
            {
                {"isLightOn", String(light.isOn)},
                {"isFanOn", String(fan.isOn)},
                {"isEmergencySwitch", String(light.isEmergencyOff)}
            }
        });
    }

    return response;
}

String handleSwitchEvent(Context &context, const Event &event) {
    context.onUpdate();

    const bool isLightOn = (event.payload.find("isLightOn") -> second).toInt();
    const bool isEmergencyOff = (event.payload.find("isEmergencyOff") -> second).toInt();

    const String payload = getPayloadString(event);
    const String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    // reset emergency flag after switching light back
    if (isEmergencyOff && isLightOn) {
        context.configuration.light.isEmergencyOff = false;
    }

    return response;
}

String handleRunEvent(Context &context, const Event &event) {
    context.onUpdate();
    context.onRun();

    const String payload = getPayloadString(event);
    const String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    return response;
}

String handleConfigEvent(Context &context, const Event &event) {
    const String response = context.fetch(REQUEST_API_CONFIG);
    DynamicJsonDocument json(DOCUMENT_CAPACITY);
    DeserializationError error = deserializeJson(json, response);

    if (error) {
        context.state.lastError = error.c_str();
        context.events.push_back({
            EventType::ERROR,
            {{"error", context.state.lastError}}
        });
    }

    if (!error) {
        auto light = context.configuration.light;
        auto fan = context.configuration.fan;

        light.isOn = json["isLightOn"];
        light.duration = json["lightCycleDurationMs"].as<long>();
        light.msBeforeSwitch = json["msBeforeLightSwitch"].as<long>();

        fan.isOn = json["isFanOn"];
        fan.duration = json["fanCycleDurationMs"].as<long>();
        fan.msBeforeSwitch = json["msBeforeFanSwitch"].as<long>();

        context.configuration.temperatureThreshold = json["temperatureThreshold"].as<float>();

        context.events.push_back({
            EventType::RUN,
            {
                {"isLightOn", String(light.isOn)},
                {"isFanOn", String(fan.isOn)}
            }
        });
    }

    return response;
}


void processNextEvent(Context &context) {
    if (context.events.size() == 0) {
        return;
    }

    Event event = context.events[0];

    context.events.erase(std::begin(context.events));

    switch (event.type) {
        case EventType::CONFIG:
            handleConfigEvent(context, event);
            break;
        case EventType::RUN:
            handleRunEvent(context, event);
            break;
        case EventType::SWITCH:
            handleSwitchEvent(context, event);
            break;
        case EventType::UPDATE:
            handleUpdateEvent(context, event);
            break;
        case EventType::ERROR:
            handleErrorEvent(context, event);
            break;
        default:
            break;
    }
}
