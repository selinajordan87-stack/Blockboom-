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
