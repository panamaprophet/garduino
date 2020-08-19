#define DAY_MS 86400000
#define DEFAULT_DURATION_MS (DAY_MS / 2)
#define DEFAULT_TEMPERATURE_THRESHOLD 30


struct State {
    bool isLightOn = false;
    bool isFanOn = false;
    bool isEmergencySwitchOff = false;

    int temperatureThreshold = DEFAULT_TEMPERATURE_THRESHOLD;

    unsigned long msBeforeLightSwitch = DEFAULT_DURATION_MS;
    unsigned long msBeforeFanSwitch = DEFAULT_DURATION_MS;

    unsigned long lightCycleDurationMs = DEFAULT_DURATION_MS;
    unsigned long fanCycleDurationMs = DEFAULT_DURATION_MS;

    String lastError;

    float currentTemperature;
    float currentHumidity;
};


class StateManager {
    private:
        State state;

    public:
        bool updateLightCounter(unsigned long interval) {
            state.msBeforeLightSwitch -= interval;

            if (state.msBeforeLightSwitch <= 0) {
                state.isLightOn = !state.isLightOn;
                state.isEmergencySwitchOff = false;
                state.msBeforeLightSwitch = state.isLightOn ? state.lightCycleDurationMs : DAY_MS - state.lightCycleDurationMs;

                return true;
            }

            return false;
        }

        bool updateFanCounter(unsigned long interval) {
            state.msBeforeFanSwitch -= interval;

            if (state.msBeforeFanSwitch <= 0) {
                state.isFanOn = !state.isFanOn;
                state.msBeforeFanSwitch = state.isFanOn ? state.fanCycleDurationMs : DAY_MS - state.fanCycleDurationMs;

                return true;
            }

            return false;
        }

        bool isLightOn() {
            return state.isLightOn;
        }

        bool isFanOn() {
            return state.isFanOn;
        }

        bool isEmergencySwitchOff() {
            return state.isEmergencySwitchOff;
        }

        void setState(State newState) {
            state = newState;
        }

        bool setCurrentData(float humidity, float temperature) {
            state.currentHumidity = humidity;
            state.currentTemperature = temperature;

            if (state.currentTemperature >= state.temperatureThreshold) {
                state.isEmergencySwitchOff = true;
                state.isLightOn = false;

                return true;
            }

            if ((state.currentTemperature < state.temperatureThreshold) && state.isEmergencySwitchOff) {
                state.isLightOn = true;

                return true;
            }

            return false;
        }

        void setLastError(String lastError) {
            state.lastError = lastError;
        }

        String getLastError() {
            return state.lastError;
        }

        float getTemperature() {
            return state.currentTemperature;
        }

        float getHumidity() {
            return state.currentHumidity;
        }
};
