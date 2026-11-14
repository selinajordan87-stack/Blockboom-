# BLOCKBOOM – Overnight Sprint / v0.7

## Recovery und Ausgangsbasis

13.11.2026: `main` und veröffentlichte v0.6.1 stehen auf `a007b56`. Der Featurebranch `feature/v07-world-discovery` enthält den Auditcommit `a1e6655` sowie umfangreiche, nicht committete Arbeit des abgebrochenen Laufs. Diese Arbeit wurde erhalten und integriert. Kein Reset, kein Rewrite und keine neue Abhängigkeit.

Der erste Recovery-Lauf bestand TypeScript und 129/130 Logiktests. Der eine Fehler war die feste alte Weltgrenze 60 im Test. Der Test prüft jetzt die tatsächlich konfigurierte Grenze `LIMIT`, weiterhin mit einem verbotenen Grenzblock. Danach bestanden alle 130 Tests und der Produktionsbuild. Sechs zusätzliche Welt-/Streamingtests bestehen ebenfalls.

Der [Reality Audit](REALITY_AUDIT.md) trennt technischen Bestand von tatsächlich abgelaufenen Spielerwegen. Die echten Vorherbilder stammen aus v0.6.1. Die vom Auftrag beigefügten Bilder sind Gestaltungsreferenzen und werden nicht als implementierte Spielgrafik ausgegeben.

## Recovery-Checkpoint

Im integrierten Spiel vorhanden: korrigierte Wasserfläche, angeschlossene Fern-Landmarken, additive Außenwelt, budgetiertes Chunk-Rendering, physische lesbare Notizbücher, gespeichertes Entdeckerbuch, Abenteuerlog, aufgedeckte Erkundungskarte, sichtbarer Startergarten, begrenzte regionale Tierplätze und ein zusätzlicher tatsächlich besetzter Angelplatz.

Erste Browserprüfung: **4/4 bestanden**. Frischer Start, direkte Werkzeugslots, tatsächliche Buchinteraktion, freiwillige Materialrechnung mit Fehler/Hilfe, Wald und Kartenaufdeckung, Langdruck-Inventar und zwei Daumen. Farming wurde vom Start zu Fuß erreicht: Kürbis geerntet, Weizen gepflanzt, gespeichert/neugeladen, zwei Minuten echte aktive Spielzeit abgewartet und geerntet. Keine Uhr- oder Koordinateninjektion.

Die anschließende längere Wanderung scheiterte tatsächlich am Ostufer des alten großen Sees: zwei Blöcke tiefer Seeboden ohne ausreichende Zwischenstufe. Diese Prüfung wird nicht als Erfolg gezählt. Die Ufer wurden gezielt abgestuft; gespeicherte Änderungen haben weiterhin Vorrang. Ein zusätzlicher Player-Physiktest bestätigt den Rückweg mit normalen Sprüngen. Der erneute vollständige Gehweg läuft noch. Die Welttexte sind jetzt explizit mit mindestens 16 px und größerem Zeilenabstand lesbar. Bau-/Sammelaktionen geben kurze Mengenrückmeldungen.

Checkpoint `49d1db3` sichert die wiederhergestellte Integration. Diese Angaben sind kein vollständiger Release- oder iPhone-Abnahmenachweis.

## Prüfmethoden und offene Punkte

Chromium mit Software-WebGL und emulierten Mobilansichten; kein echtes iPhone oder Android-Gerät. Der technische Wanderungstreiber kennt Wegpunkte und liest Diagnosen, bewegt sich aber ausschließlich über normale Eingaben und schreibt keine Koordinaten oder Vorräte. Er ist kein unabhängiger menschlicher Auffindbarkeitstest. Eine tatsächliche 20–30-Minuten-Abenteuerdauer wurde noch nicht gemessen.

Alte Spielstände bleiben im bestehenden Save-v1-Format. Neue Daten liegen additiv in versionierten Erweiterungen. Vor der ersten v0.7-Speicherung wird eine verfügbare Altdatei unter `blockboom.save.pre-v07` gesichert; Export/Import bleibt erhalten. Die bisherige Grenze von 50.000 gespeicherten Weltänderungen bleibt bestehen.

Die abschließenden Gameplay-Ergebnisse, Messwerte, Grenzen, Commits und der tatsächliche Deploymentstatus werden nach den jeweiligen Prüfungen ergänzt. Zurzeit ist weiterhin **v0.6.1** live; ein v0.7-Erfolg wird noch nicht behauptet.

## Tatsächliche Änderungen

- **Welt lesen können:** große Starttafeln entfernt, kleine Wegweiser erhalten. Berg-, Wald- und Turmsilhouetten sowie begrenzte Rauchanimation geben Fernziele. Die bestehende innere Welt und ihre gespeicherten Änderungen bleiben erhalten; äußere Regionen ergänzen begehbares Gelände. Der Startsee wird korrekt horizontal dargestellt.
- **Körperlich erkunden:** nahe Kupferhöhle, weitere Minen und eine größere Siedlung mit unterschiedlicher Gebäudegestalt. Ein draußen stehender Spieler entdeckt nicht mehr fälschlich einen Höhleninnenraum. Die kontrollierte Wanderung erreichte tatsächlich den alten Höhlengang, seine Kammer und den Rückweg sowie die alte Siedlung. Der äußere Abschnitt ist noch separat nachzuprüfen.
- **Nützliche Welttexte:** Bücher liegen als kleine dreidimensionale Objekte in der Welt. Sie erklären Baufolge, Saat, Angelverhalten, Werkzeugstufen, die Rauchspur und die Kammer. Text bleibt bis zum Schließen sichtbar. Vorlesen nutzt eine verfügbare lokale deutsche Stimme; ohne Stimme bleibt alles lesbar. Gefundene Informationen sind im Entdeckerbuch erneut erreichbar.
- **Abenteuer:** das Log zeigt höchstens drei aktive Ziele. Die neue Kapitelkette verbindet ein selbst gebautes Zuhause, einen sicheren Schlaf, Flussspur, Schmiede, Mine, Eisenverarbeitung und Fundkammer. Ein generiertes Schutzhaus oder bloß geöffnetes Fenster zählt nicht als eigener Hausbau. Die alte Haustiermission blockiert die Bergbauziele nicht mehr.
- **Bauplan:** ein gefundener Schmiedeplan ermöglicht einen echten Aussichtsturm mit transparenter Platzierungsvorschau. Die Materialliste stimmt mit den gesetzten Zellen überein: 24 Bretter, zwölf Stein, vier Fackeln und vier Leitern. Verbrauch und freier, tragfähiger Platz werden vor dem Bauen geprüft. Erst das tatsächliche Hochklettern deckt Umgebungskacheln auf und vergibt das Abzeichen. Der Browserablauf einschließlich Reload bestand mit einem kontrollierten vorhandenen Spielstand; er ist kein frischer Survival-Ressourcensammeltest.
- **Garten und Tiere:** sichtbarer kleiner Garten mit echten Pflanzen und Wachstumsstufen; Hacke, Saat, Ernte, Nahrung und Tierfutter verwenden die vorhandenen Systeme. Ein begrenzter regionaler Tierpool wird nur in Spielnähe simuliert. Vorhandene gezähmte Tiere und Namen haben beim Laden Vorrang. Der zusätzliche große See hat tatsächliche sichtbare, fangbare Fische statt nur eine dekorative Wasserfläche.
- **Mobile Bedienung:** sechs kleine direkte Slots, wenige passende Aktionen und kompakter Kompass. Werkzeugwechsel, Materialvorrat und Zielaktion sind getrennte Daten. Ein Truhenziel wird deshalb als Truhe erkannt, nicht als das zufällig ausgewählte Baumaterial. Langdruck öffnet das Inventar. Kamera und Mehrfingerbesitz aus v0.6.1 bleiben erhalten.

## Lernmomente und Spielerpfad

Ein sinnvoller Einstieg beginnt mit dem sichtbaren Buch und erreichbarem Baumaterial. Der kurze Bauhinweis erklärt Vorschau, Setzen und eigene Wände. Eine freiwillige Wandrechnung fragt nach dem tatsächlichen Reihenprinzip; falsche Antworten geben Hilfen und nehmen keine Vorräte weg. Am sichtbaren Beet wird die gelesene Reihenfolge Bearbeiten → Samen → Pflanzen → Ernte angewendet. Das Angelblatt beschreibt Hecht, Wasserpflanzen und Kunstköder; diese Auswahl nutzt das vorhandene Angelsystem. In der Schmiede erklärt das Tagebuch die im Spiel funktionierende Folge Kupfer → Kupferspitzhacke → Eisen. Die Kammer verbindet räumliche Hinweise mit einem kurzen Zielwort. Der Bauplan verbindet Materialrechnung, Sammeln, Bauen und eine nutzbare Aussicht.

Für 15–30 Minuten ist vorgesehen: zuerst Material und Unterschlupf, zwischendurch Garten oder Angeln, dann Flussspur/Rauch und Schmiede, anschließend Minenwerkzeug und erste Erze. **Das ist ein vorgeschlagener Ablauf, keine gemessene menschliche Spieldauer.** Die strengere Hausprüfung, komplette Survival-Ressourcenwirtschaft und alle Kapitel am Stück wurden noch nicht als unabhängiger Erstspielertest abgeschlossen.

## Technische Architektur und Messungen

`DiscoveryState` wird additiv in der bestehenden `Expansion` gespeichert. `DiscoveryEngine` prüft Weltänderungen und reale Ereignisse; `DiscoveryUI` verbindet Log, Texte und Buch mit den vorhandenen Menüs. `Blueprint` verwendet einen gemeinsamen Bauplan für Materialliste, Vorschau, Bau und Vollständigkeitsprüfung.

`RegionStream` priorisiert nahe Abschnitte und verteilt Generierung und Entladen auf Spalten. `WorldView` baut Chunks budgetiert und tauscht ihre beiden Materialebenen erst vollständig aus. Gespeicherte Änderungen werden über einen Chunkindex wieder angewendet. `World.specialBlocks` und eine eigene Änderungsnummer vermeiden globale Möbel-Rebuilds bei reinen Erd-/Steinänderungen. Ferngeometrie ist bewusst vereinfachtes LOD; die Kollision kommt ausschließlich aus der tatsächlichen Voxelwelt.

Gemessener lokaler Logiklauf auf diesem Cloud-Rechner: Renderer-Budgetziel 4 ms, maximal beobachteter Slice 4,07 ms, Mittel 2,13 ms; Runtime-Generierung maximal 4,79 ms in dieser Probe. Achtungsgrenze: einzelne Spalten, atomarer Geometrieabschluss oder Garbage Collection können das Ziel überschreiten; andere Entwicklungsläufe lagen bei rund 5–11 ms. Der alte synchrone Streamingtest bleibt zur Kompatibilität vorhanden und ist kein Nachweis für das neue Runtime-Budget.

Der Diagnoseexport enthält Framerate, Framezeit, Chunk-/Generierungszeiten, sichtbare Szenenmeshes, Draw Calls, aktive Tiere/Gegner und gegebenenfalls Chromiums JS-Heap. Sichtbare Szenenmeshes sind keine Behauptung über nach Frustum-Culling tatsächlich gezeichnete Objekte. Es gibt keine gemessene reale iPhone-/Android-Framerate.

## Checkpoints

| Commit | Zweck |
| --- | --- |
| `a1e6655` | tatsächlicher v0.6.1-Spieler-Audit und Vorherbilder |
| `49d1db3` | abgebrochene Arbeit integriert und baubar gesichert |
| `3b7c2c4` | gefundene Uferfalle behoben, Lesbarkeit und Fernsignale verbessert |
| `08f08d1` | echter Turmbauplan mit Aufstieg, Verbrauch und Save/Reload |
| `494769a` | Spezialblockindex verhindert unnötige globale Rebuilds |

## Noch offen vor der Veröffentlichung

Abschluss der äußeren Wanderung, abschließende Live-Prüfung und ein echter iPhone-Test. Vollständige Browserregression und konsistenter Survival-Einstieg in die Werkbankrezepte sind inzwischen bestanden. Eine dauerhafte Tierzucht, Endloswelt, Multiplayer oder Cloud-Synchronisierung wurden nicht begonnen.

## Stabilisierung nach vollständiger Regression

Der erste Gesamtlauf bestand 78/81 Browsertests. Die drei Fehler wurden einzeln untersucht: (1) Der Regionentest speicherte nach direkter Testpositionierung vor dem nächsten Simulationsschritt; er wartet jetzt auf echte aktive Spielzeit. (2) Fern-LOD lag mit 40.414 Dreiecken knapp über dem unveränderten 40.000-Budget; nicht sichtbare rückwärtige Ferngeometrie wird jetzt ausgespart (Nachprüfung: 39.078). (3) Zwei schnelle Bauaktionen trafen wegen verzögerten GPU-Chunkaufbaus dieselbe alte Fläche. Die neue Voxel-Strahlprüfung arbeitet direkt auf dem verbindlichen Weltzustand. Alle drei gezielten Wiederholungen bestanden; keine Budgetgrenze wurde erhöht.

Zusätzlicher frischer Survivalpfad ohne Vorrats-/Positionsinjektion: Holz an zwei erreichbaren Bäumen sammeln, Stein abbauen, Gartenblatt mit optionalem Vorlesen lesen, Bretter und Hacke im gleichen Werkbankmenü herstellen, Boden bearbeiten, Karotten pflanzen, speichern und neu laden. Bestanden in 57,8 Sekunden automatisierter Bedienung. Ein zunächst falscher Test zielte auf das Laub des alten dreiblöckigen Stamms; er wurde auf einen echten zweiten Baum korrigiert.

Alle **154 Logiktests in 23 Dateien**, TypeScript strict und Produktionsbuild bestanden am 14.11.2026. Die erneute vollständige Browserregression bestand **82/82 Fälle in 20,9 Minuten** auf dem unveränderten Build `index-BdAeCH9T.js`. Grundrezepte sind jetzt gemeinsam mit Möbeln erreichbar, kreative Vorräte korrekt mit ∞ gekennzeichnet und Höhlenfackeln auch bei Tageslicht aktiv. Ein zusätzlicher Brief erklärt den Unterschied zwischen altem Außenposten und größerer Siedlung. Grenztests sichern Haustierpositionen an hohen Baublöcken und die Bauplan-Metadaten am Welt-/Höhenrand.

## Konkrete iPhone-Abnahme

1. Vor dem Update in Safari **Menü → Einstellungen → Spielstand exportieren/importieren → Exportieren** nutzen. Dieselbe Pages-Adresse und denselben Browser behalten; keine Website-Daten löschen.
2. Nach Veröffentlichung normal neu laden. Die Startseite muss **v0.7.0** zeigen. Im Querformat laufen und zugleich rechts umsehen, beide Finger einzeln lösen. Menü darf sich dabei nicht öffnen.
3. **Menü → Kamera & Steuerung**: Third Person, größere Entfernung, an Baum/Wand herangehen und wieder zurück. Abstand muss zurückkehren; **Kamera zurücksetzen** muss weiter funktionieren.
4. Die sechs unteren Slots ausprobieren. Baum mit Axt abbauen, Stein mit Spitzhacke. **Werkbank** im Menü öffnen: Bretter und Hacke sind dort gemeinsam mit Möbeln erreichbar. Einen Block wählen, grüne Vorschau suchen, bauen, entfernen und rückgängig machen.
5. Ein kleines Buch auf der Startwiese anvisieren und **Lesen** nutzen. Text in Ruhe lesen oder ausdrücklich vorlesen lassen; Fenster selbst schließen. Im **Entdeckerbuch** erneut öffnen. Die Vorratsrechnung freiwillig mit Fehler und Hilfe ausprobieren.
6. Gartenblatt und sichtbares Beet suchen. Kürbis ernten, Samen im Garten wählen und pflanzen. Mit Hacke Gras bearbeiten und ein eigenes Feld anlegen. Während des Wachstums weiterspielen; die Uhr zählt weder im Menü noch bei geschlossener Seite.
7. Ohne Koordinatenhilfe nach Felsöffnung, Weg, Turm und Rauch suchen. Festhalten, ob Höhle und größere Schmiede tatsächlich auffallen und welche Hinweise verständlich sind. Falls sie nicht gefunden werden, ist das ein offener Designfehler, kein Versagen des Spielers.
8. Angel ausrüsten und einen vollständigen Fang spielen; anschließend eine Zombiebegegnung oder den friedlichen Modus prüfen. Schreibkampf mit Bildschirmtastatur öffnen/schließen.
9. Eigenen Block, Pflanze, Fundtext und gegebenenfalls Haustier speichern. Safari kurz verlassen, zurückkehren und neu laden. Alles muss erhalten bleiben. Abschließend eine neue Exportdatei sichern.
10. iPhone-Modell, iOS/Safari-Version, störende Überlagerungen, Kameraprobleme und subjektive Flüssigkeit nach etwa zehn Minuten notieren. Eine reale Smartphone-Framerate oder endgültige Abnahme wird hier nicht vorweggenommen.

## Abschließender lokaler Gesamtlauf

Am 14.11.2026 bestanden alle **82 Browsertests** in einem vollständigen Lauf mit einem Worker. Log: [final-browser.log](artifacts/v07/final-browser.log). Das umfasst alte Spielstände, reale Speicherquote, Export/Import, Mehrfingerbesitz und Abbruch, Browserwechsel, Third Person, Kamerakollision/Reset, WebGL-Wiederaufnahme, Bauen/Undo, Fischen/Drill, BOOM, Haustiere, Farming, Erz/Ofen, die bestehenden Missionen, Zombies, Schreibkämpfe und Pages-Assets. Nach wiederholtem Bau/Undo blieb die GPU-Zahl bei 54 Geometrien und vier Texturen. Die drei ursprünglichen Fehler traten nicht mehr auf.
