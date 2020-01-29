# PIC - Piano Intelligent Connecté

## Contexte

Nous avons construit un Piano Intelligent Connecté capable de continuer la suite d'une mélodie jouée par un utilisateur.

La vidéo est disponible dans `demoPIC.mp4`.

## Lancement du projet

En tout premier, installer les librairies Python, principalement Flask et Magenta.

Ensuite, dans `serial_reader.py` ligne 24, il faut mettre le numéro du port utilisé par l'IDE Arduino. Par exemple : `'/dev/cu.usbmodem142401'`.

Pour lancer le serveur, lancer la commande `python3 server.py` dans un terminal à la racine du projet puis dans un second terminal lancer `python3 serial_reader.py`. Se connecter sur `localhost:5000` dans un navigateur Web. Ensuite, il ne reste plus qu'à s'amuser !

## Spécificités techniques

Nous avons 6 capteurs (boutons) et 6 actionneurs (LEDs). L'interface permet de contrôler l'octave et le type de piano (e.g. tone, metal, ...).

## Sources

- [Google Magenta](https://magenta.tensorflow.org/)
- [Arduino](https://www.arduino.cc/)
