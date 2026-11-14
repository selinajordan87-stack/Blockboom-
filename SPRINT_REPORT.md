# BLOCKBOOM – Overnight Sprint / v0.7.0

Stand: 14.11.2026. Dies ist ein getesteter Entwicklungsschritt auf der bestehenden v0.6.1, kein Rewrite und keine vollständige Abnahme sämtlicher früherer Konzeptaufträge. **Die Veröffentlichung steht noch aus; bisher ist v0.6.1 live.** Der anschließende echte iPhone-Test bleibt erforderlich.

## Ausgangslage und Recovery

`main`/Produktion standen auf `a007b56`. Der Branch `feature/v07-world-discovery` enthielt nach dem abgebrochenen Lauf den Auditcommit und uncommittete Erweiterungen. Alles Sinnvolle wurde erhalten, integriert und schrittweise gesichert; keine Commits wurden entfernt. Die Historie einschließlich `467adf6` ist weiterhin Vorfahr des aktuellen Standes. Keine neue Abhängigkeit.

Der [Reality Audit](REALITY_AUDIT.md) enthält die vollständige Funktionsmatrix des tatsächlichen vorherigen Zustands. Der erste Recovery-Test bestand 129/130 Fälle; ein Test verwendete noch die fest codierte Weltgrenze 60. Er prüft nun die echte Grenze `LIMIT`, weiterhin einschließlich verbotener Randplatzierung. Die sichere v0.6.1-Baseline wurde zuvor mit TypeScript, 90 Logiktests und Build geprüft.

## Was im Spiel konkret besser funktioniert

**Entdecken:** Die innere Landschaft und ihre gespeicherten Bauten bleiben an ihren Koordinaten. Eine additive Außenwelt ergänzt einen felsigeren Berg, dichtere Waldgruppen, einen großen See, verbindenden Fluss und größere Siedlung. Vereinfachte Berg-/Wald-/Turmsilhouetten und begrenzter Schmiederauch dienen als Fernsignale. Große Starttafeln sind entfernt; nur kleine, von beiden Seiten richtig lesbare Wegweiser bleiben. Der Startsee ist wieder eine horizontale Wasserfläche – vorher wurde irrtümlich die Y-Achse skaliert.

**Finden und benutzen:** Kleine physische Notizbücher bieten Bauhinweise, Gartenfolge, Vorratsrechnung, Angelwissen, eine Rauchspur, Erz-/Werkzeugfolge und Kammerhinweise. Text bleibt bis zum Schließen offen, ist linksbündig mit mindestens 16 px gesetzt und später im Entdeckerbuch erneut verfügbar. Die sichtbaren Fundtexte zeigen ihre Kategorie, keine schulischen Lesestufen-Etiketten; die Schwierigkeitsdaten bleiben intern erhalten. Vorlesen wird ausdrücklich gestartet und verwendet eine verfügbare lokale deutsche Stimme. Fehlt sie, bleibt alles lesbar. Kein Lesetimer und kein automatisches Aufgabenfenster.

**Handeln:** Sechs direkte Hotbar-Slots wechseln Werkzeug, Baumaterial und Nahrung. Langdruck öffnet das Inventar. Wenige Zielaktionen ersetzen dauerhafte Funktionsbuttons; Log, Buch, Garten, Werkbank, Karte, Angelset und Kamera sind im Menü erreichbar. Die Unterscheidung zwischen ausgewähltem Material und tatsächlich anvisiertem Objekt verhindert falsche Truhen-/Bauaktionen. Schnelles Bauen trifft jetzt den verbindlichen Voxelzustand, statt auf den verzögerten GPU-Chunkaufbau zu warten.

**Garten:** Ein kleines sichtbares Beispielbeet zeigt vier echte Wachstumsstufen. Der frische Survivalpfad sammelt Holz und Stein, liest das Gartenblatt, stellt Bretter und Hacke her, bearbeitet Gras, pflanzt Karotten und lädt den eigenen Acker wieder. Grundrezepte und Möbel stehen gemeinsam im Werkbankmenü. Auch Dunkelholz wird zu nutzbaren Brettern. Bestehende Änderungen in der gesamten Bodenspalte – einschließlich hoher Dächer und tiefer Keller – schützen den betreffenden Bereich vor dem Starterbeet.

**Fortschritt:** Die sieben Kapitel verbinden tatsächliches Sammeln, ein selbst gebautes Zuhause, sicheren Schlaf, gefundene Texte, Minenbesuch, Eisenverarbeitung und Kammerfund. Öffnen eines Fensters zählt nicht als erledigte Weltaktion. Die bestehende Haustiermission sperrt Bergbau nicht mehr. Regionale Tiere werden begrenzt in Spielnähe aktiviert; vorhandene Haustier-IDs und Namen haben beim Laden Vorrang. Der zusätzliche große Angelplatz besitzt tatsächliche sichtbare, fangbare Fische und korrekte Instanzgrenzen.

**Bauplan:** Ein realer Schmiedefund schaltet den Aussichtsturm frei. Materialliste, transparente Vorschau und Bau verwenden denselben Plan: 24 Bretter, zwölf Stein, vier Fackeln, vier Leitern. Er braucht freie tragfähige Fläche und verbraucht im Survival die Vorräte. Erst das tatsächliche Hochklettern enthüllt zusätzliche Kartenumgebung und vergibt das Abzeichen. Der vollständige Bau-/Aufstiegs-/Reloadtest bestand mit einem vorbereiteten vorhandenen Spielstand; er ist kein frischer Ressourcensammeltest.

## Tatsächlicher Spielerweg und gefundene Probleme

Der technische Treiber kennt Wegpunkte und liest Diagnosen. Er bewegt sich ausschließlich über normale Touch-/Tastatureingaben. Keine Positions-, Vorrats-, Uhr- oder Missionsinjektion. Er ist **kein unabhängiger menschlicher Auffindbarkeitstest**.

Der frische Kontrollpfad erreichte Wald nach 60,7 s, See nach 130,0 s, Höhleneingang nach 195,7 s, unterirdische Kammer nach 218,0 s, alte Höfe nach 326,4 s und größere Siedlung nach 441,8 s. Er öffnete die Schmiedetür, betrat das Gebäude, las das Tagebuch und nahm den Bauplan aus der wirklichen Truhe. Das sind Treiberzeiten mit Beobachtungspausen, keine menschlichen Suchzeiten. [Aufzeichnung](artifacts/v07/journey-first-pass/journey.json).

Dabei wurden echte Hindernisse gefunden und nicht als Erfolg gezählt:

- Eine frühe Wanderung scheiterte an einer zweiblockhohen Uferstufe. Die Ufer wurden abgestuft; derselbe Rückweg wurde anschließend tatsächlich durchquert und ist zusätzlich mit Player-Physik geprüft.
- Eine äußere Route verlief abseits des Wegs und blieb stehen. Eine weitere Wanderung zeigte ein fehlendes Verbindungsstück zwischen Siedlungs- und Minenweg. Es wurde ein realer durchgehender Weg im neuen Außenbereich ergänzt. Der Physiktest geht ihn ohne Springen und erhält dort gespeicherte Baublöcke. [Fehlernachweis](artifacts/v07/failures/city-mine-journey.json).
- Der erste Gesamttest fand drei Fehler: zu früh gespeicherte Testposition vor dem Simulationsschritt, 40.414 statt erlaubter 40.000 Dreiecke und eine echte verzögerte Bauzielerkennung. Der Test wartet jetzt auf aktive Spielzeit, rückwärtige Ferngeometrie wird ausgespart, und Bauaktionen verwenden direkte Voxel-Strahlprüfung. Keine Budgetgrenze wurde erhöht.
- Der neue Gartenschutztest zeigte, dass nur die unmittelbare Bodennähe geprüft wurde. Er schützt jetzt auch gespeicherte Eingriffe weit darüber und darunter. Ein falscher Holztest zielte ursprünglich auf Laub; der korrigierte Spielerpfad sammelt das vierte Holz an einem zweiten realen Baum.

Die erste Fortsetzung erreichte die tiefe Mine, las den Kammerhinweis und entnahm den tatsächlichen Schatz. Auf dem Rückweg blockierte eine irreführende Abkürzung an der erhaltenen alten Geländekante; diese Stichverbindung wurde aus dem Wegenetz entfernt. Der Rückweg verwendet den geprüften südlichen Knoten. [Fortsetzungsaufzeichnung](artifacts/v07/journey-continued/journey.json).

Die Wanderung wird mit ihrer regulär exportierten, unveränderten Datei über das normale Importmenü fortgesetzt. Kein Teleport-Fallback. Die Fortsetzung und ihr endgültiges Ergebnis werden hier separat dokumentiert.

## Lernen und erste 15–30 Minuten

Ein sinnvoller Einstieg: kleines Buch auf der Wiese lesen, Werkzeug wählen, Holz und Stein sammeln. Die freiwillige Wandrechnung verbindet acht Blöcke Breite und vier Reihen; ein Fehler gibt Hilfe und nimmt keine Vorräte weg. Das Gartenblatt erklärt genau die anschließend funktionierende Reihenfolge Hacke → Acker → Samen → Pflanzen. Während des Wachstums kann gebaut oder geangelt werden. Das Angelblatt macht Lebensraum und Köderwahl verständlich; das vorhandene Angelsystem nutzt diese Ausrüstung bereits.

Anschließend führen Brief, Erdweg, Turm und Rauch zur größeren Schmiede. Das Tagebuch erklärt die spielbare Folge Erz + Kohle → Kupfer → bessere Spitzhacke → Eisen. Kammerhinweise verbinden räumliche Information und ein kurzes Zielwort. Der Turmplan verbindet Lesen, Mengen, Sammeln, Bauen und nutzbare Aussicht.

**Das ist ein vorgeschlagener Spielerablauf, keine gemessene menschliche Abenteuerdauer.** Die komplette neue Hausbau-/Survivalwirtschaft und alle sieben Kapitel am Stück wurden noch nicht von einem unabhängigen neuen Spieler absolviert. Rechteckige, umschlossene eigene Häuser werden erkannt; beliebige freie Bauformen bleiben spielbar, erfüllen die vereinfachte Hausprüfung aber nicht unbedingt.

## Architektur und Speicherkompatibilität

- `world/World`, `DiscoveryTerrain`, `living/Regions`: räumlicher Änderungsindex, additive Terrainregionen, nahe Chunks zuerst, Generierung/Entladen in Spalten.
- `world/Renderer`, `LandmarkView`, `building/Target`: budgetierte Mesharbeit, vollständiger atomarer Austausch beider Materialschichten, vereinfachte Ferngeometrie und direkte Voxel-Zielerkennung.
- `discovery/State`, `Content`, `Engine`, `UI`, `View`, `Blueprint*`: gespeicherte Funde, reale Handlungsbelege, Buch/Log, Texte und Bauplan.
- `living/StarterGarden`, `State`, `Systems`, `LivingUI`, `Items`: vorhandenes Farming, Inventar, Tiere und Rezepte verbunden.
- `fishing/AnglingData`, `FishingWorld`, `Shoal`, `FishView`: weiterer echter Angelplatz und korrekte entfernte Instanzgrenzen.
- `ui/MobileHUD`, `mobile-rescue.css`, `main`: direkte mobile Auswahl und Integration bei erhaltener Kamera-/Touchlogik aus v0.6.1.

Save-Key `blockboom.save`, Rootformat v1, Welteditionen und getrennte bisherige Lernspeicherung bleiben erhalten. Discovery ist eine additive versionierte Erweiterung. Vor der ersten v0.7-Speicherung wird, soweit Speicher verfügbar ist, `blockboom.save.pre-v07` gesichert. Export/Import bleibt erhalten. Der letzte lesbare Stand wird bei Speicherfehlern nicht ersetzt.

Die bisherige Grenze von 50.000 Weltänderungen bleibt bestehen. Der tatsächlich gewanderte Stand hatte 8.450 Zeichen (geschätzt 16.900 UTF-16-Bytes), sechs Weltänderungen und 158 Kartenkacheln; der formatierte Export war rund 17 KB. Das rechtfertigt noch keinen Wechsel zu IndexedDB. Es ist kein Lasttest einer maximal bebauten Welt. Ein älterer manuell importierter Stand erhält nicht in jedem Fall automatisch das Beispielbeet; eigenes Farming bleibt über die Hacke möglich.

## Tatsächlich ausgeführte Prüfungen

| Prüfung | Ergebnis / Bezug |
| --- | --- |
| TypeScript strict, letzter Stand | bestanden |
| Logik-/Integrationssuite | **159/159**, 24 Dateien, einschließlich Save-Altversionen, Quota, Rückweg aus tiefer Mine, Wegverbindung und Gartenschutz |
| Vollständige Browserregression | **82/82**, 20,9 min, Bundle `index-BdAeCH9T.js` vor dem letzten Weg-/Gartenschutzfix; [Log](artifacts/v07/final-browser.log) |
| Nachprüfung Wegverbindung | **8/8** auf `index-CjN2T-SP.js` |
| Endgültige gezielte Nachprüfung | **10/10 bestanden** auf `index-unVfjpAn.js`; frischer Survivalstart, alte Saves, Regionen, Touch, Export/Import, Quota und Pages |
| Ausfuhr, Biss, Drill, Fang, Freilassen/Versorgen | im Gesamtlauf bestanden |
| BOOM, Nahkampf, drei Zombiearten, Schreibkampf, Türen | im Gesamtlauf bestanden |
| Kamera, unabhängige Finger, Abbruch, Safe Areas, Rotation, WebGL-Unterbrechung | im Gesamtlauf bestanden; Chromiumemulation |
| Farmingwachstum ohne vorgestellte Uhr | bestanden, etwa zwei Minuten echte aktive Spielzeit einschließlich Reload |
| Letzte Kartenkorrektur | 157 Logiktests, TypeScript, Build und **4/4** Browserfälle auf `index-DR5BWunQ.js`; [Log](artifacts/v07/release-browser.log) |
| Abschließende Text-UX | **2/2** Lese-/Touch- und Pagesfälle auf `index-C5EsXfER.js`; [Log](artifacts/v07/copy-browser.log) |
| Wald-Generierungsfix | **158 Logiktests**, vier Browser-Nachtests, Build `index-CKfwcTAk.js`; [Log](artifacts/v07/forest-browser.log) |
| Echter iPhone-/Android-Test | nicht ausgeführt |

Kein alter Test wurde gelöscht. Frühere erfolglose Läufe und ihre Ursachen bleiben dokumentiert. Vorbereitete Save-Fixtures sichern gezielt Funktionen; sie gelten nicht als Beweis für normale Auffindbarkeit.

## Performance-Befunde

Gemessen auf diesem Cloud-Rechner, Chromium mit Software-WebGL; keine Aussage über reale Smartphone-FPS.

- Letzter Logiklauf: Rendererbudget 4 ms, 18 Slices, maximal 4,27 ms, Mittel 2,25 ms. Runtime-Terraingenerierung maximal 7,88 ms in dieser Probe.
- Im tatsächlichen Gehweg wurden bis 42,2 ms Runtime-Generierung beobachtet. Einzelspalten, Garbage Collection und atomare Abschlüsse können das Budget überschreiten. Vollständige synchrone Start-/Import-/Reloadaufbauten lagen in den verschiedenen Durchläufen bei etwa 137–313 ms; der Maximalzähler enthält diese Startwerte. Ein stotterfreier Start wird damit nicht behauptet.
- Gehweg-Snapshots: etwa 10,1–29,2 FPS, Frame-p95 66,7–216,6 ms einschließlich der Startfenster in Software-WebGL. Das ist **kein Nachweis stabiler 30 FPS** auf einem Handy.
- JS-Heap in den aufgezeichneten Snapshots etwa 22,5–48,1 MB, zwischenzeitlich wieder gefallen; kein Beleg für dauerhafte Leckfreiheit.
- Start-Renderprüfung: 93 Draw Calls, 39.114 Dreiecke, vier Texturen, 28 Chunks. Nach wiederholtem Bauen/Undo blieben 54 Geometrien und vier Texturen. Der Entladetest gab 152 Geometrien frei.
- Kleine Spezialblockindizes vermeiden globale Möbel-Neubauten bei normalen Terrainänderungen. Tier-/Fischpopulation und Rauch bleiben begrenzt. Diagnose zeigt echte Frame-, Chunk-, Heap- und Akteurswerte; sichtbare Szenenmeshes sind nicht gleich tatsächlich gezeichnete Draw Calls.

## Bekannte Grenzen und bewusst offene Arbeit

Die zentrale alte Landschaft wirkt weiterhin einfacher und flacher als die äußeren Regionen. Die Ufer und der Fluss sind weiterhin sehr geometrisch und kanalartig. Auch die Berggestaltung ist noch sehr kantig und plattenartig; die Tageslichtaufnahme vom tatsächlich begangenen Minenweg zeigt diese Grenze offen. Fern-LOD ist bewusst grob, Übergänge können sichtbar sein. Die Referenzbilder wurden weder als Spielassets übernommen noch als erreichter Grafikstand ausgegeben. Kein durchgehender menschlicher Hausbau-/Storytest, keine bestätigte 20–30-Minuten-Abenteuerdauer und keine echte Geräteperformance.

Neue passive Wissensboni auf Fangwahrscheinlichkeit, Farming als zusätzlicher Köderkreislauf, ein allgemeines mehrstufiges Gameplay-Hilfesystem und weitergehende Tierweltsimulation sind nicht Teil dieses geprüften Standes. Vorhandenes Wissen hilft über echte Werkzeug-/Köderentscheidungen. Lesen und Schreiben bleiben freiwillig; es werden keine diagnostischen oder handschrifttherapeutischen Wirkungen behauptet.

## Git und Veröffentlichung

| Commit | Gesicherter Schritt |
| --- | --- |
| `a1e6655` | tatsächlicher v0.6.1-Audit mit Vorherbildern |
| `49d1db3` | abgebrochene Erweiterungen integriert |
| `3b7c2c4` | Uferfalle, Lesbarkeit und Fernsignale |
| `08f08d1` | tatsächlicher Aussichtsturmbau und Aufstieg |
| `494769a` | Spezialblockindex und weniger Rebuilds |
| `bab5d86` | direkte Voxelziele und frischer Sammel-/Gartenweg |
| `eb38a5b` | 82 bestandene Browserfälle mit Nachweisen |
| `98d386e` | Wegverbindung, hoher/tiefer Gartenschutz, 157 Logiktests |
| `27375f2` | irreführende Stichverbindung entfernt, tiefer Schatz tatsächlich erreicht |
| `40eeeab` | Fundtexte ohne schulische Stufenetiketten, ehrliche Grafiknachweise |
| `ef35cac` | tatsächliche Waldgenerierung und freier Weg statt leerer Regionsmarke |
| `ded5323` | tatsächlicher Steg als Angelzone und erfolgreicher Touchfang |

Weg-/Gartenschutzfix ist mit 157 Logiktests und zehn gezielten Browserfällen gesichert. Abschließende Gehwegbelege und Live-Prüfung werden nach ihren tatsächlichen Ergebnissen ergänzt. Es wurde bisher nicht auf `main` gepusht.

## Lokaler Start und Wiederholung

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run preview -- --port 4208
# weiteres Terminal, Chromium unter /usr/bin/chromium:
BLOCKBOOM_TEST_URL=http://127.0.0.1:4208/Blockboom-/ npm run test:browser
node scripts/v07-player-journey.mjs
```

Der Journalpfad kennt technische Wegpunkte; er ist keine menschliche Bewertung von Spaß oder Suchzeit. Die tatsächlich ausgerollte Website wird erst nach erfolgreichem Workflow und Prüfung ihres ausgelieferten Bundles als veröffentlicht bezeichnet.

## Konkrete iPhone-Abnahme

1. Vor dem Update in Safari **Menü → Einstellungen → Spielstand exportieren/importieren → Exportieren** nutzen. Dieselbe Pages-Adresse und denselben Browser behalten; keine Website-Daten löschen.
2. Nach Veröffentlichung normal neu laden. Die Startseite muss **v0.7.0** zeigen. Im Querformat laufen und zugleich rechts umsehen, beide Finger einzeln lösen. Menü darf sich dabei nicht öffnen.
3. **Menü → Kamera & Steuerung**: Third Person, größere Entfernung, an Baum/Wand herangehen und wieder zurück. Abstand muss zurückkehren; **Kamera zurücksetzen** muss weiter funktionieren.
4. Die sechs unteren Slots ausprobieren. Baum mit Axt abbauen, Stein mit Spitzhacke. **Werkbank** im Menü öffnen: Bretter und Hacke sind dort gemeinsam mit Möbeln erreichbar. Einen Block wählen, grüne Vorschau suchen, bauen, entfernen und rückgängig machen.
5. Ein kleines Buch auf der Startwiese anvisieren und **Lesen** nutzen. Text in Ruhe lesen oder ausdrücklich vorlesen lassen; Fenster selbst schließen. Im **Entdeckerbuch** erneut öffnen. Die Vorratsrechnung freiwillig mit Fehler und Hilfe ausprobieren.
6. Gartenblatt und sichtbares Beet suchen. Kürbis ernten, Samen im Garten wählen und pflanzen. Mit Hacke Gras bearbeiten und ein eigenes Feld anlegen. Während des Wachstums weiterspielen; die Uhr zählt weder im Menü noch bei geschlossener Seite.
7. Ohne Koordinatenhilfe nach Felsöffnung, Weg, Turm und Rauch suchen. Festhalten, ob Höhle und größere Schmiede tatsächlich auffallen und welche Hinweise verständlich sind. Falls sie nicht gefunden werden, ist das ein offener Designfehler, kein Versagen des Spielers.
8. Angel ausrüsten und einen vollständigen Fang spielen; anschließend eine Zombiebegegnung oder den friedlichen Modus prüfen. Schreibkampf mit Bildschirmtastatur öffnen/schließen.
9. Eigenen Block, Pflanze, Fundtext und gegebenenfalls Haustier speichern. Safari kurz verlassen, zurückkehren und neu laden. Alles muss erhalten bleiben. Abschließend eine neue Exportdatei sichern.
10. iPhone-Modell, iOS/Safari-Version, störende Überlagerungen, Kameraprobleme und subjektive Flüssigkeit nach etwa zehn Minuten notieren. Eine reale Smartphone-Framerate oder endgültige Abnahme wird hier nicht vorweggenommen.

## Visuelle Nachweise

[Galerie mit Prüfmethode und Grenzen](artifacts/v07/README.md). Die separate [Bergübersicht](artifacts/v07/mountain-overview/03-mountain-overview.png) wurde zu Fuß aus einem regulär exportierten Stand erreicht. Für die Sichtaufnahme wurde ausschließlich das vorhandene Kreativ-/Tageszeitmenü auf Mittag gestellt. Sie gilt nicht als frischer Survivalablauf.

## Erst durch die Spieleraufnahme entdeckter Waldfehler

Der erste Weg erreichte den äußeren Wald und großen See tatsächlich, aber die Waldaufnahme zeigte lediglich Büsche und Stümpfe. Der unveröffentlichte Außenweltgenerator verwendete ein Vierer-Raster mit `x,z ≡ 2 mod 4`; sein Hash `31*x+73*z` war damit immer durch vier teilbar. Die Baum-Bedingung war dort nie erfüllt. Ein neuer Test reproduzierte **null höhere Stammblöcke**. Die vorherigen grünen Browserfälle hatten dieses sichtbare Problem nicht erfasst.

Der Fix mischt ganzzahlige Rasterkoordinaten, verwendet einen günstigeren Sechser-Abstand und lässt Wege und kleine Tierlichtungen frei. Der Test prüft tatsächliche höhere Stämme beider Holzarten, einen vollständigen begehbaren Weg und die resultierende Geometrie. Ergebnis: 43.488 Dreiecke in 37 Chunk-Meshes, 69.466 geladene Blöcke, 43 Buildslices, maximal beobachtet 5,25 ms. Alte Landschaft innerhalb der bisherigen Grenze und gespeicherte Blockänderungen bleiben erhalten. Der echte Eingabeweg wurde nach diesem Fix vollständig bis zum großen See und durch Reload geprüft, ohne JavaScript-Seitenfehler. [Wald nach Fix](artifacts/v07/forest-fixed-walk/02b-outer-forest.png), [See](artifacts/v07/forest-fixed-walk/04b-great-lake.png), [Fluss](artifacts/v07/forest-fixed-walk/05-connected-river.png), [Journal](artifacts/v07/forest-fixed-walk/journey.json). [Fehlaufnahme](artifacts/v07/failures/empty-forest.png), [roter Test](artifacts/v07/failures/empty-forest-red.log).

## Angelsteg im echten Spielerablauf

Der große See wurde nach dem Waldfix erneut über normale Eingaben erreicht. Eine anschließende Quellen-/Regressionprüfung fand den begehbaren Holzsteg größtenteils außerhalb des bisherigen 4,4-Meter-Uferkreises. Die Angel- und Entdeckungszone folgt nun zusätzlich dem tatsächlich erzeugten Steg. Der rote Test prüft zugleich, dass dort echte Bretter vorhanden sind; der Fix bestand alle **159 Logiktests**.

Der neue Browserfall importiert eine unveränderte Exportdatei des wirklich gelaufenen Entdeckerstands über das normale Menü, geht auf den Holzsteg, rüstet die sichtbare Angel aus und verwendet echte CDP-Touchkontakte für Kraftwurf, Anschlag und Drill. Ein tatsächlich vorhandener Fisch aus dem großen See wird angelandet und zurückgesetzt; Fangbuchdaten bleiben nach Reload erhalten. **1/1 bestanden in 54,0 s**, [Log](artifacts/v07/great-lake-browser.log), [Angel am Steg](artifacts/v07/great-lake-play/12-rod-on-great-lake-jetty.png), [Fang](artifacts/v07/great-lake-play/12-great-lake-catch.png).

Der vor diesem Fix laufende Gesamttest wurde bewusst unterbrochen: 23 bestanden, ein laufender Fall unterbrochen, 58 nicht ausgeführt. Das ist kein erfolgreicher Gesamtlauf. Die vollständige Suite mit **83 Fällen** endete auf `index-aiUri2qf.js` mit **82 bestanden / einem Feedbackfehler**. Der Fehler und die erfolgreichen Nachprüfungen des korrigierten Bundles sind unten getrennt aufgeführt.

## Abschließende Rückmeldungsregression

Der letzte vollständige 83-Fälle-Lauf bestand 82 Fälle. Einzig der Desktop-BOOM-Test scheiterte: Die erwartete Aktionsmeldung wurde in derselben Startphase von „Entdeckt: Wiesenland“ überschrieben. Damit war auch der nützliche erste Hinweis auf die Notizbücher gefährdet. [Vollständiges Log](artifacts/v07/83-browser-before-notice-fix.log), [Fehlerkontext](artifacts/v07/failures/boom-feedback-context.md).

Aktionsmeldungen haben nun für ihre sichtbare Dauer Vorrang vor gewöhnlichen Regions-/Angelplatzmeldungen. Entdeckungsdaten werden dennoch gespeichert; Abzeichen und wichtige Meldungen bleiben möglich. Kein zusätzliches Overlay und keine neue Speicherung. Eine neue Browserassertion prüft, dass der Einstiegshinweis im Menü erneut lesbar bleibt.

Auf dem korrigierten Produktionsbundle **`index-s5m-G2nK.js`** bestanden TypeScript, alle **159 Logiktests** und Build sowie **6/6 Wiederholungen**: BOOM mit tatsächlicher Blockentfernung und Reset sowie frischer Einstieg mit Lesen/Touch, jeweils dreimal. [Nachprüfungslog](artifacts/v07/notice-browser.log). Es wird ausdrücklich kein zweiter vollständig grüner 83-Fälle-Gesamtlauf nach dieser lokalisierten Änderung behauptet.

Alle 83 unterschiedlichen Szenarien wurden damit geprüft; der einzige im Gesamtlauf fehlgeschlagene Fall wurde korrigiert und erfolgreich nachgeprüft. Die Live-Smokeprüfung folgt auf genau diesem Bundle. Die Veröffentlichung gilt erst mit erfolgreichem Workflow, erreichbarer Website und geprüftem ausgeliefertem Bundle als bestätigt.
