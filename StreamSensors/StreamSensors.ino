#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>


#ifndef APSSID
#define APSSID "SCREAM"
#define APPSK  "ohsoscary"
#endif

#define PORT A0

struct wrap_sensor {
  int value;
  int offset;
  byte id;
  String name;
};

const char *ssid = APSSID;
const char *password = APPSK;

ESP8266WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

wrap_sensor advancement = {0, 0, 1, "advancement"};

wrap_sensor rotation = {0, 0, 2, "rotation"};

void initializeSensors() {
  switchSensor(&advancement);
  advancement.value = analogRead(PORT);
  switchSensor(&rotation);
  rotation.value = analogRead(PORT);
}

void switchSensor(wrap_sensor* sensor) {
  
}

void handleSensorWrap(wrap_sensor* sensor) {
  switchSensor(sensor);
  int pos = analogRead(PORT);
  if (pos - sensor->value > 512) {
    Serial.println("Sensor wrap-under detected");
    sensor->offset -= 1023;
  } else if (sensor->value - pos > 512) {
    Serial.println("Sensor wrap-over detected");
    sensor->offset += 1023;
  }
  sensor->value = pos;
}



/* Just a little test message.  Go to http://192.168.4.1 in a web browser
   connected to this access point to see it.
*/
void handleRoot() {
  server.send(200, "text/html", "<h1>You are connected</h1>");
}

void handleSensor() {
  server.send(200, "text/html", JSONSensors());
}

void broadcastSensors() {
  String value = JSONSensors();
  webSocket.broadcastTXT(value.c_str(), value.length());
}

String JSONSensors() {
  String adv = sensorValue(&advancement);
  String rot = sensorValue(&rotation);
  return String("{" + adv + ", " + rot + "}");
}

String sensorValue(wrap_sensor* sensor) {
  String value = String(sensor->offset + sensor->value, DEC);
  return String("\"" + sensor->name + "\" \: " + value);
}


void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {

  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("Websocket client disconnected!");
      break;
    case WStype_CONNECTED:
      {
        Serial.println("Websocket client connected!");
        // first sensor message
        broadcastSensors();
      }
      break;
  }

}

void setup() {
  delay(1000);
  Serial.begin(115200);
  Serial.println();
  Serial.print("Configuring access point...");
  /* You can remove the password parameter if you want the AP to be open. */
  WiFi.softAP(ssid, password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
  
  server.on("/", handleRoot);
  server.on("/sensor", handleSensor);
  server.begin();
  
  Serial.println("HTTP server started on port 80");
  
  webSocket.begin();
  
  Serial.println("Websocket server started on port 81");

  webSocket.onEvent(webSocketEvent);

  initializeSensors();
}

unsigned long period = 100;
unsigned long last_time = 0;

unsigned long update_period = 20;
unsigned long last_update = 0;


void loop() {
  server.handleClient();
  webSocket.loop();

  // handle sensor update and wraparound
  if (last_update + update_period <= millis()) {
    handleSensorWrap(&advancement);
    handleSensorWrap(&rotation);
    last_update = millis();
  }

  // broadcast sensors
  if (last_time + period <= millis()) {
    last_time = millis();
    broadcastSensors();
  }
}
