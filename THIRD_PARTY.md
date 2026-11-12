# Assets und Lizenzen

Es werden keine fremden Bild-, Textur-, Modell-, Schrift- oder Tonassets geladen. Voxelgeometrie, Farbschema, SVG-Icon, Schilder und UI sind für BLOCKBOOM im Quellcode erzeugt. Der optionale BOOM-Ton wird lokal mit Web Audio synthetisiert. Systemschriften kommen vom Gerät. Keine Minecraft-Assets.

Die lokal gebündelte Laufzeitbibliothek Three.js steht unter MIT. Ihr vollständiger Lizenztext wird unter `public/THREE-LICENSE.txt` mitgeliefert und in den Build kopiert.

Entwicklungswerkzeuge: Vite (MIT), Vitest (MIT), TypeScript (Apache-2.0), @types/three (MIT), Playwright (Apache-2.0). Exakte aufgelöste Versionen und transitive Abhängigkeiten: `package-lock.json`; deren Lizenztexte liegen in den jeweiligen npm-Paketen. Diese Werkzeuge werden nicht als Laufzeitdienst verwendet.

Auch die v0.2-Fischmodelle, Figuren, Schatzkiste, Landschaftsergänzungen und Aufgabeninhalte wurden für dieses Projekt im Code beziehungsweise als eigene Texte erzeugt. Keine zusätzlichen fremden Assets oder Bibliotheken.

Für v0.3 werden der kleine Oberflächenatlas, alle Pixelmuster, die neue Landschaft, Wasserlagen, First-Person-Hand, sieben Werkzeugmodelle und 20 zusätzlichen Lernaufgaben ebenfalls zur Laufzeit beziehungsweise im Projekt selbst erzeugt. Es kamen keine Bild-, Modell-, Sound- oder Laufzeitabhängigkeiten hinzu.
