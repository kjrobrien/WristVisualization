#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <WebSocketsServer.h>
#include <SPIFFS.h>
#include <DNSServer.h>
#include <Servo.h>


#ifndef APSSID
#define APSSID "SCREAM"
#define APPSK  "ohsoscary"
#endif

struct wrap_sensor {
  int value;
  int offset;
  int pin;
  String name;
};

const char *ssid = APSSID;
const char *password = APPSK;

DNSServer dnsServer;

Servo servo;

AsyncWebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

wrap_sensor advancement = {0, 0, 33, "advancement"};

wrap_sensor rotation = {0, 0, 36, "rotation"};

void initializeSensors() {
  advancement.value = analogRead(advancement.pin);
  rotation.value = analogRead(rotation.pin);
}

void onRequest(AsyncWebServerRequest *request){
  //Handle Unknown Request
  request->send(404);
}

void handleSensorWrap(wrap_sensor* sensor) {
  int pos = analogRead(sensor->pin);
  if (pos - sensor->value > 2048) {
    Serial.println("Sensor wrap-under detected");
    sensor->offset -= 4095;
  } else if (sensor->value - pos > 2048) {
    Serial.println("Sensor wrap-over detected");
    sensor->offset += 4095;
  }
  sensor->value = pos;
}



/* Just a little test message.  Go to http://192.168.4.1 in a web browser
   connected to this access point to see it.
*/
/*
void handleRoot() {
  request->send(200, "text/html", "<h1>You are connected</h1>");
}

void handleSensor() {
  request->send(200, "text/html", JSONSensors());
}
*/

String sensorValue(wrap_sensor* sensor) {
  String value = String(sensor->offset + sensor->value, DEC);
  return String("\"" + sensor->name + "\" \: " + value);
}

String JSONSensors() {
  String adv = sensorValue(&advancement);
  String rot = sensorValue(&rotation);
  return String("{" + adv + ", " + rot + "}");
}

void broadcastSensors() {
  String value = JSONSensors();
  webSocket.broadcastTXT(value.c_str(), value.length());
}

float displ_mm = 0;

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
    case WStype_TEXT:
      {
        String payload_str = String((char*) payload);
        displ_mm = payload_str.toFloat();
      }
      break;
  }

}

double servo_mm_travel = 29.92367333;
double max_advancement = 22.5;

void setServo(double advancement, double displacement) {
  double mm = (max_advancement - advancement) + (displacement * 4);
  double angle = mm * 180 / servo_mm_travel;
  servo.write(angle);
}

double scaleNum(double num, double in_min, double in_max, double out_min, double out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

double getAdvancementMM() {
  return scaleNum(advancement.value + advancement.offset, 4095, -5760, 0, max_advancement);
}

void setup() {
  delay(1000);
  Serial.begin(115200);
  Serial.println();
  if(!SPIFFS.begin()){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
  Serial.print("Configuring access point...");
  /* You can remove the password parameter if you want the AP to be open. */
  WiFi.softAP(ssid, password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);

  /*
  server.on("/", handleRoot);
  server.on("/sensor", handleSensor);*/
  
  dnsServer.start(53, "*", IPAddress(192, 168, 4, 1));
  
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  server.onNotFound(onRequest);
  
  server.begin();
  
  Serial.println("HTTP server started on port 80");
  
  webSocket.begin();
  
  Serial.println("Websocket server started on port 81");

  webSocket.onEvent(webSocketEvent);

  initializeSensors();

  servo.attach(25);
}

unsigned long period = 100;
unsigned long last_time = 0;

unsigned long update_period = 20;
unsigned long last_update = 0;


void loop() {
  //server.handleClient();
  dnsServer.processNextRequest();
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
    setServo(getAdvancementMM(), displ_mm);
  }
}
