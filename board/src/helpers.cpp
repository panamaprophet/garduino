#include <Arduino.h>

String getErrorEventPayload(String error) {
    return "{\"event\":\"ERROR\",\"payload\":[{\"error\": \"" + error + "\"}]}";
}

String getUpdateEventPayload(float temperature, float humidity) {
    return "{\"event\":\"UPDATE\",\"payload\":[{\"key\":\"humidity\",\"value\":\"" + 
    String(humidity) + "\"},{\"key\":\"temperature\",\"value\":\"" + String(temperature) + "\"}]}";
}

String getSwitchEventPayload(bool isLightOn, bool isFanOn) {
    return "{\"event\":\"SWITCH\",\"payload\":[{\"key\":\"isLightOn\",\"value\":\"" + 
    String(isLightOn) + "\"},{\"key\":\"isFanOn\",\"value\":\"" + String(isFanOn) + "\"}]}";
}

String getRunEventPayload(bool isLightOn, bool isFanOn) {
    return "{\"event\":\"RUN\",\"payload\":[{\"key\":\"isLightOn\",\"value\":\"" + 
    String(isLightOn) + "\"},{\"key\":\"isFanOn\",\"value\":\"" + String(isFanOn) + "\"}]}";
}