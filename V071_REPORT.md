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

Wildtiere lassen sich mit den vorhandenen Waffen jagen. Treffer besitzen Reichweite, die bestehende Waffen-Abklingzeit und eine Sichtprüfung gegen Wände. Tiere verschwinden ohne grafische Verletzungen und liefern einmalig Rohfleisch. Gezähmte Begleiter sind geschützt. Regionale Wildtierplätze werden nach drei Minuten aktiver Spielzeit wieder besetzt, sofern ein sicherer Boden vorhanden und der Spieler nicht direkt daneben ist; die Population wächst dadurch nicht.

Ein eigener Grill lässt sich aus vier Stein und einer Kohle herstellen, über die normale Materialauswahl platzieren und benutzen. Rohfleisch oder versorgte Fische werden mit Kohle gegart. Grillfleisch wird im Rucksack oder über den Nahrungsslot gegessen; der Slot nimmt vorhandene zubereitete Nahrung vor Beeren. Rohfleisch ist nicht direkt essbar. Der vorhandene Ofen kann dieselben Gerichte zubereiten.

Im ersten End-to-End-Test wurde bereits gegrillt, aber der Nahrungsslot aß noch vorrangig Beeren. Der Test deckte diese UX-Schwäche auf; nach der Korrektur bestehen alle fünf gezielten Browserfälle einschließlich Jagd/Herstellen/Platzieren/Garen/Essen/Reload und einem echten Touchfang am großen See. Die Aufzeichnung bleibt erhalten. 167 Logiktests, TypeScript und Produktionsbuild bestehen.

Die Vorher-/Nachheraufnahme des großen Sees zeigt einen weiteren echten Renderfehler: Die Instanzmaterialien verlangten Vertexfarben, während die Geometrien keine Farbattribute enthielten. Die vorhandenen Instanzfarben werden nun korrekt ohne das zusätzliche ungebundene Farbattribut genutzt. Das neue Material-Regression schützt diesen Vertrag. Die Fische sind auf der laufenden Nachheraufnahme farbig statt nahezu schwarz. Der Kamera-Schnellzugriff bietet nahe dem Wasser zusätzlich **Blick aufs Wasser**, ohne Sichtfeldverengung oder ungefragten Perspektivwechsel.

[Vorher](artifacts/v071/before-dark-fish.png) · [Nachher](artifacts/v071/lake-visible-fish.png) · [Tierziel](artifacts/v071/animal-target.png) · [Platzierter Grill](artifacts/v071/placed-grill.png) · [Grillen](artifacts/v071/grilling.png) · [Browserprotokoll](artifacts/v071/phase2-browser.log)

## Spielstände

Rootformat v1 und alle bisherigen Welt-, Lern- und Inventardaten bleiben erhalten. Tiergesundheit und Wiederbesetzungszeit sind additive Felder. Alte Tiere ohne Gesundheitswert bleiben voll funktionsfähig. Vor dem ersten Upgrade wird, soweit Speicher vorhanden ist, `blockboom.save.pre-v071` angelegt. Neue Gegenstände ergänzen den Katalog; der Grill wird am Ende der Materialliste angehängt, damit alte Slotnummern erhalten bleiben. Export/Import wird in der abschließenden Regression erneut geprüft.

## Veröffentlichung

Noch nicht veröffentlicht. Abschließende Regression und tatsächlicher Deployment-Status folgen nach ihren Ergebnissen.

Erster Kameraschritt: TypeScript und Build bestanden, 17 passende Logiktests bestanden. Fünf vorhandene Kamera-/Bau-/WebGL-Browserfälle bestanden. Ein neuer Browserfall las die Diagnose zu früh; nach Warten auf den nächsten Diagnoseframe bestanden beide neuen Fälle (2/2). Der fehlerhafte erste Lauf wird erhalten. Die ursprüngliche 40.000-Dreiecke-Grenze und alle alten Tests bleiben bestehen.
