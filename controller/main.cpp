#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <Ticker.h>
#include <DHT.h>

#include <configurationManager/ConfigurationManager.h>
#include <configurationServer/ConfigurationServer.h>
#include <context/Context.h>
#include <events/Events.h>


#define DAY_MS 86400000
#define UPDATE_INTERVAL_MS 10 * 60 * 1000
#define SCHEDULE_CHECK_INTERVAL_MS 1000
#define RELAY_LIGHT_PIN 14
#define RELAY_FAN_PIN 12
#define DHT_PIN 13
#define PIN_OFF HIGH
#define PIN_ON LOW
#define CONTROLLER_AP_IP IPAddress(192, 168, 4, 20)
#define CONTROLLER_AP_SSID "CONFIGURATION_MODE"


Ticker ticker;
Ticker scheduleTicker;
DHT11 dht;
Context context;
ConfigurationServer configServer(context.configuration.controller, CONTROLLER_AP_IP);


bool updateModuleState(ModuleConfig &state, unsigned long interval) {
    state.msBeforeSwitch -= interval;

    if (state.msBeforeSwitch <= 0) {
        state.isOn = !state.isOn;
        state.msBeforeSwitch = state.isOn ? state.duration : DAY_MS - state.duration;

        return true;
    }

    return false;
}

bool updateState(Context &ctx, unsigned long interval) {
    const bool isLightStateChanged = updateModuleState(ctx.configuration.light, interval);
    const bool isFanStateChanged = updateModuleState(ctx.configuration.fan, interval);

    if (isLightStateChanged) {
        ctx.configuration.light.isEmergencyOff = false;
    }

    return isLightStateChanged || isFanStateChanged;
}

void createSwitchEvent(Context &ctx) {
    context.events.push_back({
        EventType::SWITCH,
        {
            { "isLightOn", String(context.configuration.light.isOn) },
            { "isFanOn", String(context.configuration.fan.isOn) },
            { "isEmergencyOff", String(context.configuration.light.isEmergencyOff) }
        }
    });
}

void connect(ControllerConfigurationManager &controller) {
    WiFi.mode(WIFI_AP_STA);

    WiFi.softAPConfig(CONTROLLER_AP_IP, CONTROLLER_AP_IP, IPAddress(255, 255, 255, 0));
    WiFi.softAP(CONTROLLER_AP_SSID, emptyString, 1, 1);

    WiFi.hostname(controller.getControllerId());
    WiFi.begin(controller.getSSID(), controller.getPassword());

    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(1000);
    }

    Serial.println();
    Serial.print("Connected to " + String(WiFi.SSID()) + " with IP ");
    Serial.println(WiFi.localIP());
}


void setup() {
    Serial.begin(115200);

    dht.setup(DHT_PIN);

    pinMode(RELAY_LIGHT_PIN, OUTPUT);
    pinMode(RELAY_FAN_PIN, OUTPUT);

    digitalWrite(RELAY_LIGHT_PIN, PIN_OFF);
    digitalWrite(RELAY_FAN_PIN, PIN_OFF);

    auto& controller = context.configuration.controller;

    connect(controller);

    ticker.attach_ms(UPDATE_INTERVAL_MS, []() {
        dht.read();
    });

    dht.onData([](float humidity, float temperature) {
        context.state.humidity = humidity;
        context.state.temperature = temperature;

        context.events.push_back({
            EventType::UPDATE,
            {
                { "humidity", String(humidity) },
                { "temperature", String(temperature) }
            },
        });
    });

    dht.onError([](uint8_t e) {
        context.state.lastError = dht.getError();
        context.events.push_back({
            EventType::ERROR,
            {{ "error", context.state.lastError }}
        });
    });

    context.onSwitch = []() {
        digitalWrite(RELAY_LIGHT_PIN, context.configuration.light.isOn ? PIN_ON : PIN_OFF);
        digitalWrite(RELAY_FAN_PIN, context.configuration.fan.isOn ? PIN_ON : PIN_OFF);
    };

    context.onRun = []() {
        createSwitchEvent(context);

        scheduleTicker.attach_ms(SCHEDULE_CHECK_INTERVAL_MS, []() {
            const bool isChanged = updateState(context, SCHEDULE_CHECK_INTERVAL_MS);

            if (isChanged) {
                createSwitchEvent(context);
            }
        });

        dht.read();
    };

    context.events.push_back({ EventType::CONFIG });

    configServer.run();
}

void loop() {
    configServer.next();
    processNextEvent(context);
}
