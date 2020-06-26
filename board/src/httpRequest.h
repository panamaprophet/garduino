#include <WiFiEspClient.h>

enum RequestType {
  GET,
  POST,
  PUT,
  DELETE,
};

String httpRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  uint16_t port = 80, 
  RequestType type = GET, 
  String payload = ""
);