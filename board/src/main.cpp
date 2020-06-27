#include <Arduino.h>
#include <DHT.h>
#include <WiFiEsp.h>
#include <WiFiEspClient.h>
#include <SoftwareSerial.h>
#include <httpRequest.h>
#include <config.h>
#include <ArduinoJson.h>

#define RELAY_IN1 12
#define RELAY_IN2 13
#define RELAY_LIGHT RELAY_IN1
#define RELAY_FAN RELAY_IN2
#define DHTPIN 2
#define ESP_TX 6
#define ESP_RX 7


struct Config {
  bool isLightOn;
  bool isFanOn;

  unsigned long msBeforeLightSwitch;
  unsigned long msBeforeFanSwitch;
  unsigned long lightCycleDurationMs;
  unsigned long fanCycleDurationMs;
};


WiFiEspClient http;
SoftwareSerial esp(ESP_RX, ESP_TX);
DHT dht;
Config config;
int status = WL_IDLE_STATUS;
unsigned long lastDataSendTime = 0;
unsigned long lastScheduleCheckTime = 0;

const unsigned long SCHEDULE_CHECK_INTERVAL = 1000L;
const unsigned long DATA_SEND_INTERVAL = 60L * 1000L; // @todo: should be configurable
const unsigned long DAY_MS = 86400000;
const unsigned long REMOTE_CONFIG_FIELDS_COUNT = 20;  // @todo: figure out exact required bites amount


String getPayloadJSON(int temperature, int humidity) {
  return "{\"temperature\":\"" + String(temperature) + "\",\"humidity\":\"" + String(humidity) + "\"}";
}

void turnOnLight(uint8_t pin = RELAY_LIGHT) {
  digitalWrite(pin, HIGH);
}

void turnOffLight(uint8_t pin = RELAY_LIGHT) {
  digitalWrite(pin, LOW);
}

void setLowFanSpeed(uint8_t pin = RELAY_FAN) {
    digitalWrite(pin, LOW);
}

void setHighFanSpeed(uint8_t pin = RELAY_FAN) {
  digitalWrite(pin, HIGH);
}

bool toggleLight() {
  config.msBeforeLightSwitch = config.isLightOn ? (DAY_MS - config.lightCycleDurationMs) : config.lightCycleDurationMs;
  config.isLightOn ? turnOffLight() : turnOnLight();
  config.isLightOn = !config.isLightOn;

  return config.isLightOn;
}

bool toggleFan() {
  config.msBeforeFanSwitch = config.isFanOn ? (DAY_MS - config.fanCycleDurationMs) : config.fanCycleDurationMs;
  config.isFanOn ? setLowFanSpeed() : setHighFanSpeed();
  config.isFanOn = !config.isFanOn;

  return config.isFanOn;
}

Config getRemoteConfig(WiFiEspClient &http, char server[], char path[], uint16_t port) {
  const String response = httpRequest(http, path, server, port, GET);
  const int capacity = JSON_OBJECT_SIZE(REMOTE_CONFIG_FIELDS_COUNT);

  DynamicJsonDocument responseJson(capacity);
  Config config;
  DeserializationError error = deserializeJson(responseJson, response);

  if (error) {
    Serial.println(error.c_str());
  }

  config.isLightOn = responseJson["isLightOn"];
  config.isFanOn = responseJson["isFanOn"];
  config.msBeforeLightSwitch = responseJson["msBeforeLightSwitch"];
  config.msBeforeFanSwitch = responseJson["msBeforeFanSwitch"];
  config.lightCycleDurationMs = responseJson["lightCycleDurationMs"];
  config.fanCycleDurationMs = responseJson["fanCycleDurationMs"];

  return config;
}


void setup() {
    pinMode(RELAY_IN1, OUTPUT);
    pinMode(RELAY_IN2, OUTPUT);

    Serial.begin(9600);
    esp.begin(9600);
    dht.setup(DHTPIN);
    WiFi.init(&esp);

    if (WiFi.status() == WL_NO_SHIELD) {
      Serial.println("WiFi shield not present");
    }

    while (status != WL_CONNECTED) {
      Serial.println("Connecting to " + String(NETWORK_SSID));
      status = WiFi.begin(NETWORK_SSID, NETWORK_PASS);
    }

    Serial.println("Connected to: " + String(WiFi.SSID()) + " with IP: " + String(WiFi.localIP()));

    config = getRemoteConfig(http, REQUEST_DOMAIN, REQUEST_CONFIG_PATH, REQUEST_PORT);

    config.isLightOn ? turnOnLight() : turnOffLight();
    config.isFanOn ? setHighFanSpeed() : setLowFanSpeed();
}


void loop() {
  // check schedule and update box state
  if (millis() - lastScheduleCheckTime >= SCHEDULE_CHECK_INTERVAL) {
    config.msBeforeLightSwitch -= SCHEDULE_CHECK_INTERVAL;
    config.msBeforeFanSwitch -= SCHEDULE_CHECK_INTERVAL;

    if (config.msBeforeLightSwitch <= 0) {
      toggleLight();
    }

    if (config.msBeforeFanSwitch <= 0) {
      toggleFan();
    }

    lastScheduleCheckTime = millis();
  }

  // send data to server
  if (millis() - lastDataSendTime > DATA_SEND_INTERVAL) {
    const int temperature = dht.getTemperature();
    const int humidity = dht.getHumidity();

    const String response = httpRequest(http, REQUEST_PATH, REQUEST_DOMAIN, REQUEST_PORT, POST, getPayloadJSON(temperature, humidity));

    lastDataSendTime = millis();
  }
}