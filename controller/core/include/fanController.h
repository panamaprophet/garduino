#include <Arduino.h>


namespace fanController {
    int optimalSpeed = 100;
    int speed = optimalSpeed;
    int previousSpeed = optimalSpeed;

    float optimalTemperature = 27;
    float previousTemperature = -1;

    int step = 25;
    int max = 250;
    int pin = -1;

    void setPin(int p) {
        pin = p;
    }

    int setSpeedByTemperature(float temperature) {
        const bool isHigherThanOptimal = temperature > optimalTemperature;
        const bool isRaising = previousTemperature < temperature;

        previousTemperature = temperature;

        if (isHigherThanOptimal && isRaising) {
            speed = std::min(speed + step, max);
        }

        if (!isHigherThanOptimal && speed != optimalSpeed) {
            speed = optimalSpeed;
        }

        analogWriteFreq(25000);
        analogWrite(pin, speed);

        return speed;
    }
}
