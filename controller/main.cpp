#include <map>
#include <vector>
#include <tuple>

#include <Arduino.h>
#include <ArduinoJson.h>

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>

#include <WebSocketsClient.h>
#include <WiFiClientSecure.h>
#include <DNSServer.h>

#include <Ticker.h>
#include <DHT.h>
#include <Esp.h>
#include <LittleFS.h>
#include <EEPROM.h>


const unsigned long DAY_MS                      = 24 * 60 * 60 * 1000;
const unsigned long UPDATE_INTERVAL             = 10 * 60 * 1000;
const unsigned long SENSOR_DATA_READ_INTERVAL   = 10 * 1000;
const unsigned long SCHEDULE_CHECK_INTERVAL     = 1000;

const int PIN_LIGHT                             = 14;
const int PIN_FAN                               = 12;
const int PIN_SENSOR                            = 13;
const int PIN_OFF                               = HIGH;
const int PIN_ON                                = LOW;

const String REQUEST_DOMAIN                     = "localhost";
const String REQUEST_DOMAIN_PROTOCOL            = "https://";
const String REQUEST_API_URL                    = REQUEST_DOMAIN_PROTOCOL + REQUEST_DOMAIN + "/api";
const String REQUEST_API_LOG                    = REQUEST_API_URL + "/log";
const String REQUEST_API_CONFIG                 = REQUEST_API_URL + "/config";


namespace configuration
{
    const unsigned int SSID_OFFSET      = 0;
    const unsigned int PASSWORD_OFFSET  = 32;
    const unsigned int CID_OFFSET       = 96;
    const unsigned int ROM_LENGTH       = 128;

    String ssid {};
    String password {};
    String controllerId {};

    auto isConfigured = []() {
        return !(ssid.isEmpty() || password.isEmpty() || controllerId.isEmpty());
    };

    auto readRange = [](unsigned int startIndex, unsigned int lastIndex) {
        String result = "";

        for (unsigned int i = startIndex; i < lastIndex; i++) {
            uint8_t ch = EEPROM.read(i);

            if (ch == 0) {
                break;
            }

            result += (char)ch;
        }

        return result;
    };

    auto writeRange = [](unsigned int offset, String data) {
        for (unsigned int i = 0; i < data.length(); i++) {
            EEPROM.write(i + offset, data[i]);
        }
    };

    auto reset = []() {
        for (unsigned int i = 0; i < ROM_LENGTH; i++) {
            EEPROM.write(i, 0);
        }
    };

    auto save = [](String _ssid, String _password, String _controllerId) {
        if (!(_ssid.isEmpty() || _password.isEmpty() || _controllerId.isEmpty())) {
            return false;
        }

        reset();

        writeRange(SSID_OFFSET, ssid);
        writeRange(PASSWORD_OFFSET, password);
        writeRange(CID_OFFSET, controllerId);

        return true;
    };

    auto load = []() {
        ssid = readRange(SSID_OFFSET, PASSWORD_OFFSET);
        password = readRange(PASSWORD_OFFSET, CID_OFFSET);
        controllerId = readRange(CID_OFFSET, ROM_LENGTH);
    };

    auto init = []() {
        EEPROM.begin(ROM_LENGTH);
        load();
    };
}

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

namespace events
{
    enum EventType {
        NONE,
        CONFIG,
        UPDATE,
        ERROR,
        SWITCH,
        RUN,
    };

    typedef std::map<String, String> EventPayload;
    typedef std::function<void(EventPayload)> EventHandler;

    std::vector<std::pair<EventType, EventPayload>> events;
    std::vector<std::pair<EventType, EventHandler>> eventListeners;

    String stringifyPayload(EventPayload payload, String eventId) {
        String payloadString = "[";

        for (auto i = payload.begin(); i != payload.end(); ++i) {
            payloadString += "{\"key\":\"" + i -> first + "\", \"value\": \"" + i -> second + "\"}";

            if (std::next(i) != payload.end()) {
                payloadString += ",";
            }
        }

        payloadString += "]";

        return "{\"event\":\"" + eventId + "\",\"payload\":" + payloadString + "}";
    };

    void emit(EventType event, EventPayload payload = {}) {
        events.push_back({ event, payload });
    };

    void listen(EventType event, const EventHandler & callback) {
        eventListeners.push_back({ event, callback });
    };

    void next() {
        if (events.size() == 0) {
            return;
        }

        const auto & event = events[0];
        const auto & eventType = event.first;
        const auto & eventPayload = event.second;

        auto eventListenerIterator = std::find_if(
            eventListeners.begin(),
            eventListeners.end(),
            [ & eventType ](const std::pair<EventType, EventHandler> item) {
                return item.first == eventType;
            }
        );

        if (eventListenerIterator != eventListeners.end()) {
            eventListenerIterator -> second(eventPayload);
        }

        events.erase(std::begin(events));
    }
}

namespace state
{
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

namespace websocket
{
    const unsigned int WS_HEARTBEAT_INTERVAL       = 30 * 1000;
    const unsigned int WS_HEARTBEAT_TIMEOUT        = 3 * 1000;
    const unsigned int WS_HEARTBEAT_MAX_RETRIES    = 3;
    const unsigned int WS_PORT                     = 80;
    const unsigned int WS_RECONNECT_INTERVAL       = 5000;
    const String WS_HOSTNAME                       = REQUEST_DOMAIN;

    typedef std::function<void(WStype_t type, uint8_t * payload, size_t length)> WebSocketOnEventCallback;

    WebSocketsClient ws;

    void connect(WebSocketOnEventCallback onWebSocketEvent) {
        ws.onEvent(onWebSocketEvent);
        ws.setReconnectInterval(WS_RECONNECT_INTERVAL);
        ws.enableHeartbeat(WS_HEARTBEAT_INTERVAL, WS_HEARTBEAT_TIMEOUT, WS_HEARTBEAT_MAX_RETRIES);
        ws.begin(WS_HOSTNAME, WS_PORT, "/");
    }

    const auto loop = []() {
        ws.loop();
    };
}

namespace webserver
{
    const String API_STATUS         = "/api/status";
    const String API_CONFIGURATION  = "/api/configuration";
    const String API_REBOOT         = "/api/reboot";

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


using events::EventPayload;
using events::EventType;
using events::stringifyPayload;
using events::emit;

using state::sensor;
using state::light;
using state::fan;
using state::temperature;
using state::humidity;
using state::lastError;
using state::isEmergencyOff;
using state::lastUpdateTimestamp;
using state::temperatureThreshold;
using state::scheduleTimer;
using state::sensorTimer;


auto onUpdate = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/update");

    Serial.println("[events] onUpdate - " + payloadString);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onSwitch = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/switch");

    Serial.println("[events] onSwitch - " + payloadString);

    digitalWrite(PIN_FAN, bool(payload["isFanOn"]) ? PIN_ON : PIN_OFF);
    digitalWrite(PIN_LIGHT, bool(payload["isLightOn"]) && !bool(payload["isEmergencyOff"]) ? PIN_ON : PIN_OFF);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onRun = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/run");

    Serial.println("[events] onRun - " + payloadString);

    scheduleTimer.attach_ms(SCHEDULE_CHECK_INTERVAL, []() {
        const bool isLightChanged = state::update(light, SCHEDULE_CHECK_INTERVAL);
        const bool isFanChanged = state::update(fan, SCHEDULE_CHECK_INTERVAL);

        if (isLightChanged || isFanChanged) {
            emit(EventType::SWITCH, {
                {"isLightOn", String(light.isOn)},
                {"isFanOn", String(fan.isOn)},
                {"isEmergencyOff", String(isEmergencyOff)}
            });
        }
    });

    sensorTimer.attach_ms(SENSOR_DATA_READ_INTERVAL, [](){
        sensor.read();
    });

    const String response = request::sendPost(REQUEST_API_LOG, payloadString);

    sensor.read();

    return response;
};

auto onError = [](EventPayload payload) {
    const String payloadString = stringifyPayload(payload, "events/update");

    Serial.println("[events] onError - " + payloadString);

    return request::sendPost(REQUEST_API_LOG, payloadString);
};

auto onConfig = [](EventPayload payload) {
    Serial.println("[events] onConfig called");

    const String response = request::sendGet(REQUEST_API_CONFIG);

    Serial.println(response);

    DynamicJsonDocument json(JSON_OBJECT_SIZE(20));
    DeserializationError error = deserializeJson(json, response);

    if (error) {
        lastError = error.c_str();
        emit(EventType::ERROR, {{"error", lastError}});
    }

    if (!error) {
        light.isOn = json["isLightOn"];
        light.duration = json["lightCycleDurationMs"].as<long>();
        light.msBeforeSwitch = json["msBeforeLightSwitch"].as<long>();

        fan.isOn = json["isFanOn"];
        fan.duration = json["fanCycleDurationMs"].as<long>();
        fan.msBeforeSwitch = json["msBeforeFanSwitch"].as<long>();

        temperatureThreshold = json["temperatureThreshold"].as<float>();

        emit(EventType::RUN, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)}
        });
    }

    return response;
};


const auto onReboot = [](ESP8266WebServer *webServer) {
    webServer -> send(200, "application/json", "{success: true}");
    ESP.restart();
};

const auto onConfigurationPost = [](ESP8266WebServer *webServer) {
    String ssid = webServer -> arg("ssid");
    String password = webServer -> arg("password");
    String controllerId = webServer -> arg("controllerId");

    const bool result = configuration::save(ssid, password, controllerId);

    webServer -> send(
        200,
        "application/json",
        "{success: " + String(result) + "}"
    );
};

const auto onConfigurationGet = [](ESP8266WebServer *webServer) {
    webServer -> send(
        200,
        "application/json",
        "{\"ssid\": \"" + configuration::ssid +
        "\", \"password\": \"" + configuration::password +
        "\", \"controllerId\": \"" + configuration::controllerId +
        "\"}"
    );
};

const auto onStatus = [](ESP8266WebServer *webServer) {
    webServer -> send(
        200,
        "application/json",
        state::getStatusString()
    );
};

std::vector<webserver::Route> routes = {
    {"/api/reboot", onReboot, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationGet, HTTPMethod::HTTP_GET},
    {"/api/configuration", onConfigurationPost, HTTPMethod::HTTP_POST},
    {"/api/status", onStatus, HTTPMethod::HTTP_GET}
};


void handleTemperatureThreshold() {
    if ((temperature >= temperatureThreshold)) {
        isEmergencyOff = true;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }

    if ((temperature < temperatureThreshold) && isEmergencyOff) {
        isEmergencyOff = false;

        emit(EventType::SWITCH, {
            {"isLightOn", String(light.isOn)},
            {"isFanOn", String(fan.isOn)},
            {"isEmergencySwitch", String(isEmergencyOff)}
        });
    }
};

auto onSensorData = [](float h, float t) {
    humidity = h;
    temperature = t;

    if (lastUpdateTimestamp == 0 || millis() - lastUpdateTimestamp > UPDATE_INTERVAL) {
        lastUpdateTimestamp = millis();

        emit(EventType::UPDATE, {
            {"humidity", String(humidity)},
            {"temperature", String(temperature)}
        });
    }

    handleTemperatureThreshold();
};

auto onSensorError = [](uint8_t e) {
    emit(EventType::ERROR, {{"error", sensor.getError()}});
};


auto onWebSocketEvent = [](WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED: {
            Serial.printf("[ws] disconnected\n");
            break;
        }
        case WStype_CONNECTED: {
            Serial.printf("[ws] connected\n");
            String response = "{\"success\": true, \"payload\": {\"controllerId\":\"" + configuration::controllerId + "\"}}";
            websocket::ws.sendTXT(response);
            break;
        }
        case WStype_TEXT: {
            Serial.printf("[ws] message received: %s\n", payload);

            DynamicJsonDocument json(JSON_OBJECT_SIZE(20));
            DeserializationError error = deserializeJson(json, payload);

            if (error) {
                lastError = error.c_str();
                emit(EventType::ERROR, {{"error", lastError}});
            }

            const String action = json["action"].as<String>();

            if (action == "actions/status") {
                String status = state::getStatusString();
                websocket::ws.sendTXT(status);
            } else {
                websocket::ws.sendTXT("{\"success\": false}");
            }
            break;
        }
        default: {
            break;
        }
    }
};


void setup() {
    Serial.begin(115200);

    sensor.setup(PIN_SENSOR);

    pinMode(PIN_LIGHT, OUTPUT);
    pinMode(PIN_FAN, OUTPUT);

    digitalWrite(PIN_LIGHT, PIN_OFF);
    digitalWrite(PIN_FAN, PIN_OFF);

    sensor.onData(onSensorData);
    sensor.onError(onSensorError);

    configuration::init();

    wifi::connect(configuration::ssid, configuration::password, configuration::controllerId);
    websocket::connect(onWebSocketEvent);
    webserver::setup(routes);

    listen(EventType::UPDATE, onUpdate);
    listen(EventType::RUN, onRun);
    listen(EventType::SWITCH, onSwitch);
    listen(EventType::CONFIG, onConfig);
    listen(EventType::ERROR, onError);

    emit(EventType::CONFIG);
}

void loop() {
    webserver::loop();
    websocket::loop();
    events::next();
}
