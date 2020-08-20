#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <WiFiClient.h>
#include <EEPROM.h>
#include <ESP8266WebServer.h>

#include <setupMode.h>


bool isEmpty(String str) {
    return str.length() == 0;
}

void resetRange(unsigned int startIndex, unsigned int length) {
    for (unsigned int i = startIndex; i < length; i++) {
        EEPROM.write(i, 0);
    }
}

String readRange(unsigned int startIndex, unsigned int length) {
    String result = "";

    for (unsigned int i = startIndex; i < length; i++) {
        result += char(EEPROM.read(i));
    }

    return result;
}

bool writeRange(unsigned int startIndex, unsigned int length, String data) {
    if (data.length() + startIndex > length) {
        return false;
    }

    for (unsigned int  i = 0; i < data.length(); i++) {
        EEPROM.write(startIndex + i, data[i]);
    }

    return true;
}


String getSSID() {
    return readRange(0, 32);
}

bool setSSID(String data) {
    return writeRange(0, 32, data);
}


String getPassword() {
    return readRange(32, 96);
}

bool setPassword(String data) {
    return writeRange(32, 96, data);
}


String getControllerId() {
    return readRange(96, 128);
}

bool setControllerId(String data) {
    return writeRange(96, 128, data);
}



void setupWebserver(ESP8266WebServer &webServer) {
    webServer.on("/", [&webServer]() {
        String ssid = getSSID();
        String password = getPassword();
        String controllerId = getControllerId();

        String content = "";

        content += "<form method=\"GET\" action=\"submit\">";
        content += "<label>SSID:<br/><input type=\"text\" length=\"32\" name=\"ssid\" value=\"" + ssid + "\"/></label>";
        content += "<label>Password:<br/><input type=\"text\" length=\"64\" name=\"password\" value=\"" + password + "\" /></label>";
        content += "<label>Controller Id:<br/><input type=\"text\" length=\"32\" name=\"controllerId\" value=\"" + controllerId + "\" /></label>";
        content += "</form>";

        webServer.send(200, "text/html", createPage(content));
    });

    webServer.on("/submit", [&webServer]() {
        String ssid = webServer.arg("ssid");
        String password = webServer.arg("password");
        String controllerId = webServer.arg("controllerId");

        if (!isEmpty(ssid) && !isEmpty(password) && !isEmpty(controllerId)) {
            resetRange(0, 128);
        }

        if (setSSID(ssid) && setPassword(password) && setControllerId(controllerId)) {
            EEPROM.commit();
        }

        String content = "";

        content += "<p>";
        content += "Settings updated.";
        content += "<br/>";
        content += "<a href=\"/\">Here you can review it again</a>";
        content += "</p>";

        webServer.send(200, "text/html", createPage(content));
    });
};


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


String urlDecode(String input) {
  String s = input;

  s.replace("%20", " ");
  s.replace("+", " ");
  s.replace("%21", "!");
  s.replace("%22", "\"");
  s.replace("%23", "#");
  s.replace("%24", "$");
  s.replace("%25", "%");
  s.replace("%26", "&");
  s.replace("%27", "\'");
  s.replace("%28", "(");
  s.replace("%29", ")");
  s.replace("%30", "*");
  s.replace("%31", "+");
  s.replace("%2C", ",");
  s.replace("%2E", ".");
  s.replace("%2F", "/");
  s.replace("%2C", ",");
  s.replace("%3A", ":");
  s.replace("%3A", ";");
  s.replace("%3C", "<");
  s.replace("%3D", "=");
  s.replace("%3E", ">");
  s.replace("%3F", "?");
  s.replace("%40", "@");
  s.replace("%5B", "[");
  s.replace("%5C", "\\");
  s.replace("%5D", "]");
  s.replace("%5E", "^");
  s.replace("%5F", "-");
  s.replace("%60", "`");

  return s;
}