# BLOCKBOOM v0.7.2

## Bedienung und Kamera

- Bau-/Abbauwerkzeuge richten die Third-Person-Kamera auf einen Arbeitsbereich 2,5 statt 5 Blöcke vor der Figur. Die Interaktionsreichweite bleibt sechs Blöcke, Wände werden weiterhin berücksichtigt.
- Vertikales Wischen reagiert stärker; der Blick reicht bis knapp 90 Grad nach unten/oben. Die Blickrichtung bleibt nach Reload erhalten.
- Abbau liegt rechts unten neben Springen. Bewegen und Umsehen behalten getrennte Fingerzuständigkeiten.
- Browser-Zoom und Spielkamera werden getrennt behandelt. Gestenschutz und Ausgleich der Browservergrößerung bleiben erhalten; veraltete Visual-Viewport-Werte werden mit den Seitengrenzen abgeglichen.

## Welt und Speicher

Enthält die bisherigen Arbeiten des Visual-Branches an Berg, Wasser/Ufern, Wald, Siedlung, Vegetation und Spielfigur. Zwei in den Releaseprüfungen gefundene Blockaden wurden korrigiert: der obere Bergpfad ist breiter, die Höhlenabzweigung besitzt wieder durchgehende Stufen. Erzdekoration erzeugt keine zusätzlichen Steinblöcke im Gehraum. Die feinere Ferngeometrie wird erst näher am Berg verwendet.

Bestehende Welten behalten Revision 1, manuelle Weltänderungen haben Vorrang. Nur neu erstellte Welten erhalten Revision 2. Revision 2 wird mit dieser Freigabe als Basiskarte festgeschrieben. Speicherung erfolgt weiterhin getrennt von Revision 1; Export/Import und Schutz vor unbekannten zukünftigen Speicherformaten bleiben bestehen.

Die bisherige separat gehostete Adresse behält ihren Storage-Namespace `blockboom.preview-v072r2.*`, damit dort erspielter Fortschritt erhalten bleibt. Der historische Name ist keine Versionsanzeige. Zwischen GitHub Pages und dieser Adresse überträgt man Spielstände per Export/Import; Browser erlauben keinen direkten Zugriff auf den Speicher einer anderen Domain.

## Verifikation

TypeScript und Produktionsbuild erfolgreich. 196/196 Logiktests bestanden; danach zusätzlicher Wassertest und drei betroffene Grafiktests erfolgreich. Neuer Chromium-Touchtest: per Wischgeste Bodenblock in weniger als drei Blöcken Abstand anvisieren, tatsächlich abbauen, Undo und Reload sowie nahezu senkrechter Blick nach unten. Pages-Unterpfad mit gebündelten Assets geprüft.

21 Gameplay-/Mobile-Browserprüfungen bestanden: Bergbau/Ofen, Farming, Möbel/Truhen, drei Landscape-Größen mit Tastaturhöhe, Multitouch und unabhängiges Loslassen, Cancel-/Capture-Ereignisse, Third-Person-Bauen, echter Angel-Drill bis Inventar, Datei-Export/Import mit Sicherung, Schreibkampf mit Fehlerhilfe und ohne Timer sowie gleichzeitiges Bewegen/Umsehen/Angreifen. Abschließend sieben Browserprüfungen für vier Bergansichten, Revision-2-Transfer, nahes Abbauen und Pages-Assets erfolgreich; Startbudget danach separat erfolgreich.

Das vorherige Budgetproblem wurde reduziert, ohne Grenzen anzuheben: Wasser und Seeboden zeichnen nur sichtbare Teilflächen, der ferne See nutzt gröbere Flächen; Gras ist auf 240 Instanzen begrenzt, Blumen nutzen flache Blütenblätter. Neue Spielszene: 81 Draw Calls, 37.280 Dreiecke, 67 Geometrien, vier Texturen, 28 Terrainchunks. Kontrollierte Bergszenen: Start 85/38.756, Bergfuß 38/32.522, Gipfel 36/26.278, Kammer 86/34.206 (Draw Calls/Dreiecke). Eine anfangs zusätzlich gemessene Startbildschirm-Panoramakamera lag bei 51.602 Dreiecken. Ihre Zähler werden beim Spielstart jetzt verworfen, damit die Spielbudgetprüfung tatsächlich eine Spielkamera misst; die Panoramakamera ist dadurch nicht nachträglich als budgetkonform belegt.

Keine echten iPhone-/Android-Gerätetests in diesem Lauf; insbesondere native Browserränder und dauerhaft stabile Geräte-FPS werden nicht als behoben/nachgewiesen behauptet. Die Darstellung bleibt einfacher als das Art-Direction-Mockup. Cloud-Messungen unter gleichzeitiger Software-Grafiklast sind keine Smartphone-Frameraten.
