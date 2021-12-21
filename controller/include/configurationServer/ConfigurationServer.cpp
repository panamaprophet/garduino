#include <Arduino.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <configurationServer/ConfigurationServer.h>
#include <configurationManager/ConfigurationManager.h>


ConfigurationServer::ConfigurationServer(ControllerConfigurationManager &controller, IPAddress dnsIp) {
    ip = dnsIp;

    web.on("/", HTTP_GET, [&]() {
        String ssid = controller.getSSID();
        String password = controller.getPassword();
        String controllerId = controller.getControllerId();

        web.send(200, "text/html", handleRoot(ssid, password, controllerId));
    });

    web.on("/submit", HTTP_POST, [&]() {
        String ssid = web.arg("ssid");
        String password = web.arg("password");
        String controllerId = web.arg("controllerId");

        controller.set(ssid, password, controllerId);

        web.send(200, "text/html", handleSubmit());
    });
}

void ConfigurationServer::run() {
    dns.start(54, "*", ip);
    web.begin();
}

void ConfigurationServer::next() {
    dns.processNextRequest();
    web.handleClient();
}


String handleRoot(String ssid, String password, String controllerId) {
    String content = "";

    content += "<form method=\"POST\" action=\"submit\">";
    content += "<label>SSID:<br/><input type=\"text\" length=\"32\" name=\"ssid\" value=\"" + ssid + "\"/></label><br/>";
    content += "<label>Password:<br/><input type=\"text\" length=\"64\" name=\"password\" value=\"" + password + "\" /></label><br/>";
    content += "<label>Controller Id:<br/><input type=\"text\" length=\"32\" name=\"controllerId\" value=\"" + controllerId + "\" /></label><br/>";
    content += "<button type=\"submit\">Save</button>";
    content += "</form>";

    return createPage(content);
};

String handleSubmit() {
    String content = "";

    content += "<p>";
    content += "Settings updated.";
    content += "<br/>";
    content += "<a href=\"/\">Here you can review it again</a>";
    content += "</p>";

    return createPage(content);
}

String createPage(String content) {
    String page = "";

    page += "<!DOCTYPE html>";
    page += "<html>";
    page += "<head>";
    page += "<title>Controller Setup</title>";
    page += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />";
    page += "</head>";
    page += "<body>" + content + "</body>";
    page += "</html>";

    return page;
}
