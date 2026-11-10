# BLOCKBOOM · First Playable v0.1

Lokales 3D-Sandbox-Spiel: bauen, angeln, sammeln und in der BOOM-Zone experimentieren. Eine freiwillige Lesemission, keine Anmeldung oder Cloud.

```bash
npm ci
npm run dev
```

Dann http://localhost:5173 öffnen. Node.js 22.12+ oder 24 empfohlen.

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
