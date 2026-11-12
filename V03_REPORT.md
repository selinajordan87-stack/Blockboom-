# BLOCKBOOM v0.3 – Sandbox Revolution

Stand: Entwicklungsbranch `feature/v03-sandbox-revolution`

## Phase 0 – Audit und Sicherheitsgrenzen

- Ausgangspunkt: `main` und `origin/main` auf `e1efe3afe0b4e1ead3474ba82b4880e89b97574a`, Arbeitsbaum sauber.
- Produktion: `https://selinajordan87-stack.github.io/Blockboom-/` antwortete mit HTTP 200 und lieferte das v0.2-Bundle `index-CH-n8Nxp.js`.
- Hosting: Vite-Basis `/Blockboom-/`; GitHub Pages baut und veröffentlicht ausschließlich `main` mit den offiziellen Pages-Actions.
- Welt: begrenzte 48×48-Blockwelt, verdeckte Flächen werden nicht erzeugt, 12×12-Chunk-Meshes und getrennte Glas-Meshes. Vor v0.3 wurden bei jeder Blockänderung noch alle Chunks neu erzeugt.
- Eingabe: getrennte Pointer-Eigentümer für linken Joystick und rechte Kamerafläche; `pointercancel`, `lostpointercapture`, Mehrfingerbedienung und Ghost-Clicks sind regressionsgetestet. Ein sichtbares `blur` öffnet kein Pausenmenü.
- Speicherung: der Schlüssel `blockboom.save` und Save-Schema `version: 1` werden beibehalten. v0.2-Erweiterungen liegen additiv in `extension`; Lernfortschritt bleibt separat unter `blockboom.learning.v1`. Edition 1 und 2 dürfen ihre Basiskarte behalten.
- Rendering: ein Haupt-Material mit Vertexfarben, ein transparentes Glasmaterial, Instancing für Fische, adaptive Pixelratio. Die bisherige Werkzeugansicht war nur ein generischer Griff/Kopf.

### Baseline-Tests vor Änderungen

- `npm run typecheck`: bestanden.
- `npm test`: 32/32 Tests bestanden.
- `npm run build`: bestanden.
- Browserlauf gegen den Vite-Entwicklungsserver: 28/29 bestanden. Der einzige Fehler betraf nur den für einen statischen Pages-Server geschriebenen Manifest-Test: Vite Dev schrieb den bereits absoluten Basispfad nochmals um. Alle 28 Gameplay-, Touch-, Save-, Angel-, Lernmissions- und BOOM-Fälle bestanden. Die endgültige Pages-Prüfung erfolgt gegen `dist` und die Live-Seite.

### Risiken und gewählte Alternativen

1. Vollständige Mesh-Neubauten nach jedem Block: Umstellung auf selektive Chunk-Neubauten; kein neues Voxel-Framework.
2. Texturen/Beleuchtung auf Mobilgeräten: kleiner prozeduraler Texture-Atlas mit Nearest-Filtering und bestehendem Lambert-/Phong-Pfad statt teurer Shader oder externer Assets.
3. Alte Konstruktionen: Editionskarten 1/2 werden nicht nachträglich mit kollidierendem Terrain überschrieben. Die neue Landschaft gilt für neue Edition-3-Welten; Oberflächen, Wasser und Werkzeugdarstellung verbessern sich für alle Saves.
4. Höhlen: Abbau wird bis knapp über die unzerstörbare Sicherheitssohle erlaubt. Eine unendliche Welt oder dynamisches Chunk-Streaming ist für die endliche Karte unverhältnismäßig.
5. Third Person: bleibt optional und wird nur umgesetzt, wenn Kamera, Avatar-Clipping und Mobilperformance zuverlässig bleiben; First Person hat Vorrang.
6. Geräteperformance: Software-WebGL-/Browsermessungen erkennen Ressourcenwachstum, beweisen aber keine 30 FPS auf einem realen Smartphone.

Weitere Abschnitte werden nach jeder Implementierungsphase ergänzt.

## Implementierter Stand

### Visuelle Welt und Rendering

- 16×32 Pixel pro Kachel großer, deterministisch im Code erzeugter Texture-Atlas; strukturierte Oberflächen für Gras, Erde, Stein, Holz, Bretter, Sand, Glas, Ziegel und die neuen Materialien. Keine fremden Texturen.
- 15 frei wählbare Baustoffe: Gras, Erde, Stein, Holz, Bretter, Glas, Sand, Ziegel, Blätter, Kopfstein, Ton, Moosstein, Dunkelholz, Kalkstein und Schiefer.
- Chunk-Renderer baut nach Änderungen nur betroffene 12×12-Abschnitte und deren Grenznachbarn neu. Transparente Glasgeometrie bleibt getrennt; alte Geometrien werden entsorgt.
- Wasser besteht aus zwei günstigen Phong-/Lambert-Lagen mit leichter Bewegung, Spiegelglanz und sichtbarer Tiefe statt eines aufwendigen Shaders.
- Neue Spielstände erhalten Edition 3: zusätzliche Felsrücken, Kalkstein-/Schieferbereiche, Tonufer, verschieden hohe Bäume, Waldgruppen und Felsen. Die alte optische Bauplatzmarkierung wird dort zu Wiese. Bestehende Editionskarten werden nicht mit neuer Geometrie überschrieben.
- Beleuchtung, Himmel/Fog und Farbpalette wurden abgestimmt. Schatten und Postprocessing bleiben zugunsten mobiler Stabilität aus.

### First Person, Werkzeuge und Bedienung

- Sichtbarer rechter Arm und sichtbare Hand im Kameraraum.
- Eigene Low-Poly-Modelle für Bauwerkzeug, Spitzhacke, Axt, Schaufel, Schwert, Angel und Holzknüppel.
- Schlag-, Abbau-, Bau-, Lauf- und Angelbewegungen; die Modelle kollidieren nicht mit dem Gelände und schreiben nicht in dessen Tiefenpuffer.
- Sichtfeld von 55–90 Grad und Kameraempfindlichkeit von 55–160 Prozent einstellbar und lokal gespeichert.
- Zoom über `X` beziehungsweise einen eigenen Touchbutton; bestehende Wischgesten werden nicht umgedeutet.
- Werkzeugleiste und Inventar zeigen Werkzeuge mit Symbolen; Ausrüstung kann direkt gewechselt werden. Materialien, Schätze und Fangbuch bleiben getrennt erreichbar.
- Bis zu 20 erfolgreiche Bau-/Abbauaktionen sind innerhalb der laufenden Sitzung rückgängig machbar. Unsichere Wiederherstellung in der Spielerfigur bleibt gesperrt.
- Bauen bleibt innerhalb der gesamten endlichen Welt möglich. Terrain kann bis zur Sicherheitssohle entfernt werden; Hügel erlauben Tunnel. Geschützt bleiben nur Sohle, Steg und zwingende Missionspunkte.
- Die v0.1.1-Pointer-Eigentümer, Cancel-/Capture-Behandlung, Ghost-Click-Sperre, Safe Areas und getrennte Unterbrechungsanzeige bleiben erhalten. Der Footer liegt explizit über der Kamerafläche, damit Challenge-/Werkzeugtasten nicht abgefangen werden.

### Learning Engine

- Alle 40 v0.2-Aufgaben und gespeicherten IDs bleiben erhalten.
- 20 zusätzliche Aufgaben der Stufen 2/3 zu Mathematik, Grammatik, Naturwissenschaft, Bauwissen, Textverständnis und logischem Denken; insgesamt 60 eindeutige Aufgaben.
- Beispiele sind Brüche, Umfang/Fläche, Prozentrechnung, Satzglieder, Konjunktionen, Auftrieb, Kiemen, Nahrungsketten, Traglast und Koordinaten.
- Adaptive Wiederholung, freiwillige Hinweise, Silben, langsame Anzeige, Überspringen, lokale deutsche Sprachausgabe und Standardmodus Lern-Challenge bleiben unverändert. Inhaltliche Schwierigkeit und Länge der Texteingabe werden nicht gleichgesetzt.

## Architekturänderungen

- `world/Renderer.ts`: prozeduraler DataTexture-Atlas und selektiver Chunk-Lebenszyklus.
- `world/WaterView.ts`: gekapselte günstige Wasseransicht.
- `world/Enrich.ts`: getrennte Edition-3-Erweiterung; alte Basiskarten bleiben stabil.
- `player/HeldTools.ts`: unabhängige First-Person-Modell- und Animationsschicht.
- `building/History.ts`: begrenzter Aktionsstapel statt nur einer letzten Aktion.
- `inventory/Equipment.ts`: additives Edition-/View-Schema und Schwert; weiterhin Erweiterungsversion 1.
- `learning/challenges.json`: bestehende IDs plus `v03-01` bis `v03-20`.
- Keine neue Produktabhängigkeit und kein Architektur-Rewrite. `main.ts` bleibt der UI-/Spielkoordinator und ist ein sinnvoller späterer Modularisierungskandidat.

## Speicherkompatibilität

- Hauptschlüssel bleibt `blockboom.save`, Hauptschema bleibt `version: 1`.
- Lernprofil bleibt getrennt unter `blockboom.learning.v1`.
- Alte Saves ohne `extension` werden wie bisher mit unveränderter Sicherung `blockboom.save.pre-v02` gelesen und als Edition 1 ergänzt.
- v0.2-Erweiterungen erhalten Edition 2, Bauten, Materialien, Fänge, Rekorde, Werkzeuge, Missionen, Abzeichen und Sterne. Fehlende Sichtwerte werden nur additiv auf FOV 70/Empfindlichkeit 1 gesetzt.
- Edition 3 gilt ausschließlich für neue Welten. Gespeicherte Welt-Deltas werden weiterhin nach der jeweiligen deterministischen Basiskarte angewendet.
- Neue Materialien sind im vorhandenen Deltaformat zulässig; beschädigte oder außerhalb der Welt liegende Daten werden weiterhin verworfen.

## Tests und Qualität

- TypeScript strict: bestanden.
- Vitest: 37/37 bestanden. Enthalten sind alte Save-/Bau-/Fang-/Missionsfälle sowie Atlas-UVs, selektive Chunk-Entsorgung, 15 Materialien, Mehrfach-Undo, Editionsschutz, View-Migration, Werkzeugmodelle/-animation und 60 eindeutige Lernaufgaben.
- Produktionsbuild: bestanden. CSS rund 16,1 kB / 4,4 kB gzip; Spiellogik rund 89,7 kB / 29,8 kB gzip; Three.js rund 484,7 kB / 121,0 kB gzip.
- Lokale Browserprüfung: 36/36 Fälle bestanden in einem vollständigen Lauf (circa 3,3 Minuten) mit Chromium und Software-WebGL gegen den gebauten Pages-Unterpfad `/Blockboom-/`, nicht nur gegen den Dev-Server. Darin: alle v0.2-Szenarien, Touch-Multitasking/Cancel/Blur, 360/390/430-Pixel-Portraits, 667×375/844×390/932×430-Landscape, Edition 3, Werkzeuganimation, FOV/Zoom, 15 Materialien, Mehrfach-Undo, Inventar, Save/Reload, alte Save-Migration, Lernen, drei Missionen, sichtbare Fische, Angeln, direkter Fang, BOOM und Pages-Assets.
- Ein Zwischenlauf fand einen echten UI-Stapelungsfehler: Im mobilen Hochformat fing die Kamerafläche den Challenge-Button ab. Footer und Hotbar haben nun eine eigene höhere Ebene bei durchlässigen Leerflächen; der gezielte Regressionstest besteht.
- WebKit-Start wurde tatsächlich versucht, scheiterte jedoch vor dem App-Start an fehlenden Hostbibliotheken (`libgtk-4`, `libgraphene`, `libharfbuzz-icu`, `libmanette`, `libhyphen`, `libGLESv2`). Safari und reale iPhone-/Android-Hardware wurden daher nicht erfolgreich ausgeführt. Chromium-Emulation ist kein Ersatz für die Geräteabnahme.

## Performance-Befunde

- Welt bleibt auf maximal 16 Chunk-Meshes in der Basiskarte; beim BOOM-Reset wurden im Unit-Test 4 statt aller 16 Meshes ersetzt.
- Der Texture-Atlas benötigt eine zusätzliche kleine GPU-Textur; alle Blöcke teilen weiterhin zwei Materialien (fest/Glas).
- First-Person-Werkzeuge werden einmal erzeugt und nur ein-/ausgeblendet. Fisch-Instancing, 20-Hz-Zielabfrage, adaptive Renderauflösung und 48-Teilchen-Grenze bleiben erhalten.
- Browsermessung einer neuen Edition-3-Welt bei 1280×720 und Pixelratio 1 mit Software-WebGL: 75 Draw Calls, 17.668 Dreiecke, 26 Geometrien, 7 Texturen und 16 Weltchunks. Nach zweimal fünf Bau-/Undo-Zyklen blieben die Zähler jeweils bei 32 Geometrien und 7 Texturen; in diesem Szenario kein unkontrolliertes Ressourcenwachstum.
- 30 FPS auf einem repräsentativen Smartphone sind nicht nachgewiesen und bleiben offen.

## Bewusst verschoben oder begrenzt

- Kein Zombie-/Gesundheits-/Hunger-System und kein komplexes Crafting oder Werkzeugverschleiß. Das Schwert ist vorbereitet und animiert, aber es gibt noch keine Gegner. Diese Systeme wären ein eigener, balancierungs- und performancekritischer Vertikalschnitt.
- Keine Third-Person-Kamera: optionaler Wunsch, aber ein korrektes Avatar-, Kamera-Clipping- und Kollisionssystem hätte den stabilen First-Person-Schnitt gefährdet.
- Kein unendliches Terrain/Chunk-Streaming. Die endliche 48×48-Welt nutzt selektive Chunk-Neubauten.
- Undo wird nicht über einen Reload gespeichert; Weltänderungen selbst werden gespeichert. Ein dauerhaftes Undo-Protokoll würde das Saveformat deutlich vergrößern und benötigt eine eigene Migrations-/Konfliktstrategie.
- Wasser besitzt keine Schwimmphysik. Transparente Glas-/Wasserlagen können weiterhin Sortierartefakte zeigen.
- Die neue Basiskarte erscheint nicht automatisch in alten Welten, damit bestehende Konstruktionen Vorrang behalten.
- Keine geprüfte Handschriftwirkung; Bildschirmtexteingabe trainiert nicht automatisch Handschrift.

## Lokaler Start

```bash
cd /workspace/blockboom
npm ci
npm run dev
```

Dann `http://localhost:5173/Blockboom-/` öffnen. Produktionsprüfung:

```bash
npm run typecheck
npm test
npm run build
npm run preview -- --port 4204
BLOCKBOOM_TEST_URL=http://127.0.0.1:4204/Blockboom-/ npm run test:browser
```

## Konkreter iPhone-/Android-Testplan

1. Live-Seite in einem neuen normalen Safari-/Chrome-Tab öffnen, Website-Daten nicht löschen und Startmarkierung `v0.3.0` prüfen.
2. Vorhandenen v0.2-Spielstand laden: Position, Bauten, Fische, Missionen, Sterne und Lernfortschritt kontrollieren. Ein Backup des Browsers ist vor dem Löschen von Websitedaten sinnvoll.
3. Querformat: linken Daumen mindestens 30 Sekunden bewegen, rechts gleichzeitig drehen; Finger einzeln lösen, springen, zoomen und schnell Werkzeuge wechseln. Das Pausenmenü darf nur per Menübutton erscheinen.
4. Hochformat 360–430 CSS-Pixel: Challenge öffnen, Texteingabe fokussieren, Tastatur ein-/ausblenden, Antwort/Hilfe/Schließen erreichen; danach drehen und weiterlaufen.
5. Alle sieben Werkzeugmodelle prüfen. Axt/Spitzhacke/Schaufel abbauen, Bauwerkzeug setzt Blöcke, Angel wirft aus, Holzknüppel fängt einen sichtbaren Fisch, Schwert animiert ohne Gore.
6. Auf Materialseite 3 Schiefer wählen, mehrere Blöcke setzen, zweimal Undo, speichern und neu laden. Verbleibende Blöcke müssen erhalten sein.
7. See/Fangbuch, drei Lernmissionen und BOOM-Auslösen/Reset stichprobenartig prüfen.
8. Mindestens zehn Minuten bauen, abbauen, angeln und BOOM wiederholen. Erwärmung, Ruckler, Safari-Neuladen, Speicherwarnungen und Gerät-/OS-/Browser-Version notieren.

## Commits und Deployment

- `8c33de9`: v0.3-Audit und Sicherheitsgrenzen.
- `d09541f`: strukturierte Chunkwelt, 15 Materialien, Mehrfach-Undo, First-Person-Werkzeuge und v0.3-Version.
- `e6f2ec9`: 20 neue Aufgaben auf Niveau der sechsten Klasse und Lernregressionen.
- `85a4c89`: vollständige v0.3-Browserregression, mobile UI-Stapelung, Release-Dokumentation und visuelle Prüfbilder.
- Der tatsächliche Pages-Status wird erst nach Merge, Push, Workflowabschluss und Live-Prüfung eingetragen.
