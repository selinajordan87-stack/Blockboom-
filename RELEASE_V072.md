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

TypeScript und Produktionsbuild erfolgreich. 196/196 Logiktests bestanden. Neuer Chromium-Touchtest: per Wischgeste Bodenblock in weniger als drei Blöcken Abstand anvisieren, tatsächlich abbauen, Undo und Reload sowie nahezu senkrechter Blick nach unten. Pages-Unterpfad mit gebündelten Assets geprüft. Weitere Release-Browserprüfungen und Veröffentlichungsstand werden nach Abschluss unten ergänzt.

Keine echten iPhone-/Android-Gerätetests in diesem Lauf; insbesondere native Browserränder und dauerhaft stabile Geräte-FPS werden nicht als behoben/nachgewiesen behauptet. Die Darstellung bleibt einfacher als das Art-Direction-Mockup. Cloud-Messungen unter gleichzeitiger Software-Grafiklast sind keine Smartphone-Frameraten.
