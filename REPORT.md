# BLOCKBOOM – First Playable Foundation v0.1

Stand: 10. November 2026. Lokal ausführbares First Playable. Die Abnahmekriterien des spielbaren Kerns sind implementiert; die Ergebnisse der abschließenden Produktionsprüfung stehen in Abschnitt 6. Ein Android-Gerätetest ist noch offen.

## 1. Implementierte Funktionen

- Deutsche Startansicht mit echter 3D-Welt im Hintergrund, verständliche Spieloberfläche, Pause, Inventar und Einstellungen.
- Deterministische, begrenzte 48 × 48 Blockwelt: Gras, Erde, Stein, Hügel, Bäume, See, begehbarer Angelsteg, markierter Bauplatz, abgegrenzte BOOM-Testzone. Eigene Farben und Geometrie.
- Ego-Kamera, WASD, Maus mit Pointer Lock, Ziehen als Maus-Fallback, Springen, Schwerkraft, Blockkollision und Weltgrenzen. Rückkehr zum Startpunkt im Menü.
- Touch-Joystick mit Pointer Capture, eigener rechter Kamerabereich, große Tasten für Sprung, Bauen, Entfernen, Inventar, Menü und kontextabhängige Interaktion. Mehrere Finger werden über getrennte Pointer-IDs verarbeitet.
- Sechs frei verfügbare Baustoffe: Gras, Erde, Stein, Holz, Bretter, Glas. Zielmarkierung, transparente Vorschau für gültige Positionen, sechs Blockslots, Reichweite von sechs Blöcken, Schutz vor Platzierung in der Figur, geschützter Weltboden.
- Angeln am Steg: Auswerfen, sichtbare Angel und Schwimmer, zufällige Wartezeit, 2,8 Sekunden Reaktionsfenster, erneutes Angeln nach verpasstem Biss. Rotauge 45 %, Flussbarsch 40 %, Hecht 15 %. Beschreibungen und Fangzahlen im Inventar.
- BOOM entfernt die Teststruktur, erzeugt bis zu 48 kurzlebige animierte Blockpartikel und optional einen lokal erzeugten Ton. „Aufbau“ stellt die Struktur wieder her. Keine reale Sprengphysik.
- Genau eine freiwillige Lesemission: „Fange einen Barsch.“ Annahme oder Überspringen; positives Feedback nach Fang. Vorlesen nur auf Wunsch und nur mit einer als lokal gemeldeten deutschen Geräte-Stimme. Bei fehlender Stimme erscheint ein Hinweis.
- Lernfortschritt: abgeschlossene Mission, Annahmen/Wiederholungen, erfolgreiche Antwort und freiwillige Hilfe. Keine Diagnostik, Bewertung von Rechtschreibung oder personenbezogene Auswertung.
- Versionierter lokaler Spielstand: Position, Blickrichtung, Blockänderungen, Fanginventar, Mission und Einstellungen. Automatisches Speichern alle zehn Sekunden, nach Änderungen, bei Pause und Verlassen; manuelles Speichern. Defekte/unbekannte Versionen werden vor Neubeginn unter einem separaten Schlüssel gesichert. Speicherfehler werden angezeigt.
- Sichtbare Blockflächen werden in räumlichen Gruppen zu BufferGeometrien zusammengefügt. Wiederverwendete Materialien, begrenzte Sichtweite, einfache Beleuchtung, keine Echtzeitschatten. Begrenzte Pixeldichte und adaptive Reduktion bei langsamen Frames.
- Manifest und eigenes SVG-Icon als PWA-Vorbereitung. Kein Tracking, Login, externer Assetabruf oder Server-Backend.

## 2. Noch nicht implementierte Funktionen

- Vollständiger Offline-Modus/Service Worker und umfassende PWA-Installierbarkeit einschließlich plattformspezifischer Icons.
- Inhaltliche Rechtschreibübungen, weitere Lesemissionen, konkrete Schwierigkeitsanpassung und Lernredaktion. Die vorgesehenen Schnittstellen sind vorhanden.
- Weitere Welten, Crafting, begrenzte Materialökonomie, Schwimmen, detaillierte Fischmodelle, animierter Angler oder komplexere Angelsimulation.
- Export/Import von Spielständen, Migration aus einer früheren veröffentlichten Version (es existiert noch keine), umfangreiche Save-Reparatur.
- Nachgewiesene Performance und Browserkompatibilität auf realer Android-Hardware; WebGL-Kontextwiederherstellung nach GPU-Verlust.

## 3. Technologien

Vite 7, TypeScript 5, Three.js 0.180, HTML/CSS, localStorage, Web Audio, optionale lokale Speech Synthesis. Tests: Vitest 3 und Playwright mit installiertem Chromium. Exakte Versionen in `package-lock.json`. Keine kostenpflichtigen Dienste. Asset- und Bibliothekslizenzen in `THIRD_PARTY.md`; Three.js-Lizenz wird im Build mitgeliefert.

## 4. Architektur

```text
src/
  world/       deterministische Voxelwelt, Bauvalidierung, Flächenrenderer
  player/      schrittweise AABB-Kollision und Bewegung
  fishing/     Fang-Zustandsautomat, Fischdaten und Inventar
  boom/        auf die Teststruktur begrenzte Zerstörung
  learning/    ReadingEngine, LearningContent, LearningProgress,
               SpellingEngine- und DifficultyAdapter-Schnittstellen
  storage/     Save v1, Validierung und fehlertoleranter Speicherzugriff
  ui/          responsive Darstellung
  tests/       reine Logiktests
  main.ts      verbindet Rendering, Eingaben und Oberfläche
 e2e/          tatsächliche Browserabläufe
```

Keine Physikengine. Bewegung wird in Schritten von 1/120 Sekunde integriert; große Frame-Abstände sind begrenzt. Die Figur ist 0,56 Blöcke breit und 1,75 hoch. Weltänderungen werden gegenüber der deterministischen Basiskarte gespeichert. Die Lern-Schnittstellen erlauben später JSON-Inhalte; aktuell ist genau eine kurze Mission enthalten. Der UI-/Spielkoordinator ist bewusst noch eine gemeinsame Datei und sollte bei wachsendem Umfang in kleinere Controller zerlegt werden.

## 5. Tatsächlich ausgeführte Tests

- `npm test`: zwölf Vitest-Fälle für gültiges/ungültiges Bauen, Entfernen, Reichweite, Selbstkollision, Boden, Sprung, Wandkollision, sicheren Ladepunkt, drei Fangarten und Bisszeitfenster, Inventar, freiwillige Mission, Save-Roundtrip, ungültige/alte/zukünftige Versionen, defekte Inhalte, gesperrten Speicher und BOOM/Reset.
- `npm run typecheck`: TypeScript im strikten Modus.
- `npm run build`: TypeScript und minifizierter Produktionsbuild.
- Playwright auf dem Dev-Server: sechs Browserfälle gemeinsam bestanden, anschließend zusätzlicher vollständiger Touch-Spielablauf bestanden.
- Abschließende Suite gegen `vite preview` auf Port 4173: Start, Bewegung, Mausbedienung, Bauen/Entfernen, Speichern/Neuladen, Angeln mit deterministisch gewähltem Barsch, Missionsabschluss, Fangsammlung, BOOM/Reset, Touch-Joystick/Kamera/Inventar/Menü bei 360, 390, 430 Pixeln, sowie Bau-/Angel-/BOOM-Aktionen per Touch bei 390 Pixeln.
- Testpositionen werden durch gültige lokale Spielstände vorbereitet; die Aktionen erfolgen über reale UI-/Tastatur-/Touch-Eingaben. Für reproduzierbare Fangprüfung wird die Zufallsauswahl im Test festgelegt.
- Browserfehler werden in Desktop- und Touchabläufen abgefangen. Screenshots liegen in `artifacts/`; Startansicht, Desktopspiel und 390-Pixel-Ansicht wurden zusätzlich visuell geprüft.

## 6. Testergebnisse

- Logik: **12/12 bestanden**.
- TypeScript: **bestanden**.
- Produktionsbuild: **bestanden**, ohne Bundlegrößenwarnung. JavaScript circa 507 kB insgesamt, circa 131 kB gzip, aufgeteilt in Spiellogik und Three.js. CSS circa 9 kB.
- Abschließende Produktions-Browserprüfung: **7/7 bestanden** (abschließender Lauf ca. 1,1 Minuten; Chromium, Software-WebGL). Keine erfassten JavaScript-Laufzeitfehler in den überwachten Abläufen.
- Ein Zwischenlauf überlappte mit Neubau und weiteren Software-WebGL-Prüfungen, lief bei einem Touchfall in einen Timeout und wurde abgebrochen. Die anschließend vollständig bestandene Abschlussprüfung wird getrennt davon bewertet.
- Frühere Fehler wurden behoben: Rundungsabweichung beim Landen und instabile Bodenberührung zwischen zwei Physikschritten, verzögerte Zielaktualisierung direkt nach dem Laden, bewegter Biss-Button, Vermischung der beiden Test-Runner. Touchtests verwenden echte Chromium-Touchereignisse statt synthetischer Pointer-Ereignisse ohne gültigen Pointer Capture.

## 7. Bekannte Probleme und Grenzen

- Erfordert WebGL. Bei fehlender Unterstützung erscheint ein Hinweis; für spätere GPU-Kontextverluste gibt es noch keine Wiederherstellung.
- Das Wasser ist eine einfache Fläche; der Spieler geht auf dem Seeboden und schwimmt nicht. Auf den höheren Steg gelangt man mit einem Sprung.
- Transparente Glasflächen können bei mehreren überlappenden Schichten Sortierartefakte zeigen. Keine Schatten, Texturdetails oder aufwendigen Charakteranimationen.
- Die ganze begrenzte Weltgeometrie wird nach einer Blockänderung neu aufgebaut, bestehende GPU-Geometrien werden dabei entsorgt. Für größere Welten wären nur betroffene Chunks neu zu bauen.
- Fortschritt ist an Browser und Origin gebunden. Anderer Port/Hostname bedeutet anderen Speicher. Browserdaten löschen oder privater Modus kann Fortschritt entfernen. Keine Synchronisierung.
- Unbekannte Save-Versionen werden zurückgewiesen und gesichert, nicht automatisch konvertiert. Bei vollständig gesperrtem Speicher ist auch die Sicherung unmöglich.
- Pointer Lock hängt vom Browser ab. Der Zieh-Fallback und Tastaturaktionen stehen bereit; keine Kompatibilitätszusage für jeden Mobilbrowser.
- Noch kein vollständiger Test von Screenreadern, langer Spielsitzung oder realem Multitouch auf Android. Vorlesestimmen unterscheiden sich je Gerät.

## 8. Performance-Einschätzung

Die kleine Welt, Flächenzusammenfassung, wiederverwendete Materialien, fehlende Echtzeitschatten und begrenzte Partikelzahl sind auf mobile Nutzung ausgelegt. Die Pixelratio ist zunächst höchstens 1,5; im Menü lässt sie sich auf 1 reduzieren. Bei mehrfach gemessenen langsamen Frame-Intervallen reduziert sie sich weiter bis 0,75. Automatisch steigt sie innerhalb der Sitzung nicht wieder an.

Browserprüfungen nutzen Chromium mit Software-WebGL. Sie bestätigen Funktion, nicht Android-GPU-Leistung. **30 FPS auf einem Mittelklasse-Android wurden nicht nachgewiesen.** Vor einer Freigabe sollten Wärmeentwicklung, Akku, Framezeiten und Speicher nach mehreren Minuten Bauen/BOOM gemessen werden.

## 9. Lokal starten

Node.js 22.12+ oder 24 und npm:

```bash
cd /workspace/blockboom
npm ci
npm run dev
```

`http://localhost:5173` öffnen. Produktionsprüfung:

```bash
npm test
npm run typecheck
npm run build
npm run preview -- --port 4173
```

In einem zweiten Terminal, Chromium unter `/usr/bin/chromium`:

```bash
BLOCKBOOM_TEST_URL=http://localhost:4173 npm run test:browser
```

Auf anderen Systemen den Browserpfad in `playwright.config.ts` anpassen. Es wurde weder ein Remote-Push noch ein öffentliches Deployment vorgenommen.

## 10. Android-Gerätetest

1. PC und Android in dasselbe vertrauenswürdige WLAN bringen. Lokal `npm run dev` starten, gegebenenfalls den lokalen Port 5173 für dieses Netz freigeben. Auf dem Telefon `http://<LAN-IP-des-PCs>:5173` in aktuellem Chrome öffnen. Die privaten IPs der Cloud-Arbeitsumgebung sind dafür außerhalb dieser Umgebung nicht allgemein erreichbar.
2. Alternativ per USB und Android-Debugging: `adb reverse tcp:5173 tcp:5173`, dann am Telefon `http://localhost:5173` öffnen. Das erlaubt auch die Prüfung von Funktionen, die einen sicheren Kontext voraussetzen.
3. Hochformat zwischen 360 und 430 CSS-Pixeln und Querformat prüfen. Links laufen und gleichzeitig rechts umsehen; springen, Blöcke wählen, setzen und entfernen. Kein Scrollen/Zoom und keine überlappenden Aktionsflächen im Spiel.
4. Zum Steg gehen und hinaufspringen. Mission überspringen und frei angeln; danach annehmen, mehrere Fische fangen und Sammlung kontrollieren. Lokales Vorlesen prüfen, sofern eine deutsche Gerätestimme vorhanden ist.
5. In der BOOM-Zone mehrfach auslösen und zurücksetzen; Sound im Menü bewusst aktivieren. Keine weiter anwachsende Partikelzahl nach Ende der Effekte.
6. Bauen, fangen, speichern, neu laden und Blickrichtung, Blockänderungen, Sammlung und Auftrag vergleichen. Browser in Hintergrund legen und wieder öffnen.
7. Über Chrome Remote Debugging mindestens zehn Minuten Framezeiten, GPU-/Speicherverhalten und Erwärmung beobachten, Auflösung normal/sparsam vergleichen. Gerät, Android-/Chrome-Version und beobachtete Werte protokollieren.

## 11. Empfehlungen für v0.2

1. Reale Android-Abnahme, bessere stufenlose Bewegung über kleine Unebenheiten und Geräteleistung messen.
2. Nur veränderte Chunks neu aufbauen; WebGL-Kontextverlust und lange Sitzungen absichern.
3. Expliziten Save-Export/Import, auswählbare Sicherungswiederherstellung und eine Migration bei nächster Schemaänderung ergänzen.
4. Offline-Cache mit kontrolliertem Updateverfahren und vollständigen Installationsicons.
5. Angelauswurf und Fang visuell verfeinern. Erst nach Spieltests weitere kurze freiwillige Lesemissionen als JSON ergänzen; keine automatische Diagnose und kein Lernzwang.

Der Kern ist ein echtes kleines Sandbox-Spiel. Größere Lernprogramme, Offline-Installation und eine nachgewiesene Android-Performance sind bewusst noch kein Teil dieser Abnahme.
