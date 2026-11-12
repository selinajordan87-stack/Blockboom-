# BLOCKBOOM · Sandbox Revolution v0.3.0

Lokales 3D-Voxel-Sandbox-Spiel: frei bauen und abbauen, Werkzeuge ausrüsten, angeln, sammeln, Lern-Challenges lösen und in der BOOM-Zone experimentieren. Keine Anmeldung, Cloud oder Werbung.

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

Desktop: WASD, Maus, Leertaste, Linksklick entfernen, Rechtsklick bauen, E interagieren, I Inventar, Esc Menü, Q Werkzeug, Z Undo und X Zoom. 1–9 wählen Baustoffe; „Mehr“ wechselt die Materialseite. Ins Spiel klicken aktiviert die Maussperre. Fallback: Maus gedrückt ziehen, + bauen, − entfernen.

Touch: Joystick links, rechts wischen, ↑ springen, ⌕ zoomen, − entfernen, + bauen. Beide Daumen werden unabhängig verarbeitet. Aktionen am See und in der Testzone erscheinen automatisch; Querformat wird empfohlen.

Spielstände bleiben im lokalen Browserspeicher dieser Adresse. Automatisch alle 10 Sekunden, nach Änderungen und beim Verlassen; manuell im Menü. Inkonsistente oder unbekannte Versionen werden als `blockboom.save.backup` gesichert, bevor ein neues Spiel gespeichert wird. Browserdaten löschen entfernt den Spielstand. Ein privates Browserfenster bietet keine dauerhafte Speicherung.

Weitere Details, Grenzen, Testergebnisse und Android-Anleitung: [REPORT.md](REPORT.md). Assetlizenzen: [THIRD_PARTY.md](THIRD_PARTY.md).

Die Veröffentlichung für `selinajordan87-stack/Blockboom-` ist freigegeben; der tatsächliche Status steht im [Abschlussbericht](REPORT.md). Einrichtung und Handytest: [Repository, Pages-Einstellungen und Handytest](docs/GITHUB_PAGES.md). Ein Push auf `main` löst nach der Einrichtung den automatischen Workflow aus.

Mobile-Rescue-Update: [Fehlerursache, Regressionstests und iPhone-Abnahme](MOBILE_RESCUE_REPORT.md). Die endgültige mobile Abnahme erfolgt auf einem echten iPhone.


v0.3 ergänzt strukturierte prozedurale Voxeloberflächen, selektiv neu gebaute Welt-Chunks, eine abwechslungsreichere Landschaft für neue Welten, eine sichtbare First-Person-Hand und sieben unterscheidbare Werkzeuge mit Animation. Es gibt 15 Baustoffe, bis zu 20 Undo-Schritte pro Sitzung, ein Werkzeug-/Material-/Fischinventar, einstellbares Sichtfeld und Kameraempfindlichkeit sowie mobilen Zoom. Baumaterial zum freien Bauen bleibt unbegrenzt; gesammelte Vorräte zählen separat für Aufträge.

Standardmodus ist Lern-Challenge. Die bisherigen 40 Aufgaben und ihre Fortschritte bleiben erhalten; 20 Aufgaben auf höherem Niveau ergänzen Mathematik, Grammatik, Naturwissenschaft, Bauwissen und logisches Denken. Aufgaben sind Angebote und öffnen sich nicht selbst. „Aufträge“ führt zu Mara, zum Angler und zur Schatzkiste. Vorlesen benutzt ausschließlich eine verfügbare lokale deutsche Stimme. Bildschirmtexteingaben sind kein automatisches Handschrifttraining.

[Abschlussbericht v0.2 mit Architektur, Tests, Grenzen und iPhone-Testplan](V02_REPORT.md). Bestehende Welten behalten ihre Landschaft und Bauten; die neue Landschaftsedition gilt für neue Welten. Seite auf dem Handy neu laden, ohne Website-Daten zu löschen.

[Releasebericht v0.3 mit Architektur, Tests, Performance und Geräte-Testplan](V03_REPORT.md). v0.1-/v0.2-Spielstände behalten Save-Key, Weltedition, Bauten, Fische, Missionen und Lernfortschritt. Die neue Edition-3-Basiskarte wird nur für neue Spielstände erzeugt.
