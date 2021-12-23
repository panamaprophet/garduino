#include <Arduino.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <configurationManager/ConfigurationManager.h>


class ConfigurationServer {
    private:
        DNSServer dnsServer;
        ESP8266WebServer webServer;
        IPAddress ip;
    public:
        ConfigurationServer(ControllerConfigurationManager &controller, IPAddress ip);
        void run();
        void next();
};
