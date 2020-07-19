#include <Arduino.h>

String getErrorEventPayload(String error) {
    return "{\"type\":\"ERROR\",\"event\":\"ERROR\",\"payload\":[{\"error\": \"" + error + "\"}]}";
}

String getUpdateEventPayload(float temperature, float humidity) {
    return "{\"type\":\"INFO\",\"event\":\"UPDATE\",\"payload\":[{\"key\":\"humidity\",\"value\":\"" + 
    String(humidity) + "\"},{\"key\":\"temperature\",\"value\":\"" + String(temperature) + "\"}]}";
}