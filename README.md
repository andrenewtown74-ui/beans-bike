# Bohnen-Bike

Ein physikbasiertes 2D-Browserspiel im 8-Bit-Retrostil, entwickelt mit Vanilla JavaScript und HTML5 Canvas.

## Spielbeschreibung
Der Spieler steuert die "Bohne" auf einem Fahrrad durch 6 herausfordernde Level mit unterschiedlichen Thematiken (Wald, Schnee, Mond, Dschungel, Höhle und die Straßen von Paris). Das Ziel ist es, das Ende jedes Levels zu erreichen, Hindernissen auszuweichen, Bonuspunkte zu sammeln und sich einen Platz in der globalen Highscore-Liste zu sichern. 

Nach einem Game Over oder dem erfolgreichen Abschluss des Spiels kann der Punktestand gespeichert werden, woraufhin man ins interaktive Hauptmenü zurückkehrt.

## Kernmechaniken
* **Physik-Engine:** Eigens entwickelte 2D-Physik für das Fahrrad (getrennte Rad-Kollision, Rahmen-Kollision, Gravitation, Trägheit und Rutsch-Effekte auf Taubendreck).
* **Interaktive Startseite:** Ein aufgeräumtes Hauptmenü mit Soundtrack, Top-20-Highscore-Ansicht und tanzender Bohne im Idle-Modus.
* **Tiere fangen:** Fliegende Tiere (Vögel, Wespen, Fledermäuse, Affen) können durch Berührung eingefangen werden. Sie verwandeln sich in Seifenblasen und bringen Bonuspunkte.
* **Gefahren:** Meteoriten, Steinschlag, Feuerbälle, Lava und Abgründe führen zu einem Absturz. Im Paris-Level droht zudem extreme Rutschgefahr!
* **Fahrzeuge & Verkehr:** In jedem Level nähern sich von hinten themenspezifische Fahrzeuge (z.B. Pistenraupe, Tunnelbohrer oder weiße Pariser Taxis). Ein geschickter Sprung auf das Dach ermöglicht einen Super-Sprung. Frontal- oder Heckkollisionen führen zu einem Unfall mit Partikeleffekten und synthetisierten Audio-Kommentaren. Im 6. Level gibt es zudem Gegenverkehr durch Radfahrer und E-Roller.
* **Audio-Synthese:** Vollständig im Browser generierte Soundeffekte (Web Audio API) für Motoren, Reifenquietschen und Warnsignale.
* **Highscore:** Globale Bestenliste (Top 20), angebunden via Google Firebase Cloud Firestore (NoSQL).

## Steuerung
Das Spiel erkennt automatisch, ob es auf einem Touch-Gerät oder am PC gespielt wird, und passt sich an. Durch spezielle CSS-Regeln ist das Spiel für iOS optimiert (Siri- und Kontextmenü-Blocker).

**Tastatur:** 
* **A / D** oder **Pfeiltasten links/rechts**: Bremsen / Beschleunigen
* **N**: Hinterrad springen
* **M**: Vorderrad springen

**Touch (Direkt am Fahrrad):** 
* **Tippen auf das Vorderrad:** Vorderrad springen
* **Tippen auf das Hinterrad:** Hinterrad springen
* **Vorderrad antippen und nach vorne ziehen:** Beschleunigen (Gas)
* **Hinterrad antippen und nach hinten ziehen:** Bremsen

## Entwickler-Cheats (Nur Tastatur)
Zum einfachen Testen der Level gibt es versteckte Cheats:
* **Tasten 1 bis 6:** Sofortiger Sprung in das jeweilige Level (1 = Wald, 6 = Paris).
* **Taste I:** God-Mode (Unverwundbarkeit) an/ausschalten. Fahrzeuge und Hindernisse können durchfahren werden (ausgenommen tiefe Abgründe).

## Installation / Ausführung
Das Spiel benötigt keinen dedizierten lokalen Webserver für die Grundfunktionen. Die Datei `index.html` kann direkt in einem modernen Webbrowser (Desktop oder Mobile) geöffnet werden. Für die Speicherung und den Abruf des Highscores ist eine aktive Internetverbindung zur Firebase-Datenbank erforderlich.
