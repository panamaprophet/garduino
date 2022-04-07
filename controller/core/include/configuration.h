#pragma once

#include <EEPROM.h>
#include <Arduino.h>


namespace configuration
{
    const unsigned int SSID_OFFSET      = 0;
    const unsigned int PASSWORD_OFFSET  = 32;
    const unsigned int CID_OFFSET       = 96;
    const unsigned int URL_OFFSET       = 128;
    const unsigned int ROM_LENGTH       = 256;

    String ssid {};
    String password {};
    String controllerId {};
    String serverUrl {};

    auto isConfigured = []() {
        return !(
            ssid.isEmpty() ||
            password.isEmpty() ||
            controllerId.isEmpty() ||
            serverUrl.isEmpty()
        );
    };

    

    auto readRange = [](unsigned int startIndex, unsigned int lastIndex) {
        String result = "";

        for (unsigned int i = startIndex; i < lastIndex; i++) {
            uint8_t ch = EEPROM.read(i);

            if (ch == 0) {
                break;
            }

            result += (char)ch;
        }

        return result;
    };

    auto writeRange = [](unsigned int offset, String data) {
        for (unsigned int i = 0; i < data.length(); i++) {
            EEPROM.write(i + offset, data[i]);
        }
    };

    auto reset = []() {
        for (unsigned int i = 0; i < ROM_LENGTH; i++) {
            EEPROM.write(i, 0);
        }
    };

    auto save = [](String _ssid, String _password, String _controllerId, String _serverUrl) {
        if (_ssid.isEmpty() || _password.isEmpty() || _controllerId.isEmpty()) {
            return false;
        }

        reset();

        writeRange(SSID_OFFSET, _ssid);
        writeRange(PASSWORD_OFFSET, _password);
        writeRange(CID_OFFSET, _controllerId);
        writeRange(URL_OFFSET, _serverUrl);

        return EEPROM.commit();
    };

    auto load = []() {
        ssid = readRange(SSID_OFFSET, PASSWORD_OFFSET);
        password = readRange(PASSWORD_OFFSET, CID_OFFSET);
        controllerId = readRange(CID_OFFSET, URL_OFFSET);
        serverUrl = readRange(URL_OFFSET, ROM_LENGTH);
    };

    auto init = []() {
        EEPROM.begin(ROM_LENGTH);
        load();
    };
}
