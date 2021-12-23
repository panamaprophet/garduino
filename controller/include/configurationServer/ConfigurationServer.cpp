#include <Arduino.h>
#include <Esp.h>
#include <LittleFS.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <configurationServer/ConfigurationServer.h>
#include <configurationManager/ConfigurationManager.h>


ConfigurationServer::ConfigurationServer(ControllerConfigurationManager &controller, IPAddress dnsIp) {
    ip = dnsIp;

    LittleFS.begin();

    webServer.on("/api/configuration", HTTP_GET, [&]() {
        String ssid = controller.getSSID();
        String password = controller.getPassword();
        String controllerId = controller.getControllerId();

        webServer.send(200, "application/json", "{\"ssid\": \"" + ssid + "\", \"password\": \"" + password + "\", \"controllerId\": \"" + controllerId + "\"}");
    });

    webServer.on("/api/configuration", HTTP_POST, [&]() {
        String ssid = webServer.arg("ssid");
        String password = webServer.arg("password");
        String controllerId = webServer.arg("controllerId");

        const bool result = controller.set(ssid, password, controllerId);

        webServer.send(200, "application/json", "{success: " + String(result) + "}");
    });

    webServer.on("/api/reboot", HTTP_GET, [&]() {
        ESP.restart();

        webServer.send(200, "application/json", "{success: true}");
    });

    webServer.serveStatic("/", LittleFS, "/", "max-age=86400");
}

void ConfigurationServer::run() {
    dnsServer.start(54, "*", ip);
    webServer.begin();
}

void ConfigurationServer::next() {
    dnsServer.processNextRequest();
    webServer.handleClient();
}
