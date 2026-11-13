import { test, expect, type Page } from "@playwright/test";
import {shortcut} from "./ui-helper";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

test.use({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
  isMobile: true,
});
async function start(page: Page) {
  await page.goto("./");
  await page.locator("#play").tap();
}
test("P0: sichtbarer Fokusverlust während Bewegung öffnet keine manuelle Pause", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page);
  const r = (await page.locator("#joystick").boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, x: r.x + r.width / 2, y: r.y + 15 }],
  });
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event("blur"));
  });
  await expect(page.locator("#modal")).toBeHidden();
  await expect(page.locator("#interruption")).toBeHidden();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
});

async function saveState(page: Page) {
  await page.locator("#menu").tap();
  await page.locator("#save").tap();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  await page.locator("#resume").tap();
  return s;
}
async function surfaces(page: Page) {
  const j = (await page.locator("#joystick").boundingBox())!,
    l = (await page.locator("#look").boundingBox())!;
  return {
    joy: { id: 1, x: j.x + j.width / 2, y: j.y + 15 },
    look: { id: 2, x: l.x + l.width * 0.25, y: l.y + l.height * 0.4 },
  };
}
async function noPause(page: Page) {
  await expect(page.locator("#modal")).toBeHidden();
  await expect(page.locator("#interruption")).toBeHidden();
}

test("Bewegung, Kamera, beide Finger gleichzeitig und unabhängiges Loslassen", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page),
    p = await surfaces(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy],
  });
  await page.waitForTimeout(400);
  await noPause(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look],
  });
  p.look.x += 45;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [p.joy, p.look],
  });
  await page.waitForTimeout(300);
  await noPause(page);
  // Right finger goes up, left keeps moving.
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [p.look],
  });
  await expect(page.locator("#stick")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.waitForTimeout(300);
  // Re-add right, release left, right keeps turning.
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [p.joy],
  });
  await expect(page.locator("#stick")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  p.look.x += 35;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [p.look],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await noPause(page);
  const s = await saveState(page);
  expect(s.position[2]).toBeLessThan(15);
  expect(s.yaw).toBeLessThan(-0.15);
});

test("Kamerabewegung allein und 20 schnelle Touchfolgen öffnen kein Menü", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page),
    p = await surfaces(page);
  for (let i = 0; i < 20; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [p.look],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...p.look, x: p.look.x + 10 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await noPause(page);
  const s = await saveState(page);
  expect(s.yaw).toBeLessThan(-0.5);
  expect(s.position[2]).toBeCloseTo(17, 1);
});

for (const kind of ["pointercancel", "lostpointercapture", "touchcancel"])
  test(`${kind}: keine hängende Bewegung, nächster Kontakt funktioniert`, async ({
    page,
  }) => {
    await start(page);
    await page.dispatchEvent("#joystick", "pointerdown", {
      pointerId: 91,
      pointerType: "touch",
      clientX: 66,
      clientY: 290,
    });
    await page.dispatchEvent("#joystick", kind, {
      pointerId: 91,
      pointerType: "touch",
      touches: [],
      changedTouches: [],
    });
    await expect(page.locator("#stick")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    );
    await noPause(page);
    await page.locator("#menu").tap();
    await expect(page.locator("#resume")).toBeVisible();
    await page.locator("#resume").tap();
    await noPause(page);
  });

test("Echter Touchcancel bei zwei Kontakten endet ohne Pause", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page),
    p = await surfaces(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(page.locator("#stick")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await noPause(page);
});

test("Manuelle Pause nur per Tippen; Ziehen von Kamera oder Menü aktiviert kein Menü", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page),
    p = await surfaces(page),
    m = (await page.locator("#menu").boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.look],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...p.look, x: m.x + 20, y: m.y + 20 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await noPause(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 3, x: m.x + 20, y: m.y + 20 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 3, x: m.x - 60, y: m.y + 80 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await noPause(page);
  for (let i = 0; i < 3; i++) {
    await page.locator("#menu").tap();
    await expect(page.locator("h2")).toHaveText("Dein Abenteuer");
    await page.locator("#resume").tap();
    await noPause(page);
  }
});

test("Hintergrund unterbricht getrennt, sichtbares Blur bewahrt aktive Daumen", async ({
  page,
  context,
}) => {
  await start(page);
  const cdp = await context.newCDPSession(page),
    p = await surfaces(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look],
  });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await noPause(page);
  await expect(page.locator("#stick")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#modal")).toBeHidden();
  await expect(page.locator("#interruption")).toBeVisible();
  await expect(page.locator("#stick")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.locator("#continue").tap();
  await noPause(page);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(page.locator("#interruption")).toBeVisible();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#continue").tap();
  await noPause(page);
});

test("Altspielstand, Reload und Landschaft: Inventar, Mission, Baublöcke erhalten", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(() =>
    localStorage.setItem(
      "blockboom.save",
      JSON.stringify({
        version: 1,
        position: [0, 1.01, 17],
        yaw: 0.2,
        pitch: -0.1,
        changes: { "1,1,7": "Glas" },
        fish: { Rotauge: 2, Flussbarsch: 3, Hecht: 1 },
        progress: {
          completedMissions: ["first-perch"],
          repetitions: 1,
          successfulAnswers: 1,
          voluntaryHints: 1,
        },
        missionActive: false,
        settings: { sound: false, quality: 1 },
      }),
    ),
  );
  await page.reload();
  await page.locator("#play").tap();
  await shortcut(page,"bag");
  await expect(page.locator(".fish-list strong").nth(1)).toHaveText("3");
  await page.locator("#close").tap();
  await page.reload();
  await page.locator("#play").tap();
  const s = await saveState(page);
  expect(s.changes["1,1,7"]).toBe("Glas");
  expect(s.progress.completedMissions).toEqual(["first-perch"]);
  expect(s.settings.quality).toBe(1);
  const rects = await page
    .locator("#joystick,#mobile-quickbar,#mobile-actions")
    .evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }),
    );
  expect(
    rects.every(
      (r) => r.x >= 0 && r.y >= 0 && r.right <= 844 && r.bottom <= 390,
    ),
  ).toBe(true);
  await expect(page.locator("#rotate-tip")).toBeHidden();
  await page.screenshot({ path: "artifacts/pages/rescue-landscape.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#rotate-tip")).toBeVisible();
  await expect(page.locator("#menu")).toBeInViewport();
  await noPause(page);
});

test("Joystick startet auch auf dem Knopf; Browserleisten-Resize erhält Kontakte", async ({
  page,
  context,
}) => {
  await start(page);
  const d = await context.newCDPSession(page),
    j = (await page.locator("#joystick").boundingBox())!,
    p = await surfaces(page);
  const center = { id: 1, x: j.x + j.width / 2, y: j.y + j.height / 2 };
  await d.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [center],
  });
  await d.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...center, y: center.y - 30 }],
  });
  await expect(page.locator("#stick")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(page.locator("#stick")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await page.waitForTimeout(500);
  await d.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await noPause(page);
  const s = await saveState(page);
  expect(s.position[2]).toBeLessThan(16);
});

test("Dritter Finger auf dem Joystick ersetzt und beendet keinen aktiven Daumen", async ({
  page,
  context,
}) => {
  await start(page);
  const d = await context.newCDPSession(page),
    p = await surfaces(page),
    r = (await page.locator("#joystick").boundingBox())!;
  const extra = { id: 3, x: r.x + 12, y: r.y + r.height / 2 };
  await d.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look],
  });
  await d.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [p.joy, p.look, extra],
  });
  await d.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [extra],
  });
  await expect(page.locator("#stick")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  p.look.x += 40;
  await d.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [p.joy, p.look],
  });
  await page.waitForTimeout(350);
  await d.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await noPause(page);
  const s = await saveState(page);
  expect(s.yaw).toBeLessThan(-0.1);
  expect(s.position[2]).toBeLessThan(16.5);
});
