const int leds[] = {8, 9, 10, 11, 12, 13};
const int buttons[] = {2, 3, 4, 5, 6, 7};
int buttons_values[] = {0, 0, 0, 0, 0, 0};
int buttons_values_prev[] = {0, 0, 0, 0, 0, 0};
int incomingByte = 0; // for incoming serial data
int indice = 0;
int led = 0;
byte myNumber = 0;

void setup() {
  // initialisation du port serie
  Serial.begin(9600);
  // initialisation des leds
  for(int i=0; i< 6; i++) {
    pinMode(leds[i], OUTPUT);
  }
  // initialisation des boutons
  for(int i=0; i< 6; i++) {
    pinMode(buttons[i], INPUT);
  }
}

void loop() {
  bool allume = false;
  for(int j=0; j<6; j++) {
    buttons_values_prev[j] = buttons_values[j];
    buttons_values[j] = digitalRead(buttons[j]);
    if(buttons_values[j] == HIGH) {
      allume = true;
      digitalWrite(leds[j], HIGH);
      delay(1);
    } else {
      allume = false;
      digitalWrite(leds[j], LOW);
      delay(1); 
    }
    if(buttons_values_prev[j] != buttons_values[j]) {
      int id = j+1;
      Serial.print(id);  
    }
  }

  incomingByte = Serial.read();
  if(incomingByte != -1 && incomingByte != 10) {
    Serial.print("I received: ");
    Serial.print(incomingByte, DEC);
    Serial.print(" ");
    int as_int = (int)incomingByte;
    byte myNumber = incomingByte - '0';
    Serial.println(myNumber);
    indice = myNumber-1;
    led = leds[indice];
    if(led == HIGH) {
      digitalWrite(led, LOW);
    } else {
      digitalWrite(led, HIGH);
      delay(500);
    }
  }
}
