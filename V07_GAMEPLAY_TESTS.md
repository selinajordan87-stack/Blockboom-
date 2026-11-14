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

Die vier neuen Discovery-Fälle bestanden im ersten integrierten Produktionslauf. Der zusätzliche Survival-Einstieg in `e2e/entry-loop-v07.spec.ts` bestand ebenfalls: reale Holz-/Steingewinnung, gelesenes Gartenwissen, Rezepte, Hacke, eigenes Beet, Karotte und Reload. Der Blueprint-Fall bestand mit vorbereitetem vorhandenem Spielstand; er wird ausdrücklich nicht als frischer Sammelpfad gezählt.

Die zweite technische Wanderung erreichte Wald (61,7 s), See (130,2 s), alten Höhleneingang (198,3 s), innere Kammer (220,8 s) und alte Siedlung (337,4 s). Das sind Zeiten eines geführten Eingabetreibers, keine menschlichen Suchzeiten. Sie scheiterte anschließend abseits des sichtbaren Wegs beim äußeren Abschnitt. Die erste Wanderung scheiterte tatsächlich an einer Uferstufe; die reparierte Uferpassage wurde im zweiten Lauf durchquert. Beide Fehler bleiben dokumentiert.

Ein erster Gesamtlauf bestand 78/81 Browserfälle. Alle drei Ursachen wurden geprüft und gezielte Nachläufe bestanden. Der abschließende **82-Fälle-Lauf bestand vollständig in 20,9 Minuten** auf dem unveränderten Produktionsbundle `index-BdAeCH9T.js`. Der endgültige Gesamtausgang und die Live-Prüfung werden im Sprintbericht dokumentiert.

Es wird kein bestandener Gerätetest behauptet; hier steht Chromium mit emulierter Mobilansicht und Software-WebGL zur Verfügung.

## Was die Tests nicht belegen

- Die sieben neuen Kapitel sind als Zustandskette mit tatsächlichen Bau-/Sammel-/Schlaf-/Erzbelegen in der Logik geprüft. Es gibt noch keinen abgeschlossenen unabhängigen Erstspielertest der gesamten Geschichte und keine gemessene 20–30-Minuten-Spieldauer.
- Vorbereitete Save-Fixtures prüfen alte Funktionen und Migrationen unter kontrollierten Bedingungen. Sie beweisen nicht, dass ein neuer Spieler den jeweiligen Ort ohne Hilfe findet.
- Kamera-, Mehrfinger-, Sichtbarkeits- und Tastaturhöhenprüfungen emulieren Browserzustände. Safari-Tastatur, Home-Indikator, thermische Last und reales Touchgefühl müssen am iPhone geprüft werden.
- Screenshots werden nur von tatsächlich laufenden Versionen aufgenommen; die beigestellten Referenzbilder sind keine Implementierungsnachweise.

## Spätere Korrekturen und Buildbezug

Der vollständige Gesamtlauf gehört zu `index-BdAeCH9T.js`. Danach bestand die Wegverbindung acht Nachtests, der erweiterte Gartenschutz zehn Nachtests (`index-unVfjpAn.js`). Die zuletzt entfernte unpassierbare Stichverbindung besteht 157 Logiktests und vier passende Browserfälle (`index-DR5BWunQ.js`). Keine Behauptung, alle 82 seien auf jedem Zwischenbundle erneut ausgeführt worden. Die Kernlogik blieb bei den letzten Kartenänderungen unverändert.

Die normale Wanderung setzte ihre unveränderten, zuvor über die Exportfunktion erzeugten Dateien über das Importmenü fort. Das ist ein fortgesetzter tatsächlich gespielter Stand und kein zweiter frischer Start. Separate Tageslichtaufnahmen dürfen die vorhandene Kreativ-/Tageszeiteinstellung verwenden und sind entsprechend bezeichnet.

## Letzter Gesamt- und Fehlernachlauf

Der abschließende Lauf umfasste 83 Fälle: 82 bestanden, ein Desktop-BOOM-Feedbackfehler. Eine nachträgliche Regionsmeldung überschrieb die Aktionsmeldung. Der korrigierte Stand (`index-s5m-G2nK.js`) bestand 159 Logiktests und sechs Browser-Wiederholungen (BOOM und frischer Einstieg mit erhaltenem Notizbuchhinweis je dreimal). Kein Test wurde entfernt oder seine Material-/Weltprüfung abgeschwächt. Das ist eine gezielte Nachprüfung nach dem Gesamtlauf; kein erfundener vollständig erneut ausgeführter 83-Fälle-Lauf.
