#include <Arduino.h>
#include <WiFiEspClient.h>

enum RequestType {
  GET,
  POST,
  PUT,
  DELETE,
};

bool httpRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  uint16_t port = 80, 
  RequestType type = GET, 
  String payload = ""
);

bool httpSecureRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  RequestType type = GET, 
  String payload = ""
);