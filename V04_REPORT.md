# BLOCKBOOM v0.4 – Fishing Adventure

Stand: Entwicklungsbranch `feature/v04-fishing-adventure`

## Phase 1 – Audit und Sicherheitsgrenzen

- Ausgangspunkt: `main` und `origin/main` sauber auf `bf258390934094354b0d57da567c3aa6292dfbe4`.
- Veröffentlichung v0.3: GitHub-Pages-Workflow `43277665209` erfolgreich; Live-Seite HTTP 200 mit Bundle `index-C8K7tUZZ.js`, sichtbare Version v0.3.0.
- Baseline vor Änderungen: TypeScript strict bestanden, 37/37 Vitest-Fälle bestanden, Produktionsbuild bestanden, 36/36 Browserfälle gegen `dist` unter `/Blockboom-/` bestanden.
- Vorhandener Angelkern: fünf sichtbare Arten mit je drei Instanzen, ein realer Ziel-Fisch schwimmt zum festen Schwimmer, Zustände `idle/waiting/bite`, unmittelbarer Fang nach Reaktion. Es gibt noch keine Ausrüstungsauswirkung, Kraftaufladung, Flugphase, Drill, Schnurspannung, Fangentscheidung oder Regelprüfung.
- Rendering: Fischdarstellung nutzt vor v0.4 zwanzig InstancedMeshes (vier Teile × fünf Arten). Rutendarstellung ist ein einfaches Kameramodell; Schwimmer und Rute besitzen noch keine sichtbare Schnur oder zustandsabhängige Biegung.
- Speicherung: Hauptschlüssel `blockboom.save`, Schema `version: 1`, additive `extension.version: 1`; Lernprofil separat unter `blockboom.learning.v1`. Diese Schlüssel und Versionen bleiben erhalten.
- Editionskarten 1–3 und alle gespeicherten Welt-Deltas bleiben lesbar. Neue Gewässer werden als kompatible Basiskartenerweiterung vor den gespeicherten Deltas aufgebaut, sodass ausdrücklich gespeicherte Platzierungen/Entfernungen Vorrang behalten.

### Gewählte Architektur

1. Eine reine, testbare `AnglingEngine` verwaltet Aufladen, Flug, Warten, Biss, Drill, Flucht und Anlanden unabhängig von DOM/Three.js.
2. Ausrüstung, Fischwissen, simulierte Regeln und Angelplätze liegen datengetrieben in eigenen Modulen.
3. Die Fischansicht wird auf wenige gemeinsame InstancedMeshes mit anatomisch lesbaren Körperteilen umgestellt, statt pro Art weitere Draw Calls zu vervielfachen.
4. Schnur, Schwimmer und Landemodell werden in einer gekapselten Three.js-Ansicht aktualisiert; kein zweiter WebGL-Kontext.
5. Angelprogress wird additiv in der bestehenden Extension gespeichert. Alte Fangprotokolle bleiben gültig; neue Felder sind optional und werden begrenzt validiert.
6. Vier Gewässer liegen innerhalb der bestehenden endlichen Welt. Gespeicherte Änderungen werden danach angewendet und nicht überschrieben.

### Risiken

- Ein kompletter realistischer Angelsimulator wäre für Smartphone und Zielgruppe zu komplex. Der Drill bildet Spannung, Widerstand, Einholfortschritt, Schnurbruch und Flucht abstrahiert, aber nachvollziehbar ab.
- Bundesland- und gewässerspezifische reale Vorschriften können nicht statisch korrekt abgebildet werden. Regeln werden ausdrücklich als simulierte Lernwerte gekennzeichnet und ersetzen weder Erlaubnisschein noch Unterweisung.
- Zusätzliche Fischarten/Orte dürfen Draw Calls und aktive Population nicht linear explodieren. Population und Partikel bleiben fest begrenzt.
- Reale iPhone-/Android-Performance und Bediengefühl bleiben eine gesonderte Geräteabnahme; Browseremulation beweist keine 30 FPS auf Hardware.

Weitere Abschnitte werden nach den Implementierungsphasen ergänzt.
