#pragma once

#include <Arduino.h>
#include <ESP8266WiFi.h>

#include <include/configuration.h>


namespace wifi
{
    const IPAddress ACCESS_POINT_IP     = IPAddress(192, 168, 4, 20);
    const IPAddress ACCESS_POINT_SUBNET = IPAddress(255, 255, 255, 0);
    const String ACCESS_POINT_SSID      = "configuration-server";
    const String ACCESS_POINT_PASSWORD  = emptyString;
    const int CONNECTION_TIMEOUT        = 30 * 1000;

    void connect(String ssid, String password, String hostname) {
        WiFi.mode(WIFI_AP_STA);

        WiFi.softAPConfig(
            ACCESS_POINT_IP,
            ACCESS_POINT_IP,
            ACCESS_POINT_SUBNET
        );

        WiFi.softAP(
            ACCESS_POINT_SSID,
            ACCESS_POINT_PASSWORD,
            1
        );

        if (!configuration::isConfigured()) {
            Serial.println("Initial setup is needed.");
            return;
        }

        WiFi.hostname(hostname);
        WiFi.begin(ssid, password);

        int timestamp = millis();

        while (
            WiFi.status() != WL_CONNECTED &&
            millis() - timestamp < CONNECTION_TIMEOUT
        ) {
            Serial.print(".");
            delay(1000);
        }

        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("\nConnection error" + String(WiFi.status()));
        }

        Serial.println("\nConnected to " + WiFi.SSID());
    }
}
