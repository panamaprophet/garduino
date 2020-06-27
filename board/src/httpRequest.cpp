#include <httpRequest.h>
#include <WiFiEspClient.h>

String getRequestType(RequestType type) {
  const String requestTypes[] = { "GET", "POST", "PUT", "DELETE" };

  return requestTypes[type];
}


String httpRequest(
  WiFiEspClient &http,
  char path[], 
  char server[], 
  uint16_t port, 
  RequestType type, 
  String payload
) {
  const bool isConnected = http.connectSSL(server, port) == 1;
  const String requestType = getRequestType(type);
  String response = "";

  Serial.println(requestType + " " + String(server) + ": " + String(port) + " " + String(path) + " => " + isConnected);

  if (!isConnected) {
    return response;
  }

  http.println(requestType + " " + String(path) + " HTTP/1.1");
  http.println("Host: " + String(server));
  http.println("Accept: */*");
  http.println("User-Agent: Garduino/4.20");
  http.println("Connection: keep-alive");

  if (payload.length() > 0) {
    http.println("Content-Length: " + String(payload.length()));
    http.println("Content-Type: application/json"); // application/x-www-form-urlencoded");
    http.println();
    http.println(payload);
  } else {
    http.println();
  }

  // headers end with double line endings 
  // so we can skip it from response like this:
  http.find("\r\n\r\n");

  while (http.available()) {
    response += http.readString();
  }

  http.stop();

  return response;
}