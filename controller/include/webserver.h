#pragma once

#include <Arduino.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>


namespace webserver
{
    typedef std::function<void(ESP8266WebServer *webServer)> RouteHandler;
    typedef std::tuple<String, RouteHandler, HTTPMethod> Route;

    DNSServer dnsServer;
    ESP8266WebServer webServer;

    void setup(std::vector<Route> &routes) {
        LittleFS.begin();

        for (auto && [route, handler, method] : routes) {
            webServer.on(route, method, [&]() {
                handler(&webServer);
            });
        }

        webServer.serveStatic("/", LittleFS, "/", "max-age=86400");
        dnsServer.start(54, "*", wifi::ACCESS_POINT_IP);
        webServer.begin();
    }

    void loop() {
        dnsServer.processNextRequest();
        webServer.handleClient();
    }
}

