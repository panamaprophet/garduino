#include <Arduino.h>
#include <WiFiEspClient.h>
#include <httpRequest.h>


String getRequestType(RequestType type) {
  const String requestTypes[] = { "GET", "POST", "PUT", "DELETE" };

  return requestTypes[type];
}


bool httpRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  uint16_t port, 
  RequestType type, 
  String payload
) {
  const bool isConnected = http.connectSSL(server, port) == 1;
  const String requestType = getRequestType(type);

  Serial.println(requestType + " " + String(server) + ": " + String(port) + " " + String(path) + " => " + isConnected);

  if (!isConnected) {
    return false;
  }

  http.println(requestType + " " + String(path) + " HTTP/1.1");
  http.println("Host: " + String(server));
  http.println("Accept: */*");
  http.println("User-Agent: Garduino/4.20");
  // http.println("Connection: close");

  if (payload.length() > 0) {
    http.println("Content-Length: " + String(payload.length()));
    http.println("Content-Type: application/json"); // application/x-www-form-urlencoded");
    http.println();
    http.println(payload);
  } else {
    http.println();
  }

  while (http.available()) {
    char c = http.read();
    Serial.write(c);
  }

  http.stop();

  return true;
}

bool httpSecureRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  RequestType type, 
  String payload
) {
  const uint16_t port = 443;

  return httpRequest(http, path, server, port, type, payload);
}
