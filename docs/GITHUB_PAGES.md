# BLOCKBOOM auf GitHub Pages testen

## Aktueller Stand

Repository, `main`, Remote und Pages-Quelle **GitHub Actions** sind eingerichtet; die Veröffentlichung ist ausdrücklich freigegeben. Aktueller Umfang, geprüfter Release-Status und Geräteanleitung stehen im [v0.6-Bericht](../V06_REPORT.md). Die vorhandene Historie einschließlich `467adf6` bleibt erhalten. Das Repository heißt tatsächlich `Blockboom-`; dazu passt der Base-Pfad `/Blockboom-/`.

## Nach ausdrücklicher Freigabe

Die folgenden Schritte beschreiben die Einrichtung. Welche Schritte tatsächlich ausgeführt wurden, steht im Abschlussbericht. Ein Push auf `main` startet den eingerichteten Deployment-Workflow. Daher sind Repository-Sichtbarkeit, Push und Veröffentlichung vorab freizugeben.

1. Im gewünschten GitHub-Konto das Repository **Blockboom-** verwenden. Sichtbarkeit vorher festlegen; keine README, Lizenz oder `.gitignore` automatisch erzeugen, damit die vorhandene lokale Historie ohne Zusammenführung übernommen werden kann. GitHub Pages aus privaten Repositories setzt einen passenden GitHub-Tarif voraus. Eine private Quellcodeablage bedeutet nicht automatisch, dass die Pages-Website privat ist.
2. In **Settings → Pages → Build and deployment → Source** den Eintrag **GitHub Actions** auswählen. Falls Actions deaktiviert ist, die offiziellen Actions erlauben. Es werden keine eigenen Secrets oder persönlichen Zugriffstoken im Workflow benötigt.
3. Optional in **Settings → Environments → github-pages** einen erforderlichen Reviewer einrichten, sofern Konto/Tarif das unterstützt. Dann braucht auch ein späterer Push eine Deployment-Freigabe in GitHub. Ohne diese Regel veröffentlicht der Workflow nach erfolgreichen Checks automatisch.
4. Erst nach Freigabe lokal verknüpfen und hochladen (OWNER ersetzen):

   ```bash
   git remote add origin https://github.com/OWNER/Blockboom-.git
   git branch -m master main
   git push -u origin main
   ```

   `git branch -m master main` benennt den lokalen Branch um; sämtliche Commits bleiben erhalten. Falls inzwischen ein Remote oder `main` vorhanden ist, zuerst erneut `git remote -v` und `git branch -vv` prüfen, diese Befehle dann nicht blind wiederholen. Authentifizierung erfolgt über die eigene GitHub-Anmeldung/SSH-Konfiguration, keine Zugangsdaten ins Projekt schreiben.
5. Unter **Actions → Build and deploy GitHub Pages** den Lauf prüfen. Der Buildjob installiert mit `npm ci`, prüft TypeScript und Logiktests, baut und lädt ausschließlich `dist` hoch. Der Deploymentjob veröffentlicht erst nach erfolgreichem Build und ausschließlich von `main`. Die endgültige URL steht im Deployment-Ergebnis, gewöhnlich:

   ```text
   https://OWNER.github.io/Blockboom-/
   ```

   Das ist das URL-Muster für neue Einrichtungen. BLOCKBOOM verwendet `https://selinajordan87-stack.github.io/Blockboom-/`; der genaue geprüfte Versionsstand steht im Releasebericht. Ein manueller Start per **Run workflow** ist ebenfalls möglich; auf anderen Branches wird nicht deployt.

## iPhone und Android

- Die URL aus dem erfolgreichen GitHub-Pages-Deployment direkt in **Safari auf dem iPhone** beziehungsweise **Chrome unter Android** öffnen. HTTPS und den vollständigen Unterpfad `/Blockboom-/` verwenden. PC und Handy brauchen kein gemeinsames WLAN; die Website muss zuvor freigegeben und veröffentlicht worden sein.
- „Los geht’s“ antippen. Links laufen und gleichzeitig rechts umsehen, springen, einen Block wählen, setzen und entfernen. Hoch- und Querformat prüfen; bei Browserleisten auf überdeckte Tasten achten.
- Zum See gehen, auf den Steg springen, frei angeln oder freiwilligen Auftrag annehmen. Fischsammlung prüfen. Anschließend BOOM auslösen und den Aufbau zurücksetzen.
- Im Menü speichern, Seite neu laden und Bauänderungen, Position und Fangsammlung kontrollieren. Browser kurz in den Hintergrund legen und zurückkehren. Verpasste Bisse haben keine Strafe.
- Spielstände bleiben **auf dem jeweiligen Gerät und im jeweiligen Browser**. Die Pages-Adresse hat einen anderen Origin als localhost und übernimmt dessen Spielstand nicht. `localStorage` ist an Schema, Host und Port gebunden, nicht an den URL-Pfad. Auf derselben GitHub-Pages-Domain teilen Projekte grundsätzlich einen Origin; der Spielschlüssel heißt weiterhin `blockboom.save`.
- Privatmodus und das Löschen von Website-Daten können Fortschritt entfernen. Ein Startbildschirm-Lesezeichen ist optional, vollständiger Offline-Betrieb ist noch nicht implementiert. iOS kann für installierte Web-Apps anderen Speicher verwenden als für einen Safari-Tab.
- Bei niedriger Bildrate im Menü die Auflösung auf „sparsam“ stellen. Sound bewusst aktivieren. Vorlesen funktioniert nur mit einer verfügbaren lokalen deutschen Stimme.

Gerät, OS-/Browserversion, Darstellungsprobleme und Verhalten nach zehn Minuten Spielzeit notieren. Browseremulation ersetzt keinen echten iPhone-/Android-Test; eine Ziel-Framerate ist weiterhin nicht nachgewiesen.

## Pfade, Assets und Routen

`vite.config.ts` setzt `base: "/Blockboom-/"`. Vite erzeugt passende URLs für JavaScript, das gebündelte Three.js und CSS. Das HTML verwendet `%BASE_URL%` für Manifest und Icon. Das Manifest verwendet relative Start-, Scope- und Icon-Adressen. Voxel, Schildtexturen und Ton entstehen im Code und benötigen keine zusätzlichen Asset-Downloads.

Das Spiel hat aktuell keine clientseitigen URL-Routen. Alle Menüs bleiben unter `/Blockboom-/`; direktes Neuladen funktioniert daher ohne 404-Kopie oder SPA-Umleitung. Eine erfundene Adresse wie `/Blockboom-/inventar` liefert auf Pages absichtlich 404. Bei einem späteren Router Hash-Routing (z. B. `/Blockboom-/#/inventar`) verwenden oder eine ausdrücklich getestete Hostingstrategie ergänzen. Ein `base`-Wert allein ermöglicht keine History-Routen auf GitHub Pages.

## Lokale Prüfung

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run preview -- --port 4173
```

Die Vorschau liegt jetzt unter `http://localhost:4173/Blockboom-/`, Entwicklung unter `http://localhost:5173/Blockboom-/`.

In einem zweiten Terminal mit installiertem Chromium unter `/usr/bin/chromium`:

```bash
BLOCKBOOM_TEST_URL=http://localhost:4173/Blockboom-/ \
BLOCKBOOM_ARTIFACT_DIR=artifacts/pages \
npm run test:browser
```

`BLOCKBOOM_TEST_URL` mit abschließendem Slash angeben. Screenshots dieses Laufs landen separat im ignorierten Verzeichnis `artifacts/pages`, damit die vorhandenen Referenzbilder erhalten bleiben. Für andere Betriebssysteme den Browserpfad in `playwright.config.ts` anpassen. Die CI führt TypeScript, Logiktests und Build aus; Browserprüfungen werden derzeit lokal ausgeführt.
