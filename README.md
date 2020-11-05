# Garduino

Your personal garden controller.

It can handle one or more greenhouse controllers providing a simple way to configure and watch over via telegram bot interface.
The project is still in development but most necessary functionality is already here so contact me in person if you'd like to participate in testing.

## Install

It needs some mongodb, node.js and one little telegram bot token to run things on the server side, but when you get it — you'll love it.

```bash
yarn
```

## Controller

The code in `controller` directory written for ESP8266 but it can be easily adopted for any other (such as ATMega328).
I'm not as proficient in programming of microcontrollers as you may expect but i'm trying my best :)

By default controller will run in `SETUP` mode while no wi-fi credentials and controller Id are provided. To configure these parameters simply connect to `CONFIGURATION_MODE` network and follow the 192.168.4.20 in your browser. Note that connection mode SSID and configuration server IP could be changed to different values through the `config.h`.
