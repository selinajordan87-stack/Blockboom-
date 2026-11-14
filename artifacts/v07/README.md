# Nachweise zum World-Discovery-Sprint

Alle Bilder stammen aus tatsächlich laufenden Builds. Keine Mockups oder Bilder aus dem Auftrag werden als Spielnachweis benutzt. Browser: Chromium, Touch-/Mobilansicht und Software-WebGL; kein echtes iPhone.

| Szene / Aktion | Nachweis | Prüfmethode |
| --- | --- | --- |
| Vorheriger Start v0.6.1 | [Vorher](before/01-new-player-start.png) | neuer Spielstand, normaler Eingabepfad |
| Neuer Start / wenig HUD | [Start](journey-first-pass/01-start-region.png), [HUD](journey-first-pass/16-mobile-hud.png) | frischer Survivalstart |
| Wald und See | [Wald](journey-first-pass/02-forest.png), [See](journey-first-pass/04-lake.png) | zu Fuß vom Start, keine Teleportation |
| Nahe Höhle | [Eingang](journey-first-pass/06-cave-entrance.png), [Kammer](journey-first-pass/07-cave-interior.png) | echter Hin- und Rückweg |
| Berg vom Minenweg | [Tageslichtaufnahme](mountain-overview/03-mountain-overview.png) | zu Fuß; separate Kreativ-/Mittagseinstellung über normale Menüs; Grafik bleibt einfach |
| Größere Siedlung | [Gebäude](journey-first-pass/08b-larger-settlement.png), [Schmiede innen](journey-first-pass/08c-inside-forge.png) | zu Fuß, Tür tatsächlich geöffnet |
| Funktionales Lesen | [Schmiedetagebuch](journey-first-pass/14b-forge-reading.png), [Gartenwissen](entry-loop/garden-knowledge.png) | gefunden und im echten Spiel geöffnet |
| Bauplanfund | [Tatsächlicher Fund](journey-first-pass/09-found-blueprint.png) | reale Truhe geöffnet, ohne vorgegebene Vorräte |
| Tiefe Mine / Kammer | [Innenraum](journey-continued/07b-deep-mine.png), [Hinweis](journey-continued/14d-chamber-reading.png), [Schatz](journey-continued/09b-chamber-find.png) | Fortsetzung des regulär exportierten Spielstands über Importmenü |
| Vorratsrechnung | [Antwort / Hilfe](gameplay/reading-maths.png) | frischer Stand, Fehler und richtige Antwort geprüft |
| Eigenes Beet | [Gepflanzt](entry-loop/self-planted-garden.png), [Wachstumsprüfung](gameplay/garden-real-growth.png) | echtes Sammeln, Herstellen, Bearbeiten, Säen und Reload; Wachstum ohne vorgestellte Uhr |
| Turmbau | [Vorschau](blueprint/valid-preview.png), [nach Aufstieg](blueprint/built-tower.png) | vorbereiteter vorhandener Stand; echter Materialverbrauch, Bau und physischer Aufstieg |
| Angeln | [Fangansicht](regression-final/fishing-landing.png), [Fangbuch](regression-final/catchbook-3d.png) | bestehender Regressionstest mit vorbereitetem Stand, wirklicher Wurf/Biss/Drill |
| Zombie und Schreiben | [Nacht](regression-final/v05/zombie-night.png), [Schreibkampf](regression-final/v05/writing-844.png) | kontrollierte Nacht-/Gegnerfixtures mit tatsächlichen Aktionen |
| BOOM | [Zerstörung](regression-final/boom-mobile.png) | tatsächliche Explosion und Reset im Browsertest |
| Karte | [anfangs verborgen](gameplay/map-before-discovery.png) | neuer Stand und anschließende Kartenaufdeckung durch Bewegung |

Ein vollständiger frischer Hausbau, die neue Gesamtgeschichte am Stück und eine unabhängige menschliche Suchzeit sind noch nicht belegt. Eine Nahaufnahme unter dem Minenbogen (`journey-continued/03-mountain.png`) ist ausdrücklich keine Bergübersicht.

Die mitgespeicherten Exportdateien sind ausschließlich durch diese isolierten automatisierten Testspieler erzeugte Daten. Sie enthalten keinen Spielstand von Paul. Die Fortsetzungen verändern diese Dateien nicht und importieren sie über die normale Spielfunktion. Die Journale halten auch die gescheiterten Wege fest.

Verbindliche Ergebnisse und Grenzen: [Sprintbericht](../../SPRINT_REPORT.md), [Gameplay-Protokoll](../../V07_GAMEPLAY_TESTS.md), [vollständiger Browserlauf](final-browser.log), [letzte Karten-Nachprüfung](release-browser.log).
