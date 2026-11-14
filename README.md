# BLOCKBOOM · World Discovery v0.7

3D-Voxel-Sandbox für Smartphone und Desktop: ein Zuhause bauen, Tiere zähmen, einen Garten anlegen, Höhlen erkunden, Erze verarbeiten und die verlassene Schmiede entdecken. Angeln, Zombie-Survival, Schreibkämpfe und BOOM bleiben erhalten. Keine Anmeldung, Cloud oder Werbung.

```bash
npm ci
npm run dev
```

Dann http://localhost:5173/Blockboom-/ öffnen. Node.js 22.12+ oder 24 empfohlen.

```bash
npm test
npm run typecheck
npm run build
BLOCKBOOM_TEST_URL=http://localhost:5173/Blockboom-/ npm run test:browser
```

Die Browsertests erwarten einen laufenden Dev-Server und Chromium unter `/usr/bin/chromium`. Für andere Systeme den Pfad in `playwright.config.ts` anpassen oder den Playwright-Browser verwenden.

Desktop: WASD, Maus, Leertaste, Linksklick entfernen, Rechtsklick bauen, E interagieren, I Inventar, Esc Menü, Q Werkzeug, Z Undo und X Perspektive/Abstand. 1–9 wählen Baustoffe; „Mehr“ wechselt die Materialseite. Ins Spiel klicken aktiviert die Maussperre. Fallback: Maus gedrückt ziehen, + bauen, − entfernen.

Touch: kleiner Joystick links, rechts wischen. Sechs kompakte Slots wechseln direkt Spitzhacke, Axt, Schwert, Angel, Baumaterial und Nahrung. Langer Druck öffnet das Inventar; erneutes Tippen auf den Bauslot die Materialauswahl. Rechts erscheinen höchstens zwei zum Ziel passende Aktionen sowie Springen. Kamera, Werkbank, Garten, Entdeckerbuch, Log und Karte bleiben über den einzelnen Menübutton erreichbar. Querformat wird empfohlen.

Menü → Kamera & Steuerung: Ego/Third Person, Abstand 2–9 m, Sichtfeld, Empfindlichkeit, Joystickgröße, Deckkraft und vertauschte Daumenbelegung. **Kamera zurücksetzen** steht direkt im Hauptmenü und stellt einen normalen Ego-Blick wieder her. Hindernisse verkürzen den Third-Person-Abstand vorübergehend; im Freien kehrt er zurück.

Menü → Einstellungen → Spielstand exportieren/importieren: eigene JSON-Sicherung herunterladen oder eine geprüfte Datei übernehmen. Der vorherige Stand wird vor Import lokal gesichert. Die Kameradiagnose ist ebenfalls als lokale Datei verfügbar; es erfolgt kein Upload.

Spielstände bleiben im lokalen Browserspeicher dieser Adresse. Automatisch alle 10 Sekunden, nach Änderungen und beim Verlassen; manuell im Menü. Inkonsistente oder unbekannte Versionen werden als `blockboom.save.backup` gesichert, bevor ein neues Spiel gespeichert wird. Browserdaten löschen entfernt den Spielstand. Ein privates Browserfenster bietet keine dauerhafte Speicherung.

Aktueller Sprintstand, tatsächliche Spielerwege, Prüfungen, Grenzen und iPhone-Testplan: [SPRINT_REPORT.md](SPRINT_REPORT.md). Vorheriger Kamera-/Touchfix: [V061_REPORT.md](V061_REPORT.md). Living-World-Umfang: [V06_REPORT.md](V06_REPORT.md). Historie: [REPORT.md](REPORT.md). Assetlizenzen: [THIRD_PARTY.md](THIRD_PARTY.md).

Die Veröffentlichung für `selinajordan87-stack/Blockboom-` ist freigegeben; der tatsächliche Status steht im [Abschlussbericht](REPORT.md). Einrichtung und Handytest: [Repository, Pages-Einstellungen und Handytest](docs/GITHUB_PAGES.md). Ein Push auf `main` löst nach der Einrichtung den automatischen Workflow aus.

Mobile-Rescue-Update: [Fehlerursache, Regressionstests und iPhone-Abnahme](MOBILE_RESCUE_REPORT.md). Die endgültige mobile Abnahme erfolgt auf einem echten iPhone.


Menü → Entdeckerbuch sammelt physisch gefundene Notizen und Wissen aus echten Spielhandlungen. Menü → Abenteuerlog zeigt bis zu drei Ziele; Angebote lassen sich dort ausschalten. Karte, Garten und Werkbank sind ebenfalls direkt im Menü erreichbar. Über Welt & Karte erreichst du zusätzlich Entdeckerpfad, kategorisierten Rucksack und Begleiter. Die erste Mission führt zu einem selbst platzierten Bett mit Dach, Wänden, Tür und Licht. In der Werkbank lassen sich Möbel und eine Hacke herstellen. Hacke ausrüsten, Gras mit **Benutzen** vorbereiten, Samen auswählen und erneut benutzen. Nach 2–3,5 Minuten aktiver Spielzeit lässt sich die Ernte genauso einsammeln. Pflanzen wachsen in Menüs und bei geschlossenem Spiel nicht weiter.

Die erste Kupferhöhle liegt im Nordosten, die alten Höfe im Südosten. Ein dortiger Brief führt über den Erdweg zur größeren Siedlung mit Turm und Rauch. Die äußere Bergmine liegt weiter im Nordosten; Wald und großer Spiegelsee ergänzen die erhaltene innere Landschaft. Erz anvisieren, mit − den Abbau starten und bis zum Ende auf das Erz blicken. Kohle und Kupfer benötigen die normale Spitzhacke, Eisen die Kupfer-, Gold die Eisenspitzhacke. Ein platzierter Ofen verarbeitet Erz und Nahrung; Metallrezepte brauchen Kohle. Neue Truhen haben getrennte, gespeicherte Inhalte. Volle Truhen müssen vor dem Abbauen geleert werden.

Tiere mögen passende Nahrung; zweimal füttern gewinnt ihr Vertrauen. Danach sind Name, Folgen/Warten/Schlafen und ein sicherer Aufenthaltsort verfügbar. Haustiere können nicht sterben. Ein naher Hund warnt vor Zombies.

Neue Welten beginnen in Survival mit Schutzhaus, alte Spielstände behalten ihren bisherigen Modus. Für das neue Abenteuer zählt ein selbst gebautes Zuhause; das vorhandene Schutzhaus bleibt eine sichere Starthilfe. Im NIGHTFALL-Menü kannst du jederzeit zwischen Survival und Kreativ wechseln; nur Kreativ bietet unbegrenzte Baustoffe. Dort lassen sich auch Gegner abschalten. Freies Bauen ist in beiden Modi innerhalb der Welt möglich.

Standard bleibt Lern-Challenge. Freiwillige Aufgaben einschließlich Deutsch, Mathematik, Englisch und Naturwissenschaften öffnen sich nicht selbst. Physische Welttexte erklären zusätzlich Bau, Saat, Angelplatz und Erzverarbeitung. Sie bleiben bis zum Schließen offen und sind im Buch erneut erreichbar. Welt & Karte → Passende Challenge berücksichtigt die aktuelle Region. Die früheren Aufträge und Lernfortschritte bleiben erhalten. Vorlesen nutzt eine verfügbare lokale deutsche Stimme. Bildschirmtexteingaben sind kein automatisches Handschrifttraining.

Produktionsvorschau und reproduzierbare Software-WebGL-Messungen:

```bash
npm run build
npm run preview -- --port 4206
# in einem zweiten Terminal:
node scripts/measure-living.mjs
```

Diese Messungen ersetzen keine Framerate-Prüfung auf einem echten Smartphone. Der aktuelle Speicher bleibt lokal und auf 50.000 Weltänderungen begrenzt; ein fehlgeschlagener Speichervorgang ersetzt den letzten lesbaren Stand nicht. Website-Daten nicht löschen und zum Spielen denselben Browser verwenden.

[Abschlussbericht v0.2 mit Architektur, Tests, Grenzen und iPhone-Testplan](V02_REPORT.md). Bestehende Welten behalten ihre Landschaft und Bauten; die neue Landschaftsedition gilt für neue Welten. Seite auf dem Handy neu laden, ohne Website-Daten zu löschen.

[Releasebericht v0.3 mit Architektur, Tests, Performance und Geräte-Testplan](V03_REPORT.md). v0.1-/v0.2-Spielstände behalten Save-Key, Weltedition, Bauten, Fische, Missionen und Lernfortschritt. Die neue Edition-3-Basiskarte wird nur für neue Spielstände erzeugt.

Ein gefundener Schmiedeplan ermöglicht einen Aussichtsturm: 24 Bretter, zwölf Stein, vier Fackeln und vier Leitern. Menü → Bauplan zeigt Materialliste und Vorschau. Freie ebene Fläche anvisieren und mit der Bauaktion bestätigen. Erst das tatsächliche Hochklettern enthüllt zusätzliche Umgebung auf der Karte.

Die additive Außenwelt ersetzt keine gespeicherten Bauwerke. Vor der ersten v0.7-Speicherung wird, soweit Speicher verfügbar ist, zusätzlich `blockboom.save.pre-v07` angelegt. Eine eigene Exportdatei bleibt die beste übertragbare Sicherung.
