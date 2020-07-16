#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Ticker.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define WIFI_SSID ""
#define WIFI_PASS ""

#define CONFIG_FIELDS_COUNT 6

#define UPDATE_INTERVAL 10 * 60 * 1000

#define DAY_MS 86400000
#define DEFAULT_DURATION_MS (DAY_MS / 2)

#define RELAY_LIGHT_PIN 14
#define RELAY_FAN_PIN 12
#define DHT_PIN 4

const String REQUEST_DOMAIN = "https://example.com";
const String REQUEST_API_LOG = "/api/log";
const String REQUEST_API_CONFIG = "/api/config";

enum Event {
    NONE,
    CONFIG,
    UPDATE,
    ERROR,
};

enum RequestType {
    GET,
    POST,
};

Event requestedEvent = Event::CONFIG;

bool isLightOn = false;
bool isFanOn = false;
unsigned long msBeforeLightSwitch = DEFAULT_DURATION_MS;
unsigned long msBeforeFanSwitch = DEFAULT_DURATION_MS;
unsigned long lightCycleDurationMs = DEFAULT_DURATION_MS;
unsigned long fanCycleDurationMs = DEFAULT_DURATION_MS;

String lastError;

float temperature;
float humidity;

Ticker ticker;
Ticker lightCycleTicker;
Ticker fanCycleTicker;

WiFiClientSecure client;
HTTPClient http;
DHT11 dht;


void toggleLight() {
    digitalWrite(RELAY_LIGHT_PIN, isLightOn ? LOW : HIGH);
    isLightOn = !isLightOn;
}

void toggleFan() {
    digitalWrite(RELAY_FAN_PIN, isFanOn ? LOW : HIGH);
    isFanOn = !isFanOn;
}

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

String getErrorEventPayload(String error) {
    return "{\"type\":\"ERROR\",\"event\":\"ERROR\",\"payload\":[{\"error\": \"" + error + "\"}]}";
}

String getUpdateEventPayload(float temperature, float humidity) {
    return "{\"type\":\"INFO\",\"event\":\"UPDATE\",\"payload\":[{\"key\":\"humidity\",\"value\":\"" + String(humidity) + "\"},{\"key\":\"temperature\",\"value\":\"" + String(temperature) + "\"}]}";
}


void setup() {
    Serial.begin(115200);
    dht.setPin(DHT_PIN);
    pinMode(RELAY_LIGHT_PIN, OUTPUT);
    pinMode(RELAY_FAN_PIN, OUTPUT);

    WiFi.begin(WIFI_SSID, WIFI_PASS);

    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }

    Serial.println();
    Serial.print("Connected to " + String(WiFi.SSID()) + " with IP ");
    Serial.println(WiFi.localIP());

    ticker.attach_ms(UPDATE_INTERVAL, []() {
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
        Serial.println("Config was requested");

        const int capacity = JSON_OBJECT_SIZE(CONFIG_FIELDS_COUNT);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_CONFIG, RequestType::GET);

        DynamicJsonDocument json(capacity);
        DeserializationError error = deserializeJson(json, response);

        if (!bool(error)) {
            lastError = error.c_str();
            requestedEvent = Event::ERROR;
        }

        if (bool(error)) {
            isLightOn = json["isLightOn"];
            isFanOn = json["isFanOn"];
            msBeforeLightSwitch = json["msBeforeLightSwitch"];
            msBeforeFanSwitch = json["msBeforeFanSwitch"];
            lightCycleDurationMs = json["lightCycleDurationMs"];
            fanCycleDurationMs = json["fanCycleDurationMs"];

            Serial.println("Config received");
        }

        digitalWrite(RELAY_LIGHT_PIN, isLightOn ? LOW : HIGH);
        digitalWrite(RELAY_FAN_PIN, isFanOn ? LOW : HIGH);

        lightCycleTicker.once_ms(msBeforeLightSwitch, []() {
            toggleLight();
            lightCycleTicker.attach_ms(lightCycleDurationMs, toggleLight);
        });

        fanCycleTicker.once_ms(msBeforeFanSwitch, []() {
            toggleFan();
            fanCycleTicker.attach_ms(fanCycleDurationMs, toggleFan);
        });

        requestedEvent = requestedEvent == Event::CONFIG ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::UPDATE) {
        Serial.println("Update event was requested");

        String payload = getUpdateEventPayload(temperature, humidity);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG, RequestType::POST, payload);

        Serial.println("Update event response: " + response);

        requestedEvent = requestedEvent == Event::UPDATE ? Event::NONE : requestedEvent;
    }

    if (requestedEvent == Event::ERROR) {
        Serial.println("Error event was requested");

        String payload = getErrorEventPayload(lastError);
        String response = sendRequest(REQUEST_DOMAIN + REQUEST_API_LOG, RequestType::POST, payload);

        Serial.println("Error event response: " + response);

        requestedEvent = requestedEvent == Event::ERROR ? Event::NONE : requestedEvent;
    }
}