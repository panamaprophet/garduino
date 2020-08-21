#include <Arduino.h>
#include <ConfigurationServer.h>

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