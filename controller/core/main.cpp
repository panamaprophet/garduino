#include <vector>

#include <Arduino.h>
#include <ArduinoJson.h>

#include <Ticker.h>
#include <DHT.h>
#include <Esp.h>
#include <LittleFS.h>
#include <EEPROM.h>

#include <include/configuration.h>
#include <include/events.h>
#include <include/state.h>
#include <include/request.h>
#include <include/wifi.h>
#include <include/webserver.h>
#include <include/websocket.h>
#include <include/fanController.h>


const unsigned long UPDATE_INTERVAL             = 10 * 60 * 1000;
const unsigned long SENSOR_DATA_READ_INTERVAL   = 10 * 1000;
const unsigned long SCHEDULE_CHECK_INTERVAL     = 5 * 1000;
const unsigned int TEMPERATURE_THRESHOLD_DELTA  = 5;

const int PIN_LIGHT                             = 14;
const int PIN_FAN                               = 12;
const int PIN_SENSOR                            = 13;
const int PIN_OFF                               = HIGH;
const int PIN_ON                                = LOW;


using events::EventPayload;
using events::EventType;
using events::stringifyPayload;
using events::emit;

using state::sensor;
using state::light;
using state::temperature;
using state::humidity;
using state::lastError;
using state::isEmergencyOff;
using state::lastUpdateTimestamp;
using state::temperatureThreshold;
using state::scheduleTimer;
using state::sensorTimer;


void handleEmergencySwitch() {
    if ((temperature >= temperatureThreshold)) {
        isEmergencyOff = true;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }

    if ((temperature < temperatureThreshold - TEMPERATURE_THRESHOLD_DELTA) && isEmergencyOff) {
        isEmergencyOff = false;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }
};

auto onUpdate = [](EventPayload payload) {
    handleEmergencySwitch();

    fanController::setSpeedByTemperature(temperature);

    if (lastUpdateTimestamp == 0 || millis() - lastUpdateTimestamp > UPDATE_INTERVAL) {
        const String payloadString = stringifyPayload(payload, "events/update");

        Serial.println("[events] onUpdate - " + payloadString);

        request::sendPost(configuration::getUrl("/log"), payloadString);

        lastUpdateTimestamp = millis();
    }
};

auto onSwitch = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/switch");

    Serial.println("[events] onSwitch - " + payloadString);

    const auto & isLightOn = payload["isLightOn"] != "0" && payload["isEmergencyOff"] == "0";

    digitalWrite(PIN_LIGHT, isLightOn ? PIN_ON : PIN_OFF);

    return request::sendPost(configuration::getUrl("/log"), payloadString);
};

auto onRun = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/run");

    Serial.println("[events] onRun - " + payloadString);

    emit(EventType::SWITCH, {
        {"isLightOn", String(light.isOn)},
        {"isEmergencyOff", String(isEmergencyOff)}
    });

    scheduleTimer.attach_ms(SCHEDULE_CHECK_INTERVAL, []() {
        const bool isLightChanged = state::update(light, SCHEDULE_CHECK_INTERVAL);

        if (isLightChanged) {
            emit(EventType::SWITCH, {
                {"isLightOn", String(light.isOn)},
                {"isEmergencyOff", String(isEmergencyOff)}
            });
        }
    });

    sensorTimer.attach_ms(SENSOR_DATA_READ_INTERVAL, [](){
        sensor.read();
    });

    const String response = request::sendPost(configuration::getUrl("/log"), payloadString);

    sensor.read();

    return response;
};

auto onError = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/error");

    lastError = payloadString;

    Serial.println("[events] onError - " + payloadString);

    return request::sendPost(configuration::getUrl("/log"), payloadString);
};

auto onConfig = [](EventPayload payload) {
    Serial.println("[events] onConfig called");

    const String response = request::sendGet(configuration::getUrl("/config"));

    Serial.println("configuration received = " + response);

    DynamicJsonDocument json(JSON_OBJECT_SIZE(20));
    DeserializationError error = deserializeJson(json, response);

    if (error) {
        emit(EventType::ERROR, {{"error", error.c_str()}});
    }

    if (!error) {
        light.isOn = json["light"]["isOn"].as<bool>();
        light.duration = json["light"]["duration"].as<long>();
        light.msBeforeSwitch = json["light"]["msBeforeSwitch"].as<long>();

        temperatureThreshold = json["temperatureThreshold"].as<float>();

        emit(EventType::RUN, {
            {"isLightOn", String(light.isOn)},
        });
    }

    return response;
};


const auto onReboot = [](ESP8266WebServer *webServer) {
    webServer -> send(200, "application/json", "{\"success\": true}");
    ESP.restart();
};

const auto onConfigurationPost = [](ESP8266WebServer *webServer) {
    const bool result = configuration::save(
        webServer -> arg("ssid"),
        webServer -> arg("password"),
        webServer -> arg("controllerId"),
        webServer -> arg("serverUrl")
    );

    webServer -> send(200, "application/json", "{\"success\": " + String(result) + "}");
};

const auto onConfigurationGet = [](ESP8266WebServer *webServer) {
    webServer -> send(200, "application/json", configuration::toJSON());
};

const auto onStatus = [](ESP8266WebServer *webServer) {
    webServer -> send(200, "application/json", state::toJSON());
};


std::vector<webserver::Route> routes = {
    {"/api/reboot", onReboot, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationGet, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationPost, HTTPMethod::HTTP_POST},
    {"/api/status", onStatus, HTTPMethod::HTTP_GET}
};

auto onSensorData = [](float h, float t) {
    humidity = h;
    temperature = t;

    emit(EventType::UPDATE, {
        {"humidity", String(humidity)},
        {"temperature", String(temperature)}
    });
};

auto onSensorError = [](uint8_t e) {
    emit(EventType::ERROR, {{"error", sensor.getError()}});
};


auto onWebSocketEvent = [](WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED: {
            Serial.printf("[ws] disconnected\n");
            break;
        }
        case WStype_CONNECTED: {
            Serial.printf("[ws] connected\n");
            String response = "{\"success\": true, \"payload\": {\"controllerId\":\"" + configuration::controllerId + "\"}}";
            websocket::sendText(response);
            break;
        }
        case WStype_TEXT: {
            Serial.printf("[ws] message received: %s\n", payload);

            DynamicJsonDocument json(JSON_OBJECT_SIZE(20));
            DeserializationError error = deserializeJson(json, payload);

            if (error) {
                emit(EventType::ERROR, {{"error", error.c_str()}});
                break;
            }

            const String action = json["action"].as<String>();
            const String controllerId = json["payload"]["controllerId"].as<String>();

            if (configuration::controllerId != controllerId) {
                websocket::sendText("{\"error\":\"controllerId mismatch\"}");
                break;
            }

            if (action == "actions/status") {
                websocket::sendText("{\"controllerId\":\"" + controllerId + "\",\"action\":\"" + action + "\",\"payload\":" + state::toJSON() + "}");
                break;
            }
            
            if (action == "actions/reboot") {
                websocket::sendText("{\"success\": true}");
                ESP.restart();
                break;
            }
            
            websocket::sendText("{\"success\": false}");
            break;
        }
        default: {
            break;
        }
    }
};


void setup() {
    Serial.begin(115200);

    sensor.setup(PIN_SENSOR);

    pinMode(PIN_LIGHT, OUTPUT);
    pinMode(PIN_FAN, OUTPUT);

    digitalWrite(PIN_LIGHT, PIN_OFF);

    fanController::setPin(PIN_FAN);

    sensor.onData(onSensorData);
    sensor.onError(onSensorError);

    configuration::init();

    wifi::connect(configuration::ssid, configuration::password, configuration::controllerId);
    websocket::connect(configuration::serverUrl, onWebSocketEvent);
    webserver::setup(routes);

    listen(EventType::UPDATE, onUpdate);
    listen(EventType::RUN, onRun);
    listen(EventType::SWITCH, onSwitch);
    listen(EventType::CONFIG, onConfig);
    listen(EventType::ERROR, onError);

    emit(EventType::CONFIG);
}

void loop() {
    webserver::loop();
    websocket::loop();
    events::next();
}
