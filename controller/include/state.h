#pragma once

#include <Arduino.h>


namespace state
{
    const unsigned long DAY_MS                      = 24 * 60 * 60 * 1000;

    struct Module {
        bool isOn = false;
        long duration = -1;
        long msBeforeSwitch = -1;
    };

    Ticker sensorTimer;
    Ticker scheduleTimer;
    DHT11 sensor;

    Module light;
    Module fan;
    String lastError;

    float humidity;
    float temperature;
    float temperatureThreshold;

    unsigned long lastUpdateTimestamp = 0;

    bool isEmergencyOff = false;

    bool update(Module &module, unsigned long interval) {
        const auto isOn = module.isOn;

        const auto day = isOn ? module.duration : (DAY_MS - module.duration);
        const auto night = DAY_MS - day;

        const auto msBeforeSwitch = module.msBeforeSwitch - interval;
        const auto isChanged = msBeforeSwitch < 0;

        module.msBeforeSwitch = isChanged
            ? module.duration
            : msBeforeSwitch;

        module.duration = isChanged
            ? (isOn ? night : day)
            : module.duration;

        module.isOn = isChanged
            ? !isOn
            : isOn;

        return isChanged;
    };

    String getStatusString() {
        return
            "{\"temperature\": \"" + String(temperature) +
            "\", \"humidity\": \"" + String(humidity) +
            "\", \"lastError\": \"" + lastError +
            "\", \"light\": {\"isOn\": \"" + String(light.isOn) +
            "\", \"msBeforeSwitch\": \"" + String(light.msBeforeSwitch) +
            "\", \"duration\": \"" + String(light.duration) +
            "\"}}";
    }
}