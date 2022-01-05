#pragma once

#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Arduino.h>

#include <include/configuration.h>


namespace request
{
    enum Type { GET, POST };

    WiFiClientSecure client;
    HTTPClient http;

    String send(String endpoint, Type type = Type::GET, String payload = "") {
        String controllerId = configuration::controllerId;
        String requestUrl = endpoint + "/" + controllerId;
        String response = "";

        client.setInsecure();

        http.begin(client, requestUrl);

        http.addHeader("Accept", "*/*");
        http.addHeader("Content-Type", "application/json");

        if (type == Type::GET) {
            http.GET();
        }

        if (type == Type::POST) {
            http.POST(payload);
        }

        // @todo: check http code returned by http.GET() and http.POST()
        response = http.getString();

        http.end();

        return response;
    };

    String sendGet(String endpoint, String payload = "") {
        return send(endpoint, Type::GET, payload);
    };

    String sendPost(String endpoint, String payload = "") {
        return send(endpoint, Type::POST, payload);
    }
}
