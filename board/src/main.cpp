#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Ticker.h>
#include <config.h>
#include <helpers.h>

#define CONFIG_FIELDS_COUNT 20

#define DAY_MS 86400000
#define DEFAULT_DURATION_MS (DAY_MS / 2)
#define DEFAULT_TEMPERATURE_THRESHOLD 30
#define UPDATE_INTERVAL_MS 10 * 60 * 1000
#define SCHEDULE_CHECK_INTERVAL_MS 1000

#define RELAY_LIGHT_PIN 14
#define RELAY_FAN_PIN 12
#define DHT_PIN 4


Event requestedEvent = Event::CONFIG;

ModuleConfig light;
ModuleConfig fan;

String lastError;

float humidity;
float temperature;
float temperatureThreshold = DEFAULT_TEMPERATURE_THRESHOLD;

Ticker ticker;
Ticker scheduleTicker;
WiFiClientSecure client;
HTTPClient http;
DHT11 dht;


String sendRequest(String url, RequestType type = GET, String payload = "") {
    http.begin(client, url);
    http.addHeader("Accept", "*/*");
    http.addHeader("Content-Type", "application/json");

    String response = "";

    if (type == RequestType::GET) {
        http.GET();
    }

    if (type == RequestType::POST) {
        http.POST(payload);
    }

    // @todo: check http code returned by http.GET() and http.POST()

    response = http.getString();
    http.end();

    return response;
}

/**
 * @returns true if state changed
 */
bool updateModuleState(ModuleConfig &state, unsigned long interval) {
    state.msBeforeSwitch -= interval;

    if (state.msBeforeSwitch <= 0) {
        state.isOn = !state.isOn;
        state.msBeforeSwitch = state.isOn ? state.duration : DAY_MS - state.duration;

        return true;
    }

    return false;
}

/**
 * @returns true if state changed
 */
bool updateState(ModuleConfig &light, ModuleConfig &fan, unsigned long interval) {
    const bool isLightStateChanged = updateModuleState(light, interval);
    const bool isFanStateChanged = updateModuleState(fan, interval);

    if (isLightStateChanged) {
        light.isEmergencyOff = false;
    }

    return isLightStateChanged || isFanStateChanged;
}

/**
 * changes requestedEvent to Event::SWITCH if state changed
 */
void handleSchedule() {
    const bool isChanged = updateState(light, fan, SCHEDULE_CHECK_INTERVAL_MS);

    if (isChanged) {
        requestedEvent = Event::SWITCH;
    }
}

void updateRelay(int pin, bool isOn) {
    digitalWrite(pin, isOn ? HIGH : LOW);
}

void updateRelays() {
    updateRelay(RELAY_LIGHT_PIN, light.isOn);
    updateRelay(RELAY_FAN_PIN, fan.isOn);
}


void setup() {
    Serial.begin(115200);
    dht.setPin(DHT_PIN);
    pinMode(RELAY_LIGHT_PIN, OUTPUT);
    pinMode(RELAY_FAN_PIN, OUTPUT);

    WiFi.hostname(CONTROLLER_ID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }

    Serial.println();
    Serial.print("Connected to " + String(WiFi.SSID()) + " with IP ");
    Serial.println(WiFi.localIP());

    ticker.attach_ms(UPDATE_INTERVAL_MS, []() {
        dht.read();
    });

    dht.onData([](float h, float t) {
        temperature = t;
        humidity = h;
        requestedEvent = Event::UPDATE;
    });

    dht.onError([](uint8_t e) {
        lastError = dht.getError();
        requestedEvent = Event::ERROR;
    });

    client.setInsecure();
}

void loop() {
    if (requestedEvent == Event::CONFIG) {
        Serial.println("[Event::CONFIG] requested");

        const int capacity = JSON_OBJECT_SIZE(CONFIG_FIELDS_COUNT);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_CONFIG + CONTROLLER_ID, RequestType::GET);

        DynamicJsonDocument json(capacity);
        DeserializationError error = deserializeJson(json, response);

        if (error) {
            lastError = error.c_str();
            requestedEvent = Event::ERROR;
        }

        if (!error) {
            light.isOn = json["isLightOn"];
            light.duration = json["lightCycleDurationMs"].as<long>();
            light.msBeforeSwitch = json["msBeforeLightSwitch"].as<long>();

            fan.isOn = json["isFanOn"];
            fan.duration = json["fanCycleDurationMs"].as<long>();
            fan.msBeforeSwitch = json["msBeforeFanSwitch"].as<long>();

            temperatureThreshold = json["temperatureThreshold"].as<float>();

            Serial.println("[Event::CONFIG] config received");

            Serial.println("isLightOn = " + String(light.isOn));
            Serial.println("isFanOn = " + String(fan.isOn));
            Serial.println("msBeforeLightSwitch = " + String(light.msBeforeSwitch));
            Serial.println("msBeforeFanSwitch = " + String(fan.msBeforeSwitch));
            Serial.println("lightCycleDurationMs = " + String(light.duration));
            Serial.println("fanCycleDurationMs = " + String(fan.duration));
            Serial.println("temperatureThreshold = " + String(temperatureThreshold));

            requestedEvent = Event::RUN;
        }

        requestedEvent = requestedEvent == Event::CONFIG ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::RUN) {
        Serial.println("[Event::RUN] requested");

        updateRelays();

        scheduleTicker.attach_ms(SCHEDULE_CHECK_INTERVAL_MS, handleSchedule);

        String payload = getRunEventPayload(light.isOn, fan.isOn);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);
        Serial.println("[Event::RUN] response: " + response);

        requestedEvent = requestedEvent == Event::RUN ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::EMERGENCY_SWITCH) {
        Serial.println("[Event::EMERGENCY_SWITCH] requested");

        updateRelays();

        String payload = getSwitchEventPayload(light.isOn, fan.isOn, light.isEmergencyOff);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);
        Serial.println("[Event::SWITCH] response: " + response);

        // reset emergency flag after switching light back
        if (light.isEmergencyOff && light.isOn) {
            light.isEmergencyOff = false;
        }

        requestedEvent = requestedEvent == Event::EMERGENCY_SWITCH ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::SWITCH) {
        Serial.println("[Event::SWITCH] requested");

        updateRelays();

        String payload = getSwitchEventPayload(light.isOn, fan.isOn, light.isEmergencyOff);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);
        Serial.println("[Event::SWITCH] response: " + response);

        requestedEvent = requestedEvent == Event::SWITCH ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::UPDATE) {
        Serial.println("[Event::UPDATE] requested");
        String payload = getUpdateEventPayload(temperature, humidity);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);
        Serial.println("[Event::UPDATE] response: " + response);

        if (temperature >= temperatureThreshold) {
            light.isEmergencyOff = true;
            light.isOn = false;
            requestedEvent = Event::EMERGENCY_SWITCH;
        }

        if ((temperature < temperatureThreshold) && light.isEmergencyOff) {
            light.isOn = true;
            requestedEvent = Event::EMERGENCY_SWITCH;
        }

        requestedEvent = requestedEvent == Event::UPDATE ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::ERROR) {
        Serial.println("[Event::ERROR] requested");
        String payload = getErrorEventPayload(lastError);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);
        Serial.println("[Event::ERROR] response: " + response);

        requestedEvent = requestedEvent == Event::ERROR ? Event::NONE : requestedEvent;
    }
}