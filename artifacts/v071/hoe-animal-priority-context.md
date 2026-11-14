# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: living-v06.spec.ts >> Hacke, Aussaat, gespeichertes Wachstum und Ernte funktionieren auf Touch
- Location: e2e/living-v06.spec.ts:39:1

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - generic:
    - generic "BLOCKBOOM 3D-Spielwelt" [ref=f1e1]
    - generic:
      - banner:
        - generic:
          - button "Kamera ändern" [ref=f1e2] [cursor=pointer]:
            - generic [ref=f1e6]: Kamera
          - button "Menü öffnen" [ref=f1e7] [cursor=pointer]: ☰
      - generic: N · 1/7
      - generic:
        - generic: ☀ Mittag☀
        - generic: ♥ ∞
        - generic: ◉ 100
      - generic: +
      - generic: Huhn · 16 LP
      - status: Acker vorbereitet. Wähle Samen im Gartenmenü und pflanze mit Benutzen.
      - generic "Zum Umsehen wischen" [ref=f1e8]
      - text: ⚒ Hacke
    - article [ref=f1e10]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: TIERBEGEGNUNG
        - button "Schließen" [ref=f1e13] [cursor=pointer]: ✕
      - generic [ref=f1e14]:
        - heading "Huhn" [level=2] [ref=f1e15]
        - paragraph [ref=f1e16]: Vertrauen wächst durch passendes Futter. · Vertrauen 0/2 · Sättigung 75%
        - paragraph [ref=f1e17]: Mag Ernte oder Beeren.
        - generic [ref=f1e18]:
          - button "Füttern" [ref=f1e19] [cursor=pointer]
          - button "Streicheln" [ref=f1e20] [cursor=pointer]
        - status
```
