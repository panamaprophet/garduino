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


const unsigned long UPDATE_INTERVAL             = 10 * 60 * 1000;
const unsigned long SENSOR_DATA_READ_INTERVAL   = 10 * 1000;
const unsigned long SCHEDULE_CHECK_INTERVAL     = 1000;
const unsigned int TEMPERATURE_THRESHOLD_DELTA  = 5;

const int PIN_LIGHT                             = 14;
const int PIN_FAN                               = 12;
const int PIN_SENSOR                            = 13;
const int PIN_OFF                               = HIGH;
const int PIN_ON                                = LOW;

#ifndef SERVER_HOSTNAME
    const String SERVER_HOSTNAME = "localhost";
#endif

const String REQUEST_API_LOG                    = "https://" + String(SERVER_HOSTNAME) + "/api/log";
const String REQUEST_API_CONFIG                 = "https://" + String(SERVER_HOSTNAME) + "/api/config";


using events::EventPayload;
using events::EventType;
using events::stringifyPayload;
using events::emit;

using state::sensor;
using state::light;
using state::fan;
using state::temperature;
using state::humidity;
using state::lastError;
using state::isEmergencyOff;
using state::lastUpdateTimestamp;
using state::temperatureThreshold;
using state::scheduleTimer;
using state::sensorTimer;


auto onUpdate = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/update");

    Serial.println("[events] onUpdate - " + payloadString);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onSwitch = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/switch");

    Serial.println("[events] onSwitch - " + payloadString);

    const auto & isFanOn = payload["isFanOn"] != "0";
    const auto & isLightOn = payload["isLightOn"] != "0" && payload["isEmergencyOff"] == "0";

    digitalWrite(PIN_FAN, isFanOn ? PIN_ON : PIN_OFF);
    digitalWrite(PIN_LIGHT, isLightOn ? PIN_ON : PIN_OFF);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onRun = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/run");

    Serial.println("[events] onRun - " + payloadString);

    emit(EventType::SWITCH, {
        {"isLightOn", String(light.isOn)},
        {"isFanOn", String(fan.isOn)},
        {"isEmergencyOff", String(isEmergencyOff)}
    });

    scheduleTimer.attach_ms(SCHEDULE_CHECK_INTERVAL, []() {
        const bool isLightChanged = state::update(light, SCHEDULE_CHECK_INTERVAL);
        const bool isFanChanged = state::update(fan, SCHEDULE_CHECK_INTERVAL);

        if (isLightChanged || isFanChanged) {
            emit(EventType::SWITCH, {
                {"isLightOn", String(light.isOn)},
                {"isFanOn", String(fan.isOn)},
                {"isEmergencyOff", String(isEmergencyOff)}
            });
        }
    });

    sensorTimer.attach_ms(SENSOR_DATA_READ_INTERVAL, [](){
        sensor.read();
    });

    const String response = request::sendPost(REQUEST_API_LOG, payloadString);

    sensor.read();

    return response;
};

auto onError = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/error");

    lastError = payloadString;

    Serial.println("[events] onError - " + payloadString);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onConfig = [](EventPayload payload) {
    Serial.println("[events] onConfig called");

    const String response = request::sendGet(REQUEST_API_CONFIG);

    Serial.println(response);

    DynamicJsonDocument json(JSON_OBJECT_SIZE(20));
    DeserializationError error = deserializeJson(json, response);

    if (error) {
        emit(EventType::ERROR, {{"error", error.c_str()}});
    }

    if (!error) {
        light.isOn = json["light"]["isOn"].as<bool>();
        light.duration = json["light"]["duration"].as<long>();
        light.msBeforeSwitch = json["light"]["msBeforeSwitch"].as<long>();

        fan.isOn = json["fan"]["isOn"].as<bool>();
        fan.duration = json["fan"]["duration"].as<long>();
        fan.msBeforeSwitch = json["fan"]["msBeforeSwitch"].as<long>();

        temperatureThreshold = json["temperatureThreshold"].as<float>();

        emit(EventType::RUN, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)}
        });
    }

    return response;
};


const auto onReboot = [](ESP8266WebServer *webServer) {
    webServer -> send(200, "application/json", "{success: true}");
    ESP.restart();
};

const auto onConfigurationPost = [](ESP8266WebServer *webServer) {
    String ssid = webServer -> arg("ssid");
    String password = webServer -> arg("password");
    String controllerId = webServer -> arg("controllerId");

    const bool result = configuration::save(ssid, password, controllerId);

    webServer -> send(
        200,
        "application/json",
        "{success: " + String(result) + "}"
    );
};

const auto onConfigurationGet = [](ESP8266WebServer *webServer) {
    webServer -> send(
        200,
        "application/json",
        "{\"ssid\": \"" + configuration::ssid +
        "\", \"password\": \"" + configuration::password +
        "\", \"controllerId\": \"" + configuration::controllerId +
        "\"}"
    );
};

const auto onStatus = [](ESP8266WebServer *webServer) {
    webServer -> send(
        200,
        "application/json",
        state::getStatusString()
    );
};


std::vector<webserver::Route> routes = {
    {"/api/reboot", onReboot, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationGet, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationPost, HTTPMethod::HTTP_POST},
    {"/api/status", onStatus, HTTPMethod::HTTP_GET}
};


void handleTemperatureThreshold() {
    if ((temperature >= temperatureThreshold)) {
        isEmergencyOff = true;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }

    if ((temperature < temperatureThreshold - TEMPERATURE_THRESHOLD_DELTA) && isEmergencyOff) {
        isEmergencyOff = false;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }
};

auto onSensorData = [](float h, float t) {
    humidity = h;
    temperature = t;

    if (lastUpdateTimestamp == 0 || millis() - lastUpdateTimestamp > UPDATE_INTERVAL) {
        lastUpdateTimestamp = millis();

        emit(EventType::UPDATE, {
            {"humidity", String(humidity)},
            {"temperature", String(temperature)}
        });
    }

    handleTemperatureThreshold();
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
                String status = state::getStatusString();
                websocket::sendText("{\"controllerId\":\"" + controllerId + "\",\"action\":\"" + action + "\",\"payload\":" + status + "}");
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
    digitalWrite(PIN_FAN, PIN_OFF);

    sensor.onData(onSensorData);
    sensor.onError(onSensorError);

    configuration::init();

    wifi::connect(configuration::ssid, configuration::password, configuration::controllerId);
    websocket::connect(SERVER_HOSTNAME, onWebSocketEvent);
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
