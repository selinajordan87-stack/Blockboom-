# Bergvalidierung – echte Laufzeitaufnahmen

**Entwicklungszweig, keine Veröffentlichung oder visuelle Freigabe.**

## Eingabeweg

`input/` stammt aus einer einzigen laufenden Spielsession am Geometriestand `c757e7e`. Start: normale neue Spielerposition, experimentelle Terrainrevision 2 im isolierten Testprofil. Danach nur normale Joystick-/Kameraeingaben und Sprünge. Der technische Treiber kennt Wegpunkte; das ist kein menschlicher Auffindbarkeitstest. Der spätere Felsmaterial- und LOD-Pass ist auf diesen Bildern noch nicht enthalten.

| Abschnitt | Bild |
| --- | --- |
| Normaler Start | [Start](input/01-start-distant.png) |
| Bergfuß | [Bergfuß](input/02-foot.png) |
| Serpentine | [Unterer Pfad](input/03-serpentine.png) |
| Mittlere Höhe | [Mittelzone](input/04-middle.png) |
| Aussichtspunkt | [Aussichtspunkt](input/05-viewpoint.png) |
| Oberer Grat | [Grat](input/06-upper-ridge.png) |
| Gipfel | [Gipfel](input/07-summit.png) |
| Talblick | [Talblick](input/08-valley.png) |
| Höhleneingang | [Eingang](input/09-entrance.png) |
| Erste Kammer | [Erste Kammer](input/10-first-chamber.png) |
| Tiefe Kammer und anvisierte Truhe | [Tiefe Kammer](input/11-deep-chamber.png) |
| Wieder draußen | [Rückkehr](input/12-return.png) |
| Tatsächlicher Reload | [Reload](input/13-reload.png) |

Die Tageszeit läuft während der rund 13½-minütigen Sitzung weiter. Abend-/Nachtbilder sind keine gleich beleuchteten Art-Vergleiche. [Ereignisse, Ressourcen und Fehlerliste](input/journey.json) · [Abschlussstatus](input/status.json).

Die dortige exportierte `played-save.json` stammt aus dem frühen experimentellen Build vor dem Export-Versionsschutz; sie ist nur interne Testevidenz, keine freigegebene Sicherungsdatei für alte Clients. Der aktuelle Export-/Import-Schutz wird separat im Browser geprüft.

## Kontrollierte Vergleiche

`fixtures/` wird mit `scripts/mountain-v072.mjs` aus dem aktuellen Build erzeugt. Es enthält gleiche Speicher-/Kamerafestlegungen für Generation 1 und 2. `metrics.json` kennzeichnet ausdrücklich, ob die tatsächlichen Standpositionen identisch blieben. Bei unterschiedlicher Standhöhe darf ein Paar nicht als Vergleich aus identischer Kameraposition gelten. Diese Bilder sind keine Belege für einen Eingabeweg.

`prototype-058e609/` zeigt den früheren Prototyp vor der neuen Berggrundfläche, dem Pfad-Baumschutz und dem Felsmaterial-Pass. Historische Evidenz, keine aktuelle Abnahme.

### Verwendbare Vorher-/Nachher-Paare

Gleiche tatsächliche Standposition, gleiche Blickrichtung und annähernd gleiche Tageszeit; kontrollierte Vergleichsfixtures:

| Blick | Generation 1 | Generation 2 |
| --- | --- | --- |
| Zufahrt: hohe Seitenwände gegenüber offenen Hängen | [Vorher](fixtures/generation-1-approach.png) | [Nachher](fixtures/generation-2-approach.png) |
| Ferne vom Regionsweg: runder Hügel gegenüber mehreren Gipfeln | [Vorher](far-comparison/generation-1-far-ridge.png) | [Nachher](far-comparison/generation-2-far-ridge.png) |
| Bergfuß | [Vorher](fixtures/generation-1-foot.png) | [Nachher](fixtures/generation-2-foot.png) |
| Tiefe Kammer, unverändert geschützt | [Generation 1](fixtures/generation-1-chamber.png) | [Generation 2](fixtures/generation-2-chamber.png) |

[Vergleichspositionen](fixtures/metrics.json) · [Fernvergleich](far-comparison/metrics.json).

Nicht als geometrischer Vergleich verwendet: Der normale Spawn-Blick ist durch vorhandene Objekte verdeckt. Beim Gipfelpaar fällt die Spielfigur auf unterschiedliche Standhöhen. Die Eingangsfixture `[128,1.01,-90]` löst in Generation 1 wegen einer seitlichen Terrainkollision den vorhandenen Safe-Spawn aus und zeigt deshalb eine andere Position. Das sind keine identischen Kameraansichten; die Prüfdaten kennzeichnen beide Paare ausdrücklich als ungeeignet. Der tatsächlich begangene Revision-2-Eingang ist separat im Eingabeweg belegt.

### Korrigierte Budgetbelege

`browser-mountain-final/` enthält die gültigen Ressourcenwerte samt echten Spielkamerafotos. `browser-core-pre-wait-fix/` enthält dagegen veraltete Startkamera-Diagnosen aus dem anfangs fehlerhaften Test. Diese frühen Werte sind **ungültig für die Bergabnahme**; ihre Bilder wurden nicht als Visual-Beweise übernommen. Der Test wartet nun auf eine aktive Ego-Kamera an der tatsächlichen Spielerposition.

Alle Bilder stammen aus Chromium/SwiftShader mit Touch-Viewport 844×390. Keine Mockups und keine echten iPhone-Aufnahmen.
