#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Ticker.h>
#include <config.h>
#include <stateManager.h>
#include <helpers.h>

#define CONFIG_FIELDS_COUNT 20

#define UPDATE_INTERVAL_MS 10 * 60 * 1000
#define SCHEDULE_CHECK_INTERVAL_MS 1000

#define RELAY_LIGHT_PIN 14
#define RELAY_FAN_PIN 12
#define DHT_PIN 4


Event requestedEvent = Event::CONFIG;
StateManager stateManager;

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


void handleSchedule() {
    const bool isLightSwitched = stateManager.updateLightCounter(-1 * SCHEDULE_CHECK_INTERVAL_MS);
    const bool isFanSwitched = stateManager.updateFanCounter(-1 * SCHEDULE_CHECK_INTERVAL_MS);

    if (isLightSwitched || isFanSwitched) {
        requestedEvent = Event::SWITCH;
    }
}

void updateRelay(int pin, bool isOn) {
    digitalWrite(pin, isOn ? HIGH : LOW);
}

void updateRelays() {
    updateRelay(RELAY_LIGHT_PIN, stateManager.isLightOn());
    updateRelay(RELAY_FAN_PIN, stateManager.isFanOn());
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
        stateManager.setCurrentData(h, t);
        requestedEvent = Event::UPDATE;
    });

    dht.onError([](uint8_t e) {
        stateManager.setLastError(dht.getError());
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
            stateManager.setLastError(error.c_str());
            requestedEvent = Event::ERROR;
        }

        if (!error) {
            State state;

            state.isLightOn = json["isLightOn"];
            state.isFanOn = json["isFanOn"];
            state.msBeforeLightSwitch = json["msBeforeLightSwitch"].as<long>();
            state.msBeforeFanSwitch = json["msBeforeFanSwitch"].as<long>();
            state.lightCycleDurationMs = json["lightCycleDurationMs"].as<long>();
            state.fanCycleDurationMs = json["fanCycleDurationMs"].as<long>();
            state.temperatureThreshold = json["temperatureThreshold"].as<float>();

            stateManager.setState(state);

            requestedEvent = Event::RUN;
        }

        requestedEvent = requestedEvent == Event::CONFIG ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::RUN) {
        updateRelays();

        scheduleTicker.attach_ms(SCHEDULE_CHECK_INTERVAL_MS, handleSchedule);

        String payload = getRunEventPayload(stateManager.isLightOn(), stateManager.isFanOn());
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);

        requestedEvent = requestedEvent == Event::RUN ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::EMERGENCY_SWITCH) {
        updateRelays();

        String payload = getSwitchEventPayload(stateManager.isLightOn(), stateManager.isFanOn(), stateManager.isEmergencySwitchOff());
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);

        requestedEvent = requestedEvent == Event::EMERGENCY_SWITCH ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::SWITCH) {
        updateRelays();

        String payload = getSwitchEventPayload(stateManager.isLightOn(), stateManager.isFanOn(), stateManager.isEmergencySwitchOff());
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);

        requestedEvent = requestedEvent == Event::SWITCH ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::UPDATE) {
        String payload = getUpdateEventPayload(stateManager.getTemperature(), stateManager.getHumidity());
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);

        requestedEvent = requestedEvent == Event::UPDATE ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::ERROR) {
        String payload = getErrorEventPayload(stateManager.getLastError());
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG + CONTROLLER_ID, RequestType::POST, payload);

        requestedEvent = requestedEvent == Event::ERROR ? Event::NONE : requestedEvent;
    }
}