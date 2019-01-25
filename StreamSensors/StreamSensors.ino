#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>


#ifndef APSSID
#define APSSID "SCREAM"
#define APPSK  "ohsoscary"
#endif

const char *ssid = APSSID;
const char *password = APPSK;

ESP8266WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);


/* Just a little test message.  Go to http://192.168.4.1 in a web browser
   connected to this access point to see it.
*/
void handleRoot() {
  server.send(200, "text/html", "<h1>You are connected</h1>");
}

void handleSensor() {
  server.send(200, "text/html", sensorValue());
}

void broadcastSensor() {
  String value = sensorValue();
  webSocket.broadcastTXT(value.c_str(), value.length());
}

String sensorValue() {
  return String(analogRead(A0), DEC);
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
        broadcastSensor();
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
}

unsigned long period = 100;
unsigned long last_time = 0;

void loop() {
  server.handleClient();
  webSocket.loop();
  if (last_time + period <= millis()) {
    last_time = millis();
    broadcastSensor();
  }
}
