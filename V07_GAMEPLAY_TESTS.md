# v0.7 – Spielerzentrierte Prüfnotizen

## Verbindliche Prüfmethode

Die neuen Fälle in `e2e/discovery-v07.spec.ts` und `scripts/v07-player-journey.mjs` starten in einem **frischen isolierten Browserprofil**. Sie setzen keine Koordinaten, Vorräte, Missionszustände, Tageszeit oder Wachstumsuhren. Bewegungen und Kameradrehungen werden ausschließlich als normale Touch-/Tastatureingaben ausgeführt. Save-/Diagnosedaten werden nur gelesen. Ein erneutes Laden verwendet ausschließlich den vom Spiel geschriebenen Zustand.

Der Journey-Treiber kennt technische Wegpunkte und liest die diagnostizierte Position, um normale Eingaben zu dosieren. Er ist damit ein **geführter technischer Kontrollpfad**, kein unabhängiger Mensch und kein Nachweis einer menschlichen Suchzeit. Fehlgeschlagene Wege werden protokolliert; es gibt keinen Teleport-Fallback. Nicht erreichte Regionen oder nicht ausgeführte Systeme erhalten keinen Erfolgs-Screenshot.

## Vorgesehene tatsächliche Abläufe

- Frischer Touchstart: sechs Slots wechseln direkt Werkzeuge, höchstens zwei kontextabhängige Aktionen, sichtbarer Kompass. Physisches Startbuch anvisieren und lesen; kurze Bau-Materialrechnung freiwillig bearbeiten, Fehlversuch und Hilfe ausprobieren, speichern/neuladen.
- Entdeckerkarte: unbekannte Siedlung bleibt verborgen. Wald wird vom Start mit normalen Eingaben erreicht und aufgedeckt; Standort und Entdeckung bleiben nach Reload bestehen.
- Sichtbares Startfeld: zu Fuß hingehen, reifen Kürbis ernten, Weizen auswählen und denselben Acker neu bepflanzen. Nach Reload tatsächliche aktive Spielzeit abwarten und reifen Weizen ernten. **Keine Beschleunigung durch Clock-Injection.**
- Mobile Regression: Inventar durch Langdruck, anschließend zwei unabhängige Daumen, Finger einzeln lösen, kein ungewolltes Menü.
- Erweiterte Wanderung: Wald, See, Höhleneingang, Höhleninneres, alte Siedlung und äußere Regionen über echte Wege. Screenshots werden erst am tatsächlich erreichten Ort aufgenommen.

## Ergebnisse

Noch nicht ausgeführt: Die Tests warten auf den integrierten v0.7-Produktionsbuild auf Port 4208. Dieser Abschnitt wird nach realer Ausführung durch tatsächliche Resultate ersetzt. Es wird kein bestandener Gerätetest behauptet; hier steht Chromium mit emulierter Mobilansicht und Software-WebGL zur Verfügung.
