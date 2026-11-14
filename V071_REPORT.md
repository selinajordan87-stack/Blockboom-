# BLOCKBOOM v0.7.1 – Kamera, Tiere und See

## Ausgangspunkt und belegte Ursachen

Ausgangspunkt: veröffentlichter `main` auf `60385e1`, sauberes Arbeitsverzeichnis. Entwicklungsbranch `fix/v071-camera-wildlife`. Baseline: TypeScript, 159 Logiktests und Produktionsbuild bestanden.

Drei neue Regressionen wurden vor dem Fix rot ausgeführt ([Protokoll](artifacts/v071/reproduced-errors.log)):

- Bei einer Kamerakollision zwischen 0,32 und rund 1,05 Metern war weder die Third-Person-Figur noch die Ego-Hand sichtbar. Die Kamera blieb in einem unbrauchbaren Zwischenblick. Die Korrektur verwendet bei zu wenig Platz die Augenposition und kehrt mit Hysterese zur gewählten Entfernung zurück. Der Wunschabstand wird nicht überschrieben.
- Die Raycast-Begrenzung der Tierinstanzen blieb nach deren Bewegung veraltet. Dasselbe zuvor treffbare Tier war nach Bewegung nicht mehr anvisierbar. Neue, leicht vergrößerte körperbezogene Ziele sind unabhängig von dieser Begrenzung; Instanzgrenzen werden zusätzlich aktualisiert. Die Third-Person-Zielrichtung berücksichtigt Tiere und massive Wände.
- Im großen See existierten fünf Fische in einer einzelnen kleinen Gruppe, zudem seitlich zur normalen Blickrichtung vom Steg. Jetzt gibt es acht Fische an drei Uferabschnitten, davon vier beim Steg. Das Gesamtlimit bleibt bei 32. Klareres Wasser verbessert die Sicht.

Das beweist diese konkreten Fehler im Code. Es beweist nicht, dass jede gelegentliche iPhone-Unterbrechung dieselbe Ursache hat. Die bestehende lokale Kamera-/Frame-Diagnose bleibt erhalten; ein echter iPhone-Test ist weiter erforderlich.

## Direkt bedienbare Kamera

Neben dem Menü steht ein kompakter **Kamera**-Knopf. Er öffnet unmittelbar Ego/Ansicht von hinten, einen Abstandsregler und **Kamera befreien**. Weitere Einstellungen bleiben erreichbar. Bewegung und aktive Kontakte werden beim Öffnen sauber beendet. Das vorhandene Menü und seine bisherigen Kameraaktionen bleiben erhalten.

## Weitere Umsetzung und Prüfungen

Wildtiere lassen sich mit den vorhandenen Waffen jagen. Treffer besitzen Reichweite, die bestehende Waffen-Abklingzeit und eine Sichtprüfung gegen Wände. Tiere verschwinden ohne grafische Verletzungen und liefern einmalig Rohfleisch. Gezähmte Begleiter sind geschützt. Regionale Wildtierplätze werden nach drei Minuten aktiver Spielzeit wieder besetzt, sofern ein sicherer Boden vorhanden und der Spieler nicht direkt daneben ist; die Population wächst dadurch nicht.

Ein eigener Grill lässt sich aus vier Stein und einer Kohle herstellen, über die normale Materialauswahl platzieren und benutzen. Rohfleisch oder versorgte Fische werden mit Kohle gegart. Grillfleisch wird im Rucksack oder über den Nahrungsslot gegessen; der Slot nimmt vorhandene zubereitete Nahrung vor Beeren. Rohfleisch ist nicht direkt essbar. Der vorhandene Ofen kann dieselben Gerichte zubereiten.

Im ersten End-to-End-Test wurde bereits gegrillt, aber der Nahrungsslot aß noch vorrangig Beeren. Der Test deckte diese UX-Schwäche auf; nach der Korrektur bestehen alle fünf gezielten Browserfälle einschließlich Jagd/Herstellen/Platzieren/Garen/Essen/Reload und einem echten Touchfang am großen See. Die Aufzeichnung bleibt erhalten. Dieser Schritt bestand 167 Logiktests, TypeScript und Produktionsbuild. Der abschließende Stand besitzt zusätzlich die unten beschriebene Distanzdarstellung.

Die Vorher-/Nachheraufnahme des großen Sees zeigt einen weiteren echten Renderfehler: Die Instanzmaterialien verlangten Vertexfarben, während die Geometrien keine Farbattribute enthielten. Die vorhandenen Instanzfarben werden nun korrekt ohne das zusätzliche ungebundene Farbattribut genutzt. Die neue Material-Regression schützt diesen Vertrag. Die Fische sind auf der laufenden Nachheraufnahme farbig statt nahezu schwarz. Der Kamera-Schnellzugriff bietet nahe dem Wasser zusätzlich **Blick aufs Wasser**, ohne Sichtfeldverengung oder ungefragten Perspektivwechsel.

[Vorher](artifacts/v071/before-dark-fish.png) · [Nachher](artifacts/v071/lake-visible-fish.png) · [Tierziel](artifacts/v071/animal-target.png) · [Platzierter Grill](artifacts/v071/placed-grill.png) · [Grillen](artifacts/v071/grilling.png) · [Browserprotokoll](artifacts/v071/phase2-browser.log)

## Geänderte Architektur

| Bereich | Dateien / Wirkung |
| --- | --- |
| Kamera | `player/CameraRig.ts`, `main.ts`, `ui/mobile-rescue.css`: sichere Nahansicht, direktes Kamerafenster, lokales Diagnoseereignis |
| Tierziele | `living/AnimalTarget.ts`, `LivingView.ts`: körperbezogene Ziele, leichtes Zielhilfepolster, erneuerte Instanzbegrenzung und Third-Person-Parallaxe |
| Jagd | `living/Hunting.ts`, `State.ts`, `Systems.ts`: Schaden, Reichweite, Haustierschutz, einmalige Beute und begrenzte Wiederbesetzung |
| Nahrung | `living/Items.ts`, `LivingUI.ts`, `ui/MobileHUD.ts`: Rezepte, Verzehr und passende Touchaktionen |
| Grill in der Welt | `world/World.ts`, `Renderer.ts`, `nightfall/Views.ts`: eigener platzierbarer und gespeicherter Gegenstand, gemeinsame Geometrie/Materialien |
| See | `fishing/Shoal.ts`, `FishView.ts`, `FishingWorld.ts`: verteilte Gruppen, tatsächliche Farben, klareres Wasser und Distanzdarstellung |
| Regressionen | neue Logik-/Browserfälle; vorhandener Transferfall enthält zusätzlich Grill, Fleisch und gejagtes Tier; Materialanzahl und Versionsanzeige sachlich aktualisiert |

Keine neue Abhängigkeit und kein Rewrite. Die bestehende Pointer-/Touch-Ownership und die Spieleingaben bleiben erhalten.

## Spielstände

Rootformat v1 und alle bisherigen Welt-, Lern- und Inventardaten bleiben erhalten. Tiergesundheit und Wiederbesetzungszeit sind additive Felder. Alte Tiere ohne Gesundheitswert bleiben voll funktionsfähig. Vor dem ersten Upgrade wird, soweit Speicher vorhanden ist, `blockboom.save.pre-v071` angelegt. Neue Gegenstände ergänzen den Katalog; der Grill wird am Ende der Materialliste angehängt, damit alte Slotnummern erhalten bleiben. Export/Import wird in der abschließenden Regression erneut geprüft.

## Veröffentlichung

Noch nicht veröffentlicht. Abschließende Regression und tatsächlicher Deployment-Status folgen nach ihren Ergebnissen.

Erster Kameraschritt: TypeScript und Build bestanden, 17 passende Logiktests bestanden. Fünf vorhandene Kamera-/Bau-/WebGL-Browserfälle bestanden. Ein neuer Browserfall las die Diagnose zu früh; nach Warten auf den nächsten Diagnoseframe bestanden beide neuen Fälle (2/2). Der fehlerhafte erste Lauf wird erhalten. Die ursprüngliche 40.000-Dreiecke-Grenze und alle alten Tests bleiben bestehen.


## Abschließender Qualitätsdurchlauf

Die Darstellung packt nur nahe lebende Fischinstanzen in die vorhandenen sieben Batches. Die tatsächliche Fischidentität bleibt auch nach dieser Auswahl beim Raycast erhalten. Bei Kamera-Verengung und anschließender Freigabe entstehen bounded lokale Diagnoseereignisse; es erfolgt kein Upload. Der Reset steht im Kamera-Schnellfenster oben.

Ein erster Start des abschließenden gezielten Tests traf auf den noch laufenden lokalen Build und erhielt HTTP 404. Das war ein Fehler der Testausführung, keine erfolgreiche Spielprüfung. Der Build wurde abgewartet; der vollständige Nachlauf verwendet ausschließlich das unveränderte fertige Produktionsverzeichnis. In diesem ersten gezielten Lauf bestanden bereits beide Jagd-/Grillpfade (Ego und Third Person), der enge Kamerablick und der Angelblick.

## Konkreter iPhone-Test

1. Vor dem Update den Spielstand im Menü exportieren. Safari auf derselben Pages-Adresse benutzen und die Website-Daten nicht löschen. Nach Reload muss **v0.7.1** sichtbar sein.
2. Oben rechts **Kamera** antippen. Zwischen Ego und Ansicht von hinten wechseln; den Abstand auf etwa 6–8 m setzen. Der Regler verändert die Entfernung, nicht das Sichtfeld. Beide Daumen gleichzeitig benutzen.
3. An einen Baum oder eine Wand herangehen, zurückweichen und prüfen, ob die gewählte Entfernung wiederhergestellt wird. Bei enger oder unerklärlich festhängender Ansicht **Kamera → Kamera befreien** nutzen. Falls das Problem erneut auftritt, im Menü unter Einstellungen die Kameradiagnose speichern; der genaue weitere Hänger ist ohne echten iPhone-Test nicht als endgültig behoben bestätigt.
4. Ein wildes Tier mit Schwert oder Axt anvisieren. Der Zielpunkt wird golden, Name und Lebenspunkte erscheinen. Mit **Jagen** angreifen. Haustiere bleiben geschützt.
5. In der Werkbank einen Grill herstellen, als Baumaterial auswählen und platzieren. Rohfleisch mit Kohle grillen. Über den Nahrungsslot essen; die Hungeranzeige und die Vorratsmenge müssen sich ändern. Speichern und neu laden: Grill, Nahrung und Tierzustand bleiben erhalten.
6. Am großen Seesteg **Kamera → Blick aufs Wasser** ausprobieren. Die Gruppe direkt neben dem Steg ansehen, dann einen vollständigen Fang spielen. Weitere Fischgruppen liegen an den seitlichen Ufern; nicht die gesamte große Wasserfläche ist gleichmäßig mit Fischen besetzt.
7. Safari kurz verlassen, zurückkehren, Gerät drehen und erneut laufen. Falls die Ansicht wieder hängt, iPhone-Modell, iOS-Version, Perspektive und zuletzt ausgeführte Aktion notieren.

## Grenzen

Die Fische und Landschaft bleiben stilisierte Voxelmodelle. Es wird kein grafischer Komplettumbau behauptet. Die Tests prüfen reproduzierbare Teilursachen und die Wiederherstellung; sie ersetzen weder einen echten iPhone-Test noch den Nachweis, dass jede gemeldete Unterbrechung dieselbe Ursache hatte. Smartphone-Frameraten werden hier nicht erfunden. Grillen ist ein kurzer spielerischer Vorgang ohne detaillierte Simulation. Wie das bisherige Hauptmenü beendet das Kamerafenster einen laufenden Auswurf; Perspektive und Wasserblick deshalb vor dem Auswerfen wählen.


## Im Gesamtlauf gefundene Köder-Auswahl

Der erste vollständige 88-Fälle-Lauf wurde nach 18 bestandenen Fällen, einem großen-See-Fehler und einem unterbrochenen Fall angehalten; 68 waren noch nicht ausgeführt. Das ist kein erfolgreicher Gesamtlauf. Der Fangfall blieb bei „Köder im Wasser“. Die bisherige Zufallsauswahl berücksichtigte Art und Ausrüstung, aber nicht die Entfernung der nun verteilten Gruppen. Ein neuer deterministischer Test wählte einen Fisch **29,48 Meter** vom Schwimmer entfernt und reproduzierte den Fehler.

Die Auswahl berücksichtigt jetzt nur tatsächliche Fische innerhalb von zwölf Spielmetern um den Köder und gewichtet näher schwimmende Tiere stärker. Wunscharten werden innerhalb dieser lokalen Gruppe bevorzugt; fehlt die gewünschte Art, bleibt ein anderer naher Fisch fangbar. Keine Teleportation von Fischen, keine simulierte Textfangmeldung und keine Verlängerung des Test-Zeitlimits. [Roter Logiktest](artifacts/v071/lake-selection-red.log), [angehaltener Gesamtlauf](artifacts/v071/interrupted-full-before-lake-fix.log).


## Seegrund an den seitlichen Ufern

Eine zusätzliche Logikprüfung über 30 Sekunden Fischbewegung fand am westlichen Rand einen Barsch unter dem tatsächlichen Sandboden. Die beiden seitlichen Gruppen wurden jeweils vier Spielmeter in tieferes Wasser versetzt. Der Test prüft den wirklichen Terrainhöhenwert für jeden Fisch; danach bestehen alle 13 betroffenen Logikfälle. Das laufende 88-Fälle-Browserbundle bleibt dafür unverändert (`index-BpZYmPJX.js`). Die Positionskorrektur erhält anschließend eigene Produktions- und Browsernachprüfungen; sie wird nicht rückwirkend als Bestandteil jenes Bundles ausgegeben. [Roter Bodentest](artifacts/v071/lake-ground-red.log).


## Werkzeugpriorität bei nahen Tieren

Der zweite Gesamtlauf fand im unveränderten alten Touch-Farmingfall eine Interaktion zwischen größerem Tierziel und Hacke: Ein Huhn übernahm die Bodenaktion. Bei einer Hacke und anvisiertem Gras/Erde/Acker hat jetzt die Bodenarbeit Vorrang. Tiere bleiben mit anderen Gegenständen bedienbar; der fehlgeschlagene Test wird nicht umgeschrieben. [Fehlerkontext](artifacts/v071/hoe-animal-priority-context.md). Die Korrektur wird nach Ende des unverändert weiterlaufenden Diagnosebundles eigens gebaut und nachgeprüft.


Der folgende unveränderte Truhenfall zeigte dasselbe Problem bei einer Möbelaktion. Die Zielauswahl nutzt deshalb zuerst das tatsächliche sichtbare Tiermesh; das zusätzliche Zielhilfepolster darf kein genauer anvisiertes Möbel oder eine verdeckende Weltfläche verdrängen. Das gilt auch für die Third-Person-Parallaxenkorrektur. [Truhen-Fehlerkontext](artifacts/v071/chest-animal-priority-context.md). Beide vorhandenen Fälle werden auf dem korrigierten Produktionsbuild nachgeprüft.
