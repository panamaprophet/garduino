#include <Arduino.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <configurationManager/ConfigurationManager.h>


String handleRoot(String ssid, String password, String controllerId);

String handleSubmit();

String createPage(String content);


class ConfigurationServer {
    private:
        DNSServer dns;
        ESP8266WebServer web;
        IPAddress ip;
    public:
        ConfigurationServer(ControllerConfigurationManager &controller, IPAddress ip);
        void run();
        void next();
};
