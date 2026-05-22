# Bohnen-Bike 8-Bit

## Beschreibung
Ein physikbasiertes 2D-Side-Scroller-Spiel im Retro-8-Bit-Design. Der Spieler steuert eine Bohne auf einem stark verlängerten Fahrrad und muss prozedural generierte Hindernisse überwinden. Das Spiel zeichnet sich durch eine detaillierte Physik-Engine aus, bei der Vorder- und Hinterrad unabhängig voneinander gesteuert werden müssen, um das Gleichgewicht zu halten und Unfälle zu vermeiden.

## Features
* **Unabhängige Rad-Physik:** Vorder- und Hinterrad besitzen eigene Sprung- und Gravitationsberechnungen.
* **Dynamische Hindernisse:** Prozedural generierte Blöcke, Rampen und runde Hindernisse erfordern unterschiedliche Herangehensweisen (z.B. Nutzen von Rampen als Sprungbrett).
* **Komplexe Kollisionserkennung:** Reibung am Fahrradrahmen beim Überqueren von Hindernissen sowie spezifische Crash-Bedingungen.
* **Detaillierte Crash-Animationen:** * Frontaler Aufprall (Stauchung): Das Fahrrad überschlägt sich um 180 Grad.
  * Hängenbleiben des Hinterrads (Dehnung): Das Fahrrad zerreißt in zwei Teile.
  * Die Bohne wird bei einem Unfall abgeworfen, rotiert in der Luft und zerplatzt auf dem Boden.
* **Prozedurales Audio:** Alle Soundeffekte (Springen, Treten, Punkte, Crash) sowie die Hintergrundmusik werden dynamisch über die Web Audio API des Browsers generiert. Es sind keine externen Audio-Dateien notwendig.
* **Responsive Design:** Das Canvas-Element skaliert automatisch auf die volle Bildschirmgröße (Fullscreen-Unterstützung integriert) und bietet eine dedizierte Touch-Steuerung für mobile Endgeräte.

## Steuerung

### Desktop (Tastatur / Maus)
* **W / Pfeil Oben:** Beschleunigen (Gas)
* **S / Pfeil Unten:** Abbremsen
* **M / D / Pfeil Rechts:** Vorderrad anheben (Springen)
* **N / A / Pfeil Links:** Hinterrad anheben (Springen)
* **Mausklick Links:** Hinterrad springt (Klick auf linke Bildschirmhälfte)
* **Mausklick Rechts:** Vorderrad springt (Klick auf rechte Bildschirmhälfte)

### Mobile (Touchscreen)
Der Bildschirm ist vertikal und horizontal in Zonen unterteilt:
* **Untere linke Hälfte (Halten):** Abbremsen
* **Untere rechte Hälfte (Halten):** Beschleunigen (Gas)
* **Obere linke Hälfte (Tippen):** Hinterrad anheben (Springen)
* **Obere rechte Hälfte (Tippen):** Vorderrad anheben (Springen)

## Spielmechanik
1. **Punkte:** Das Überwinden eines Hindernisses gewährt einen Punkt. Mit steigender Punktzahl erhöht sich die Basisgeschwindigkeit des Spiels minimal.
2. **Beschleunigung:** Der Spieler kann manuell beschleunigen, um schwierige Sprünge zu meistern, oder abbremsen, um das Timing anzupassen.
3. **Animation:** Die Bohne reagiert dynamisch auf das Spielgeschehen (Aufstehen beim Hinterradsprung, Zurücklehnen beim Vorderradsprung) und die Beine bewegen sich synchron zur berechneten Kurbeldrehung.

## Installation & Start
Das Spiel erfordert keine Installation, keinen Build-Prozess und keine externen Bibliotheken. 

1. Repository klonen oder herunterladen.
2. Die Datei `index.html` in einem beliebigen, modernen Webbrowser öffnen.

## Technologien
* HTML5 (Canvas API)
* CSS3
* Vanilla JavaScript (ES6)
* Web Audio API