# v0.7.2 – Visual & World Polish: geprüfter Zwischenstand

**Kein fertiges Release. Nicht auf main übernommen oder veröffentlicht.** Die Live-Version bleibt v0.7.1. Die optischen Abnahmekriterien sind noch nicht erreicht. Ausgangspunkt ist der tatsächliche HEAD `bab05373617badc14be72396590aab22af256987`, nicht nur der frühere Softwarecommit `25fc213`.

## Visual Audit

Die Vergleichsaufnahmen zeigen die wichtigsten Schwächen direkt: Die Startregion hat wenig Höhenstaffelung, die Bergannäherung wird von einer eingeschnittenen Geländekante beherrscht, der See wirkt fast trocken und Gebäude/Bäume bleiben kantig. Ein reiner Austausch von Farben und Fernobjekten reicht nicht für die gewünschte Weltqualität.

## Tatsächlich umgesetzt

- Weniger überstrahlte Tagesbeleuchtung, wärmeres Sonnenlicht, hellere nächtliche Grundbeleuchtung und ein klarerer Himmel.
- Abgestimmte Gras-/Stein-/Sandfarben sowie räumlich variierende Blattfarben ohne zusätzliche Texturen.
- Blaues, lichtunabhängig eingefärbtes Oberflächenwasser statt einer durch hohe Beleuchtungsintensität ausgewaschenen Wasserfläche. Transparenz und bisherige Bewegung bleiben erhalten. Keine Spiegelungen oder teuren Shader.
- Begrenzte, terrainfolgende Vordergrundpflanzen in zwei wiederverwendeten Instanzbatches. Bearbeitete Bodenspalten werden ausgelassen. Die Pflanzen sind nicht kollidierende Details und verändern keine Weltblöcke.
- Gestapelte Fernberg-Platten durch begrenzte spitze LOD-Silhouetten ersetzt. **Das verändert die tatsächliche begehbare Bergform nicht.**
- Ein kleiner Rucksack ergänzt die bestehende Third-Person-Figur; Werkzeuge und Animationen bleiben erhalten.

Geänderte Hauptdateien: `world/Renderer.ts`, `LandmarkView.ts`, `WaterView.ts`, neues `NatureDetails.ts`, `fishing/FishingWorld.ts`, `nightfall/DayCycle.ts`, `player/Avatar.ts`, Integration in `main.ts`. Keine neue Abhängigkeit, keine neue Gameplay-Engine, keine Änderung an Speicherformat, Inventar oder Weltgenerierung.

## Vergleichsmethode und Bilder

[Galerie](artifacts/v072/README.md). Je 16 Screenshots aus tatsächlich laufenden Produktionsbuilds, kein Mockup. Gleiche kontrollierte Save-Fixtures, Kamerawinkel, 844×390 CSS-Pixel, Kreativ/friedlich, Tageszeit außer Nachtfall gleich. Diese Renderprüfungen verwenden direkte Test-Speicherstände und sind **keine** neuen Spielerwege oder Belege für selbstständige Auffindbarkeit. Tatsächliche Position, Chunkzeiten, Frames und GPU-Zähler stehen jeweils in `metrics.json`.

Die Aufnahme „mountain“ zeigt die Annäherung mit der störenden Geländekante. Sie ist ausdrücklich kein Beweis, dass ein markanter echter Berg fertig wäre. Auch die neuen Pflanzen sind noch einfache stilisierte Formen. Das Mockup-Niveau wurde nicht erreicht.

## Speicher- und Gameplay-Sicherheit

Terrain, Kollisionsblöcke und bestehende Bauten wurden nicht umgeformt. Gespeicherte Änderungen behalten ihre Koordinaten. Der neue Pflanzenrenderer wird mit unverändertem Weltzustand, begrenzten Instanzzahlen und wiederverwendeter Geometrie getestet. Bestehende Save- und Kameratests bleiben erhalten. Der v0.7.1-Fischmaterialvertrag wurde nicht verändert.

## Noch offen – vor einem Release erforderlich

1. Tatsächliches Bergterrain mit klaren Gipfeln, lesbaren Höhenstufen und sicheren Wegen; vorher eine ausdrücklich versionierte Terrainstrategie für bestehende Welten entwickeln.
2. Physisch und visuell unregelmäßigere Ufer und Flussquerschnitte; begehbare Angelzugänge erhalten.
3. Größere natürliche Baumkronenvariation, passende Lichtungen und weniger geometrische Vegetation.
4. Höhleneingang und Innenraum als zusammenhängenden Ort gestalten, Erzadern und Lichtakzente verbessern.
5. Siedlung/Schmiede mit unterschiedlichen Dächern und glaubwürdigen Werkstattdetails.
6. Tier-/Fischsilhouetten und Ego-Hand/Fackel weiter bearbeiten, kontrollierte Abend-/Nachtabnahme.
7. Größere Gameplay-Regression, reale mobile Abnahme und erst danach Versionierung/Deployment.

Es wird deshalb weder eine fertige v0.7.2 noch ein neues Live-Bundle behauptet. Die Versionsanzeige bleibt bewusst v0.7.1, solange es ein Entwicklungsstand auf dem eigenen Branch ist.


## Tatsächlich ausgeführte Prüfungen

- Baseline auf v0.7.1: TypeScript, 170 Logiktests und Produktionsbuild bestanden.
- Zwischenstand `29f80b8`: TypeScript strict, **172/172 Logiktests in 28 Dateien**, Produktionsbuild bestanden.
- **16/16 ausgewählte Browsertests bestanden, 3,0 Minuten**: drei Landscape-/Safe-Area-Größen 667×375, 844×390, 932×430; Kamera/enge Sicht/Kamerabefreiung/Baumkollision; Export/Import; BOOM; Schreibkampf; Jagd/Grill/Essen/Reload in Ego und Third Person; wirklicher Stegfang; beide seitlichen Fischgruppen und bestehender Startbudgettest.
- Je 16 kontrollierte Vorher-/Nachher-Aufnahmen, keine registrierten `pageerror`-Ereignisse. Kein kompletter neuer Gameplay-Gesamtlauf, kein echter iPhone-/Android-Test und keine Live-Prüfung eines v0.7.2-Bundles.

[Logikprotokoll](artifacts/v072/logic-tests.log) · [Browserprotokoll](artifacts/v072/browser.log) · [Produktionsbuild](artifacts/v072/build.log).

## Performance

Der unveränderte bestehende Startbudgettest misst **96 Draw Calls, 39.478 Dreiecke, 55 Geometrien, vier Texturen und 28 Chunks** bei Faktor 1. v0.7.1-Referenz: 93 / 39.510 / 52 / 4 / 28. Die Grenzen **unter 40.000 Dreiecken und höchstens 110 Draw Calls wurden nicht angehoben**. Weniger Fernberg-Dreiecke gleichen die kleinen Instanzdetails aus. Diese Zahlen sind Ressourcenprüfungen, kein Qualitätsbeweis und keine Smartphone-FPS-Messung.

Der Logik-Renderbudgetlauf mit Ziel 4 ms meldete 20 Slices, maximal 4,34 ms und durchschnittlich 2,35 ms; ein beobachteter Chunk-CPU-Maximalwert lag bei 3,28 ms. Das sind Software-/Cloud-Messungen, keine harte Obergrenze. Synchrone Startwerte und Szenenwerte sind separat in den Vergleichs-JSONs vorhanden. Langzeit-Heapverhalten wurde nicht neu gemessen.

## Git und Fortsetzung

Branch: `polish/v072-visual`.

- `107cd9a`: tatsächlicher Visual Audit mit 16 Vorher-Szenen und reproduzierbarem Aufnahmeprogramm.
- `29f80b8`: erste Darstellungsstufe, Schutztests und Nachher-/Regressionsevidenz.

`main` und `origin/main` bleiben auf `bab0537`. Kein Push und kein Deployment dieses Zwischenstands. Der nächste Umsetzungsschritt ist eine sichere, versionierte Terrainstrategie für **wirklich** modellierte Berge/Ufer und begehbare Höhlen – erst danach weitere Art-Details und Veröffentlichung. Das bisherige Live-Spiel bleibt unter https://selinajordan87-stack.github.io/Blockboom-/ verfügbar.

Wiederholen: `npm run build`, `npm run preview -- --port 4208`, anschließend `VISUAL_OUT=artifacts/v072/recheck node scripts/visual-v072.mjs`. Die Screenshots verwenden absichtlich kontrollierte Test-Speicherstände; nicht mit dem persönlichen Spielstand ausführen.
