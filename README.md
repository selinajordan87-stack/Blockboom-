# BLOCKBOOM · Living World v0.6.0

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

Desktop: WASD, Maus, Leertaste, Linksklick entfernen, Rechtsklick bauen, E interagieren, I Inventar, Esc Menü, Q Werkzeug, Z Undo und X Zoom. 1–9 wählen Baustoffe; „Mehr“ wechselt die Materialseite. Ins Spiel klicken aktiviert die Maussperre. Fallback: Maus gedrückt ziehen, + bauen, − entfernen.

Touch: Joystick links, rechts wischen, ↑ springen, ⌕ zoomen, − entfernen, + bauen. Beide Daumen werden unabhängig verarbeitet. Aktionen am See und in der Testzone erscheinen automatisch; Querformat wird empfohlen.

Spielstände bleiben im lokalen Browserspeicher dieser Adresse. Automatisch alle 10 Sekunden, nach Änderungen und beim Verlassen; manuell im Menü. Inkonsistente oder unbekannte Versionen werden als `blockboom.save.backup` gesichert, bevor ein neues Spiel gespeichert wird. Browserdaten löschen entfernt den Spielstand. Ein privates Browserfenster bietet keine dauerhafte Speicherung.

Aktueller Umfang, Architektur, Prüfungen, Speichergrenzen und iPhone-/Android-Testplan: [V06_REPORT.md](V06_REPORT.md). Historie: [REPORT.md](REPORT.md). Assetlizenzen: [THIRD_PARTY.md](THIRD_PARTY.md).

Die Veröffentlichung für `selinajordan87-stack/Blockboom-` ist freigegeben; der tatsächliche Status steht im [Abschlussbericht](REPORT.md). Einrichtung und Handytest: [Repository, Pages-Einstellungen und Handytest](docs/GITHUB_PAGES.md). Ein Push auf `main` löst nach der Einrichtung den automatischen Workflow aus.

Mobile-Rescue-Update: [Fehlerursache, Regressionstests und iPhone-Abnahme](MOBILE_RESCUE_REPORT.md). Die endgültige mobile Abnahme erfolgt auf einem echten iPhone.


Über ◇ oben rechts erreichst du Karte, Entdeckerpfad, kategorisierten Rucksack, Garten und Begleiter. Die erste Mission führt zu einem selbst platzierten Bett mit Dach, Wänden, Tür und Licht. In der Werkbank lassen sich Möbel und eine Hacke herstellen. Hacke ausrüsten, Gras mit **Benutzen** vorbereiten, Samen auswählen und erneut benutzen. Nach 2–3,5 Minuten aktiver Spielzeit lässt sich die Ernte genauso einsammeln. Pflanzen wachsen in Menüs und bei geschlossenem Spiel nicht weiter.

Die Kupferhöhle liegt im Nordosten, die Siedlung im Südosten. Erz anvisieren, mit − den Abbau starten und bis zum Ende auf das Erz blicken. Kohle und Kupfer benötigen die normale Spitzhacke, Eisen die Kupfer-, Gold die Eisenspitzhacke. Ein platzierter Ofen verarbeitet Erz und Nahrung; Metallrezepte brauchen Kohle. Neue Truhen haben getrennte, gespeicherte Inhalte. Volle Truhen müssen vor dem Abbauen geleert werden.

Tiere mögen passende Nahrung; zweimal füttern gewinnt ihr Vertrauen. Danach sind Name, Folgen/Warten/Schlafen und ein sicherer Aufenthaltsort verfügbar. Haustiere können nicht sterben. Ein naher Hund warnt vor Zombies.

Neue Welten beginnen in Survival mit Schutzhaus, alte Spielstände behalten ihren bisherigen Modus. Im NIGHTFALL-Menü kannst du jederzeit zwischen Survival und Kreativ wechseln; nur Kreativ bietet unbegrenzte Baustoffe. Dort lassen sich auch Gegner abschalten. Freies Bauen ist in beiden Modi innerhalb der Welt möglich.

Standard bleibt Lern-Challenge. 144 freiwillige Aufgaben einschließlich Deutsch, Mathematik, Englisch und Naturwissenschaften öffnen sich nicht selbst. ◇ → Passende Challenge berücksichtigt die aktuelle Region. Die früheren Aufträge und Lernfortschritte bleiben erhalten. Vorlesen nutzt eine verfügbare lokale deutsche Stimme. Bildschirmtexteingaben sind kein automatisches Handschrifttraining.

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
