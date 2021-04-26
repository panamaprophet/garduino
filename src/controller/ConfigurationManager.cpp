#include <Arduino.h>
#include <EEPROM.h>
#include <ConfigurationManager.h>


bool isEmpty(String str) {
    return str.length() == 0;
}


ControllerConfigurationManager::ControllerConfigurationManager() {
    EEPROM.begin(ROM_LENGTH);
    load();
}


/**
 * read ROM memory range from startIndex inclusive to lastIndex exclusive
 * @returns {String} data from memory range
 */
String ControllerConfigurationManager::readRange(uint startIndex, uint lastIndex) {
    uint8_t ch;
    String result = "";

    for (uint i = startIndex; i < lastIndex; i++) {
        ch = EEPROM.read(i);

        if (ch == 0) {
            break;
        }

        result += (char)ch;
    }

    return result;
}

/**
 * writes data from specified offset to ROM memory
 * NOTE! commit() should be called after write manually
 */
void ControllerConfigurationManager::writeRange(uint offset, String data) {
    for (uint i = 0; i < data.length(); i++) {
        EEPROM.write(i + offset, data[i]);
    }
}


bool ControllerConfigurationManager::save() {
    reset();

    writeRange(SSID_OFFSET, ssid);
    writeRange(PASS_OFFSET, password);
    writeRange(CID_OFFSET, controllerId);

    return EEPROM.commit();
}

void ControllerConfigurationManager::load() {
    ssid = readRange(SSID_OFFSET, PASS_OFFSET);
    password = readRange(PASS_OFFSET, CID_OFFSET);
    controllerId = readRange(CID_OFFSET, ROM_LENGTH);
}

void ControllerConfigurationManager::reset() {
    for (uint i = 0; i < ROM_LENGTH; i++) {
        EEPROM.write(i, 0);
    }
}


String ControllerConfigurationManager::getControllerId() {
    return controllerId;
}

String ControllerConfigurationManager::getSSID() {
    return ssid;
}

String ControllerConfigurationManager::getPassword() {
    return password;
}


bool ControllerConfigurationManager::set(String _ssid, String _password, String _controllerId) {
    bool isUpdated = false;

    if (!isEmpty(_ssid)) {
        ssid = _ssid;
        isUpdated = true;
    }

    if (!isEmpty(_password)) {
        password = _password;
        isUpdated = true;
    }

    if (!isEmpty(_controllerId)) {
        controllerId = _controllerId;
        isUpdated = true;
    }

    if (isUpdated) {
        return save();
    }

    return false;
}

bool ControllerConfigurationManager::isConfigured() {
    return !isEmpty(ssid) && !isEmpty(password) && !isEmpty(controllerId);
}
