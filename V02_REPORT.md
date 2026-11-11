# BLOCKBOOM v0.2 – Arbeits- und Abschlussbericht

**Stand 11. November 2026, 21:04 UTC: implementiert, lokal vollständig geprüft und auf main hochgeladen; Veröffentlichung extern blockiert. GitHub meldet einen größeren Ausfall bei Actions und Pages. Die Live-Adresse liefert derzeit weiterhin v0.1.1. Nach der Definition of Done ist der Release deshalb noch nicht vollständig abgeschlossen.**

## Phase 1: geprüfter Ausgangsstand

Ausgangspunkt ist `3f3305d` auf main. Arbeitsbaum sauber, origin/main identisch. Die vollständigen mobilen Korrekturen aus v0.1.1 sind vorhanden: getrennter Lifecycle für Blur/Visibility, eigener Besitzer je Touchfläche, sichere native Button-Klicks, Safe Areas, 20-Hz-Zielsuche und Regressionstests. `/Blockboom-/` ist korrekt konfiguriert; der bestehende Pages-Workflow bleibt bestehen.

Vor Änderungen ausgeführt: TypeScript strict, 21 Unit-/Logiktests und Produktionsbuild bestanden. Bestehendes Save-Schema ist v1 unter `blockboom.save`; Lernfortschritt und Mission sind bislang Bestandteil dieses Welt-Saves. Fish-UI enthält drei Arten, aber noch keine lebenden Fischobjekte. Bauen ist bereits weltweit erlaubt, allerdings nur sechs Materialien, ohne Undo und mit Mindesthöhe 1.

Risiken: gespeicherte Weltänderungen dürfen durch neue Grundlandschaft nicht verschoben werden; native Touch-/Klick-Reihenfolge muss erhalten bleiben; Lernformulare benötigen bei Tastaturänderungen eigene Scrollfläche. Deshalb: additive, versionierte Erweiterung des bestehenden Saves; eigene Lernspeicherung; separate Module für Inventar, Fischpopulation, Challenges und Missionen. Kein Rewrite und keine neuen Produktabhängigkeiten.

Geplanter vertikaler Abschnitt: freies Bauen/Undo → sichtbare reale Fänge → drei vollständige Lernmissionen → mobile Regression und Freigabe. Komplexer Survival-Kampf, Crafting und endlose Welt bleiben außerhalb dieses Releases.

## Phasen 2–4: modulare Erweiterungen

Phase 2: neun Materialien, freies Bauen bis in ausgehobene Bereiche, geschützte Steg-/Auftragspunkte, sichere letzte Bauaktion rückgängig. Additive Save-Erweiterung mit Ausgabeprüfung, begrenztem Fangprotokoll und unverändertem v1-Weltformat. 24 Tests bestanden. Phase 3: fünf Arten mit je drei lebenden Tieren, getrenntem Populationsmodell und instanzierten Körperteilen; echte Fischidentität und Bewegung zum Schwimmer. 26 Tests bestanden. Phase 4: 40 JSON-Aufgaben in fünf Bereichen und drei Stufen, eigenständige adaptive Engine, eigene lokale Lernspeicherung und rein logische Missionszustände mit einmaliger Belohnung. 29 Tests bestanden. Die Oberflächenintegration und komplette mobile Abnahme folgen in Phase 5.

## Implementierter v0.2-Umfang

- Neun Baustoffe, zwei übersichtliche Materialseiten, Bauen/Abbauen im gesamten zulässigen Weltbereich, farbige Vorschau und einmaliges sicheres Undo pro Sitzung. Grundgestein, Steg und neue Interaktionspunkte geschützt; historische eigene Änderungen werden nicht überschrieben. Sechs jederzeit verfügbare Werkzeuge mit Direktwahl und sichtbarem aktiven Werkzeug. Gesammelte Materialvorräte sind für Aufträge verwendbar; freies Bauen bleibt unbegrenzt.
- Neue Weltedition mit größerem See, Waldgruppen, Felsbereich, Aussichtspunkt und Waldruine. Bestehende Spielstände behalten die exakte alte Geländebasis. Beide Editionen erhalten Mara, Angler und die erreichbare Schatzkiste. Die alte BOOM-Zone samt Effekten, Sound und Reset bleibt unabhängig vom Lernen nutzbar.
- 15 tatsächlich bewegte Fische aus fünf Arten: Rotauge, Flussbarsch, Hecht, Karpfen, Forelle. Unterschiedliche Größen, Silhouetten/Farben, gemeinsame Schwimmbahnen und Wassergrenzen. Instanzierte Modelle mit gemeinsamer Geometrie und sicherer konstanter Bounding Sphere. Angeln bindet einen lebenden Fisch an den Schwimmer und entfernt genau dieses Tier beim Einholen. Der Holzknüppel fängt nur ein tatsächlich getroffenes, erreichbares Modell, ohne Darstellung von Verletzungen. Gefangene Tiere erscheinen nach 20 Spielsekunden wieder, damit keine Art dauerhaft verloren geht.
- Fangbuch mit Artzahlen, letzten Größen/Fangmethoden und dauerhaftem Größenrekord. Alte Fangzahlen werden erhalten, alte Größen nicht erfunden. Das Detailprotokoll ist auf 100 Fänge begrenzt; Gesamtzahlen und Rekorde bleiben separat erhalten.
- Eigenständige `LearningEngine` mit 40 JSON-Aufgaben, fünf Lernbereichen, drei Stufen, Schreiben, Lücken, Fehlerkorrektur und Auswahl-/Verständnisaufgaben. Großschreibung und definierte Varianten werden berücksichtigt; Fehler kosten nichts. Auswahl vermeidet direkte Wiederholung, wiederholt zeitversetzt und erhöht die Stufe nach jeweils acht erfolgreichen Antworten. Hinweise, Silben, langsame Anzeige, Überspringen und freiwillige reine Zeitanzeige. Keine automatisierte Diagnose oder Behauptung zur Handschriftförderung durch Bildschirmtastatur.
- Standardmodus Lern-Challenge; Abenteuer/Entspannt wählbar. Nach 90/180/300 aktiven Spielsekunden wird ein Angebot markiert. Aufgaben öffnen sich ausschließlich durch den Spieler. Alle Modi behalten Bauen, Fangen, BOOM und grundlegende Werkzeuge. Sterne sind Sammelpunkte, kein verpflichtendes Bezahlsystem.
- Drei vollständige optionale Missionen mit Fortschritt, tatsächlichen Weltaktionen, Texteingaben, Hilfen und einmaliger Belohnung: Holzauftrag (drei Holzblöcke sammeln, schreiben, abliefern), Fischmission (Barsch erkennen/fangen/benennen), Schatzkiste (Glas, Holz und Schatz lösen; sichtbare Kiste öffnet sich). Abzeichen und Sterne im Inventar; Holzhelfer verändert zusätzlich den Werkzeuggriff. Der frühere kurze Barschauftrag bleibt kompatibel erhalten.
- Unabhängiger Pointer-Besitz und die Blur-/Visibility-Trennung aus v0.1.1 erhalten. Neue Formulare werden von WASD/Q/Z-Tastenkürzeln ausgenommen. `visualViewport` steuert die nutzbare Panelhöhe bei Tastaturänderungen; Schrift in Eingaben mindestens 16 px. Werkzeugwahl ohne Pausenmenü, Safe Areas und nicht blockierende Querformat-Empfehlung bleiben vorhanden.

## Architektur und Speicherung

Bestehender Renderer, Welt, Physik, BOOM und Mobile-Controller werden weiterverwendet. Ergänzt: `building/History`, `inventory/Equipment`, `world/Enrich`, `fishing/Shoal` und `FishView`, `learning/Engine`/JSON/`Speech`, `missions/Missions`, `ui/AdventureUI`. `main.ts` verbindet diese Module; kein Rewrite und keine neue Produktabhängigkeit.

Welt-Save weiterhin `blockboom.save`, Schema v1 mit optionaler eigener, versionierter `extension`. Dadurch bleiben v0.1/v0.1.1-Saves lesbar. Beim ersten Laden ohne Erweiterung wird nach Möglichkeit `blockboom.save.pre-v02` als unveränderte Sicherung abgelegt. Erweiterung: Weltedition, Werkzeug, Vorräte, Fangprotokoll/Rekorde, Missionen, Sterne und Abzeichen. Neue Lernresultate/Versuche/Hilfen/Verlauf und Modus getrennt unter `blockboom.learning.v1`; beschädigte/andere Lernversionen werden vor Neubeginn nach Möglichkeit gesichert. Der alte Lesemissionsfortschritt bleibt aus Kompatibilitätsgründen im alten Weltfeld. Keine Rohantworten, Personenprofile, Cloud-Synchronisierung oder Tracking.

localStorage bleibt angesichts der begrenzten Welt und Datenmengen angemessen. Fehler beim Schreiben werden angezeigt; gesperrter Speicher, Privatmodus und gelöschte Website-Daten können weiterhin dauerhafte Speicherung verhindern. Keine automatisch garantierte Wiederherstellung beschädigter Daten und keine Synchronisierung zwischen Geräten. Alte parallele Tabs sollten vor einem Versionswechsel geschlossen werden.

## Tests und zwischenzeitliche Fehler

Vor Änderungen: TypeScript, 21 Tests und Build bestanden. Danach schrittweise 24/26/29 Tests für die neuen Module. Releasekandidat: TypeScript strict, **32 Unit-/Logiktests**, Produktionsbuild bestanden. Bestehende 20 Browserfälle sind erhalten; sieben neue Funktionsfälle, eine zusätzliche Touch-Mission und die Prüfung auf Kompatibilitätsklicks ergänzen sie auf 29 Fälle. Ein Gesamtlauf mit 27 Fällen bestand, die neue Touch-Schatzmission zusätzlich separat. Der abschließende unveränderte Releasekandidat bestand am Ende **29/29 Browserfälle** in einem einzigen Gesamtlauf (2,7 Minuten), protokolliert unter `artifacts/pages/v02-local-final.log` im Arbeitsbereich.

Getestet werden tatsächliche Platzierung/Entfernung/Undo, Kollision, Save-Roundtrips, sichtbare bewegte Fischidentitäten und Modelltreffer, Angelbiss, Fangmethoden, echte Holzernte, alle drei Missionsabschlüsse und einmalige Belohnung. Tests setzen Positionen/Alt-Saves zur Vorbereitung; Materialien, Fischfänge und Missionsabschlüsse werden über Spielaktionen erzeugt. Lernfehler, Hilfen, getrennte Speicherung, Moduswechsel und Texteingabe mit verkleinerter Höhe sind enthalten. Speech-Auswahl/Benutzeraktion wird mit einer lokalen deutschen Stimme als Browser-API-Mock geprüft; das ist kein Nachweis hörbarer Geräteausgabe.

Zwischenzeitlich gefunden und behoben: Desktop-Interaktionsknopf überdeckte das neue Auftragsbuch; Abstand korrigiert. Die alte Pages-Versionserwartung wurde auf die Paketversion umgestellt. Ein zunächst direkter JSON-Import im Node-Browsertest scheiterte am fehlenden Importattribut und wurde durch Node-Dateilesen ersetzt. Beim Speech-Test akzeptierte die native Voice-Eigenschaft keinen einfachen Mock; der API-Mock wurde konsistent gestaltet. Ein weiterer 360-Pixel-Zwischenlauf verwarf einen bewussten Menü-Tap. Eine instrumentierte Wiederholung zeigte bei Durchlauf 12 Pointerdown/Pointerup/Capture-Verlust am Menü, aber keinen nachfolgenden nativen Klick. Die Tap-Hilfe schließt gültige Touchaktionen deshalb jetzt bei Pointerup ab; ein einmaliger dokumentweiter Capture-Handler unterdrückt den Kompatibilitätsklick desselben Kontakts auch dann, wenn inzwischen ein Dialog unter dem Finger liegt. Neue Kontakte sowie Tastatur-/Mausaktionen bleiben erlaubt. Dies ist durch eine eigene Prüfung gegen Klick-Durchfall ins Angelmenü abgesichert. Diese fehlgeschlagenen Zwischenläufe werden nicht als erfolgreiche Abnahme gezählt.

WebKit-Start erneut versucht, aber wegen fehlender GTK4-/Graphene-/Harfbuzz-ICU-/Manette-/Hyphen-/GLES-Bibliotheken nicht ausführbar. Kein echter iPhone-/Android-Test und kein erfolgreicher Safari-Test behauptet.

## Performance-Befunde und Grenzen

Weltgeometrie bleibt räumlich zusammengefasst (16 Weltmeshes in der Basiskarte). Fischkörperteile verwenden Instancing: 20 kleine InstancedMeshes für 15 Tiere statt 60 Einzelmeshes; eine gemeinsame Boxgeometrie, frustumabhängige Darstellung und begrenzte Population. CPU-Stichprobe der Basiskarte: kalter Aufbau etwa 31 ms, Zielsuche etwa 0,37 ms pro Abfrage in dieser Umgebung. Zielabfrage weiterhin höchstens 20 Hz, Aktionen prüfen sofort. Keine Echtzeitschatten oder teuren neuen Shader.

Chromium mit Software-WebGL, Querformat 844 × 390 und DPR 2: Start 57 Draw Calls / 13.100 Dreiecke / 25 GPU-Geometrien, See 34 / 9.500 / 27. Sechs lokal erzeugte Schildtexturen. Drei BOOM-Stichproben mit 48 Partikeln: 94–100 Draw Calls, jeweils 25 Geometrien/sechs Texturen. Danach wieder null Partikel; keine steigenden GPU-Geometrie-/Texturzahlen. Im Pausenmenü blieb die Diagnostik über 1,2 Sekunden unverändert. Dies beweist keine allgemeine Leckfreiheit, keine Langzeitstabilität und keine Smartphone-Framerate. Adaptives DPR-Limit bleibt erhalten.

## Bewusst verschoben / bekannte Einschränkungen

Keine Zombies, Gesundheit/Hunger, komplexes Crafting, Werkzeughaltbarkeit, Gewichtssimulation, Schwimmen, Wetter oder endlose Welt. Werkzeuge teilen die einfache Abbaulogik; die freie Bauversorgung ist bewusst keine Survival-Ökonomie. Fischmodelle sind einfache eigene Voxelmodelle, keine realistischen Tiermodelle; Wassergrenzen statt vollständiger Fischphysik gegenüber selbst gebauten Hindernissen. Undo umfasst die letzte Aktion dieser Sitzung und schützt vor Wiederherstellung in der Figur. Weltgeometrie wird nach Änderungen weiterhin insgesamt neu aufgebaut. Neue Landschaft ausschließlich in neuen Welteditionen; alte Bauten haben Vorrang.

Lokale deutsche Stimmen können fehlen oder erst verzögert verfügbar sein; der Vorleseknopf kann erneut benutzt werden, alle Aufgaben bleiben ohne Audio lösbar. Bildschirmtastatur trainiert nicht automatisch Handschrift. Echte iOS-Tastatur-/Safe-Area-/App-Wechsel-Ereignisse und GPU-Leistung bleiben Geräte-Risiken. Sterne haben noch keinen Shop. Keine Offline-PWA-Vervollständigung in v0.2.

## Konkreter iPhone-/Android-Testplan

1. Live-Adresse in Safari/Chrome neu laden und Startmarkierung **v0.2.0** kontrollieren. Alte Tabs schließen, Website-Daten nicht löschen. Vorhandene Position, Bauten und Fangzahlen prüfen.
2. Querformat: links gehen, gleichzeitig rechts schauen, Finger unabhängig lösen, dritten Finger hinzunehmen, kurz Browser/App wechseln. Kein ungewolltes Pausenmenü; nach echtem Hintergrund getrennte Fortsetzen-Anzeige. Hochformatempfehlung darf nicht blockieren.
3. Mit „Mehr“ Sand/Ziegel/Blätter wählen. An zwei Orten außerhalb des Bauplatzes eine Wand/Brücke bauen, abbauen, letzte Aktion rückgängig, speichern und neu laden.
4. Am See fünf Arten beobachten. Angel auswählen oder Kontextaktion am Steg benutzen. Auf tatsächlichen Biss warten und einholen. Holzknüppel auswählen, vom flachen Ufer aus sichtbaren Fisch anvisieren und „Fangen“ benutzen. Fangbuch auf Anzahl, Länge und Methode prüfen.
5. „Aufträge“: Holzauftrag annehmen, drei Stammblöcke abbauen, Holz schreiben und bei Mara abliefern. Fischauftrag lesen, Barsch fangen/benennen und beim Angler belohnen lassen. Entdeckerpfad zur Kiste: Glas, Holz, Schatz lösen; geöffnete Kiste und Abzeichen prüfen.
6. „Challenge“: falsche Antwort, Hinweise, Silben, langsames Wort, Überspringen und Vorlesen versuchen. Bei geöffneter Tastatur muss das Feld samt „Prüfen“ erreichbar bleiben. Lernmodus im Menü wechseln; Bauen/BOOM müssen in allen Modi frei bleiben.
7. Save/Reload und Browser-Neustart prüfen. Zehn Minuten spielen, Wärme/Bildrate beobachten, bei Bedarf „sparsam“ vergleichen. Modell, OS, Browser und genaue Probleme protokollieren. Die endgültige mobile Abnahme erfolgt durch die Auftraggeberin.

## Phase 5: Releasekandidat und Regression

TypeScript strict, 32 Unit-/Logiktests und Produktionsbuild bestanden. 29 Browserfälle wurden erfolgreich ausgeführt: 28 im letzten Gesamtlauf, anschließend der neue Kompatibilitätsklickfall nach Ergänzung seines zuvor fehlenden Touch-Kontexts separat. Der Kontextfehler war eine Testkonfiguration, kein übergangener Produktfehler. Die zuvor intermittierende 360-Pixel-Bedienung bestand nach der ereignisbasierten Tap-Korrektur auch im wiederholten gezielten Lauf; zehn Touch-/Angel-/Menüfälle wurden dabei erfolgreich wiederholt. Der gesamte Bestand wird nach Veröffentlichung nochmals gegen die reale Pages-Adresse geprüft.

Der Anwendungsstand ist für den freigegebenen Release vorbereitet. Die tatsächliche Veröffentlichung wird erst nach grünem Workflow, passendem Live-Bundle und HTTP-Erreichbarkeit bestätigt. Endgültige Abnahme auf echtem iPhone bleibt offen.


## Phase 6: Produktionsstand, Commits und tatsächlicher Deployment-Status

Abgeschlossene lokale Prüfungen des freigegebenen Anwendungsstands: **TypeScript bestanden, 32/32 Unit-/Logiktests bestanden, 29/29 Browserfälle im abschließenden Gesamtlauf bestanden, Produktionsbuild erfolgreich**. JavaScript etwa 557 kB insgesamt / 145 kB gzip, CSS etwa 15 kB / 4 kB gzip. Keine neue Produktabhängigkeit.

Die Feature-Historie wurde ohne Rewrite/Force-Push per Fast-Forward nach main übernommen und hochgeladen:

- `31f7dc8`: Audit und Kompatibilitätsstrategie.
- `c1a406b`: Baustoffe, Undo und additive Speicherung.
- `d64b0dc`: fünf lebende Fischarten und identitätsgebundene Fänge.
- `adfaa95`: Learning Engine, 40 Inhalte und Missionszustände.
- `d9e9265`: vollständige Spiel-/UI-Integration, Regression und mobile Tap-Absicherung.

Der bestehende [Pages-Workflow für den Anwendungsstand](https://github.com/selinajordan87-stack/Blockboom-/actions/runs/43099128884) wurde durch den Push gestartet, steht aber weiterhin auf **queued**. Jobs melden keinen zugewiesenen Runner und es werden keine ausstehenden manuellen Deployment-Freigaben angezeigt. Die offizielle [GitHub-Statusseite](https://www.githubstatus.com/) meldete beim Abruf einen „Partial System Outage“, insbesondere **Actions: major_outage** und **Pages: major_outage**. Das ist ein externer Dienstfehler; eine Konfigurationsänderung oder ein Force-Push wäre keine sachliche Behebung.

Die [Live-Adresse](https://selinajordan87-stack.github.io/Blockboom-/) ist zwar mit HTTP 200 erreichbar, liefert aber noch den alten Bundle `index-B6PmffVw.js` aus v0.1.1. Erwarteter v0.2-Anwendungsbundle ist `index-CH-n8Nxp.js`. Deshalb werden **weder ein erfolgreicher v0.2-Deploymentabschluss noch erfolgreiche v0.2-Live-Browsertests behauptet**. Eine Dokumentationsaktualisierung auf main nutzt ebenfalls den bestehenden Workflow; sie ändert keinen Anwendungsbundle.

Offen bis zum vollständigen Release: Nach Behebung der GitHub-Störung den laufenden/gegebenenfalls fehlgeschlagenen Pages-Lauf prüfen oder erneut starten, dessen grünen Abschluss abwarten, Live-Bundle und Startmarkierung v0.2.0 vergleichen und die Browserfälle gegen die tatsächliche öffentliche URL ausführen. Erst danach kann die Produktionsbereitstellung nach der Definition of Done bestätigt werden. Anschließend folgt die separate echte iPhone-Abnahme nach obigem Plan. Website-Daten dabei nicht löschen.
