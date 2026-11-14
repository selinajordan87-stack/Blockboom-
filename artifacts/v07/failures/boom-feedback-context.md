# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game.spec.ts >> BOOM zerstört und setzt zurück
- Location: e2e/game.spec.ts:105:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#toast')
Expected substring: "BOOOM"
Received string:    "Entdeckt: Wiesenland"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#toast') with timeout 5000ms
  - waiting for locator('#toast')
    12 × locator resolved to <div id="toast" role="status" class="visible">Entdeckt: Wiesenland</div>
       - unexpected value "Entdeckt: Wiesenland"
    2 × locator resolved to <div class="" id="toast" role="status">Entdeckt: Wiesenland</div>
      - unexpected value "Entdeckt: Wiesenland"

```

```yaml
- status: "Entdeckt: Wiesenland"
```

# Test source

```ts
  8   |   yaw,
  9   |   pitch,
  10  |   changes: {},
  11  |   fish: { Rotauge: 0, Flussbarsch: 0, Hecht: 0 },
  12  |   progress: {
  13  |     completedMissions: [],
  14  |     repetitions: 0,
  15  |     successfulAnswers: 0,
  16  |     voluntaryHints: 0,
  17  |   },
  18  |   missionActive: false,
  19  |   settings: { sound: false, quality: 1 },
  20  | });
  21  | async function seed(page: any, s: any) {
  22  |   await page.goto("./");
  23  |   await page.evaluate(
  24  |     (s: any) => localStorage.setItem("blockboom.save", JSON.stringify(s)),
  25  |     s,
  26  |   );
  27  |   await page.reload();
  28  |   await page.locator("#play").click();
  29  | }
  30  | async function getSave(page: any) {
  31  |   await page.keyboard.press("Escape");
  32  |   await page.locator("#save").click();
  33  |   const s = await page.evaluate(() =>
  34  |     JSON.parse(localStorage.getItem("blockboom.save")!),
  35  |   );
  36  |   await page.locator("#resume").click();
  37  |   await page.waitForTimeout(100);
  38  |   return s;
  39  | }
  40  | test("Desktop: Start, Bewegung, Kamera, Bauen und dauerhafter Spielstand", async ({
  41  |   page,
  42  | }) => {
  43  |   const errors: string[] = [];
  44  |   page.on("pageerror", (e) => errors.push(e.message));
  45  |   await page.setViewportSize({ width: 1280, height: 800 });
  46  |   await page.goto("./");
  47  |   await expect(page.locator("h1")).toContainText("BLOCK");
  48  |   await page.screenshot({ path: `${artifactDir}/start-desktop.png` });
  49  |   await page.locator("#play").click();
  50  |   await page.keyboard.down("KeyW");
  51  |   await page.waitForTimeout(500);
  52  |   await page.keyboard.up("KeyW");
  53  |   let s = await getSave(page);
  54  |   expect(s.position[2]).toBeLessThan(16.5);
  55  |   expect(s.position[1]).toBeGreaterThan(0.9);
  56  |   // Headless Chrome may reject pointer lock: drag fallback must still rotate.
  57  |   await page.locator("canvas").click({ position: { x: 700, y: 350 } });
  58  |   await page.mouse.move(740, 360);
  59  |   await page.keyboard.press("Escape");
  60  |   if (await page.locator("#resume").isVisible())
  61  |     await page.locator("#resume").click();
  62  |   await seed(page, blank([1, 1.01, 9], 0, -0.65));
  63  |   await page.waitForTimeout(250);
  64  |   await page.keyboard.press("Equal");
  65  |   await page.waitForTimeout(100);
  66  |   s = await getSave(page);
  67  |   expect(Object.values(s.changes)).toContain("Gras");
  68  |   const k = Object.keys(s.changes).find((k) => s.changes[k] === "Gras")!;
  69  |   await page.reload();
  70  |   await page.locator("#play").click();
  71  |   s = await getSave(page);
  72  |   expect(s.changes[k]).toBe("Gras");
  73  |   await page.keyboard.press("Minus");
  74  |   s = await getSave(page);
  75  |   expect(s.changes[k]).toBeNull();
  76  |   await page.screenshot({ path: `${artifactDir}/game-desktop.png` });
  77  |   expect(errors).toEqual([]);
  78  | });
  79  | test("Angeln, freiwillige Mission, Sammlung und Neuladen", async ({ page }) => {
  80  |   await seed(page, blank([-11, 2.01, 2], 0, -0.2));
  81  |   await page.locator("#interact").click();
  82  |   await expect(page.locator(".mission-text")).toHaveText(
  83  |     "„Fange einen Barsch.“",
  84  |   );
  85  |   await page.locator("#accept").click();
  86  |   await landFish(page, "keep", `${artifactDir}/fishing-landing.png`);
  87  |   await expect(page.locator("#toast")).toContainText("Auftrag geschafft");
  88  |   await shortcut(page,"bag");
  89  |   await expect(page.locator(".fish-list")).toContainText("Flussbarsch");
  90  |   await page.screenshot({ path: `${artifactDir}/fish-collection.png` });
  91  |   await page.locator('[data-fish-preview="Flussbarsch"]').click();
  92  |   await expect(page.locator("#panel-tag")).toHaveText("3D-FANGBUCH");
  93  |   await page.screenshot({ path: `${artifactDir}/catchbook-3d.png` });
  94  |   await page.locator("#back-catchbook").click();
  95  |   await page.locator("#close").click();
  96  |   const s = await getSave(page);
  97  |   expect(s.fish.Flussbarsch).toBe(1);
  98  |   expect(s.progress.completedMissions).toEqual(["first-perch"]);
  99  |   await page.reload();
  100 |   await page.locator("#play").click();
  101 |   await expect(page.locator("#mission-pin")).toBeHidden();
  102 |   await shortcut(page,"bag");
  103 |   await expect(page.locator(".fish-list strong").nth(1)).toHaveText("1");
  104 | });
  105 | test("BOOM zerstört und setzt zurück", async ({ page }) => {
  106 |   await seed(page, blank([14, 1.01, 17], 0, -0.15));
  107 |   await page.locator("#interact").click();
> 108 |   await expect(page.locator("#toast")).toContainText("BOOOM");
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  109 |   let s = await getSave(page);
  110 |   expect(s.changes["12,1,9"]).toBeNull();
  111 |   await shortcut(page,"reset-boom");
  112 |   s = await getSave(page);
  113 |   expect(s.changes["12,1,9"]).toBe("Boom");
  114 | });
  115 | for (const width of [360, 390, 430])
  116 |   test(`Touch ${width}px: Start, Joystick, Kamera, Inventar und Menü`, async ({
  117 |     browser,
  118 |   }) => {
  119 |     const context = await browser.newContext({
  120 |       viewport: { width, height: 800 },
  121 |       isMobile: true,
  122 |       hasTouch: true,
  123 |     });
  124 |     const page = await context.newPage();
  125 |     const errors: string[] = [];
  126 |     page.on("pageerror", (e) => errors.push(e.message));
  127 |     await page.goto("./");
  128 |     await expect(page.locator("#play")).toBeInViewport();
  129 |     await page.locator("#play").tap();
  130 |     await page.waitForTimeout(150);
  131 |     const joystick = page.locator("#joystick");
  132 |     await expect(joystick).toBeVisible();
  133 |     const box = (await joystick.boundingBox())!;
  134 |     const cdp = await context.newCDPSession(page);
  135 |     await cdp.send("Input.dispatchTouchEvent", {
  136 |       type: "touchStart",
  137 |       touchPoints: [{ x: box.x + 55, y: box.y + 15 }],
  138 |     });
  139 |     await page.waitForTimeout(450);
  140 |     await cdp.send("Input.dispatchTouchEvent", {
  141 |       type: "touchEnd",
  142 |       touchPoints: [],
  143 |     });
  144 |     await cdp.send("Input.dispatchTouchEvent", {
  145 |       type: "touchStart",
  146 |       touchPoints: [{ x: 250, y: 350 }],
  147 |     });
  148 |     await cdp.send("Input.dispatchTouchEvent", {
  149 |       type: "touchMove",
  150 |       touchPoints: [{ x: 280, y: 350 }],
  151 |     });
  152 |     await cdp.send("Input.dispatchTouchEvent", {
  153 |       type: "touchEnd",
  154 |       touchPoints: [],
  155 |     });
  156 |     await page.locator("#menu").tap();
  157 |     await page.locator("#save").tap();
  158 |     const s = await page.evaluate(() =>
  159 |       JSON.parse(localStorage.getItem("blockboom.save")!),
  160 |     );
  161 |     expect(s.position[2]).toBeLessThan(17);
  162 |     expect(s.yaw).toBeLessThan(0);
  163 |     await page.locator("#resume").tap();
  164 |     await shortcut(page,"bag");
  165 |     await expect(page.locator("h2")).toHaveText("Deine Sammlung");
  166 |     await page.locator("#close").tap();
  167 |     expect(
  168 |       await page.evaluate(
  169 |         () => document.documentElement.scrollWidth <= innerWidth,
  170 |       ),
  171 |     ).toBe(true);
  172 |     await page.screenshot({ path: `${artifactDir}/mobile-${width}.png` });
  173 |     expect(errors).toEqual([]);
  174 |     await context.close();
  175 |   });
  176 | test("Touch: Blöcke setzen/entfernen, Barsch fangen und BOOM zurücksetzen", async ({
  177 |   browser,
  178 | }) => {
  179 |   const context = await browser.newContext({
  180 |     viewport: { width: 390, height: 844 },
  181 |     isMobile: true,
  182 |     hasTouch: true,
  183 |   });
  184 |   const page = await context.newPage();
  185 |   const errors: string[] = [];
  186 |   page.on("pageerror", (e) => errors.push(e.message));
  187 |   await seed(page, blank([1, 1.01, 9], 0, -0.65));
  188 |   await page.locator("#place").tap();
  189 |   await page.locator("#menu").tap();
  190 |   let s = await page.evaluate(() =>
  191 |     JSON.parse(localStorage.getItem("blockboom.save")!),
  192 |   );
  193 |   const k = Object.keys(s.changes).find((k) => s.changes[k] === "Gras")!;
  194 |   expect(k).toBeTruthy();
  195 |   await page.locator("#resume").tap();
  196 |   await page.locator("#break").tap();
  197 |   await page.locator("#menu").tap();
  198 |   s = await page.evaluate(() =>
  199 |     JSON.parse(localStorage.getItem("blockboom.save")!),
  200 |   );
  201 |   expect(s.changes[k]).toBeNull();
  202 |   await seed(page, blank([-11, 2.01, 2], 0, -0.2));
  203 |   await page.locator("#interact").tap();
  204 |   await page.locator("#accept").tap();
  205 |   await landFish(page);
  206 |   await expect(page.locator("#toast")).toContainText("Auftrag geschafft");
  207 |   await seed(page, blank([14, 1.01, 17], 0, -0.15));
  208 |   await page.locator("#interact").tap();
```