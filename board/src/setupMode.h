#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>


void resetRange(unsigned int startIndex, unsigned int length);
String readRange(unsigned int startIndex, unsigned int length);
bool writeRange(unsigned int startIndex, unsigned int length, String data);

String getSSID();
String getPassword();
String getControllerId();

String createPage(String content);
String urlDecode(String input);

bool setSSID(String data);
bool setPassword(String data);
bool setControllerId(String data);

bool isEmpty(String str);

void setupWebserver(ESP8266WebServer &webServer);