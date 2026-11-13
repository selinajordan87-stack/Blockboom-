# BLOCKBOOM v0.6 – LIVING WORLD

## Audit

13. November 2026: sauberer `main` auf `e5da842`, gleich `origin/main`. v0.5 online mit `index-BRhEF1WY.js`, Pages-Lauf `43313545310` erfolgreich. Erneute Baseline: TypeScript strict, 58/58 Logiktests und Produktionsbuild bestanden. Entwicklung auf `feature/v06-living-world`.

## Technische Grenzen

- Der 48×48-Ursprung und Weltedition 4 bleiben erhalten. Neue Regionen liegen außerhalb dieses Bereichs. Äußere Chunks werden deterministisch geladen und entladen; gespeicherte Deltas gewinnen gegen die Generierung.
- Speicherformat v1 bleibt; additive Erweiterung `living.version = 1`, einmalige Sicherung `.pre-v06`. Haustiere, Pflanzen, Truhen und Fortschritt werden einzeln validiert.
- Keine neuen Laufzeitabhängigkeiten. Originale Voxelmodelle, feste Tier-/Gegnergrenzen, geteilte Geometrien und vorhandene Chunk-Neubauten.
- Reale Smartphone-FPS und iPhone-/Android-Abnahme bleiben offen.

## Tatsächlich implementierter Spielabschnitt

### Regionen, Höhlen und Bergbau

- Welt in einem 120×120-Rahmen statt bisher 48×48: Wiesenland, dichter Wald, Silbergebirge, großer See mit Fluss, Kupferhöhlen und verlassene Siedlung. Das bisherige Zentrum wird nicht neu generiert. Höhen, Waldformen, Gewässer und Gebäude unterscheiden die Außenregionen.
- 12×12-Chunks: die 16 ursprünglichen Chunks bleiben geladen; äußere Chunks folgen der Spielerposition mit begrenztem Radius. Höchstens 37 Chunks sind aktiv. Beim normalen Gehen wird höchstens ein neuer Chunk je Bild erzeugt, der Ladepunkt vor Spielstart synchron vorbereitet. Entfernte Geometrien werden freigegeben, angrenzende Flächen neu sichtbar gemacht.
- Echte begehbare Höhle mit abfallendem Eingang, Kammer und tieferem Seitenzweig. Unterirdische Positionen bleiben nach Reload gültig. Äußerer Weltboden bei −18; das alte Fundament bei −3 bleibt erhalten.
- Stein, Kohle-, Kupfer-, Eisen- und Goldvorkommen. Erzabbau startet mit −/Entfernen und benötigt sichtbare Arbeitszeit bei gleichbleibendem Ziel. Bessere Spitzhacken verkürzen die Zeit; Eisen benötigt Kupfer-, Gold eine Eisenspitzhacke. Pausieren oder Wegblicken bricht sicher ab.
- Erze werden als echte Vorräte aufgenommen; Kohle liefert auch Brennstoff. Ofen → Barren → bessere Spitzhacke verbindet Erkundung und Ausrüstung. Fackeln sind weiterhin platzierbar, aufnehmbar und beleuchten dunkle Bereiche über die begrenzten vorhandenen Lichter.

### Zuhause, Inventar und Herstellung

- 39 Baustoffe, darunter Bett, Tisch, Stuhl, Regal, Truhe, Werkbank, Ofen, Laterne, Teppich und vier Erze. Glasfenster, Türen und alle bisherigen Bauteile bleiben vorhanden. Freies Bauen, Vorschau, Kollision und bis zu 20 Undo-Schritte bleiben erhalten.
- Bett prüft Dach, Wände und nahe Zombies, springt dann zum Morgen und regeneriert Gesundheit. Laternen nutzen dieselbe Begrenzung auf drei nächstgelegene Punktlichter wie Fackeln. Dekorationsmöbel sind sichtbar und abbaubar; es werden keine zusätzlichen Sitz-/Leseanimationen behauptet.
- Jede neue Truhe besitzt einen eigenen gespeicherten Inhalt, adressiert durch ihre Weltzelle. Rein/Raus verschiebt jeweils ein tatsächliches Exemplar. Volle Truhen müssen vor dem Abbauen geleert werden. Alte `Lagerkiste`-Blöcke behalten das bisherige gemeinsame NIGHTFALL-Lager.
- Rucksack mit stabilen Gegenstands-IDs, Namen, Symbolen, Kategorien und Mengen. Materialien, Fische, Nahrung, Waffen, Werkzeuge, Ausrüstung und besondere Funde werden über bestehende Speicherbestände zusammengeführt. Keine Duplizierung der alten Inventardaten.
- Zwölf neue Werkbankrezepte und sechs Ofenrezepte ergänzen die bisherigen 21 NIGHTFALL-Rezepte. Kupfer/Eisen/Gold werden mit Kohle verhüttet; Brot, Ofenkartoffel und Gemüsesuppe verwenden tatsächliche Ernte. Gebratener Fisch bleibt im vorhandenen Proviantmenü verfügbar.
- Survival verbraucht Zutaten und prüft hergestellte Werkzeuge. Kreativ behält unbegrenztes Bauen. Hacke, Kupfer- und Eisenspitzhacke erscheinen in der vorhandenen Werkzeugauswahl und Handdarstellung.

### Tiere und Garten

- Sechs dauerhaft gespeicherte Tiere: Wolf, Katze, Huhn, Kuh, Schaf, Schwein. Geteilte Voxelgeometrie mit angepassten Größen, Körperformen, Hörnern beziehungsweise Flügeln, Farben und Gehanimation. Wander-/Ruheverhalten, Fressen und Schlafzustand sind vorhanden.
- Zweimal passendes Futter gewinnt Vertrauen; danach Namen vergeben, Folgen/Warten/Schlafen, Streicheln und sicheren Aufenthaltsort speichern. Tiere sterben nicht; ein zu weit entfernter Begleiter wird an eine freie, tragfähige Stelle nachgeführt. Wartende und schlafende Haustiere werden ebenfalls aus neu gebauten Blöcken gerettet, ohne ihren gemerkten Heimatort zu überschreiben. Ein naher gezähmter Wolf warnt vor nahen Zombies.
- Begrenzung auf zwölf validierte Tiere, derzeit sechs initiale Tiere. Logik mit 5 Hz, Simulation im Umfeld von 30 Blöcken, Darstellung bis 32 Blöcke. Keine unbeschränkte Vermehrung oder Tier-Physik.
- Hacke bereitet Gras/Erde vor; gewählte Samen pflanzen auf freiem Acker. Weizen, Karotten, Kartoffeln und Kürbisse besitzen vier sichtbare Wachstumsstufen. Reife nach 120/150/180/210 gespeicherten aktiven Spielsekunden. Ernten gibt drei Erzeugnisse und zwei Samen; abgegrabener Acker verliert seine Pflanze.
- Ernte lässt sich essen oder im Ofen verarbeiten; Pflanzen und Tierfutter verbinden Farming, Angeln und Survival. Wachstum pausiert im Menü, Hintergrund und bei geschlossenem Browser. Kein Anspruch auf reale Landwirtschaftssimulation.

### Entdeckungen, Lernen und Orientierung

- Siedlung mit zwei Häusern, Schmiede, Wachturm und verborgenem Keller. Kurze Fundtexte erzählen von einer nach einem Sturm verlassenen Schmiede. Fundtruhen sind nicht frei herstellbar und belohnen nur einmal.
- Fünf aufeinander aufbauende Missionen prüfen tatsächliche Spielzustände: geschütztes selbst eingerichtetes Zuhause; gezähmtes benanntes Tier; Höhlenentdeckung plus drei abgebaute Rohstoffarten; Schmiedebauplan; geöffneter Bergschatz. Jede Mission belohnt einmal. Das Öffnen des Journals reicht nicht.
- ◇ öffnet Karte, Rucksack, Garten, Begleiter und Entdeckerpfad. Kompass mit Himmelsrichtung, Kartenposition und persönlicher Zuhause-Markierung.
- 24 neue Auswahlaufgaben für Deutsch, Mathematik, Englisch und Naturwissenschaften; insgesamt 144, alle bisherigen IDs und Fortschritte bleiben erhalten. „Passende Challenge“ berücksichtigt die aktuelle Region. Vorlesen, Hinweise, ruhige Wiederholung und Überspringen bleiben vorhanden. Fachniveau und Schreibmenge sind getrennte Datenfelder. Lern-Challenge bleibt Standard; Aufgaben öffnen sich nicht automatisch. Freie Texteingaben bleiben in den bisherigen Aufgaben und Schreibkämpfen erhalten; offene Englischdialoge sind noch nicht ergänzt.
- Bewegte Wolken, bestehender Tageslauf, Wasserbewegung und synthetische Tages-/Nachtgeräusche bleiben erhalten. Neues Tier- und Pflanzenrendering benötigt zusammen zwei InstancedMeshes.

## Architektur und geänderte Dateien

| Modul | Verantwortung |
| --- | --- |
| `src/living/Regions.ts` | deterministische Außenwelt, Regionen, Streaming, Höhle, Siedlung |
| `src/living/State.ts` | additive validierte Speicherstruktur, Tiere, Pflanzen, Entdeckungen |
| `src/living/Items.ts` | Gegenstandskatalog, Adapter über alte Bestände, Transfers und Rezepte |
| `src/living/Systems.ts` | Farming, Tierverhalten, Werkzeugstufen, Fund- und Missionsbedingungen |
| `src/living/LivingView.ts` | instanzierte Tiere/Pflanzen, großer See und Fluss |
| `src/living/LivingUI.ts` | Rucksack, Truhen, Werkbank/Ofen, Tiere, Garten, Karte, Journal, Bett |
| `src/learning/living-content.ts` | 24 regionale Aufgaben ohne Änderung alter Aufgaben-IDs |
| `scripts/measure-living.mjs` | reproduzierbare Produktionsmessungen/Screenshots in Chromium |

Gezielte Erweiterungen an `World.ts`, `Renderer.ts`, `Player.ts`, `Save.ts`, `Equipment.ts`, `Defense.ts`, `Views.ts`, `Zombies.ts`, `HeldTools.ts`, Lernengine, `main.ts` und CSS verbinden diese Module mit dem bestehenden Spiel. Tests liegen unter `src/tests/living.test.ts`, `rendering.test.ts` und `e2e/living-v06.spec.ts`; ältere Prüfungen wurden nur bei bewusst erweiterten Material-/Werkzeug-/Aufgabenzahlen angepasst. Paketversion und Startbildschirm zeigen v0.6.0. Keine neuen Abhängigkeiten, kein Rewrite und keine fremden Assets.

## Speicherkompatibilität und Grenzen

- `blockboom.save`, Rootversion 1, Extensionversion 1 und Weltedition 4 bleiben erhalten. Zusätze liegen in `extension.living.version = 1`. Das separate Lernprofil `blockboom.learning.v1` wird weiterverwendet.
- Vor erstmaligem Ergänzen alter Daten wird der unveränderte Rohstand unter `blockboom.save.pre-v06` gesichert, sofern der Browser das Schreiben zulässt. Frühere Sicherungen bleiben erhalten.
- Gespeichert: Welt-Deltas, Position/Blickrichtung, bisherige Angel- und Survivaldaten, Materialien/Ausrüstung, Truhen, Tiernamen/Verhalten/Aufenthaltsorte, Pflanzen mit Spielzeit, Zuhause, Regionen, Funde und Missionen.
- Generierung überschreibt niemals aufgezeichnete Änderungen: Beim Nachladen eines Außenchunks werden seine gespeicherten Deltas nach der Landschaft angewendet. Alte Gebäude im Zentrum bleiben an ihren Koordinaten.
- Grenzen: 50.000 Welt-Deltas, 100 gefüllte getrennte neue Truhen, 160 Pflanzen, zwölf Tiere. Leere Truhendatensätze werden bei Bedarf wiederverwendet; eine 101. gefüllte Truhe wird vor dem Einlagern abgewiesen. Übermäßige oder beschädigte Einträge werden validiert. Mehr als 50.000 Deltas ersetzen den letzten lesbaren Stand nicht; das HUD zeigt einen Speicherfehler. Diese Welt ist bewusst begrenzt.
- Die Datenmenge wird mit Delta-Speicherung begrenzt; vorerst keine Umstellung auf IndexedDB. Gemessen: 5.234 Byte UTF-16 für den kleinen Beispielstand; 2.478.300 Byte mit 50.000 Deltaeinträgen (`Kupfererz`). Das sind Messproben, keine universellen Maximalgrößen. Die echte Chromium-Quote wurde in einem isolierten Browserkontext ausgeschöpft: gescheiterter Spielstandschreibversuch erhält den alten Rohstand; nach Entfernen der Fülldaten funktioniert Speichern wieder.
- Bei weiterem Weltwachstum ist eine getestete IndexedDB-Migration mit Export/Import der nächste Schritt. Backups teilen die Herkunftsquote mit dem Spielstand; sehr große Altsicherungen und Weltstände zusammen können sie überschreiten. Ein privater Browser, gelöschte Website-Daten oder knapper Speicher können Fortschritt weiterhin beeinträchtigen; keine Cloud-Synchronisierung. HUD-Speicherfehler ernst nehmen: Änderungen nach dem letzten erfolgreichen Schreiben sind dann noch nicht dauerhaft gesichert.
- Gleichzeitige Änderungen in mehreren Tabs werden nicht zusammengeführt. Für einen Spielstand nur einen aktiven Tab verwenden; auf anderen Geräten/Browsern besteht jeweils ein eigener Stand.

## Tatsächlich ausgeführte Prüfungen

- Ausgangsstand v0.5: strict TypeScript, 58/58 Logiktests und Build bestanden; veröffentlichtes Bundle und erfolgreicher Pages-Lauf geprüft.
- Nach abschließender Stabilisierung einschließlich Sichtbarkeitskorrektur: strict TypeScript, **75/75 Unit-/Integrationstests** in zehn Dateien und Produktionsbuild bestanden. Aktuelles Bundle: `index-DE_B-dPy.js`, CSS `index-BWFNebq2.css`, Three.js `three-D1BCpSoH.js`.
- Erster vollständiger Produktions-Browserlauf unter `/Blockboom-/`: **59/59 bestanden**, 11,4 Minuten, Chromium/SwiftShader. Enthält alle 53 bisherigen Fälle und sechs neue verknüpfte Wohnwelt-Abläufe.
- Die neuen Fälle prüfen tatsächliche Höhlenbewegung/Reload, Entdeckung der Regionen, Erzabbau, Ofen/Werkzeugkette, Füttern/Benennen, mobiles Pflanzen/Ernten, Truhentransfer/Reload und alle fünf Missionen. Wachstumszeit wird im Browserfall nach echter Aussaat als gespeicherte aktive Zeit vorgerückt; es wird kein minutenlanges Echtzeitwarten behauptet.
- Gefundene Integrationsfehler wurden korrigiert: Schmiedeofen belegte dieselbe Zelle wie die Fundtruhe; ungeeignete Testpositionen im Gelände lösten den sicheren Wiedereinstieg aus; ein Truhentest zielte auf den Rand des Modells. Fehlerläufe sind keine bestandenen Prüfungen.
- Anschließend **7/7 neue Kernabläufe** nach den Streaming-/Speicherschutzänderungen erneut bestanden, einschließlich tatsächlicher Bettnutzung bis zum Morgen, voller Truhe und ausgefüllter Browserquote.
- Ein weiterer Gesamtlauf wurde nach 20 erfolgreichen Fällen wegen eines Renderer-Absturzes im Quoten-Stresstest abgebrochen: ein Fall fehlgeschlagen, ein laufender Fall bewusst unterbrochen, 41 noch nicht ausgeführt. Das vorherige Füllverfahren schrieb beim Annähern an die Quote viele große Werte in einer Schleife. Es wurde durch eine begrenzte binäre Suche mit Ereignisschleifen-Freigaben ersetzt. Kein Nachweis eines Absturzes beim normalen Speichern; der Fehler im Stresstest wird ausdrücklich nicht als erfolgreicher Test gezählt.
- Das korrigierte Quotenverfahren bestand anschließend **3/3 Wiederholungen** (46,4 Sekunden). Die drei neuen mobilen Karten-/Nahrungs-/Tiernamenfälle bestehen bei 667×375, 844×390 und 932×430, jeweils zusätzlich mit 240 Pixeln Tastaturhöhe.
- Vollständige Produktions-Browsersuite auf Release-Code `41805a1`: **63/63 bestanden**, 11,6 Minuten. Alle zehn neuen Fälle und alle 53 bisherigen Regressionen sind enthalten. Zusätzlich bestanden TypeScript strict, 74/74 Unit-/Integrationstests und der Build. Bau-/Undo-Plateau: beide Messungen 55 Geometrien und zehn Texturen.
- Nach der ersten Veröffentlichung bestanden **17/17 Live-Fälle** auf GitHub Pages, 5,2 Minuten: alle zehn neuen Abläufe, Angeln mit Reload, BOOM, kombinierter Touch-Spielablauf, Schreibkampf, Nahkampf, Dreifingersteuerung und Pages-Assets.
- Zusätzliche Randkontrolle: Der alte Zombie-Instancing-Sichtradius 60 deckte die neue Welt nicht vollständig ab. Ein reproduzierbarer Kamerafrustum-Test zeigt einen tatsächlich sichtbaren Gegner bei (57,5 / 1 / 57,5), während dessen InstancedMesh fälschlich ausgeblendet wurde. Dieser Fall schlug vor der Korrektur fehl. Der Radius wird jetzt aus Weltgrenze und Bauhöhe abgeleitet; der Test besteht. Die erste Testfixture wurde zuvor auf die tatsächliche Bodenhöhe der Spawnprüfung korrigiert.
- Nach dieser eng begrenzten Grafikänderung (`a2be6c9`): erneut strict TypeScript, **75/75 Tests**, Produktionsbuild und **14/14 gezielte NIGHTFALL-/Pages-Browserfälle** bestanden (2,2 Minuten). Es wird kein weiterer vollständiger 63er-Durchlauf nach dieser Änderung behauptet. Danach dieselben **14/14 Fälle direkt auf dem korrigierten GitHub-Pages-Bundle bestanden** (2,2 Minuten), einschließlich Kampf, Dreifingersteuerung, mobiler Tastaturhöhe, Save/Reload und Pages-Assets.

## Performance-Befunde

- Terrain bleibt in zusammengeführten Chunk-Meshes mit gemeinsamem Atlas, zwei Tier-/Pflanzen-InstancedMeshes und gemeinsam instanzierten Möbeln. Sichtgrenze 48, adaptive Renderauflösung 0,75 bis eingestellte Obergrenze, drei schattenlose lokale Lichter, höchstens acht Zombies (reduziert vier), maximal 48 Effektpartikel.
- Acht vollständige Regionswechsel im Integrationstest: maximal 59.675 geladene Blöcke und 38 Chunk-Meshes; 163 ersetzte Geometrien wurden freigegeben. Verbleibende Geometrien entsprechen den noch vorhandenen Meshes. Das prüft Ressourcenfreigabe, ist kein unbegrenzt langer Heap-Leak-Nachweis.
- Vollständige synchrone Regionssprünge benötigten im Container je nach Testlast bis etwa 404 ms. Deshalb lädt normales Gehen nur einen neuen Chunk je Bild. Initiales Laden sowie Chunk-Grenzen können weiterhin kurze Arbeitsspitzen verursachen. Eine Worker-/Geometrie-Pipeline wäre für wesentlich größere Welten geeigneter.
- Mit `node scripts/measure-living.mjs` wurden bei emuliertem DPR 2 beide Qualitätsobergrenzen isoliert geprüft (Messstand `index-D5rHhqjK.js`). Keine gleichzeitige Testlast; je Probe etwa 2,3 Sekunden Messfenster nach Spielstart. Rohdaten: `artifacts/v06/measurements.json`. Die automatische Absenkung nach längerer Last ist in diesen kurzen Proben noch nicht aktiv.

| Landscape-CSS-Pixel | Software-FPS bei Faktor 1 | Software-FPS bei Faktor 1,5 | Draw Calls / Dreiecke |
| --- | ---: | ---: | ---: |
| 667×375 | 20,0 | 13,1 | 68 / 23.788 |
| 844×390 | 18,2 | 12,5 | 71 / 24.920 |
| 932×430 | 15,3 | 9,0 | 71 / 24.920 |

- Dies ist Chromium/SwiftShader auf einem Cloud-Container, kein Smartphone und kein GPU-Benchmark repräsentativer Hardware. Das Ziel stabiler 30 FPS auf realen Geräten bleibt offen. Die Messung zeigt den erwarteten Vorteil reduzierter Pixelzahl, keine zugesicherte Gerätegeschwindigkeit.
- Startproben: 57 Geometrien, zehn Texturen und 28 Chunk-Meshes bei 26 aktiven Chunks. Heap-Schnappschüsse etwa 28–32 MB; daraus lässt sich kein langfristiger Heap-Verlauf ableiten. Außenregionen in den sechs aufgenommenen Ansichten: 13–70 Draw Calls, 10.412–23.800 Dreiecke, höchstens 60.380 geladene Blöcke. Keine JavaScript-Seitenfehler bei diesen Messungen.

## Bewusst begrenzte oder verschobene Funktionen

- Keine Endloswelt, keine umfassende Terrain-Erosion, kein dynamisches Grundwasser. Große Außenwasserfläche und Fluss sind erkundbare Landschaft; die vier vollständig interaktiven v0.4-Angelplätze bleiben unverändert. Eine zusätzliche Fischpopulation im neuen Großsee ist noch offen.
- Keine Tierzucht, Milch-/Eier-/Wollwirtschaft oder Schadenssimulation für Haustiere. Streicheln gibt Feedback/Ruhezustand, keine eigene Handanimation. Schlafen von Tieren ist ein persistenter Ruhemodus.
- Tiere bewegen sich mit einfacher Bodensuche und Blockkollision, ohne vollständige Wegsuche. Komplexe Mauern können einen Begleiter kurz aufhalten; bei größerem Abstand greift die sichere Nachführung. Es gibt keine irreversible Haustierniederlage.
- Keine laufenden Ofenwarteschlangen, Brenndauer oder geteilten Multiplayer-Kisten; Herstellung erfolgt nach Zutatenprüfung direkt. Werkbankrezepte sind auch über ◇ erreichbar, damit Grundfortschritt nicht blockiert wird. Einmalige Grundwerkzeuge und hergestellte Werkzeugfreischaltungen bleiben persönliche Ausrüstung und sind nicht in Truhen verschiebbar; Materialien, Fische, Nahrung und Vorräte sind es.
- Möbel außer Bett, Ofen, Werkbank, Truhe und Laterne sind Dekoration. Kein Sitzsystem und keine editierbare Bücherbibliothek. Die Siedlung besitzt kurze Fundtexte, keine umfangreiche NPC-Geschichte.
- Keine individuell verschiebbaren Touchflächen, Third-Person-Kamera oder neue regionenabhängige Audiobibliothek. Bestehende FOV-/Empfindlichkeits-/Zoom-/Safe-Area-Funktionen bleiben erhalten.
- Kein echter iPhone-/Android-/WebKit-Gerätetest in dieser Umgebung. Automatische Tests verkleinern die Viewporthöhe, öffnen aber keine reale iOS-Tastatur. Smartphone-Temperatur, Akkulast und langes Spielen müssen am Gerät geprüft werden.

## Start und konkreter iPhone-/Android-Testplan

1. Lokal: `npm ci`, `npm run dev`, dann `http://localhost:5173/Blockboom-/`. Produktionsprüfung: `npm run build` und `npm run preview -- --port 4206`. Die Tests erwarten Chromium unter `/usr/bin/chromium`.
2. Am Smartphone die öffentliche Adresse in Safari beziehungsweise Chrome öffnen, neu laden und auf **v0.6.0** achten. Keine Website-Daten löschen. Zum Erhalt alter Daten denselben Browser verwenden. Querformat einschalten, Rotationssperre gegebenenfalls lösen.
3. Zwei Daumen gleichzeitig: links gehen, rechts umsehen, einzelnen Finger lösen, danach Springen/Abbauen/Angreifen testen. Währenddessen darf kein Pausenmenü erscheinen. Browser kurz verlassen: sichere Unterbrechung, anschließend bewusst weitergehen.
4. ◇ → Karte: Höhle im Nordosten, Siedlung im Südosten aufsuchen. Außerhalb des Zentrums bauen, abbauen, kurz in eine andere Region gehen und zurückkehren; speichern, Tab schließen und erneut öffnen. Bauwerk und Blickrichtung prüfen.
5. Mit Spitzhacke Kohle/Kupfer abbauen, im Ofen Kupfer herstellen und Kupferspitzhacke bauen; Eisen darf erst damit abbaubar sein. Fackel in der Höhle platzieren und aufnehmen.
6. Bett, Tür und Laterne in einem geschlossenen Haus platzieren; sicher schlafen und Morgen prüfen. Truhe platzieren, Material/Fisch einlagern, neu laden und wieder entnehmen. Eine gefüllte Truhe darf beim Abbauen keinen Inhalt verlieren.
7. Wolf oder Katze mit zwei Fischen/Fischgerichten zähmen, Namen mit Bildschirmtastatur eingeben. Folgen/Warten und Reload prüfen. Hacke herstellen, Samen auswählen, vier Beete anlegen; während aktiven Spiels wachsen lassen, ernten und Nahrung herstellen/essen.
8. Alle fünf Entdeckermissionen verfolgen: Zuhause → Begleiter → drei Höhlenrohstoffe → Schmiedebauplan → Bergschatz. Keine Belohnung allein für geöffnetes Journal.
9. Regression: werfen/Biss/Drill/Fangentscheidung, BOOM/Reset, Nachtgegner hinter geschlossener Tür, Waffenangriff und freiwilliger Schreibkampf. Regionale Challenge mit Vorlesen/Hinweis und falscher Antwort ausprobieren.
10. Mindestens 20–30 Minuten spielen, beide Auflösungen vergleichen und auf Ruckler, Wärme, unlesbare/überdeckte Bedienelemente sowie Speicherfehler achten. Gerät, OS, Browser und konkrete Schritte bei Fehlern notieren. Das ist die separate Geräteabnahme.

## Commits und Veröffentlichung

- `25156d2`: Audit und Schutz des bisherigen Welt-/Speicherstands.
- `b1ccf11`: verknüpfte Regionen, Streaming, Höhlen, Einrichtung, Tiere, Garten, Missionen und regionale Lerninhalte.
- `e5db9e2`: Save-/Truhenschutz, gestaffeltes Nachladen, stabile Missionsprüfung, verbundene Browser-/Logikregressionen und Messskript.
- `41805a1`: sichere Haustierpositionen auch beim Warten/Schlafen, feste Truhengrenze ohne stillen Inhaltsverlust, Kompassabstand und begrenzter Quoten-Stresstest.
- `c48a8c5`: geprüfter Releasebericht, Start-/Geräteanleitung, Lizenznachweis und Messdaten. Per Fast-Forward nach `main` übernommen und ohne Force-Push veröffentlicht. Der ursprüngliche Commit `467adf6` ist weiterhin Vorfahr; frühere Branches und Commits bleiben erhalten.
- `a2be6c9`: reproduzierter und korrigierter Zombie-Sichtbarkeitsradius für die vergrößerte Welt, mit zusätzlichem Regressionstest.
- Erste Veröffentlichung: [Workflow 43380788662](https://github.com/selinajordan87-stack/Blockboom-/actions/runs/43380788662) für `c48a8c5` am 13. November 2026 erfolgreich; auch dort strict TypeScript, 74/74 Tests und Build erfolgreich. Das Bundle `index-D2TPZoVJ.js` bestand anschließend die 17 Live-Fälle.
- Korrigierter Release: [Workflow 43382086660](https://github.com/selinajordan87-stack/Blockboom-/actions/runs/43382086660) für `a2be6c9` erfolgreich. Die bestehenden offiziellen Pages-Actions wurden verwendet. Nicht blockierende GitHub-Hinweise betreffen ältere Action-Runtime-Metadaten; die Ausführung unter Node 24 war erfolgreich.
- Öffentliche Adresse: **https://selinajordan87-stack.github.io/Blockboom-/** — tatsächlich HTTP 200, HTML verweist auf `index-DE_B-dPy.js`, `index-BWFNebq2.css` und `three-D1BCpSoH.js`.
- Heruntergeladenes korrigiertes Live-Spielbundle und lokaler getesteter Build besitzen exakt denselben SHA-256: `8625df2a4a0abd066c87918044d69c7f391296059aa29b63d221baef4a0e64b9`.
- Die 14 relevanten Live-Nachtests bestehen vollständig. **v0.6.0 ist veröffentlicht und automatisiert geprüft; die echte iPhone-/Android-Abnahme bleibt offen.** Auf dem Gerät neu laden, ohne Website-Daten zu löschen. Maßgeblich für den laufenden Hauptbranch ist der [aktuelle Pages-Workflowstatus](https://github.com/selinajordan87-stack/Blockboom-/actions/workflows/pages.yml).

## Nächste sinnvolle Teilversion

v0.6.1 sollte die echte Geräteabnahme auswerten, bei Bedarf Chunk-Generierung/Meshaufbau in kleine Arbeitsbudgets oder einen Worker verlagern und einen überprüften Export/Import samt IndexedDB-Migrationspfad ergänzen. Danach weitere große-See-Angelstellen, kleine Tiergeräusche und tiefere Siedlungsfunde ausbauen. Neue Systeme erst nach Stabilisierung der bestehenden erweitern.
