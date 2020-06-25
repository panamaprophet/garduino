#include <Arduino.h>
#include <DHT.h>
#include <WiFiEsp.h>
#include <WiFiEspClient.h>
#include <SoftwareSerial.h>
#include <httpRequest.h>
#include <config.h>

#define RELAY_IN1 12
#define RELAY_IN2 13
#define DHTPIN 2
#define ESP_TX 6
#define ESP_RX 7
#define DHT_DELAY 2000

WiFiEspClient http;
SoftwareSerial esp(ESP_RX, ESP_TX);
DHT dht;

int status = WL_IDLE_STATUS;

unsigned long lastConnectionTime = 0;
const unsigned long REQUEST_INTERVAL = 10L * 1000L;


String getPayloadJSON(int temperature, int humidity) {
  return "{\"temperature\":\"" + String(temperature) + "\",\"humidity\":\"" + String(humidity) + "\"}";
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
      Serial.println("connecting to " + String(NETWORK_SSID));
      status = WiFi.begin(NETWORK_SSID, NETWORK_PASS);
    }

    Serial.println("Connected to: " + String(WiFi.SSID()) + " with IP: " + String(WiFi.localIP()));
}

void loop() {
  if (millis() - lastConnectionTime > REQUEST_INTERVAL) {
    const int temperature = dht.getTemperature();
    const int humidity = dht.getHumidity();

    httpSecureRequest(
      http, 
      REQUEST_PATH, 
      REQUEST_DOMAIN,
      POST, 
      getPayloadJSON(temperature, humidity)
    );

    lastConnectionTime = millis();
  }
}