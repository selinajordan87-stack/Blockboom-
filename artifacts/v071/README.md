# v0.7.1 – Nachweise

Alle Bilder stammen aus der laufenden Anwendung in Chromium mit emuliertem Touch und Software-WebGL. Kein echter iPhone-Test und keine Mockups.

- [Dunkle Fischmodelle vor Korrektur](before-dark-fish.png), [farbige Fische danach](lake-visible-fish.png): kontrollierter vorhandener Spielstand am großen Steg, Kameraknopf und Blick aufs Wasser benutzt.
- [Tier anvisiert](animal-target.png): tatsächliche Zielerkennung mit Waffenaktion; kontrollierter Jagdspielstand.
- [Grill platziert](placed-grill.png), [Grillen](grilling.png): Waffenangriff, Fleischgewinn, Grillherstellung, Platzieren, Garen, Essen und Reload per normaler Oberfläche geprüft. Vorhandene Startvorräte sind Test-Fixtures, kein frischer Ressourcensammelpfad.
- [Kamera im Spiel](direct-camera.png): direkter Knopf oben neben dem Menü. [Direkte Kamerawahl](camera-panel.png): Reset oben ohne Scrollen, Ego/Ansicht von hinten und echter Abstandsregler.
- [Rote Regressionen](reproduced-errors.log), [Kameraprüfung](camera-browser.log), [fünf gezielte Gameplay-Fälle](phase2-browser.log).

Vollständiger Umfang, genaue Teststände und echte Geräteabnahme: [Releasebericht](../../V071_REPORT.md).


[Östliche Gruppe](lake-east-fish.png) und [westliche Gruppe](lake-west-fish.png) wurden im abschließenden Produktionsbuild aus kontrollierten vorhandenen Spielständen im flachen Uferwasser aufgenommen. Das sind Render-/Bewegungsnachweise, keine unabhängige menschliche Suchzeit.

Abschließender Bundlebezug: `index-DBQix1VS.js`. [Fünf erfolgreich abgeschlossene Fälle vor Prozessende](release-browser-interrupted.log), [21/21 fortgesetzte Fälle](release-browser-remaining.log), [Nachprüfung der beiden gefundenen Zielkonflikte](priority-browser.log). Der vorherige Gesamtlauf mit 86/88 bleibt im Bericht klar getrennt.
