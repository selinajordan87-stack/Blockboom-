# Reality Audit – Ausgangsstand v0.6.1

Geprüfte Ausgangsbasis: `a007b56` auf `main`, Produktion lokal unter `/Blockboom-/`, Browserkennzeichnung v0.6.1. Dieser Bericht beschreibt ausschließlich den Zustand **vor** den v0.7-Änderungen.

## Methode und Grenzen

Ein frisches isoliertes Chromium-Profil mit 844×390 CSS-Pixeln, Mobile/Touch und Software-WebGL startete ohne Spielstand. Eingaben erfolgten über echte CDP-Touchkontakte auf dem Joystick und normale Menübuttons. Es wurden keine Positionen, Weltzellen, Vorräte, Missionen oder Spielzeiten injiziert. `?diagnostics=1` wurde ausschließlich gelesen. Das gewöhnliche Speichern im Menü und anschließende Neuladen wurden benutzt.

Die Richtungen wurden als standardisierte, von der sichtbaren Karte aus geplante Etappen gewählt. Das ist **kein unbeeinflusster menschlicher Erstspielertest** und keine Messung menschlicher Such- oder Lesegeschwindigkeit. Der gesamte Browserablauf dauerte rund 65 Sekunden; daraus wird kein bestandener 3–5-Minuten-iPhone-Test abgeleitet. Technische Quellenprüfung und ältere Tests mit vorgegebenen Koordinaten sind ausdrücklich keine Nachweise für normale Auffindbarkeit.

Reproduktion: `node scripts/v07-audit-player.mjs`, während der unveränderte v0.6.1-Build auf Port 4207 läuft. Der Test schreibt keinen Spielzustand über Entwicklerwerkzeuge. Screenshots und Messdaten: [artifacts/v07/before](artifacts/v07/before), insbesondere [player-audit.json](artifacts/v07/before/player-audit.json).

## Beobachteter Spielerpfad

1. Start bei `[0,1,17]`: großes Auftragsschild vor der Figur, mehrere weitere Schilder in Sicht. Kein Berg, Dorf, Höhleneingang oder sichtbarer Weg zu einem größeren Ziel. Kleine kompakte v0.6.1-Steuerung funktioniert.
2. Menü → Welt & Karte → Karte: sofort alle sechs Regionen benannt und eingefärbt, obwohl nur Wiesenland entdeckt ist. Der bestehende Kompass ist auf Mobile ausgeblendet. Es gibt keine wirkliche Entdeckungsabdeckung der Karte.
3. Menü → Welt & Karte → Garten: alle vier Saatarten sind wählbar; der Ablauf ist ein Textabsatz im Untermenü. Auf der Startwiese gibt es kein angelegtes Feld oder sichtbares Landwirtschaftsangebot. Menü → Welt & Karte → Werkbank zeigt ein zunächst nicht finanzierbares Hackerezept.
4. Zwei Sekunden nach Norden, zehn Sekunden nach Westen: Wald erreicht; Position danach `[-27.71,1,7.85]`. Der westliche Fortschritt wird an einem Baum gebremst. Baumgruppe ist als dichterer Wald erkennbar. Bewegungsinput insgesamt zwölf Sekunden; keine Aussage über menschliche Suchzeit.
5. Zehn Sekunden weiter nach Norden: Wasserufer bei `[-27.71,1,-34.71]`, Regionsname „Großer See“. Links ist tatsächlich eine Wasserfläche sichtbar. Es gibt dort keinen entsprechenden neuen Angelplatz aus dem v0.6-Regionssystem; die zusätzlichen v0.4-Angelstellen sind ein separates System.
6. Fünfzehn Sekunden nach Osten: Bergrand bei `[29.70,1,-34.71]`; außen dominieren große Grasstufen. Trotzdem wird bereits „Kupferhöhlen“ entdeckt. Es wurde weder ein Eingang erkannt noch ein unterirdischer Raum betreten.
7. Zwölf Sekunden nach Süden: Position nur bis `[29.70,0,-28.30]` fortgeschritten, an einer Geländekante stehen geblieben. Die Siedlung wurde in diesem Versuch nicht erreicht. Es wurde nicht mit internem Wissen um den Eingang nachgeholfen.
8. Menü → Speichern → Weiter → Browser-Reload: Position, sechs Tierdatensätze und entdeckte Regionsnamen bleiben erhalten. Keine JavaScript-Seitenfehler im Ablauf. Keine Pflanze, kein Begleiter und kein eigenes Haus wurden in diesem Audit erzeugt; ihre Persistenz ist daher hier nicht als Gameplay-Erfolg bewertet.

## Funktionsmatrix

**C** = anhand des Baseline-Codes bestätigt, aber kein vollständiger normaler Spielerpfad nachgewiesen. **B** = im obigen normalen Browserpfad beobachtet. **Offen** bedeutet hier nicht „fehlt technisch“, sondern „nicht mit diesem Spielerpfad belegt“. Dauerangaben gelten nur dort als gemessen, wo ein konkreter Ablauf genannt ist.

| Funktion | Technisch vorhanden? | Tatsächlich erzeugt? | Vom neuen Start erreichbar / gemessene Finddauer | Kann man die Aktion erkennen? | Mobile-Benutzung | Visuelle Unterscheidbarkeit | Save/Reload |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Wiesenland | Ja, C | Ja, zentraler Weltkern | B: sofort | Freies Gelände erkennbar, nächstes Abenteuerziel fehlt | B: Bewegung und Menüs | B: offene Grasfläche | B: Position erhalten |
| Wald | Ja, C | Ja, externe Chunks | B: zwölf Sekunden Bewegungsinput nach vorherigem Kartenaufruf | Bäume erkennbar; kein lesbarer Pfad | B: echter Joystickweg | B: dichter als Start, Screenshot 06 | Regionsname B, Weltregeneration C |
| Gebirge | Ja, C | Ja, Höhenfunktion | B: Bergrand nach insgesamt 37 Sekunden Bewegungsinput; eigentlicher Gipfel nicht bestiegen | Hohe Grasstufen; keine sichtbar angebotene Route | Bewegung bis Kante B; Besteigung offen | B: Höhe erkennbar, kaum Felscharakter im Blick | Gelände C, Position B |
| Startsee | Ja, C | Becken ja; Wassertransformation fehlerhaft | Nicht eigens abgelaufen; Zeit offen | Steg erkennbar, Wasser kann optisch fehlen | Angeln nicht in diesem Audit gespielt | C: `WaterView` skaliert die übergeordnete Y-Achse statt Wasser-Z-Ausdehnung | C |
| Großer See | Ja, C | Becken und Wasserellipse ja | B: Ufer nach insgesamt 22 Sekunden Bewegungsinput | Wasser sichtbar; keine v0.6-Angelstellenverknüpfung | B: Ufer erreicht, Fang offen | B: Wasser links in Screenshot 07 | Regionsname B, Wasser C |
| Fluss | Ja, C | Schmale Wasserplane und Bett, C | Nicht als Fluss erkannt; Zeit offen | Kein Regionsname, keine sichtbare Strömungsorientierung | Offen | C: kurze schmale Fläche, kein großer verbindender Lauf | C |
| Höhlenregion | Ja, C | Regionsklassifikation ja | B: „cave“ bereits draußen bei y=1 | **Irreführend:** Eintrag entsteht ohne Höhlenbesuch | Außenpfad B | B: Screenshot 08 ist offene Landschaft | B: vorzeitige Entdeckung gespeichert |
| Begehbare Höhle | Ja, C | Gang, Kammer, Tiefenast erzeugt, C | Normaler Einstieg in diesem Versuch **nicht** nachgewiesen; keine Finddauer behauptet | Eingang von beobachteter Ankunftsseite nicht erkannt | Innenraum offen | Außenaufnahme kein klarer dunkler Eingang | C; ältere koordinatengesetzte Tests sind kein Auffindbarkeitsbeweis |
| Verlassene Siedlung | Ja, C | Vier Gebäude im externen Generator, C | Versuch nach Süden an Stufe blockiert; nicht erreicht | Keine Silhouette vom Start; Sichtgrenze 48 m für Weltmeshes | Offen | C: Häuser erst aus geringerer Distanz | C |
| Schmiede | Ja, C | Ofen, Werkbank, Truhe in Ziegelhaus, C | Nicht regulär erreicht; Zeit offen | Rolle nur durch Inneneinrichtung/alte Notiz erschließbar | Offen | C: Ziegel statt Bretter | C |
| Lagerhaus | Kein eigener Typ; zweites Haus, C | Zweites Haus mit Truhe, C | Nicht erreicht | Als Lager nicht eindeutig ausgezeichnet | Offen | Nahezu gleich wie Wohnhaus, C | C |
| Wachturm | Ja, C | Höheres Bretterhaus mit Leiter, C | Nicht erreicht | Höhe erkennbar, Aufstiegshinweis fehlt | Leiterbenutzung offen | C: höhere Silhouette, aber kein fernes LOD | C |
| Keller | Ja, C | Kammer und schmale Treppenrampe, C | Nicht erreicht | Kein vom Start zugänglicher Hinweis darauf | Offen | Unterirdisch, C | C |
| Tiere | Ja, C | Sechs persistente Tiere, je eine Art, C/B Daten | Im Startblick nur einzelne Tiere; kein gezielter Tierpfad | Nähe und Kontextinteraktion nötig | Beobachtung B, Füttern offen | C: verschiedene Modelle, Sichtweite 32 m | B: sechs Datensätze bleiben; individuelles Haustier offen |
| Haustiere | Ja, C | Keine bereits gezähmten Tiere | Futterbeschaffung und zweimal Füttern nötig; Zeit offen | Untermenü erklärt Futter erst nach Treffen | Offen | Tame-Status nicht als großes Weltziel sichtbar | C |
| Farming | Ja, C | Kein Startfeld; muss selbst angelegt werden | Menüpfad B, vollständiger Spielablauf offen | Dreifach verschachtelter Zugang; kein Weltangebot | Garten- und Rezeptmenü B | Ohne eigene Aktion nichts sichtbar | C |
| Pflanzen | Ja, C | Im frischen Spiel **null** Pflanzen | Erst nach Hacke/Bodenbearbeitung/Saat | Vier Saatarten nur im Gartenmenü | Saatmenü B; Wachstum/Ernte offen | Wachstumsmodelle C | C |
| Bett | Ja, C | Im neuen Schutzhaus kein Bett; muss hergestellt/gebaut werden | Werkbankrezept B; echte Herstellung offen | Rezeptkosten vorhanden, kein anleitender Bau-Loop | Rezeptansicht B; Schlafen offen | Modell C | C |
| Truhe | Ja, C | Lagerkiste im Startschutzhaus, Truhen in Siedlung | Kein vollständiger Ein-/Auslagerungspfad gespielt | Haus hinter/seitlich vom Start nicht zuerst erklärt | Offen | Modelle C | C, nicht als normaler Spielerablauf hier bestätigt |
| Werkbank | Ja, C | In Siedlung; Menü öffnet Rezepte ortsunabhängig | B: Menü → Welt/Karte → Werkbank | Herstellungskosten sichtbar, Rolle der echten Werkbank unklar | Rezeptmenü B | Weltmodell C | C |
| Ofen | Ja, C | Siedlung; selbst herstellbar | Keine tatsächliche Verarbeitung im normalen Audit | Ofenhinweis nur im Werkbank-Untermenü | Offen | Weltmodell C | C |
| Missionskette | Ja, C | Fünf Entdeckungsprüfungen, drei ältere Aufträge | Menüzugang C; keine in diesem Pfad abgeschlossen | Fünf statische Absätze hinter Untermenü, kein laufendes Ziel | Menüs technisch vorhanden; kompletter Ablauf offen | Kein zusammenhängendes Weltangebot | C |
| Rohstoffe | Ja, C | Grundblöcke und externe Erze, C | Gras/Stein B sichtbar; Erzfund offen | Abbau-Taste vorhanden, Werkzeugstufen nicht als Reisehinweis | Offen für echte Rohstoffgewinnung | Erze C | C |
| Bergbau | Ja, C | Erze in Höhlen und Zufallsadern, C | Normaler Höhleneinstieg fehlt im Audit | Richtige Spitzhacke erforderlich, Erklärung verborgen | Offen | Unterschiedliche Erzfarben C | C |
| Crafting | Ja, C | Rezepte erzeugen Gegenstände, C | B: Rezeptansicht, aber keine Herstellung | Mehrere voneinander getrennte Crafting-/Inventarmenüs | Menüs B; Produktion offen | Nur bei Menüöffnung sichtbar | C |
| Angeln | Ja, C | Sichtbare Fische und vier v0.4-Plätze, C | Kein Fang in diesem Audit; Zeit offen | Angel muss erst über Werkzeugfeld gewählt werden | Offen in diesem audit; frühere Regressionen getrennt | Fischmodelle C; Startwasserfehler beeinträchtigt Erkennung | C |
| Zombie-Survival | Ja, C | Nachtabhängiger Spawn, C | Neue Welt startet tagsüber, ca.20-Minuten-Zyklus; Nacht nicht abgewartet | Neues Schutzhaus vorhanden, keine spielerische Einführung | Offen in diesem Audit | Modelle/Tag-Nacht C | C |
| Lernaufgaben | Ja, C | Vorwiegend Menüangebote; keine Fundtexte | Kein sinnvoller Welttext auf dem Gehpfad ausgelöst | Challenge separat im Menü, erste Auswahl elementar | Eingabe hier nicht gespielt | Separate Formulare statt Weltinformation | C |

## Warum die Funktionen im echten Spiel leicht verfehlt werden

- Weltgrenze ±60 bei 4,5 Blöcken/Sekunde bedeutet auf einer freien geraden Strecke theoretisch nur rund 27 Sekunden zwischen gegenüberliegenden Rändern. Diese Rechnung ist keine gemessene Wegzeit, erklärt aber die geringe räumliche Größenordnung. Die gerenderten Weltmeshes verschwinden ab 48 m; natürliche Fernziele helfen am Start kaum.
- Die Karte ersetzt zwar fehlende Richtungsinformationen, ist aber nicht permanent sichtbar, hat keine echte Entdeckungsabdeckung und erklärt weder Eingänge noch erreichbare Wege.
- „Höhlen entdeckt“ bedeutet im bisherigen Code `x>=26`, `z<-20`, `y<3` statt tatsächlicher unterirdischer Erkundung. Im Browserpfad wird diese falsche Bestätigung reproduziert.
- Der erste Weg Richtung Siedlung wird an einem Terrainversatz unterbrochen. Ein gezielt konstruierter Koordinatentest überspringt genau diese reale Navigation.
- Die Startszene zeigt große Textschilder und ein generisches Bauwerkzeug, aber keine spielbare kurze Aufgabe, die Materialgewinnung, Auswahl, Vorschau und Schutzbau miteinander verbindet.
- Farming hat Samen, Rezepte und Wachstum im Code, aber weder Pflanzen noch ein angelegtes Feld im Startzustand. Ein neuer Spieler muss mehrere Menüs und Materialvoraussetzungen selbst zusammenführen.
- Sechs feste Tiere auf der gesamten Karte und Sichtweite 32 m ergeben keine gleichmäßig lebendige Welt. Ein Test auf sechs gespeicherte Datensätze beweist keine sechs wahrgenommenen Tiere.
- Bücher/Baupläne sind bisher Gegenstandszahlen bzw. Toasts, keine erneut lesbaren Weltfundstücke. Lernfenster werden unabhängig vom Reise-/Bauproblem aufgerufen.

## Nachweise

- [Frischer Start](artifacts/v07/before/01-new-player-start.png)
- [Von Anfang an vollständige Regionskarte](artifacts/v07/before/02-map-full-known.png)
- [Garten hinter Menüpfaden](artifacts/v07/before/03-garden-hidden-in-menu.png)
- [Hackerezept ohne Anfangsvorräte](artifacts/v07/before/04-hacke-recipe.png)
- [Regulär erreichter Wald](artifacts/v07/before/06-west-toward-forest.png)
- [Regulär erreichtes Wasserufer](artifacts/v07/before/07-north-toward-lake.png)
- [Offener Bergrand bereits als Höhle gemeldet](artifacts/v07/before/08-east-toward-mountains.png)
- [Blockierter Südweg](artifacts/v07/before/09-south-toward-village.png)
- [Gewöhnlicher Reload](artifacts/v07/before/10-ordinary-reload.png)

Die Matrix dokumentiert vorhandenen Code, tatsächlich erzeugte Welt und erprobten Spielerpfad getrennt. Insbesondere Höhleninnenraum, Siedlungsgebäude, vollständiger Hausbau, Farmingzyklus, Fischen und Zombie-Nacht werden hier **nicht** als bestandene normale Erstspielerpfade ausgegeben.
