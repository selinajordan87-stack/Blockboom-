# BLOCKBOOM · Living World v0.2.0

Lokales 3D-Sandbox-Spiel: bauen, angeln, sammeln und in der BOOM-Zone experimentieren. Eine freiwillige Lesemission, keine Anmeldung oder Cloud.

```bash
npm ci
npm run dev
```

Dann http://localhost:5173/Blockboom-/ öffnen. Node.js 22.12+ oder 24 empfohlen.

```bash
npm test
npm run typecheck
npm run build
npx playwright test
```

Die Browsertests erwarten einen laufenden Dev-Server und Chromium unter `/usr/bin/chromium`. Für andere Systeme den Pfad in `playwright.config.ts` anpassen oder den Playwright-Browser verwenden.

Desktop: WASD, Maus, Leertaste, Linksklick entfernen, Rechtsklick bauen, E interagieren, I Inventar, Esc Menü, 1–6 Blockwahl. Ins Spiel klicken aktiviert die Maussperre. Fallback: Maus gedrückt ziehen, + bauen, − entfernen (Doppelklick entfernt, Umschalt+Doppelklick baut).

Touch: Joystick links, rechts wischen, ↑ springen, − entfernen, + bauen. Aktionen am See und in der Testzone erscheinen automatisch.

Spielstände bleiben im lokalen Browserspeicher dieser Adresse. Automatisch alle 10 Sekunden, nach Änderungen und beim Verlassen; manuell im Menü. Inkonsistente oder unbekannte Versionen werden als `blockboom.save.backup` gesichert, bevor ein neues Spiel gespeichert wird. Browserdaten löschen entfernt den Spielstand. Ein privates Browserfenster bietet keine dauerhafte Speicherung.

Weitere Details, Grenzen, Testergebnisse und Android-Anleitung: [REPORT.md](REPORT.md). Assetlizenzen: [THIRD_PARTY.md](THIRD_PARTY.md).

Die Veröffentlichung für `selinajordan87-stack/Blockboom-` ist freigegeben; der tatsächliche Status steht im [Abschlussbericht](REPORT.md). Einrichtung und Handytest: [Repository, Pages-Einstellungen und Handytest](docs/GITHUB_PAGES.md). Ein Push auf `main` löst nach der Einrichtung den automatischen Workflow aus.

Mobile-Rescue-Update: [Fehlerursache, Regressionstests und iPhone-Abnahme](MOBILE_RESCUE_REPORT.md). Die endgültige mobile Abnahme erfolgt auf einem echten iPhone.


v0.2 ergänzt sichtbare Fische (fünf Arten), sechs direkt wählbare Werkzeuge, neun Baustoffe, Undo, Fangbuch, 40 Challenges und drei Lernmissionen. „Mehr“ wechselt die Materialseite, Q das Werkzeug, Z macht die letzte Bauaktion rückgängig. Baumaterial zum freien Bauen bleibt unbegrenzt; gesammelte Vorräte zählen separat für Aufträge. Die neuen Lernresultate bleiben lokal in einem eigenen Speicherbereich.

Standardmodus ist Lern-Challenge. Aufgaben sind Angebote und öffnen sich nicht selbst. „Aufträge“ führt zu Mara am Bauplatz, zum Angler und zur Schatzkiste am Entdeckerpfad. Vorlesen benutzt ausschließlich eine verfügbare lokale deutsche Stimme. Bildschirmtexteingaben sind kein automatisches Handschrifttraining.

[Abschlussbericht v0.2 mit Architektur, Tests, Grenzen und iPhone-Testplan](V02_REPORT.md). Bestehende Welten behalten ihre Landschaft und Bauten; die neue Landschaftsedition gilt für neue Welten. Seite auf dem Handy neu laden, ohne Website-Daten zu löschen.
