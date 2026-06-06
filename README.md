# Bohnen-Bike

Ein physikbasiertes 2D-Browserspiel im 8-Bit-Retrostil, entwickelt mit Vanilla JavaScript und HTML5 Canvas.

## Spielbeschreibung
Der Spieler steuert die "Bohne" auf einem Fahrrad durch 5 herausfordernde Level mit unterschiedlichen Thematiken (Wald, Schnee, Mond, Dschungel und Hoehle). Das Ziel ist es, das Ende jedes Levels zu erreichen, Hindernissen auszuweichen, Bonuspunkte zu sammeln und sich einen Platz in der globalen Highscore-Liste zu sichern.

## Kernmechaniken
* **Physik-Engine:** Eigens entwickelte 2D-Physik fuer das Fahrrad (getrennte Rad-Kollision, Rahmen-Kollision, Gravitation und Traegheit).
* **Tiere fangen:** Fliegende Tiere (Voegel, Wespen, Fledermaeuse, Affen) koennen durch Beruehrung eingefangen werden. Sie verwandeln sich in Seifenblasen und bringen Bonuspunkte.
* **Gefahren:** Meteoriten, Steinschlag, Feuerbaelle sowie Lava und Abgruende fuehren zu einem Absturz des Spielers.
* **Fahrzeuge:** In jedem Level naehern sich von hinten themenspezifische Fahrzeuge (Auto, Pistenraupe, Rover, Jeep, Tunnelbohrer). Ein geschickter Sprung auf das Dach ermoeglicht einen Super-Sprung. Frontal- oder Heckkollisionen fuehren zu einem Unfall mit Partikeleffekten und synthetisierten Audio-Kommentaren.
* **Audio-Synthese:** Vollstaendig im Browser generierte Soundeffekte (Web Audio API) fuer Motoren, Reifenquietschen und Warnsignale.
* **Highscore:** Globale Bestenliste, angebunden via Google Firebase Cloud Firestore (NoSQL).

## Steuerung
* **Tastatur:** Pfeiltasten (oder A/D) fuer Beschleunigung und Bremse. 'N' laesst das Hinterrad springen, 'M' das Vorderrad.
* **Touch:** Vier vertikale Bildschirmzonen (Bremse, Gas, Sprung Hinten, Sprung Vorne). Das Interface passt sich automatisch an das Eingabegeraet an.

## Installation / Ausfuehrung
Das Spiel benoetigt keinen dedizierten lokalen Webserver fuer die Grundfunktionen. Die Datei `index.html` kann direkt in einem modernen Webbrowser (Desktop oder Mobile) geoeffnet werden. Fuer die Speicherung und den Abruf des Highscores ist eine aktive Internetverbindung zur Firebase-Datenbank erforderlich.
