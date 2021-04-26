#pragma once

#include <Arduino.h>
#include <EEPROM.h>


class ControllerConfigurationManager {
    private:
        String controllerId;
        String ssid;
        String password;

        const uint SSID_OFFSET = 0;
        const uint PASS_OFFSET = 32;
        const uint CID_OFFSET  = 96;
        const uint ROM_LENGTH  = 128;

        void reset();

        String readRange(uint startIndex, uint lastIndex);

        void writeRange(uint offset, String data);

        bool save();

        void load();
    public:
        ControllerConfigurationManager();

        bool isConfigured();

        bool set(String _ssid, String _password, String _controllerId);

        String getSSID();

        String getPassword();

        String getControllerId();
};
