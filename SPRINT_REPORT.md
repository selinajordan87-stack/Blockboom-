# BLOCKBOOM – Overnight Sprint / v0.7

## Recovery und Ausgangsbasis

13.11.2026: `main` und veröffentlichte v0.6.1 stehen auf `a007b56`. Der Featurebranch `feature/v07-world-discovery` enthält den Auditcommit `a1e6655` sowie umfangreiche, nicht committete Arbeit des abgebrochenen Laufs. Diese Arbeit wurde erhalten und integriert. Kein Reset, kein Rewrite und keine neue Abhängigkeit.

Der erste Recovery-Lauf bestand TypeScript und 129/130 Logiktests. Der eine Fehler war die feste alte Weltgrenze 60 im Test. Der Test prüft jetzt die tatsächlich konfigurierte Grenze `LIMIT`, weiterhin mit einem verbotenen Grenzblock. Danach bestanden alle 130 Tests und der Produktionsbuild. Sechs zusätzliche Welt-/Streamingtests bestehen ebenfalls.

Der [Reality Audit](REALITY_AUDIT.md) trennt technischen Bestand von tatsächlich abgelaufenen Spielerwegen. Die echten Vorherbilder stammen aus v0.6.1. Die vom Auftrag beigefügten Bilder sind Gestaltungsreferenzen und werden nicht als implementierte Spielgrafik ausgegeben.

## Recovery-Checkpoint

Im integrierten Spiel vorhanden: korrigierte Wasserfläche, angeschlossene Fern-Landmarken, additive Außenwelt, budgetiertes Chunk-Rendering, physische lesbare Notizbücher, gespeichertes Entdeckerbuch, Abenteuerlog, aufgedeckte Erkundungskarte, sichtbarer Startergarten, begrenzte regionale Tierplätze und ein zusätzlicher tatsächlich besetzter Angelplatz.

Erste Browserprüfung: frischer Start, direkte Werkzeugslots, tatsächliche Buchinteraktion, freiwillige Materialrechnung mit Fehler/Hilfe und Reload bestanden. Wald und Kartenaufdeckung wurden ebenfalls mit normalen Bewegungseingaben erreicht. Der vollständige Farmingtest und die erweiterten Wanderungen laufen noch. Diese Liste ist kein vollständiger Release- oder iPhone-Abnahmenachweis.

## Prüfmethoden und offene Punkte

Chromium mit Software-WebGL und emulierten Mobilansichten; kein echtes iPhone oder Android-Gerät. Der technische Wanderungstreiber kennt Wegpunkte und liest Diagnosen, bewegt sich aber ausschließlich über normale Eingaben und schreibt keine Koordinaten oder Vorräte. Er ist kein unabhängiger menschlicher Auffindbarkeitstest. Eine tatsächliche 20–30-Minuten-Abenteuerdauer wurde noch nicht gemessen.

Alte Spielstände bleiben im bestehenden Save-v1-Format. Neue Daten liegen additiv in versionierten Erweiterungen. Vor der ersten v0.7-Speicherung wird eine verfügbare Altdatei unter `blockboom.save.pre-v07` gesichert; Export/Import bleibt erhalten. Die bisherige Grenze von 50.000 gespeicherten Weltänderungen bleibt bestehen.

Die abschließenden Gameplay-Ergebnisse, Messwerte, Grenzen, Commits und der tatsächliche Deploymentstatus werden nach den jeweiligen Prüfungen ergänzt. Zurzeit ist weiterhin **v0.6.1** live; ein v0.7-Erfolg wird noch nicht behauptet.
