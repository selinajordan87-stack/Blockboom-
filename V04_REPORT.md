# BLOCKBOOM v0.4 – Fishing Adventure

Stand: Entwicklungsbranch `feature/v04-fishing-adventure`

## Phase 1 – Audit und Sicherheitsgrenzen

- Ausgangspunkt: `main` und `origin/main` sauber auf `bf258390934094354b0d57da567c3aa6292dfbe4`.
- Veröffentlichung v0.3: GitHub-Pages-Workflow `43277665209` erfolgreich; Live-Seite HTTP 200 mit Bundle `index-C8K7tUZZ.js`, sichtbare Version v0.3.0.
- Baseline vor Änderungen: TypeScript strict bestanden, 37/37 Vitest-Fälle bestanden, Produktionsbuild bestanden, 36/36 Browserfälle gegen `dist` unter `/Blockboom-/` bestanden.
- Vorhandener Angelkern: fünf sichtbare Arten mit je drei Instanzen, ein realer Ziel-Fisch schwimmt zum festen Schwimmer, Zustände `idle/waiting/bite`, unmittelbarer Fang nach Reaktion. Es gibt noch keine Ausrüstungsauswirkung, Kraftaufladung, Flugphase, Drill, Schnurspannung, Fangentscheidung oder Regelprüfung.
- Rendering: Fischdarstellung nutzt vor v0.4 zwanzig InstancedMeshes (vier Teile × fünf Arten). Rutendarstellung ist ein einfaches Kameramodell; Schwimmer und Rute besitzen noch keine sichtbare Schnur oder zustandsabhängige Biegung.
- Speicherung: Hauptschlüssel `blockboom.save`, Schema `version: 1`, additive `extension.version: 1`; Lernprofil separat unter `blockboom.learning.v1`. Diese Schlüssel und Versionen bleiben erhalten.
- Editionskarten 1–3 und alle gespeicherten Welt-Deltas bleiben lesbar. Neue Gewässer werden als kompatible Basiskartenerweiterung vor den gespeicherten Deltas aufgebaut, sodass ausdrücklich gespeicherte Platzierungen/Entfernungen Vorrang behalten.

### Gewählte Architektur

1. Eine reine, testbare `AnglingEngine` verwaltet Aufladen, Flug, Warten, Biss, Drill, Flucht und Anlanden unabhängig von DOM/Three.js.
2. Ausrüstung, Fischwissen, simulierte Regeln und Angelplätze liegen datengetrieben in eigenen Modulen.
3. Die Fischansicht wird auf wenige gemeinsame InstancedMeshes mit anatomisch lesbaren Körperteilen umgestellt, statt pro Art weitere Draw Calls zu vervielfachen.
4. Schnur, Schwimmer und Landemodell werden in einer gekapselten Three.js-Ansicht aktualisiert; kein zweiter WebGL-Kontext.
5. Angelprogress wird additiv in der bestehenden Extension gespeichert. Alte Fangprotokolle bleiben gültig; neue Felder sind optional und werden begrenzt validiert.
6. Vier Gewässer liegen innerhalb der bestehenden endlichen Welt. Gespeicherte Änderungen werden danach angewendet und nicht überschrieben.

### Risiken

- Ein kompletter realistischer Angelsimulator wäre für Smartphone und Zielgruppe zu komplex. Der Drill bildet Spannung, Widerstand, Einholfortschritt, Schnurbruch und Flucht abstrahiert, aber nachvollziehbar ab.
- Bundesland- und gewässerspezifische reale Vorschriften können nicht statisch korrekt abgebildet werden. Regeln werden ausdrücklich als simulierte Lernwerte gekennzeichnet und ersetzen weder Erlaubnisschein noch Unterweisung.
- Zusätzliche Fischarten/Orte dürfen Draw Calls und aktive Population nicht linear explodieren. Population und Partikel bleiben fest begrenzt.
- Reale iPhone-/Android-Performance und Bediengefühl bleiben eine gesonderte Geräteabnahme; Browseremulation beweist keine 30 FPS auf Hardware.

## Phase 2–7 – Tatsächlich implementiert

### Angel, Animation und Spielablauf

- Sichtbare First-Person-Rute mit Arm/Hand, dreiteiligem Rutenkörper, beweglicher Spitze, Rolle und animierter Kurbel. Rutenpose und -biegung unterscheiden Aufladen, Auswurf, Warten, Biss, Drill und Anlanden.
- Eine dynamische Angelschnur verwendet genau eine aktualisierte `BufferGeometry`; Schwimmer und Wasserringe werden wiederverwendet. Der Auswurf folgt einer sichtbaren Flugkurve aus Kamerarichtung und aufgeladener Wurfkraft.
- `AnglingEngine` als DOM- und Three.js-unabhängiger Zustandsautomat: `idle → charging → flying → waiting → bite → drill → landed/escaped`.
- Im Drill wirken Fischgröße/-art, Widerstand, Rute, Schnurstärke und Schnurdehnung auf Spannung und Fortschritt. Dauerhafte Überlastung verursacht simulierten Schnurbruch; dauerhaft lose Schnur lässt den Fisch entkommen. Kontrolliertes Kurbeln landet das konkrete Fischobjekt.
- Eine große Halten/Loslassen-Fläche bedient Wurf, Anschlag und Kurbeln auf Touchgeräten mit einer Hand. `pointercancel` und `lostpointercapture` beenden Aufladen/Kurbeln ohne hängenden Zustand oder Pause. Desktop nutzt dieselbe Mechanik über E beziehungsweise die Maus.
- Beim Anlanden erscheint das tatsächliche Voxelmodell in einer kamerainternen 3D-Fangansicht. Der Spieler kann Merkmale untersuchen, schonend zurücksetzen oder – wenn die optionale Simulation dies zulässt – sachlich und ohne grafische Verletzungsdarstellung versorgen.
- Der Holzknüppel fängt weiterhin ausschließlich ein räumlich getroffenes, sichtbares Fischobjekt. Die Trefferhülle entspricht dem Modellvolumen, damit nicht pixelgenau eine kleine Flosse getroffen werden muss.

### Fische, Gewässer und Ausrüstung

- Acht Arten: Rotauge, Flussbarsch, Hecht, Karpfen, Forelle, Zander, Schleie und Brasse. Die Modelle besitzen Körper, Kopf, Schwanz, Rücken-/Seitenflossen, Augen und artabhängige Markierung, Proportion, Farbe, Größe und Tiefe.
- 24 gleichzeitig simulierte Fische. Schwarmarten gruppieren sich, Grundfische bleiben tiefer, Flussarten reagieren auf die Strömung und Räuber können kleinere Fische verfolgen. Entfernte Fische verwenden dieselben einfachen Instanzanimationen; die Population wächst nicht unkontrolliert.
- Alle Fischteile werden artenübergreifend in sieben `InstancedMesh`-Draw-Objekten gerendert. Farben sind gecacht; das Frame-Update erzeugt für Flossen-/Augenpositionen keine temporären Vektoren mehr.
- Vier Orte in der bestehenden 48×48-Welt: Kleiner See, Waldsee, Fluss und Geheimteich. Neue Becken, Wasseroberflächen, Schilf, Totholz und Strömungsmarken werden vor gespeicherten Deltas aufgebaut. Vorhandene Bäume, Ruinen und Marker bleiben als Inseln erhalten; Spieleränderungen gewinnen immer.
- Eigenes Angelset für Stipprute, Spinnrute, Raubfischrute, Posen-/Grundmontage, drei Schnüre, drei Hakengrößen sowie Wurm, Mais und Kunstköder. Köder, Hakengröße, Tiefe, Rutenreichweite/-stärke und Schnur wirken in Auswahl oder Drill.
- Freischaltung erfolgt durch echte Fänge bei 1, 3 und 7 angelandeten Fischen – nicht ausschließlich durch Lernen. Angelplätze werden durch Erkundung entdeckt.

### Fangbuch, Regeln und Lernen

- Fangprotokolle speichern Art, Länge, Gewicht, Methode, Köder, Ort und Entscheidung. Das Fangbuch zeigt Anzahl, Inventarmenge, persönliche Längen-/Gewichtsrekorde, letzten Köder/Ort, Lebensraum, Nahrung und eine echte 3D-Vorschau.
- Abzeichen: erster Fisch, fünf Arten, erster Hecht, zehn Fänge und alle Angelplätze. Zurückgesetzte und versorgte Fische werden getrennt gezählt.
- Optionale Mindestmaß-/Schonzeit-Simulation mit auswählbarer Jahreszeit. Jeder Hinweis erklärt sichtbar, dass reale Regeln von Bundesland, Gewässer, Erlaubnisschein und Zeitpunkt abhängen und BLOCKBOOM weder Fischereischein noch praktische Unterweisung ersetzt.
- 60 neue, datengetriebene Angelaufgaben zusätzlich zu 60 bestehenden Aufgaben. Themen: Arten, Gewässer/Lebensräume, Nahrungsketten, Geräte, Sicherheit, Naturschutz/Regelkunde, Maße/Gewichte, Textverständnis und Fachschreibung.
- Jede neue Aufgabe enthält getrennte Stufen für fachliche Schwierigkeit und Schreibmenge sowie Lösungen, Varianten, Hinweise, Silben und Vorlesetext. Die vorhandene adaptive Auswahl, freiwillige Hilfen und lokale Web-Speech-Funktion bleiben erhalten. Bestehende Aufgaben behalten ihre Auswahlreihenfolge.

## Architektur und veränderte Bereiche

```text
src/fishing/
  AnglingData.ts       Orte, Ausrüstung, Fortschritt, Regeln, Abzeichen
  AnglingEngine.ts     reiner Wurf-/Biss-/Drill-Zustandsautomat
  Fishing.ts           acht Arten, Wissen und kompatibles Inventar
  FishingView.ts       Schnur, Schwimmer, Wasserringe
  FishingWorld.ts      additive Gewässer und effiziente Umgebung
  FishView.ts          instanzierte Fischmodelle und 3D-Fangansicht
  Shoal.ts             begrenzte Population und Artverhalten
src/learning/
  fishing-challenges.json  60 neue Aufgaben
src/inventory/Equipment.ts additive Angelprogress-/Fangfelder
src/storage/Save.ts        acht Arten, bestehendes Save-v1 bleibt
src/player/HeldTools.ts    Rute, Spitze, Rolle und Zustandsposen
e2e/fishing-v04.spec.ts    Migration, Ausrüstung, Touchcancel, Orte
e2e/fishing-helper.ts      echter Hold/Release-/Drill-Ablauf
```

`src/main.ts` bleibt der übergeordnete Spielkoordinator. Die rechenintensive bzw. fachliche Angellogik liegt nicht darin, sondern in testbaren Modulen. Ein kompletter Umbau des bestehenden Koordinators wurde bewusst vermieden.

## Speicherkompatibilität

- Hauptschlüssel bleibt `blockboom.save`, Save-Schema bleibt `version: 1`, Extension bleibt `version: 1`; das Lernprofil bleibt separat in `blockboom.learning.v1`.
- Vor dem ersten Upgrade einer Edition 1–3 legt die App einmalig `blockboom.save.pre-v04` an. Anschließend wird nur die additive Edition auf 4 gehoben.
- Alte Drei-/Fünf-Arten-Inventare, Weltänderungen, Blickrichtung, Material, Missionen, Abzeichen und Lernprofile werden validiert übernommen. Fehlende v0.4-Felder erhalten sichere Starterwerte.
- Neue Fangfelder sind optional, begrenzt und werden einzeln validiert. Alte Fangprotokolle bleiben im Fangbuch gültig.
- Ein Browser-/Originwechsel überträgt `localStorage` weiterhin nicht automatisch. Löschen der Website-Daten löscht den lokalen Fortschritt.

## Tatsächlich ausgeführte Prüfungen

- `npm run typecheck`: bestanden, TypeScript strict.
- `npm test`: **43/43 bestanden** in acht Vitest-Dateien.
- `npm run build`: bestanden mit Vite 7.3.8.
- Produktions-Browserprüfung gegen `vite preview` unter dem echten Pages-Unterpfad `/Blockboom-/`: **40/40 bestanden** in Chromium/Software-WebGL, Laufzeit 5,2 Minuten.
- Abgedeckt: altes Save und Sicherung, Welt-Deltas, acht Arten, echte Fischbewegung, Wurf/Flug/Biss, kontrollierter Drill, Schnurbruch/lockere Schnur, Anlanden, Zurücksetzen/Versorgen, Holzknüppel, Fangbuch, Ausrüstung, alle Orte, Missionen, 120 Lernaufgaben, Vorlesen-Fallback, Touch-/Pointer-Abbruch, Mehrfingersteuerung, keine unbeabsichtigte Pause, 360/390/430-Portrait sowie 667×375, 844×390 und 932×430 Landscape, Pages-Assets und Reload.
- Der Angel-Browsertest verwendet ausschließlich sichtbare Halten/Loslassen-Eingaben und passt das Kurbeln anhand der sichtbaren Spannungsanzeige an. Keine internen Zustände werden für einen Fang übersprungen.
- Nach der vollständigen Suite wurde die 3D-Fangansicht visuell nachgebessert und der vollständige Desktop-Fang-/Fangbuchfall erneut einzeln bestanden.
- Screenshots: `artifacts/fishing-landing.png`, `artifacts/catchbook-3d.png`, Fangbuch, Desktop sowie Mobile-Viewports.

Buildgrößen des letzten geprüften Builds:

- Spielcode: rund 155 kB (48,6 kB gzip)
- Three.js-Chunk: rund 488 kB (122 kB gzip)
- CSS: rund 19,3 kB (5,2 kB gzip)

## Performance-Befunde

- Diagnostik im getesteten v0.4-Startzustand: 16 Chunk-Meshes, 77 Renderaufrufe, 21.566 Dreiecke, 39 Geometrien und 10 Texturen bei Renderfaktor 1 im Software-WebGL-Test.
- Wiederholtes Bauen/Undo stabilisierte sich bei 45 Geometrien und 10 Texturen; es wurde kein fortlaufendes GPU-Ressourcenwachstum im geprüften Ablauf beobachtet.
- Fischpopulation: fest 24; Fischmodelle: sieben instanzierte Draw-Objekte; BOOM-Partikel: weiterhin maximal 48 und werden entfernt.
- Adaptive Pixelratio und manuelle Sparauflösung bleiben aktiv. Kein teurer Postprocessing- oder Schattenpass wurde ergänzt.
- **Nicht nachgewiesen:** 30 FPS, Akkuverbrauch, Wärme und Langzeitspeicher auf einem echten iPhone oder Android-Gerät. Software-WebGL und Viewport-Emulation ersetzen keine Hardwaremessung.

## Bewusst begrenzter oder offener Umfang

- Die Regelwerte sind absichtlich eine klar gekennzeichnete Simulation, keine vollständige oder tagesaktuelle Rechtsdatenbank.
- Versorgung ist eine kurze, nicht grafische UI-Sequenz; keine realistische Tötungs-/Verletzungsanimation.
- Es gibt kein komplexes Crafting-Rezeptsystem und keine Verbrauchsökonomie für Köder. Ausrüstung wird über Spielfortschritt freigeschaltet.
- Fischverhalten ist stilisiert: kein vollständiges Ökosystem, keine realistische Hydrodynamik und keine echte Angelschnurphysik.
- Keine reale iPhone-/Android-Abnahme, kein WebKit-Automationsergebnis und kein vollständiger Offline-Service-Worker.
- Ein echter Fußweg zu jedem neuen Ort wurde nicht automatisiert abgespielt; Entdeckung, Kollision und Speichern wurden an allen vier Zielkoordinaten geprüft.

## Konkreter iPhone-/Android-Testplan

1. Live-Seite in Safari beziehungsweise Chrome öffnen, vorhandenen v0.3-Spielstand laden und prüfen, ob Bauwerk, Inventar, Missionen und Position vorhanden sind.
2. Ins Querformat drehen. Gleichzeitig links laufen und rechts umsehen; Menü darf nur nach bewusstem Tippen öffnen. Browser kurz in den Hintergrund legen und mit „Weiter“ fortsetzen.
3. Am Kleinen See Angel ausrüsten. Große Angel-Taste halten, Kraft beobachten und loslassen. Beim Untertauchen drücken; beim Drill halten, im roten Bereich kurz lösen und bei völlig lockerer Schnur wieder kurbeln.
4. Einen Fang untersuchen und zurücksetzen. Einen zweiten erlaubten Simulationsfang versorgen; Inventar, Fangbuch, Köder/Ort, Rekord und 3D-Vorschau prüfen.
5. Im Angelset Köder/Montage wechseln. Nach mehreren Fängen Freischaltungen prüfen. Waldsee, Fluss und Geheimteich erkunden und nach Reload im Angelset kontrollieren.
6. Touch während Wurfkraft und Drill abbrechen (Finger aus dem Bereich, App-Wechsel). Bewegung/Kurbeln dürfen nicht hängen, das Pausenmenü nicht erscheinen.
7. Challenge öffnen, Vorlesen testen und eine Texteingabe mit Bildschirmtastatur durchführen. Freies Spiel muss nach Schließen sofort weitergehen.
8. Mindestens 15 Minuten spielen; Ruckeln, Wärme, Akkudrain, Audio, abgeschnittene Safe-Area-Elemente und Safari-Version protokollieren. Diese echte Geräteabnahme ist Voraussetzung für die endgültige mobile Bestätigung.

## Commits und Veröffentlichung

- `ed7f80d` – Audit v0.4 fishing baseline and compatibility boundaries
- `d54b48a` – Build interactive v0.4 fishing adventure
- `80f2910` – Harden v0.4 mobile fishing and browser regression
- Deploymentstatus wird erst nach erfolgreichem Push, GitHub-Actions-Lauf und Abruf des neuen Live-Bundles bestätigt. Bis dahin ist v0.4 **lokal getestet, aber noch nicht veröffentlicht**.
