#include <WiFiEspClient.h>

#define MAX_RETRIES 3

enum RequestType {
    GET,
    POST,
    PUT,
    DELETE,
};

struct Request {
    char* domain;
    char* path;
    uint16_t port = 80;
    RequestType type = GET;
};

String getRequestType(
    RequestType type
);

Request createRequest(
    char* domain, 
    char* path, 
    uint16_t port = 80, 
    RequestType type = GET
);

String httpRequest(
    WiFiEspClient &http,
    Request request,
    String payload = ""
);

String httpRequest(
    WiFiEspClient &http,
    char path[],
    char server[],
    uint16_t port = 80,
    RequestType type = GET,
    String payload = ""
);