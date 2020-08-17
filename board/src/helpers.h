#include <Arduino.h>

enum Event {
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

struct Config {
    bool isLightOn;
    bool isFanOn;

    int temperatureThreshold;

    unsigned long msBeforeLightSwitch;
    unsigned long msBeforeFanSwitch;

    unsigned long lightCycleDurationMs;
    unsigned long fanCycleDurationMs;
};


String getErrorEventPayload(String error);

String getUpdateEventPayload(float temperature, float humidity);

String getSwitchEventPayload(bool isLightOn, bool isFanOn, bool isEmergencyOff);

String getRunEventPayload(bool isLightOn, bool isFanOn);