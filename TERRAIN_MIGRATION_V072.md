# Terrainstrategie v0.7.2 – Generation 2, erster Schritt

Vor jeder Terrainänderung geprüft: Edition 1–4 steuert bestehende zentrale Landschaften; der äußere Generator ist davon bislang unabhängig. Weltänderungen werden als einzelne Blockdeltas gespeichert und nach Chunkaufbau wieder angewandt. Ein Delta allein schützt KEINE Kellerluft oder das Fundament eines Hauses gegen eine andere Basishöhe. Eine bloße „bearbeitete Spalte überspringen“-Regel wäre auch für neue Häuser auf neuen Bergen beim nächsten Reload falsch.

Deshalb: neue additive Kennung `extension.terrainRevision`, unabhängig von Edition. Fehlende/ungültige Werte bedeuten Generation 1. Alte Welten werden nicht automatisch umgeformt. So bleiben auch nie editierte Nachbarfundamente, Dächer, Keller, Möbel, Pflanzen, Tiere und gespeicherte Positionen auf demselben Untergrund. Generation 2 muss anschließend unveränderlich bleiben. Ein künftig gewünschter Wechsel braucht einen ausdrücklichen Export und einen gesonderten geprüften Import-/Regionserhaltungsplan. Keine automatische Freigabe allein aus „keine Deltas vorhanden“.

Der erste Generation-2-Prototyp modelliert ausschließlich Teile des äußeren Silbergebirges. See, Steg, Fluss, Siedlung, bestehende Regionswege und Höhlenkoordinaten bleiben unverändert. Höhlen werden anschließend weiterhin durch denselben Generator ausgespart. Manuelle Deltas bleiben maßgeblich. Der Prototyp ist NICHT standardmäßig für neue oder bestehende Welten aktiviert: Nur vorbereitete Tests können `terrainRevision:2` setzen. Keine Migration und kein neues Release werden behauptet.

## Validierungsfortsetzung (15. November 2026)

Der experimentelle Berg besitzt nun einen abgestuften Fuß, drei überlappende Gipfelkörper und einen breiten Pfad. Die gesamte ehemalige Berggrundfläche wird berücksichtigt; das vorherige Mischen nur innerhalb kleiner Gipfel hinterließ einen Ring alten hohen Geländes. Der Anschluss an bestehende Regionswege wird in Revision 2 abgeflacht. Kammerdecken haben Vorrang vor diesem Abflachen. Generation 1 verwendet weiterhin exakt die alte Höhenfunktion.

Player-Physik: Kontrollierter Start am Bergfuß, anschließend ausschließlich `Player.step` zum Gipfel und zurück, mit automatisch ausgelösten normalen Sprüngen vor Hindernissen. Beide Kammerbereiche und der Rückweg sind ebenfalls geprüft. Das ist ein technischer Pfadtest, keine Aussage über die menschliche Auffindbarkeit. Ergänzende Browser-Eingabefahrt und visuelle Abnahme werden separat dokumentiert.

210 Höhlenspalten sind auf freie Innenräume und mindestens drei Blöcke Deckenstärke geprüft; absichtlich platzierte Erze bleiben ausgenommen. Der äußere Revisionsrand hat höchstens eine Blockstufe an den geprüften Nachbarspalten. Generierte Bäume halten Abstand vom Bergpfad. Manuelle Kellerluft, Möbel und hohe Baublöcke überstehen Entladen und erneutes Generieren.

### Schutz gegenüber alten Clients

Ein bereits veröffentlichter Client lässt sich nicht durch ein neues optionales Feld nachträglich zum Anzeigen einer Warnung zwingen. Deshalb speichern aktuelle Clients Generation 2 unter **`blockboom.save.terrain2`**, während **`blockboom.save`** für Generation 1 unverändert bleibt. Aktuelle Clients bevorzugen den separaten Stand. Ein alter Client kann nur seinen bisherigen Generation-1-Stand bearbeiten; er überschreibt die separate Welt nicht. Das ist eine Trennung der Welten, kein automatischer Zusammenführungsmechanismus. Die experimentellen Testfixtures mit direkt unter dem alten Schlüssel eingesetztem Revision-2-JSON sind keine unterstützte Austauschform.

Revision-2-Exporte erhalten die Hüllenversion **2**. Der geprüfte v0.7.1-Parser (`bab0537`, `src/storage/Transfer.ts`) lehnt diese Version bereits vor dem Import ab. Der aktuelle Client liest Hüllenversion 1 und 2. Rohe JSON-Dateien manuell in alte Clients einzuspielen ist kein unterstützter Rückweg. Bei unbekannter neuer Terrainrevision oder neuerer Weltversion zeigt der aktuelle Client die Schutzmeldung und schreibt keine Daten.

Ein Import sichert die zuvor aktive Welt, erhält die separate Generation-1-Welt beim Import von Generation 2 und stellt bei einem fehlgeschlagenen Schreibschritt beide Weltbereiche wieder her. Ein ausdrücklicher Generation-1-Import darf zurückwechseln; zuvor wird die aktive Generation-2-Welt gesichert. Keine automatische Migration anhand der Deltaanzahl.

### Weiterhin keine Freigabe

Generation 2 bleibt ein kontrollierter Prototyp. Neu erstellte Produktwelten bleiben Generation 1. Der Browser-Eingabeweg, Speicher-Roundtrip und die korrigierten Renderbudgetfälle bestehen inzwischen; Details und Einschränkungen: [Bergvalidierung](MOUNTAIN_VALIDATION_V072.md). Die abschließende visuelle Berg-/LOD-Abnahme und ein echter Gerätetest stehen noch aus. See/Ufer/Fluss werden bis zur Bergabnahme nicht umgeformt.

Spätere Produktoption, hier bewusst nicht umgesetzt: „Neue Welt mit verbessertem Terrain“, mit ausdrücklicher Übernahme von Lernfortschritt, Fangbuch, Erfolgen und Einstellungen. Keine Übernahme alter Keller/Bauten durch implizites Neugenerieren.
