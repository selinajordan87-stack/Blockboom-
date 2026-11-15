# Revision 2 – Bergvalidierung, Entwicklungsstand

Branch: `polish/v072-visual`. **Keine Freigabe, kein Deployment.** Bestehende und neue Produktwelten bleiben Revision 1. Dieser Bericht ergänzt die historischen Zwischenstände in [V072_REPORT.md](V072_REPORT.md).

## Geänderte Landschaft

Die Berggrundfläche wird zusammenhängend geformt; die vorherige kleine Gipfelmaske ließ einen Ring alten hohen Geländes um die neuen Täler stehen. Das neue Band zwischen Berg und alten Regionswegen senkt die Schultern ab, ohne die Wege zu verschieben. Der Pfad bleibt breit, erhält Kalkstein als dezente Orientierung und reicht bis etwa 25 Blöcke Spielerhöhe. Unter kahlem Fels liegen nun Stein/Schiefer statt breiter Erdstreifen. Generation 1 bleibt unverändert.

Der Pfadabstand schützt vor generierten Bäumen und ihren Kronen. Die zwei Kammerbereiche, ihre ursprünglichen Positionen und die Schatzposition bleiben erhalten. Die Abflachung darf Kammerdecken nicht aufschneiden. 210 geprüfte Höhlenspalten besitzen mindestens drei Blöcke Deckenstärke. Absichtlich platzierte Erzblöcke am Kammerrand sind von der Luftprüfung ausgenommen. Die äußere Revisionsgrenze wurde auf höchstens eine Blockstufe zwischen benachbarten Randspalten geprüft.

Die Fernansicht benutzt dieselbe Höhenfunktion. Die zusätzliche künstliche Hauptberg-Kegelkulisse entfällt für Revision 2. Nahe LOD-Flächen haben ein 4-Block-Raster, entfernte ein 12-Block-Raster. Beide Varianten liegen im selben Mesh; der Wechsel erzeugt keinen zusätzlichen Draw Call. Das bleibt eine vereinfachte Silhouette, kein detailgleiches Abbild jedes Voxels.

## Speicher- und Versionsschutz

[Verbindliche Strategie](TERRAIN_MIGRATION_V072.md): Keine automatische Umformung, unabhängig von Anzahl oder Fehlen der Deltas. Revision 2 ist weiterhin experimentell und darf bis zur Freigabe korrigiert werden; danach muss ihre Generation unveränderlich sein.

Aktuelle Clients speichern Revision 2 getrennt unter `blockboom.save.terrain2`. Der Generation-1-Schlüssel bleibt erhalten und wird vom alten Client weiterhin verwendet. Revision-2-Exporte verwenden Sicherungshülle 2; der v0.7.1-Parser akzeptiert ausschließlich Hülle 1. Unbekannte zukünftige Terrainrevisionen/Weltversionen werden im aktuellen Client mit Schutzmeldung abgewiesen, bevor Sicherungs- oder Autosave-Schritte Daten ändern. Das ist keine nachträgliche Warnfunktion im bereits veröffentlichten alten Client.

Logiktests prüfen getrennte Speicherbereiche, simulierte Schreibzugriffe eines alten Clients auf dessen eigenen Schlüssel, Export-Roundtrip, ausdrücklichen Rückimport von Revision 1 sowie Rollback beider Bereiche nach einem Quota-Fehler. Die alte Client-Version wurde dafür im Quellcode geprüft; ein gleichzeitiger echter Gerätebetrieb zweier Clientversionen wurde nicht getestet.

## Methoden und Grenzen der Wegnachweise

`src/tests/mountain-walk.test.ts` beginnt mit einer kontrollierten Startposition am Bergfuß. Danach erfolgt jede Positionsänderung durch `Player.step`, normale Schwerkraft, Kollision und Sprünge. Der Auf-/Abstieg benötigt im aktuellen Lauf 24 automatisch vor Hindernissen ausgelöste Sprünge. Kein präzises Sprungtiming und keine spätere Positionskorrektur. Beide Kammerbereiche und Rückweg bestehen ebenfalls. Der Fund wird auf Existenz und Erreichbarkeit geprüft, nicht als erfolgreich eingelöst behauptet.

`scripts/mountain-input-v072.mjs` aktiviert ausschließlich die experimentelle Revision am normalen neuen Startpunkt, ohne vorhandene Änderungen. Danach verwendet der technische Treiber echte Touch-Joystick-/Kamerabewegungen und normale Sprungtasten. Er kennt Wegpunkte und liest die Diagnoseposition zum Steuern. Das ist **kein unabhängiger menschlicher Suchtest** und keine gemessene Entdeckungszeit. Kreativ/Friedlich dient der kontrollierten Erkundung; Survival wird separat geprüft.

Der erste Eingabelauf verwendet den Geometriestand `c757e7e` vor separatem Speicherbereich, späterem Felsmaterial-Pass und entfernungsabhängiger LOD-Auswahl. Diese späteren Änderungen verändern die geprüften Kollisionsflächen nicht. Seine Aufnahmen zeigen auch den während des längeren Laufs eintretenden Abend/Nachtzustand. Identische Tageslicht-Vergleichsfixtures werden separat geführt und nicht als Eingabenachweis ausgegeben.

## Noch keine visuelle Abnahme

Technisch begehbar bedeutet nicht automatisch überzeugend gestaltet. Regelmäßige Voxelstufen und große Felsflächen bleiben sichtbar. Die Fernaufnahme vom Regionsweg zeigt mehrere Gipfel, ihre Dominanz aus unterschiedlichen normalen Spielerblicken ist aber noch nicht ausreichend abgenommen. Der Blick direkt vom ursprünglichen Spawn wird durch einen Baum und bestehende Gegenstände verdeckt. Fern-LOD bleibt gröber als das Nahterrain; der Übergang mit der letzten entfernungsabhängigen LOD-Auswahl wurde nicht erneut in einer vollständigen Eingabefahrt aufgezeichnet. Höhlenportal und Innenraum stammen noch wesentlich aus der bisherigen Generation und sind keine vollständige neue Höhlengestaltung.

Damit ist insbesondere keine Gleichwertigkeit mit dem Mockup erreicht. See, Ufer und Fluss wurden in dieser Fortsetzung bewusst nicht umgeformt. Vor deren Bearbeitung bleibt die Bergabnahme erforderlich.

## Tatsächlich ausgeführte Prüfungen

- Abschließender Produktionsbuild mit TypeScript strict: bestanden. Lokales Bundle `index-BGYdInc1.js`, Three.js `three-BaeYR3QQ.js`; diese Dateien wurden nicht veröffentlicht.
- **191/191 Logiktests in 34 Dateien bestanden.** Enthalten sind Auf-/Abstieg, Kammern, Deckenstärke, äußere Naht, Pfadvegetation, Kellerluft/hohe Bauten nach Chunkwechsel, Speichern, Versionsschutz und Ressourcenfreigabe.
- **Eingabeweg bestanden**, 815,982 Sekunden bis zum Reloadfoto, keine registrierten `pageerror`-Ereignisse. Die Schatztruhe wurde normal anvisiert, aber in diesem Lauf nicht geöffnet. Ein menschlicher Suchtest und echter Gerätebetrieb wurden nicht ausgeführt.
- **24 Browserfälle** der ersten Gruppe und **19 der zweiten Gruppe** formal bestanden. Darin liegen acht Ausführungen der vier neuen Renderbudgetfälle, die wegen zu früher Diagnosedaten **nicht als gültige Messnachweise gelten**. Sie wurden anschließend korrigiert wiederholt. Die übrigen Fälle prüfen Multitouch, unabhängiges Loslassen, Touch-/Pointercancel, Fokus/Visibility, Kamera/enge Sicht, Jagd/Grill/Essen in Ego und Third Person, echten Stegfang, Pages-Unterpfad, BOOM, Erz/Ofen, Farming, Truhen, Bauen/Abbauen, Inventar, Export/Import, Schreibkampf, Nahkampf, Angriffspause, Türen, Materialien und Undo/Reload. Dies ist eine relevante Auswahl, nicht die vollständige vorhandene Browsersuite.
- **7/7 abschließende Browserfälle bestanden** auf dem grafischen Prüfstand: vier korrigierte Ressourcenprüfungen, tatsächlicher Revision-2-Dateiexport/-import samt Backup/Reload und beide Speicherbereiche mit einer unbekannten zukünftigen Revision. Die Tests prüfen nun eine frische aktive Ego-Kamera auf Spielerhöhe und unveränderte X/Z-Testposition, bevor sie Werte auswerten.
- Ungültige gebrochene Revisionszahlen bleiben Generation 1. Danach bestanden Build, alle 190 damaligen Logiktests und die sieben korrigierten Browserfälle. Zusätzlich bestehen sechs Mobile-Prüfungen für HUD/Safe Areas bei 667×375, 844×390 und 932×430, Baumkollision, Kamera-Reset sowie Multitouch/Rotation/Browserwechsel.
- Die letzte zusätzliche Importsicherung prüft auch eine inaktive unbekannte Zukunftswelt, bevor irgendein Speicherbereich ersetzt wird, und meldet diesen Zustand verständlich. Danach bestanden erneut Build, **alle 191 Logiktests** und **vier gezielte Browserfälle**: Revision-1-Dateitransfer, Revision-2-Dateitransfer mit Backup/Reload sowie Zukunfts-Schutz auf beiden Schlüsseln. Die zuvor geprüften Terrain-/Render-/Steuerungsfunktionen wurden durch diese ausschließlich den Import betreffende Änderung nicht verändert.

[Build](artifacts/v072/mountain/logs/build.log) · [Logiktests](artifacts/v072/mountain/logs/logic-tests.log) · [Mobile](artifacts/v072/mountain/logs/browser-mobile.log) · [Gameplay](artifacts/v072/mountain/logs/browser-core.log) · [Abschließende Berg-/Speichertests](artifacts/v072/mountain/logs/browser-mountain-final.log) · [Viewport/Kamera](artifacts/v072/mountain/logs/browser-viewport.log) · [Letzter Transferstand](artifacts/v072/mountain/logs/browser-transfer-final.log) · [Spielaufnahmen](artifacts/v072/mountain/README.md).

### Fehler im ersten Messverfahren

`#world.dataset.performance` existiert bereits auf dem Startbildschirm. Die erste Testfassung wartete nur auf leere Chunkqueues und konnte deshalb noch die Startkamera `[23,18,29]` auswerten, obwohl die gespeicherte Spielerposition bereits am Berg lag. Das wurde beim Vergleich von Kamera- und Spielerkoordinaten entdeckt. Diese Werte und Bilder werden nicht für die Budgetabnahme verwendet. Der Ordner `browser-core-pre-wait-fix` enthält als Diagnose die ausdrücklich ungültigen früheren Werte; die gültigen Werte liegen in `browser-mountain-final`.

## Gemessene Ressourcen

Chromium/SwiftShader, emuliertes Touch-Landscape 844×390, Renderfaktor 1. Kontrollierte, ruhende Kamerafälle aus dem abschließenden Test, keine Smartphone-FPS-Messung:

| Szene | Draw Calls | Dreiecke | Geometrien | Texturen | aktive Chunks | geladene Blöcke |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Revision-2-Start | 79 | 29.236 | 60 | 4 | 26 | 38.548 |
| Bergfuß | 29 | 25.750 | 67 | 4 | 37 | 89.706 |
| Gipfel | 30 | 20.236 | 62 | 4 | 37 | 106.423 |
| Tiefe Kammer | 80 | 26.592 | 66 | 4 | 37 | 96.243 |

Die Limits **40.000 Dreiecke / 110 Draw Calls** wurden nicht angehoben. Der bestehende Revision-1-Startbudgettest liefert weiterhin 96 / 39.478 / 55 Geometrien / vier Texturen / 28 Terrainmeshes. Er benutzt seine eigene bestehende Kamerafestlegung und ist nicht direkt mit der aktiven Ego-Kamera der neuen Fälle gleichzusetzen.

Der synchrone Erstaufbau des Renderers dauerte in den neuen Browserfixtures **104,9–236,9 ms**; längster einzelner Chunk-CPU-Wert 10 ms. Das sind Lade-/Initialisierungswerte. `maxRuntimeBuildMs` ist bei diesen ruhenden Fixtures 0 und darf nicht als Nachweis für ruckelfreies Laufen ausgegeben werden. Laufzeit-Generierung und Rendereraufbau werden im separaten CPU-Benchmark über zwölf Berg-Fokuspunkte budgetiert gemessen: im abschließenden 191-Test-Lauf maximal **12,67 ms Renderer-Slice**, **4,38 ms Generierung**, **10,19 ms Chunk-CPU-Zeit aufsummiert über mehrere Slices**, bis 107.217 geladene Blöcke / 37 aktive Chunks / 37 Terrainmeshes. Beim Zurückkehren ergibt sich wieder dieselbe Blockmenge. Ressourcenfreigabe wird geprüft. Ein früherer Lauf unter gleichzeitiger SwiftShader-Last zeigte bis 40,32 ms Render-Slice und 37,58 ms Generierung; das 4-ms-Arbeitsziel ist keine harte Obergrenze. Es wurden keine 30 FPS auf einem echten Smartphone nachgewiesen.

## Git und Veröffentlichung

- `22a512f`: unbekannte zukünftige Terrainstände vor Laden/Überschreiben schützen.
- `058e609`: Player-Physik-Auf-/Abstieg und Kammer-Rückweg.
- `c757e7e`: Bergfuß/Wege formen, Decken schützen, Bäume vom Pfad fernhalten.
- `c95891b`: separate Revision-2-Welt und versionierte Transferhülle.
- `3cae186`: Schutz auch bei direktem Decodieren/Schreiben.
- `c2e46df`: Runtime-Messung, Naht- und Ressourcenprüfungen.
- `198dbfa`: freier Fels und entfernungsabhängig begrenzte Berg-LOD.
- `22a8ad2`: ungültige Revisionswerte bleiben Generation 1; beide Speicherbereiche erhalten einen Browser-Schutztest.
- `d00b3bf`: reproduzierbare Eingabe-/Vergleichsskripte und korrigierte Budgetprüfung.
- `e379717`: auch inaktive Zukunftswelten vor Import schützen. **Software-HEAD der abschließenden Prüfung**; nachfolgende Dokumentations-/Evidenzcommits verändern das Bundle nicht.

Remote-`main` wurde am 15. November 2026 mit `git ls-remote` auf **`bab05373617badc14be72396590aab22af256987`** bestätigt. Hauptseite und deren Bundle `index-DBQix1VS.js` antworteten mit HTTP 200. Das ist weiterhin die veröffentlichte v0.7.1, keine veröffentlichte Revision 2. **Kein Merge, Push oder Pages-Deployment dieses Zwischenstands.**

Live: https://selinajordan87-stack.github.io/Blockboom-/

## Nächste Abnahme

Vor einer Freigabe: Gipfelformen und den Übergang der letzten Fern-LOD beim normalen Annähern visuell prüfen; den Blick aus dem Wiesenbereich ohne verdeckende Objekte beurteilen. Die Bilder belegen eine offenere Zufahrt und gegliederte Silhouette, aber keine abschließend hochwertige Berglandschaft aus allen normalen Blickwinkeln. Bis dahin weder neue Welten automatisch auf Revision 2 stellen noch mit dem Uferumbau beginnen.

Ein späterer echter iPhone-/Android-Test braucht einen gesondert bereitgestellten Teststand mit experimenteller neuer Welt; die öffentliche v0.7.1 enthält diese Änderungen nicht. Im Querformat vom normalen Start zur Mine gehen, den gesamten Auf-/Abstieg mit Touchspringen durchführen, beide Kammern besuchen und zurückkehren. Dabei Ego/Third Person, Kameraabstand/Reset, Menüwechsel, kurze Browserunterbrechung sowie Save/Reload/Dateiexport prüfen. Persönliche bestehende Welten bleiben Revision 1. Geräte-FPS und längere Wärme-/Speichertests sind weiterhin offen.

## Reproduktion

1. `npm run build`
2. `npm run preview -- --port 4208`
3. `node scripts/mountain-input-v072.mjs` für den bekannten Eingabeweg in einem isolierten Browserprofil.
4. `node scripts/mountain-v072.mjs` für kontrollierte Generation-1-/2-Vergleichsaufnahmen.
5. `BLOCKBOOM_TEST_URL=http://127.0.0.1:4208/Blockboom-/ npx playwright test e2e/mountain-v072.spec.ts --workers=1` für Ressourcen- und Transferprüfungen.

Alle Browserläufe verwenden Chromium mit SwiftShader und emuliertem Touch-Viewport. Keine echten iPhone-/Android-Tests, keine bestätigten Geräte-FPS, kein vollständiger Langzeit-Speichertest.
