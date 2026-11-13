import { test, expect } from "@playwright/test";
import { landFish } from "./fishing-helper";
import {shortcut} from "./ui-helper";
const artifactDir = process.env.BLOCKBOOM_ARTIFACT_DIR || "artifacts";
const blank = (position = [0, 1.01, 17], yaw = 0, pitch = 0) => ({
  version: 1,
  position,
  yaw,
  pitch,
  changes: {},
  fish: { Rotauge: 0, Flussbarsch: 0, Hecht: 0 },
  progress: {
    completedMissions: [],
    repetitions: 0,
    successfulAnswers: 0,
    voluntaryHints: 0,
  },
  missionActive: false,
  settings: { sound: false, quality: 1 },
});
async function seed(page: any, s: any) {
  await page.goto("./");
  await page.evaluate(
    (s: any) => localStorage.setItem("blockboom.save", JSON.stringify(s)),
    s,
  );
  await page.reload();
  await page.locator("#play").click();
}
async function getSave(page: any) {
  await page.keyboard.press("Escape");
  await page.locator("#save").click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  await page.locator("#resume").click();
  await page.waitForTimeout(100);
  return s;
}
test("Desktop: Start, Bewegung, Kamera, Bauen und dauerhafter Spielstand", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("./");
  await expect(page.locator("h1")).toContainText("BLOCK");
  await page.screenshot({ path: `${artifactDir}/start-desktop.png` });
  await page.locator("#play").click();
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");
  let s = await getSave(page);
  expect(s.position[2]).toBeLessThan(16.5);
  expect(s.position[1]).toBeGreaterThan(0.9);
  // Headless Chrome may reject pointer lock: drag fallback must still rotate.
  await page.locator("canvas").click({ position: { x: 700, y: 350 } });
  await page.mouse.move(740, 360);
  await page.keyboard.press("Escape");
  if (await page.locator("#resume").isVisible())
    await page.locator("#resume").click();
  await seed(page, blank([1, 1.01, 9], 0, -0.65));
  await page.waitForTimeout(250);
  await page.keyboard.press("Equal");
  await page.waitForTimeout(100);
  s = await getSave(page);
  expect(Object.values(s.changes)).toContain("Gras");
  const k = Object.keys(s.changes).find((k) => s.changes[k] === "Gras")!;
  await page.reload();
  await page.locator("#play").click();
  s = await getSave(page);
  expect(s.changes[k]).toBe("Gras");
  await page.keyboard.press("Minus");
  s = await getSave(page);
  expect(s.changes[k]).toBeNull();
  await page.screenshot({ path: `${artifactDir}/game-desktop.png` });
  expect(errors).toEqual([]);
});
test("Angeln, freiwillige Mission, Sammlung und Neuladen", async ({ page }) => {
  await seed(page, blank([-11, 2.01, 2], 0, -0.2));
  await page.locator("#interact").click();
  await expect(page.locator(".mission-text")).toHaveText(
    "„Fange einen Barsch.“",
  );
  await page.locator("#accept").click();
  await landFish(page, "keep", `${artifactDir}/fishing-landing.png`);
  await expect(page.locator("#toast")).toContainText("Auftrag geschafft");
  await shortcut(page,"bag");
  await expect(page.locator(".fish-list")).toContainText("Flussbarsch");
  await page.screenshot({ path: `${artifactDir}/fish-collection.png` });
  await page.locator('[data-fish-preview="Flussbarsch"]').click();
  await expect(page.locator("#panel-tag")).toHaveText("3D-FANGBUCH");
  await page.screenshot({ path: `${artifactDir}/catchbook-3d.png` });
  await page.locator("#back-catchbook").click();
  await page.locator("#close").click();
  const s = await getSave(page);
  expect(s.fish.Flussbarsch).toBe(1);
  expect(s.progress.completedMissions).toEqual(["first-perch"]);
  await page.reload();
  await page.locator("#play").click();
  await expect(page.locator("#mission-pin")).toBeHidden();
  await shortcut(page,"bag");
  await expect(page.locator(".fish-list strong").nth(1)).toHaveText("1");
});
test("BOOM zerstört und setzt zurück", async ({ page }) => {
  await seed(page, blank([14, 1.01, 17], 0, -0.15));
  await page.locator("#interact").click();
  await expect(page.locator("#toast")).toContainText("BOOOM");
  let s = await getSave(page);
  expect(s.changes["12,1,9"]).toBeNull();
  await shortcut(page,"reset-boom");
  s = await getSave(page);
  expect(s.changes["12,1,9"]).toBe("Boom");
});
for (const width of [360, 390, 430])
  test(`Touch ${width}px: Start, Joystick, Kamera, Inventar und Menü`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("./");
    await expect(page.locator("#play")).toBeInViewport();
    await page.locator("#play").tap();
    await page.waitForTimeout(150);
    const joystick = page.locator("#joystick");
    await expect(joystick).toBeVisible();
    const box = (await joystick.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + 55, y: box.y + 15 }],
    });
    await page.waitForTimeout(450);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 250, y: 350 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 280, y: 350 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.locator("#menu").tap();
    await page.locator("#save").tap();
    const s = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("blockboom.save")!),
    );
    expect(s.position[2]).toBeLessThan(17);
    expect(s.yaw).toBeLessThan(0);
    await page.locator("#resume").tap();
    await shortcut(page,"bag");
    await expect(page.locator("h2")).toHaveText("Deine Sammlung");
    await page.locator("#close").tap();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${artifactDir}/mobile-${width}.png` });
    expect(errors).toEqual([]);
    await context.close();
  });
test("Touch: Blöcke setzen/entfernen, Barsch fangen und BOOM zurücksetzen", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, blank([1, 1.01, 9], 0, -0.65));
  await page.locator("#place").tap();
  await page.locator("#menu").tap();
  let s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  const k = Object.keys(s.changes).find((k) => s.changes[k] === "Gras")!;
  expect(k).toBeTruthy();
  await page.locator("#resume").tap();
  await page.locator("#break").tap();
  await page.locator("#menu").tap();
  s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  expect(s.changes[k]).toBeNull();
  await seed(page, blank([-11, 2.01, 2], 0, -0.2));
  await page.locator("#interact").tap();
  await page.locator("#accept").tap();
  await landFish(page);
  await expect(page.locator("#toast")).toContainText("Auftrag geschafft");
  await seed(page, blank([14, 1.01, 17], 0, -0.15));
  await page.locator("#interact").tap();
  await expect(page.locator("#toast")).toContainText("BOOOM");
  await shortcut(page,"reset-boom");
  await expect(page.locator("#toast")).toContainText(
    "Die Struktur steht wieder",
  );
  await page.screenshot({ path: `${artifactDir}/boom-mobile.png` });
  expect(errors).toEqual([]);
  await context.close();
});
