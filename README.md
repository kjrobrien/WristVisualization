# Scream MQP Visualization
This repository contains the code for visualizing and controlling the WPI 2019 SCREAM MQP. The visualization supports two modes: slider-based control and sensor-based control.
## Slider-based Control
This simply allows for the visualization of the three degrees of freedom (advancement, rotation, displacement) through sliders in the web browser.
## Sensor-based Control
This mode changes the visualization based upon sensor feedback from two absolute encoders and a servo.
This requires the device to be connected to the sensor server's (ESP32) WiFi hotspot. Sensor data is streamed to the device using WebSockets.
The device may control the displacement/bending of the notched manipulator by dragging the displacement slider.
This sends the requested position to the ESP32 over WebSockets, adjusting the Servo for displacment as needed.

## Requirements & Dependencies
### Visualization
* Web browser
* [p5.js](https://p5js.org/) - Library for drawing the notched manipulator.
* [quicksettings](https://github.com/bit101/quicksettings) - Library for control panel (i.e. sliders).
* [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket) - Library for re-establishing WebSocket connections.
* For sensor-based control of the visualization, the device must be connected to the same local network as the sensor server (i.e. ESP32).
### Sensor server
* ESP-32 (default SSID: `SCREAM`, default password: `ohsoscary`, default IP: `192.168.4.1`)
* Absolute analog encoder for advancement (default pin: `32`)
* Absolute analog encoder for advancement (default pin: `36`)
* 180&deg; servo for displacement (default pin: `25`)
* [ESP32-Arduino-Servo-Library](https://github.com/RoboticsBrno/ESP32-Arduino-Servo-Library)
* [ESPAsyncWebServer](https://github.com/me-no-dev/ESPAsyncWebServer)
* [AsyncTCP](https://github.com/me-no-dev/AsyncTCP)
* [arduinoWebSockets](https://github.com/Links2004/arduinoWebSockets)
* [arduino-esp32fs-plugin](https://github.com/me-no-dev/arduino-esp32fs-plugin) - Arduino plugin for uploading files to ESP32 file system. Used to upload HTML/JS/CSS to ESP32 for hosting.

## Directory & File Descriptions
`index.html` - The main page that hosts the visualization.

`sketch.js` - The logic for drawing the notched manipulator.

`wrist.js` - The kinematics for a notched-wrist manipulator.

`style.css` - CSS styling.

`SingleNotch.obj` - Object file for a single notch (i.e. one cut, one uncut portion of a notch).

`libs/*` - The Visualization dependencies mentioned above.

`StreamSensors/StreamSensors.ino` - The Arduino sketch for the ESP32. Contains the logic for WebSocket streaming of sensor information, sensor wrap-under and wrap-around, and servo control of displacement.

## Running/building locally
In order to build the visualization locally (either in slider-based control or sensor-based control modes), you must run a local webserver.
This is due to how p5.js handles loading external files, specifically `SingleNotch.obj`, documentation can be found here https://github.com/processing/p5.js/wiki/Local-server.
The simplest way to run a webserver locally is `python -m http.server`.
### Deploying changes
One you have finalized your changes, they can be deployed to the ESP32 so that anyone that accesses the ESP32's network can view them.

This is done by uploading the relevant HTML, CSS, JS files to the ESP32, where they are loaded using SPIFFS.
The new files can be uploaded using the `arduino-esp32fs-plugin` as documented here https://github.com/me-no-dev/arduino-esp32fs-plugin#usage.
