# BLOCKBOOM v0.5 – NIGHTFALL

## Ausgangslage

12. November 2026: sauberer `main` auf `acb9cf4`, identisch mit `origin/main`. v0.4.0 ist online (Bundle `index-B6xNo-vd.js`), Pages-Lauf `43304890633` erfolgreich. Vor Änderungen erneut TypeScript strict, 43/43 Unit-/Integrationstests und Produktionsbuild bestanden. Entwicklung auf `feature/v05-nightfall`.

## Architekturentscheidungen

- Save v1 und Extension v1 bleiben erhalten; NIGHTFALL wird als eigener validierter Unterdatensatz ergänzt. Die Weltedition 4 wird nicht verändert. Vor dem Upgrade einmalige lokale Sicherung `blockboom.save.pre-v05`.
- Tag/Nacht, Versorgung, Crafting, begrenzte Zombie-Simulation, Bauteile und Schreibkampf erhalten unabhängige Module. Three.js-Ansichten verwenden geteilte Geometrien/Instancing.
- Permanente Gebäudeschäden bleiben standardmäßig aus. Bestehende Saves starten im Kreativmodus; neue Welten im Survivalmodus. Lern-Challenge bleibt unabhängig davon Standard.
- Gegnerzahl und Wellen sind begrenzt; keine Physikengine, keine neuen Laufzeitabhängigkeiten.
- Reale iPhone-/Android-Abnahme und 30-FPS-Nachweis bleiben gesondert offen.

## Implementierter Spielabschnitt

### Tageslauf und Atmosphäre

- Kontinuierlicher Zyklus mit Morgen, Mittag, Abend, Sonnenuntergang, Nacht und Sonnenaufgang; Standard 1.200 Sekunden (20 Minuten).
- Bewegte Sonne, Mond, 90 Sterne, veränderliche Himmels-/Nebelfarben und sanfte Lichtübergänge. Nacht bleibt zur Orientierung ausreichend hell.
- Tageslänge zwischen 2 und 60 Minuten wählbar. Im Kreativmodus sind alle sechs Tagesphasen direkt auswählbar.
- Lokal erzeugte Tages-/Nacht-, Zombie- und Treffergeräusche bei eingeschaltetem Sound. Keine externen Audiodateien.

### Zombies und Kampf

- Wanderer (55 LP), Sprinter (34 LP) und Koloss (110 LP) unterscheiden sich in Silhouette, Farben, Geschwindigkeit, Lebenspunkten und Schaden.
- Ein gemeinsames InstancedMesh rendert Kopf, Körper, Arme, Beine, Augen und Mund aller Gegner. Gehen, Angriff, Trefferreaktion und Niederlage sind sichtbar und ohne realistische Verletzungsdarstellung.
- Zustände: Idle, Wandern, Entdecken, Verfolgen, Angreifen, Rückzug und Besiegt. Die KI prüft Sichtlinie und gemeinsame AABB-Kollision mit der Blockwelt. Begrenzte Wegsuche umrundet Hindernisse; massive Wände schützen den Spieler.
- Spawns werden auf Abstand zum Spieler, belegte Position, tragenden Boden, andere Gegner und Dächer geprüft. Keine Spawns in Häusern oder im Spieler.
- Erste Nacht zwei Wanderer, zweite drei; ab Nacht drei Sprinter, ab Nacht vier Kolosse, ab Nacht fünf gemischte Verteidigungswelle. Höchstens sechs Wellengegner; harte Rendering-/KI-Grenze acht, bei reduziertem Renderfaktor vier. Sinkende Grenze entfernt die entferntesten überschüssigen Gegner.
- Friedlich entfernt Gegner sofort. Normal und Herausfordernd verändern Geschwindigkeit/Schaden. Schwierigkeit ist jederzeit änderbar.
- Separater Touch-Angriffsbutton; auf Desktop zusätzlich F. Sichtbarer Arm mit Holzknüppel, Holzschwert, Steinschwert, Axt, Steinaxt, Spitzhacke, Bogen, Angel und allen bisherigen Werkzeugen. Waffen unterscheiden Reichweite, Schaden und Cooldown.
- Der Bogen verwendet eine räumlich begrenzte Trefferprüfung mit Sichtlinie und benötigt im Survival Pfeile. Treffer geben Partikel, Animation und optional Ton; es gibt keine blutigen Effekte.

### Survival, Nahrung und Fortschritt

- Gesundheit, Hunger, einfache Regeneration, Nahrung und kurze Unverwundbarkeit nach einem Treffer. Hunger allein verursacht keinen Tod.
- Beeren werden nahe Bäumen gesammelt. Bestehende v0.4-Fische können über einen einfachen Feldkocher zu Fischgerichten verarbeitet werden. Essen erhöht Hunger und Gesundheit.
- Nach einer Niederlage erfolgt ein freundlicher Wiedereinstieg am Startpunkt mit zwölf Sekunden Schutz. Welt, Angelinventar und Materialien bleiben erhalten.
- Gegner geben Schnur, gelegentlich Kohle; Siege und überstandene Nächte geben Abzeichen. Rüstung reduziert Schaden. Keine wesentliche Survival-Funktion ist an Lernaufgaben gebunden.
- Bestehende Saves starten zur Wahrung des bisherigen freien Bauens in Kreativ. Neue Welten starten in Survival mit frei verfügbaren Grundwerkzeugen und einem kleinen Schutzhaus. Der Modus ist jederzeit umstellbar.

### Bauen, Schutzhaus und Werkbank

- Insgesamt 25 Baumaterialien, darunter Türen, Tore, Zäune, Leitern, Treppen, Fackeln, Fallen, Lagerkisten, Mauern und Barrieren. Glas bleibt das frei baubare Fenstermaterial.
- Türen/Tore werden zwei Blöcke hoch gesetzt. Interagieren öffnet/schließt beide Zellen; Schließen wird verhindert, wenn die Figur im Durchgang steht.
- Treppen haben halbe Blockhöhen und tatsächliche Stufenkollision. Leitern tragen beim Vorwärtsgehen oder Springen nach oben.
- Fackeln haben eigene Modelle und beleuchten über maximal drei nächstgelegene, schattenlose Punktlichter die Umgebung.
- Zäune, Mauern und Barrieren stoppen Gegner; Fallen schädigen tatsächlich berührende Gegner.
- Wanderer und Kolosse können Tür-/Torschaden erzeugen. Standardmäßig bleiben Türen vollständig erhalten, Schaden ist reparierbar und wird morgens zurückgesetzt. Erst nach ausdrücklichem Einschalten von dauerhaftem Gebäudeschaden dürfen Türen/Tore zerstört werden. Andere Gebäude werden von Gegnern nicht entfernt.
- Lagerkisten übertragen echte Materialmengen zwischen Spieler und gemeinsamem lokalem Lager.
- 21 nachvollziehbare Rezepte einschließlich Bretter, Schwerter, Steinaxt, Spitzhacke, Holzkohle, Fackeln, Schnur, Rutenstück, Bogen, Pfeilen, Bauteilen und Rüstung. Survival prüft Zutaten und verbraucht sie atomar; Kreativ produziert ohne Verbrauch.
- Rutenstücke schalten die bereits vorhandene Spinnrute frei. Das Angelspiel bleibt vollständig nutzbar.
- Neue Schutzhaus-Basis wird durch einen gespeicherten Schalter deterministisch wiederhergestellt; gespeicherte Welt-Deltas werden danach angewendet. Alte Welten erhalten kein ungefragt darübergebautes Haus.

### Schreibkämpfe

- Wortmagie wird bei einem konkreten Zombie in maximal zwölf Blöcken Reichweite angeboten. Die Welt pausiert während der Texteingabe; Gegner können dabei nicht unkontrolliert angreifen.
- Zwölf Aufgaben in vier Stufen: Fachwörter, kurze Sätze, Korrektur von Rechtschreibung/Grammatik und anspruchsvollere Satzstrukturen. Der Aufstieg richtet sich langsam nach erfolgreichen Zaubern.
- Richtige Eingaben treffen den ausgewählten echten Gegner. Fehler geben Hinweise und erlauben beliebig ruhige Wiederholung. Ein gelöster Zauber kann nicht mehrfach belohnen.
- Vorlesen mit lokaler deutscher Web-Speech-Stimme, Hinweise, Abbruch und normale Waffen bleiben verfügbar.
- Freiwillige, standardmäßig ausgeschaltete Bonuszeit von 75 Sekunden. Auch nach Ablauf bleibt die Aufgabe lösbar; es gibt keinen Lebensverlust durch Schreibfehler oder Zeitablauf.
- Rechtschreib-Erfolgsverlauf und Eingabetempo werden getrennt gespeichert. Bei Diktat über die Gerätetastatur wird kein Tempo erfasst. Keine Aussage zur Verbesserung der Handschrift.
- Bildschirmtastatur und physische Tastatur werden unterstützt. Panels nutzen die sichtbare Viewporthöhe und bleiben bei reduzierter Höhe scrollbar.

## Architektur und geänderte Dateien

Neue Module unter `src/nightfall/`:

| Datei | Verantwortung |
| --- | --- |
| `State.ts` | Save-Validierung, Gesundheit, Nahrung, Wiedereinstieg |
| `DayCycle.ts` | Zeitlogik, Tagesphasen, Himmel, Sonne/Mond/Sterne |
| `Zombies.ts` | begrenzte KI, Spawns, Pfadsuche, Sichtlinien, Waffen/Wellen |
| `Defense.ts` | gemeinsame Formkollision, Türen, Schäden, Schutzhaus |
| `Crafting.ts` | Rezepte, Bestände, atomarer Verbrauch, Kochen |
| `Writing.ts` | Aufgaben, Hilfe, adaptive Auswahl, getrennte Tempowerte |
| `Views.ts` | instanzierte Gegner/Bauteile, begrenztes Fackellicht, Audio |
| `NightUI.ts` | Werkbank, Proviant, Kiste, Einstellungen, Schreibkampf |

Bestehende Module wurden gezielt ergänzt: `Equipment.ts`, `Save.ts`, `World.ts`, `Renderer.ts`, `Player.ts`, `HeldTools.ts`, `main.ts`, `style.css`. Die bestehende Lernengine und alle 120 Aufgaben bleiben erhalten. Der Hauptkoordinator verbindet die neuen Module mit dem bestehenden Spiel; kein Rewrite und keine neue Laufzeitabhängigkeit.

## Save-Kompatibilität

- `blockboom.save` und Save-Version 1 bleiben unverändert. Neue Daten liegen unter `extension.nightfall.version = 1`. Weltedition 4 bleibt bestehen.
- Vor dem ersten Upgrade eines älteren Saves wird einmalig `blockboom.save.pre-v05` gesichert. Alte Sicherungsschlüssel und das separate Lernprofil bleiben erhalten.
- Gespeichert: Tageszeit/Länge, Nacht-/Wellenfortschritt, Gesundheit/Hunger, Modus/Schwierigkeit, Nahrung/Vorräte, hergestellte Gegenstände, Kisteninhalt, Türschaden, Schreibkampfoptionen sowie getrennte Erfolgs-/Tempowerte.
- Offene Türen/Tore sind gültige gespeicherte Blockzustände. Alte Blocknamen, Fischzahlen, Fangrekorde, Ausrüstung und Weltänderungen bleiben gültig.
- Aktive Gegnerpositionen sind sitzungsgebunden; eine bereits gestartete Welle wird nach Reload nicht dupliziert. Nachtzähler, besiegte Gegner und Belohnungen bleiben gespeichert.
- Speicherfehler werden weiterhin im HUD angezeigt; private Browsermodi oder gelöschte Website-Daten können lokalen Fortschritt entfernen. Es gibt weiterhin keine Cloud-Synchronisierung.

## Tests und Befunde

- Baseline: 43/43 Logiktests, TypeScript strict und Build bestanden; v0.4-Workflow und Live-Bundle erneut geprüft.
- Aktueller Logikkern: 58 Tests in neun Dateien, darunter 15 neue NIGHTFALL-Fälle. Der zusätzliche Langzeittest simuliert eine Stunde in 0,1-Sekunden-Schritten mit festen Gegnergrenzen und prüft alle Positionen auf gültige Werte. Das ist ein Simulationstest, kein einstündiger realer Gerätetest.
- Neue Browserfälle bedienen Werkbank, Proviant, Tür, Nahkampf, Niederlage, Schreibkampf und Einstellungen über echte UI-Eingaben. Der Dreifinger-Fall verwendet reale Chromium-Touchereignisse für Joystick, Kamera und separaten Angriff.
- Getestete Schreibkampf-Viewports: 667×375, 844×390, 932×430; jeweils zusätzlich auf 240 CSS-Pixel Höhe reduziert, um die nutzbare Fläche mit geöffneter Tastatur zu prüfen.
- Die vorhandenen Regressionen prüfen weiterhin acht Fischarten, echten Wurf/Biss/Drill, Fangbuch, Bauen/Undo/Reload, drei Missionen, lokale Sprachausgabe/Fallback, Touch-/Pointercancel, Browserwechsel und Pages-Unterpfad.
- Zwischenlauf: 38/40 alte Browserfälle bestanden. Ein Angeltest griff vor dem nächsten Renderframe auf eine noch ausgeblendete Taste zu; er wartet nun ausdrücklich auf Sichtbarkeit. Ein Drilltest endete im langsamen Software-WebGL zu früh; das Testzeitbudget wurde angepasst, ohne Spielzustände zu überspringen.
- Bei der Türprüfung war die Bewegung zu kurz im Software-Renderer. Der Test wartet nun auf die tatsächlich gemessene Position hinter der Tür. Ein Touchtest hatte die falschen Kontakte beendet; aufgezeichnete Pointer-Ereignisse zeigten die Ursache. Beide korrigierten Fälle bestanden erneut.
- Vollständige Produktions-Browsersuite: **52/52 bestanden**, 7,7 Minuten, Chromium mit Software-WebGL. Zuvor hatte ein Lauf 51/52 erreicht, weil die Spawn-Abfrage noch den Diagnosewert des Startbildschirms las. Die korrigierte Abfrage wartet auf den echten ersten Spawn.
- Nach der letzten Desktop-Waffenwechsel-Korrektur erneut **13/13** NIGHTFALL-/Pages-Fälle bestanden. Nach der Normalisierung abgebauter offener Türen erneut **4/4** gezielte Fälle für Crafting/Waffenwechsel, Hausdurchgang, Tür-Abbau/Undo/Reload und mehrstufiges Bauen/Undo bestanden. Der neue Türfall erweitert die verfügbare Suite auf 53 Fälle; es wird kein vollständiger 53er-Durchlauf behauptet.
- TypeScript strict, 58/58 Logiktests und Produktionsbuild nach den abschließenden Änderungen erneut bestanden. Letztes lokales Spielbundle: `index-BRhEF1WY.js`.

## Performance

- KI wird zehnmal pro Sekunde aktualisiert. Wegsuche ist auf 500 Zellen und höchstens etwa eine Neuberechnung pro Sekunde/Gegner begrenzt.
- Alle Gegner verwenden ein InstancedMesh mit gemeinsamer Boxgeometrie und Material. Bauteile werden gemeinsam instanziert und nur bei Weltänderungen neu aufgebaut; Fackelpositionen werden dabei gecacht.
- Maximal drei schattenlose Fackellichter, 90 Sterne, acht Gegner (sparsam vier) und weiterhin insgesamt höchstens 48 aktive Effektpartikel.
- Gemessener Zwischenstand der neuen Startwelt: 79 Draw Calls, 21.982 Dreiecke, 42 Geometrien, 10 Texturen, 17 Chunk-Meshes. Nach wiederholtem Bauen/Undo stabil bei 46 Geometrien und 10 Texturen.
- Produktionsbundle etwa 193 kB Spielcode (62 kB gzip), 493 kB Three.js (123 kB gzip), 21,7 kB CSS (5,7 kB gzip).
- Software-WebGL bestätigt Funktionen und begrenzte Ressourcen, keine repräsentative Smartphoneleistung. Echte 30 FPS, Wärme, Akku und Safari-Verhalten auf Hardware sind offen.

## Bekannte Grenzen und bewusst verschoben

- Stilisierte, begrenzte Wegsuche: Kein Navigation-Mesh, keine komplexen Sprünge oder Tunnelplanung. Unzugängliche Häuser bleiben geschützt; ein Gegner kann an einem unlösbaren Hindernis stehen bleiben.
- Bauteile haben eine feste Ausrichtung; keine freie Rotation. Zäune/Barrieren verwenden konservative Blockkollision. Kisten teilen sich ein gemeinsames Lager.
- Der Bogen benutzt einen sofortigen räumlichen Treffer statt ballistischer Projektilphysik. Rüstung ist ein Schadensbonus ohne eigenes angelegtes Körpermodell.
- Der Feldkocher ist eine einfache Grundausrüstung im Proviantmenü; noch keine zusätzliche Feuerstellen-/Temperatursimulation. Keine Landwirtschaft, kein komplexer Crafting-Baum, keine Werkzeugabnutzung.
- Nur Türen/Tore können optional dauerhaft beschädigt werden. Keine unkontrollierte Zerstörung ganzer Häuser.
- Keine aktive Mikrofonaufnahme in der App. Optionales Diktat verwendet die Gerätetastatur und schaltet die Tempowertung ab.
- Kein Offline-Service-Worker, kein Save-Export/Import, keine realen iPhone-/Android-Tests.

## Bedienung und echte Geräteabnahme

1. Live-URL öffnen und `NIGHTFALL · v0.5.0` prüfen. Vorhandene Welt, Fänge und Bauwerke kontrollieren. Website-Daten nicht löschen.
2. Querformat verwenden. Unter Menü → NIGHTFALL Spielweise, Schwierigkeit und Tageslänge wählen. In Kreativ lässt sich Nacht sofort wählen; Friedlich entfernt Gegner.
3. Holzknüppel oder Schwert ausrüsten. Links laufen, rechts umsehen, mit separatem Schwertknopf angreifen; Desktop F. Zwei Steuerfinger und ein zusätzlicher Angriff müssen unabhängig funktionieren.
4. Türen/Tore anvisieren und Öffnen/Schließen benutzen. Hinter einer geschlossenen Tür/Wand Schutz prüfen. Neue Welten besitzen ein Haus neben dem Startpunkt.
5. Holz/Stein abbauen, an der Werkbank Bretter und Holzschwert herstellen. Zutaten zählen. Fisch im Proviant zubereiten, essen, Kisten beladen und nach Reload vergleichen.
6. Bei einem nahen Zombie Wortmagie aktivieren. Fehler, Hinweis, Vorlesen, richtige Antwort, Abbruch und freiwillige Zeitanzeige prüfen. Tastatur öffnen, scrollen und im Querformat antworten.
7. Einen normalen Kampf bis zur Niederlage spielen und den Wiedereinstieg prüfen. Inventar/Welt müssen bleiben. Anschließend speichern, Browser wechseln, Reload und Rückkehr testen.
8. Das komplette v0.4-Angeln weiter testen: Kraftwurf, Biss, Drill, Zurücksetzen, Versorgen und Fangbuch.
9. Mindestens 20–30 Minuten auf echtem iPhone/Safari und Android/Chrome spielen. Gerät/Browser, Ruckeln, Temperatur, Akku, Safe Areas und Tastaturbesonderheiten protokollieren.

## Commits und Release

- `4de6fc2` – Audit NIGHTFALL baseline and save boundaries
- `81bf993` – Implement NIGHTFALL day cycle survival defense and word combat
- `e2d40c6` – Harden NIGHTFALL collisions mobile combat and regression coverage
- `528bfa3` – Wait for actual night spawn in browser assertion
- Abschließender Commit für gültige Tür-Vorräte und hergestellte Waffen per Q: siehe Git-Historie unmittelbar vor der Release-Dokumentation.
- Noch keine Veröffentlichung von v0.5 bestätigt. Erst erfolgreicher Pages-Lauf und Abruf des neuen Live-Bundles schließen den Release ab.

## Vorschläge für v0.6

1. Reale Gerätebefunde priorisieren; Safe-Area-/Tastaturfehler und gemessene Frame-Engpässe beheben.
2. Baustoffrotation, besseres Türmodell und getrennte Kisten; kompakte Bauwerkzeuge für Basisverteidigung.
3. Bogenprojektil und deutlicheres, niedrig aufgelöstes Trefferfeedback; Gegner-Navigation in komplexeren Häusern verbessern.
4. Save-Export/Import und wählbare lokale Wiederherstellung ergänzen.
5. Schreibkämpfe mit differenziert wählbarer Schreibmenge erweitern; individuelle Erfolge ohne Leistungsdruck sichtbar machen.
