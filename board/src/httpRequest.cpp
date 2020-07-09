#include <httpRequest.h>
#include <WiFiEspClient.h>

String getRequestType(RequestType type) {
  const String requestTypes[] = { "GET", "POST", "PUT", "DELETE" };

  return requestTypes[type];
}

Request createRequest(char* domain, char* path, uint16_t port, RequestType type) {
    Request request;

    strcpy(request.domain, domain);
    strcpy(request.path, path);

    request.port = port;
    request.type = type;

    return request;
}

String httpRequest(WiFiEspClient &http, Request request, String payload) {
    return httpRequest(http, request.path, request.domain, request.port, request.type, payload);
}

String httpRequest(WiFiEspClient &http, char path[], char server[], uint16_t port, RequestType type, String payload) {
    const String requestType = getRequestType(type);

    String response = "";
    bool isConnected = false;
    int retries = 0;

    while (!isConnected && retries < MAX_RETRIES) {
        retries++;
        isConnected = http.connectSSL(server, port) == 1;
    }

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
        http.println("Content-Type: application/json");
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