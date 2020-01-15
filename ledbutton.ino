int buttons_value[] = {0, 0, 0, 0, 0, 0, 0};
int buttons[] = {0, 1, 2, 3, 4, 5, 6};
int leds[] = {7, 8, 9, 10, 11, 12, 13};

void setup() {
  // Serial.begin(9600); // open the serial port at 9600 bps:
  for(int i = 0 ; i < 7 ; i++) {
    pinMode(buttons[i], INPUT);
    pinMode(leds[i], OUTPUT);
  }
}

void loop() {
  for(int i = 0 ; i < 7 ; i++) {
    buttons_value[i] = digitalRead(buttons[i]);
    if(buttons_value[i] != 0) {
      digitalWrite(leds[i], HIGH);
      Serial.write(buttons_value[i]);
      //delay(1000);
      //digitalWrite(leds[i], LOW);
      // Serial.print(buttons_value[i]);
      
    } else {
      digitalWrite(leds[i], LOW);
      Serial.write(buttons_value[i]);
    }
  }
}
