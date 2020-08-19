#include <Arduino.h>


enum Event {
    NONE,
    CONFIG,
    UPDATE,
    ERROR,
    SWITCH,
    EMERGENCY_SWITCH,
    RUN,
};

enum RequestType {
    GET,
    POST,
};



String getErrorEventPayload(String error);

String getUpdateEventPayload(float temperature, float humidity);

String getSwitchEventPayload(bool isLightOn, bool isFanOn, bool isEmergencyOff);

String getRunEventPayload(bool isLightOn, bool isFanOn);