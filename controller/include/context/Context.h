#pragma once

#include <map>
#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <configurationManager/ConfigurationManager.h>
#include <config.h>


enum EventType {
    NONE,
    CONFIG,
    UPDATE,
    ERROR,
    SWITCH,
    RUN,
};

enum RequestType {
    GET,
    POST,
};

enum ControllerMode {
    RUNNING,
    SETUP,
};

struct ModuleConfig {
    bool isOn;
    bool isEmergencyOff;
    long msBeforeSwitch;
    unsigned long duration;
};

struct Configuration {
    ControllerConfigurationManager controller;
    ControllerMode mode = ControllerMode::RUNNING;

    ModuleConfig light;
    ModuleConfig fan;

    float temperatureThreshold;
};

struct State {
    float temperature;
    float humidity;
    String lastError;
};

struct Event {
    EventType type;
    std::map<String, String> payload;
};

struct Context {
    private:
        WiFiClientSecure client;
        HTTPClient http;

    public:
        Configuration configuration;
        State state;
        std::vector<Event> events;

        std::function<void(void)> onSwitch;
        std::function<void(void)> onRun;

        String fetch(String endpoint, RequestType type = RequestType::GET, String payload = "") {
            String controllerId = configuration.controller.getControllerId();
            String requestUrl = REQUEST_DOMAIN + endpoint + controllerId;
            String response = "";

            client.setInsecure();

            http.begin(client, requestUrl);

            http.addHeader("Accept", "*/*");
            http.addHeader("Content-Type", "application/json");

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
        };
};
