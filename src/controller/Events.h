#include <Arduino.h>
#include <ArduinoJson.h>
#include <Context.h>
#include <config.h>


#define CONFIG_FIELDS_COUNT 20


String process_event_error(Context &context) {
        String payload = getErrorEventPayload(context.state.lastError);
        String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

        return response;
};

String process_event_update(Context &context) {
    const float temperature = context.state.temperature;
    const float humidity = context.state.humidity;
    const float temperatureThreshold = context.configuration.temperatureThreshold;

    auto light = context.configuration.light;

    const String payload = getUpdateEventPayload(temperature, humidity);
    const String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    if ((temperature >= temperatureThreshold) && light.isOn) {
        light.isEmergencyOff = true;
        light.isOn = false;

        context.events.push_back({Event::EMERGENCY_SWITCH});
    }

    if ((temperature < temperatureThreshold) && light.isEmergencyOff) {
        light.isOn = true;

        context.events.push_back({Event::EMERGENCY_SWITCH});
    }

    return response;
}

String process_event_switch(Context &context) {
    context.onUpdate();

    const bool isLightOn = context.configuration.light.isOn;
    const bool isFanOn = context.configuration.fan.isOn;
    const bool isEmergencyOff = context.configuration.light.isEmergencyOff;

    String payload = getSwitchEventPayload(isLightOn, isFanOn, isEmergencyOff);
    String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    // reset emergency flag after switching light back
    if (isEmergencyOff && isLightOn) {
        context.configuration.light.isEmergencyOff = false;
    }

    return response;
}

String process_event_run(Context &context) {
    context.onUpdate();
    context.onRun();

    const bool isLightOn = context.configuration.light.isOn;
    const bool isFanOn = context.configuration.fan.isOn;

    String payload = getRunEventPayload(isLightOn, isFanOn);
    String response = context.fetch(REQUEST_API_LOG, RequestType::POST, payload);

    return response;
}

String process_event_config(Context &context) {
    const int capacity = JSON_OBJECT_SIZE(CONFIG_FIELDS_COUNT);
    String response = context.fetch(REQUEST_API_CONFIG);

    DynamicJsonDocument json(capacity);
    DeserializationError error = deserializeJson(json, response);

    if (error) {
        context.state.lastError = error.c_str();
        context.events.push_back({Event::ERROR}); // @todo: pass args
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

        context.events.push_back({Event::RUN});
    }

    return response;
}


void process_next_event(Context &context) {
    if (context.events.size() == 0) {
        return;
    }

    ControllerEvent event = context.events[0];

    context.events.erase(std::begin(context.events));

    switch (event.type) {
        case Event::CONFIG:
            process_event_config(context);
            break;
        case Event::RUN:
            process_event_run(context);
            break;
        case Event::SWITCH:
        case Event::EMERGENCY_SWITCH:
            process_event_switch(context);
            break;
        case Event::UPDATE:
            process_event_update(context);
            break;
        case Event::ERROR:
            process_event_error(context);
            break;
        default:
            break;
    }
}
