const int leds[] = {6, 7, 8, 9};
const int buttons[] = {2, 3, 4, 5};
int buttons_values[] = {0, 0, 0, 0};
int buttons_values_prev[] = {0, 0, 0, 0};

void setup() {
  // initialisation du port serie
  Serial.begin(9600);
  // initialisation des leds
  for(int i=0; i< 4; i++) {
    pinMode(leds[i], OUTPUT);
  }
  // initialisation des boutons
  for(int i=0; i< 4; i++) {
    pinMode(buttons[i], INPUT);
  }
}

void loop() {
  bool allume = false;
  for(int j=0; j<4; j++) {
    buttons_values_prev[j] = buttons_values[j];
    buttons_values[j] = digitalRead(buttons[j]);
    if(buttons_values[j] == HIGH) {
      allume = true;
      digitalWrite(leds[j], HIGH);
      delay(100);
      
    } else {
      allume = false;
      digitalWrite(leds[j], LOW);
      delay(100); 
    }
    if(buttons_values_prev[j] != buttons_values[j]) {
      int id = j+1;
      Serial.print(id);
      if(allume == true) {
        Serial.println(" est allume");
      } else {
        Serial.println(" est eteint");
      }
      
    }
  }
}
