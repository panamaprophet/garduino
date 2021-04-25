#pragma once

#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <ConfigurationManager.h>
#include <helpers.h>
#include <config.h>


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

struct ControllerEventPayloadEntity {
    String key;
    String value;
};

struct ControllerEvent {
    Event type;
    std::vector<ControllerEventPayloadEntity> payload;
};

struct Context {
    Configuration configuration;
    State state;
    std::vector<ControllerEvent> events;

    std::function<void(void)> onUpdate;
    std::function<void(void)> onRun;

    WiFiClientSecure client;
    HTTPClient http;

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
