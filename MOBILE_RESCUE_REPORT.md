# BLOCKBOOM v0.1.1 – Mobile Rescue

## Nachgewiesener Fehler und Grenzen der Aussage

Im bisherigen Stand `6946d9f` rief der globale `window.blur`-Listener während des Spiels unmittelbar `menu()` auf. Ein sichtbarer Fokusverlust und ein tatsächlich verstecktes Dokument wurden dadurch gleich behandelt. Der neue P0-Browsertest löste bei sichtbarem Dokument während einer Joystickbewegung fünf Blur-Ereignisse aus: **vor der Änderung sichtbar geöffnetes Pausenmenü, nach der Änderung kein Menü**. Das ist ein reproduzierbarer Fehlerpfad, keine Vermutung anhand des Gerätenamens.

Es liegt weiterhin kein Ereignismitschnitt des betroffenen echten iPhones vor. Welche Browser-/Systemaktion dort die Fokusereignisse im gemeldeten Abstand auslöst, ist noch nicht nachgewiesen. Deshalb ist dies die Behebung des belegten Codefehlers mit automatisierter Absicherung; die endgültige Bestätigung muss am iPhone erfolgen.

Weitere geprüfte Stellen: Die alten Controller überschrieben ihren Fingerbesitzer bei jedem Kontakt und setzten sich bei jedem Pointer-Ende zurück. Capture-Verlust wurde nicht behandelt. Die Listener wurden einmalig registriert, nicht in der Animationsschleife. Es gab keinen delegierten HUD-Handler, der Touchbewegungen direkt zum Menü weiterleitete.

## Lösung und geänderte Dateien

- `src/core/Lifecycle.ts`: sichtbares Blur stoppt nur Tastatur/Maus, öffnet kein Menü und verwirft aktive Daumen nicht. `visibilitychange` bei verborgenem Dokument und `pagehide` sichern und unterbrechen getrennt vom manuellen Menü. Nach Rückkehr gibt es eine kleine explizite „Weiter“-Anzeige. WebGL-Kontextverlust wird als eigener Unterbrechungszustand behandelt.
- `src/player/TouchControls.ts`: genau ein Besitzer je Steuerfläche, unabhängiges Loslassen, Pointercancel und Capture-Verlust; zusätzlicher Touchcancel-Fallback nur für die betroffene Fläche. Fremde Kontakte ersetzen den Besitzer nicht. Capture-Verlust von untergeordneten Elementen beendet nicht versehentlich den Controller. Kamera begrenzt extreme Einzeldeltas; Joystick hat eine kleine tote Mitte und proportionale Auslenkung.
- `src/main.ts`: verbindet Controller und Lifecycle, schützt Touchaktionen durch passenden Anfang/Ende am Button. Aktivierung erfolgt erst im abschließenden nativen Klick. Eine Zwischenimplementierung mit Aktivierung bei Pointerup ließ einen Folgeklick in ein neu geöffnetes Angelmenü geraten und scheiterte am vorhandenen vollständigen Touch-Spieltest; das ist korrigiert. Manuelles Menü nur durch Menüknopf/ESC. Browserleisten-Resize behält Kontakte, ein Orientierungswechsel setzt sie kontrolliert zurück.
- `src/ui/style.css`: Safe Areas an Header, Joystick, Aktionen, Hotbar und Panels; mehr Abstand, kompakteres Querformat, scrollbares Pausenmenü. Hochformat erhält eine nicht blockierende Drehempfehlung. Kein erzwungener Orientierungs-Lock. Steuerflächen verhindern Scrollen, Zoom, Auswahl und Touch-Callout.
- `src/tests/input.test.ts`, `src/tests/rendering.test.ts`, `e2e/mobile-rescue.spec.ts`: neue Regressionen. `e2e/pages.spec.ts`: Assetprüfung über denselben Browser-Netzwerkpfad wie das Spiel, damit die Cloud-Umgebung nicht an direkten API-Client-Verbindungen scheitert.
- `package.json`, `package-lock.json`: App-Version 0.1.1, keine neue Produktabhängigkeit. README/REPORT: Verweis auf diesen Bericht.

Welt, Physik, Baumaterialien, Angeln, BOOM, Lernmission sowie Save-Schlüssel `blockboom.save` und Save-Schema v1 bleiben erhalten. Der Browserfall lädt ausdrücklich einen alten Save mit Glasblock, Fischsammlung und abgeschlossenem Auftrag und kontrolliert ihn nach Neuladen. Vite verwendet bereits korrekt **`/Blockboom-/`**; die alte Schreibweise `/blockboom/` wäre auf dem tatsächlichen Pages-Pfad falsch und wird nicht verwendet.

## Performance

Die Welt enthält in der Startkarte 16 zusammengefasste Weltmeshes. Der Test kontrolliert begrenzte Geometriezahl, Wiederverwendung bei unveränderter Revision und Entsorgung alter Geometrien nach Änderungen. Eine CPU-Stichprobe in dieser Umgebung ergab etwa 33 ms für den kalten Aufbau und 0,46 ms je Zielsuche (100 Wiederholungen); dies sind keine Android-/iPhone-Messungen.

Die Zielsuche wurde von jedem Renderbild auf höchstens 20 Aktualisierungen pro Sekunde begrenzt. Bauaktionen prüfen weiterhin synchron ein frisches Ziel. Der Renderloop pausiert im Hintergrund und bei offenen Menüs/Unterbrechungen; Viewportänderungen dürfen ein einzelnes Bild erneuern. Die adaptive Auflösung verwendet echte Framezeiten und wird durch Browserleisten-Resize nicht wieder auf die teurere Ausgangsauflösung gesetzt. Schatten, Texturqualität und Sichtweite wurden nicht verschlechtert. Partikel bleiben auf 48 begrenzt. Ein kompletter Neuaufbau aller Weltmeshes nach einer Blockänderung bleibt als begrenzter v0.1.1-Kompromiss bestehen.

Zusätzliche Chromium-Software-WebGL-Stichprobe im Querformat mit DPR 2: 27 Draw Calls in der aktiven Startansicht, 71–76 in drei BOOM-Stichproben mit je 48 Partikeln. Nach Ende der Effekte wieder 0 Partikel; GPU-Geometrien (21) und Texturen (3) blieben über die Zyklen stabil. Die Diagnostik aktualisierte sich bei geöffneter Pause über 1,3 Sekunden nicht; der Renderloop blieb stehen. Die adaptive Auflösung reduzierte die Pixelratio während der Software-Rendering-Probe von 1,5 auf 1,25. Das ist kein Nachweis gegen sämtliche Speicherlecks oder für eine Smartphone-Framerate.

Optional `?diagnostics=1`: lokale Grafikzahlen sind als JSON in `document.querySelector('#world').dataset.performance` abrufbar, ohne sichtbares Overlay oder Übertragung. Das dient der Abnahme (Draw Calls, Dreiecke, GPU-Geometrien/-Texturen, Auflösung, Partikel, Renderbilder, Zielabfragen), ist keine Telemetrie.

## Tests und Ergebnis

- TypeScript strict und Produktionsbuild: bestanden.
- Vitest: **21/21 bestanden**; bisherige Logik plus Fingerbesitz, Abbruch, Listener-Lifecycle, Klickschutz und Geometrie-Freigabe.
- P0-Test auf dem alten Build: **wie erwartet fehlgeschlagen**, weil das Menü bei sichtbarem Blur erschien. Derselbe Test auf dem Fix: bestanden.
- Abschließender Chromium-Lauf unter dem echten Produktions-Unterpfad auf einem einfachen statischen Server: **19/19 bestanden** (ca. 1,4 Minuten), danach die zusätzliche echte Drei-Finger-Prüfung und Pages-/Versionsprüfung ebenfalls separat bestanden (2/2). Der vollständige Bestand umfasst damit 20 Browserfälle. Enthalten sind alle bisherigen Kernfunktionen und Fälle für Bewegungen, Kameradrehung, zwei Kontakte, getrenntes Loslassen, Zusatzfinger, Touchcancel/Pointercancel/Capture-Verlust, schnelle Aktionen, manuelle Pause, kontrollierte Fokus-/Visibility-/Pagehide-Ereignisse, Save-Neuladen und Querformat.
- Der Mehrfinger-Test wurde anhand protokollierter Pointerereignisse korrigiert: CDP `touchEnd` benennt die beendeten Kontakte. Der anfängliche Test beendete irrtümlich den Joystickkontakt, obwohl er den Kamerafinger prüfen sollte. Die korrigierte Prüfung besteht.
- WebKit 27.2 wurde heruntergeladen; ein Start ist hier wegen fehlender GTK4-/Graphene-/Harfbuzz-ICU-/Manette-/Hyphen-/GLES-Bibliotheken nicht möglich. Es gibt hier weder den vorgesehenen Systempaket-Helfer noch sudo. **Kein erfolgreicher WebKit-, Safari- oder echter iPhone-Test wird behauptet.**

## Konkrete iPhone-Abnahme

1. https://selinajordan87-stack.github.io/Blockboom-/ in Safari öffnen und neu laden. Im Startbildschirm muss **v0.1.1** stehen. Website-Daten nicht löschen; der vorhandene Spielstand soll erhalten bleiben.
2. Ins Querformat drehen. Mindestens drei Minuten mit links gehaltenem Joystick laufen und gleichzeitig rechts umsehen. Beide Finger abwechselnd einzeln loslassen und erneut aufsetzen. Auch auf der Joystickmitte beginnen. **Es darf kein „Kleine Pause“-Menü erscheinen.**
3. Mit einem dritten Finger kurz eine Steuerfläche berühren. Schnell wiederholt laufen, schauen, springen und Blöcke wählen. Kamera-Drags bis in die Nähe des Menüknopfes testen. Kein versehentliches Menü und keine weiterlaufende Figur nach Abbruch/Loslassen.
4. Menü bewusst antippen, schließen, Inventar öffnen/schließen und in beiden Ausrichtungen scrollen. Auf freien Abstand zu Notch, Dynamic Island und Home-Indikator achten. Die Drehempfehlung im Hochformat darf nichts blockieren.
5. Safari kurz verlassen (Home/App-Wechsel) und zurückkehren. Erwartet wird **die separate Unterbrechungsanzeige**, kein automatisch geöffnetes „Kleine Pause“-Menü. Nach „Weiter“ neue Daumenkontakte benutzen; keine hängende Bewegung.
6. Blöcke setzen/entfernen, einen Fisch fangen, freiwillige Mission prüfen, BOOM und Aufbau benutzen. Speichern und neu laden; Weltänderungen, Fische und Auftrag vergleichen.
7. Zehn Minuten spielen; Erwärmung, Bildrate und Abbrüche notieren. Bei Bedarf Grafik „sparsam“ vergleichen. Bitte Modell, iOS-Version, Safari-/Startbildschirm-Modus und genaue auslösende Aktion melden, falls ein Fehler bleibt.

Automatisierte Tests ersetzen diesen Test nicht. Insbesondere echte Systemgesten, Browserleisten, Safe Areas, GPU-Kontextverluste und die gemeldete iPhone-Ereignisfolge bleiben Geräte-Risiken. Es wird keine erreichte Smartphone-Framerate behauptet.
