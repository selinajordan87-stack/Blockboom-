# BLOCKBOOM v0.5 – NIGHTFALL

## Ausgangslage

12. November 2026: sauberer `main` auf `acb9cf4`, identisch mit `origin/main`. v0.4.0 ist online (Bundle `index-B6xNo-vd.js`), Pages-Lauf `43304890633` erfolgreich. Vor Änderungen erneut TypeScript strict, 43/43 Unit-/Integrationstests und Produktionsbuild bestanden. Entwicklung auf `feature/v05-nightfall`.

## Architekturentscheidungen

- Save v1 und Extension v1 bleiben erhalten; NIGHTFALL wird als eigener validierter Unterdatensatz ergänzt. Die Weltedition 4 wird nicht verändert. Vor dem Upgrade einmalige lokale Sicherung `blockboom.save.pre-v05`.
- Tag/Nacht, Versorgung, Crafting, begrenzte Zombie-Simulation, Bauteile und Schreibkampf erhalten unabhängige Module. Three.js-Ansichten verwenden geteilte Geometrien/Instancing.
- Permanente Gebäudeschäden bleiben standardmäßig aus. Bestehende Saves starten im Kreativmodus; neue Welten im Survivalmodus. Lern-Challenge bleibt unabhängig davon Standard.
- Gegnerzahl und Wellen sind begrenzt; keine Physikengine, keine neuen Laufzeitabhängigkeiten.
- Reale iPhone-/Android-Abnahme und 30-FPS-Nachweis bleiben gesondert offen.

Implementierungs-, Test- und Releasebefunde folgen nach den abgeschlossenen Phasen.
