# BLOCKBOOM v0.7.1 – Kamera, Tiere und See

## Ausgangspunkt und belegte Ursachen

Ausgangspunkt: veröffentlichter `main` auf `60385e1`, sauberes Arbeitsverzeichnis. Entwicklungsbranch `fix/v071-camera-wildlife`. Baseline: TypeScript, 159 Logiktests und Produktionsbuild bestanden.

Drei neue Regressionen wurden vor dem Fix rot ausgeführt ([Protokoll](artifacts/v071/reproduced-errors.log)):

- Bei einer Kamerakollision zwischen 0,32 und rund 1,05 Metern war weder die Third-Person-Figur noch die Ego-Hand sichtbar. Die Kamera blieb in einem unbrauchbaren Zwischenblick. Die Korrektur verwendet bei zu wenig Platz die Augenposition und kehrt mit Hysterese zur gewählten Entfernung zurück. Der Wunschabstand wird nicht überschrieben.
- Die Raycast-Begrenzung der Tierinstanzen blieb nach deren Bewegung veraltet. Dasselbe zuvor treffbare Tier war nach Bewegung nicht mehr anvisierbar. Neue, leicht vergrößerte körperbezogene Ziele sind unabhängig von dieser Begrenzung; Instanzgrenzen werden zusätzlich aktualisiert. Die Third-Person-Zielrichtung berücksichtigt Tiere und massive Wände.
- Im großen See existierten fünf Fische in einer einzelnen kleinen Gruppe, zudem seitlich zur normalen Blickrichtung vom Steg. Jetzt gibt es acht Fische an drei Uferabschnitten, davon vier beim Steg. Das Gesamtlimit bleibt bei 32. Klareres Wasser verbessert die Sicht.

Das beweist diese konkreten Fehler im Code. Es beweist nicht, dass jede gelegentliche iPhone-Unterbrechung dieselbe Ursache hat. Die bestehende lokale Kamera-/Frame-Diagnose bleibt erhalten; ein echter iPhone-Test ist weiter erforderlich.

## Direkt bedienbare Kamera

Neben dem Menü steht ein kompakter **Ansicht**-Knopf. Er öffnet unmittelbar Ego/Ansicht von hinten, einen Abstandsregler und **Kamera befreien**. Weitere Einstellungen bleiben erreichbar. Bewegung und aktive Kontakte werden beim Öffnen sauber beendet. Das vorhandene Menü und seine bisherigen Kameraaktionen bleiben erhalten.

## Weitere Umsetzung und Prüfungen

Wird nach den tatsächlich ausgeführten Tier-/Grill- und Browserprüfungen ergänzt. Kein vollständiger Release wird hier vorweggenommen.

Erster Kameraschritt: TypeScript und Build bestanden, 17 passende Logiktests bestanden. Fünf vorhandene Kamera-/Bau-/WebGL-Browserfälle bestanden. Ein neuer Browserfall las die Diagnose zu früh; nach Warten auf den nächsten Diagnoseframe bestanden beide neuen Fälle (2/2). Der fehlerhafte erste Lauf wird erhalten. Die ursprüngliche 40.000-Dreiecke-Grenze und alle alten Tests bleiben bestehen.
