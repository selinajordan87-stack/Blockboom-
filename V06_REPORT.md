# BLOCKBOOM v0.6 – LIVING WORLD

## Audit

13. November 2026: sauberer `main` auf `e5da842`, gleich `origin/main`. v0.5 online mit `index-BRhEF1WY.js`, Pages-Lauf `43313545310` erfolgreich. Erneute Baseline: TypeScript strict, 58/58 Logiktests und Produktionsbuild bestanden. Entwicklung auf `feature/v06-living-world`.

## Technische Grenzen

- Der 48×48-Ursprung und Weltedition 4 bleiben erhalten. Neue Regionen liegen außerhalb dieses Bereichs. Äußere Chunks werden deterministisch geladen und entladen; gespeicherte Deltas gewinnen gegen die Generierung.
- Speicherformat v1 bleibt; additive Erweiterung `living.version = 1`, einmalige Sicherung `.pre-v06`. Haustiere, Pflanzen, Truhen und Fortschritt werden einzeln validiert.
- Keine neuen Laufzeitabhängigkeiten. Originale Voxelmodelle, feste Tier-/Gegnergrenzen, geteilte Geometrien und vorhandene Chunk-Neubauten.
- Reale Smartphone-FPS und iPhone-/Android-Abnahme bleiben offen.

Implementierungs- und Releasebefunde werden nach Prüfung ergänzt.
