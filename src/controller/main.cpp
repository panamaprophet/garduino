#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>

#include <WiFiClientSecure.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <DHT.h>
#include <Ticker.h>

#include <config.h>
#include <helpers.h>
#include <ConfigurationServer.h>

#include <Context.h>
#include <Events.h>


#define CONFIG_FIELDS_COUNT 20

#define DAY_MS 86400000
#define DEFAULT_DURATION_MS (DAY_MS / 2)
#define DEFAULT_TEMPERATURE_THRESHOLD 30
#define UPDATE_INTERVAL_MS 10 * 60 * 1000
#define SCHEDULE_CHECK_INTERVAL_MS 1000

#define RELAY_LIGHT_PIN 14
#define RELAY_FAN_PIN 12
#define DHT_PIN 13


const IPAddress CONFIGURATION_MODE_IP(192, 168, 4, 20);
const char* CONFIGURATION_MODE_SSID = "CONFIGURATION_MODE";


Ticker ticker;
Ticker scheduleTicker;
DHT11 dht;
DNSServer dnsServer;
ESP8266WebServer webServer(80);


Context context;


bool updateModuleState(ModuleConfig &state, unsigned long interval) {
    state.msBeforeSwitch -= interval;

    if (state.msBeforeSwitch <= 0) {
        state.isOn = !state.isOn;
        state.msBeforeSwitch = state.isOn ? state.duration : DAY_MS - state.duration;

        return true;
    }

    return false;
}

bool updateState(ModuleConfig &light, ModuleConfig &fan, unsigned long interval) {
    const bool isLightStateChanged = updateModuleState(light, interval);
    const bool isFanStateChanged = updateModuleState(fan, interval);

    if (isLightStateChanged) {
        light.isEmergencyOff = false;
    }

    return isLightStateChanged || isFanStateChanged;
}

void handleSchedule() {
    const bool isChanged = updateState(context.configuration.light, context.configuration.fan, SCHEDULE_CHECK_INTERVAL_MS);

    if (isChanged) {
        context.events.push_back({Event::SWITCH}); // @todo: pass args
    }
}

void updateRelay(int pin, bool isOn) {
    digitalWrite(pin, isOn ? HIGH : LOW);
}


void setup() {
    Serial.begin(115200);
    dht.setPin(DHT_PIN);
    pinMode(RELAY_LIGHT_PIN, OUTPUT);
    pinMode(RELAY_FAN_PIN, OUTPUT);

    auto controller = context.configuration.controller;

    if (controller.isConfigured()) {
        WiFi.mode(WIFI_STA);
        WiFi.hostname(controller.getControllerId());
        WiFi.begin(controller.getSSID(), controller.getPassword());

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
            context.state.humidity = h;
            context.state.temperature = t;

            context.events.push_back({Event::UPDATE}); // @todo: pass args
        });

        dht.onError([](uint8_t e) {
            context.state.lastError = dht.getError();
            context.events.push_back({Event::ERROR}); // @todo: pass args
        });

        context.onUpdate = []() {
            updateRelay(RELAY_LIGHT_PIN, context.configuration.light.isOn);
            updateRelay(RELAY_FAN_PIN, context.configuration.fan.isOn);
        };

        context.onRun = []() {
            scheduleTicker.attach_ms(SCHEDULE_CHECK_INTERVAL_MS, handleSchedule);
        };

        return;
    }

    Serial.println("No configuration was found. Switching to setup mode");

    webServer.on("/", HTTP_GET, [&controller]() {
        String ssid = controller.getSSID();
        String password = controller.getPassword();
        String controllerId = controller.getControllerId();

        webServer.send(200, "text/html", handleRoot(ssid, password, controllerId));
    });

    webServer.on("/submit", HTTP_POST, [&controller]() {
        String ssid = webServer.arg("ssid");
        String password = webServer.arg("password");
        String controllerId = webServer.arg("controllerId");

        controller.set(ssid, password, controllerId);

        webServer.send(200, "text/html", handleSubmit());
    });

    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(CONFIGURATION_MODE_IP, CONFIGURATION_MODE_IP, IPAddress(255, 255, 255, 0));
    WiFi.softAP(CONFIGURATION_MODE_SSID);

    dnsServer.start(53, "*", CONFIGURATION_MODE_IP);
    webServer.begin();

    context.configuration.mode = ControllerMode::SETUP;
}


void loop() {
    if (context.configuration.mode == ControllerMode::SETUP) {
        dnsServer.processNextRequest();
        webServer.handleClient();
        return;
    }

    process_next_event(context);
}
