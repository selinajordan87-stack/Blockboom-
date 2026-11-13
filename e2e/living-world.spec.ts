import { test, expect, type Page } from "@playwright/test";
import { landFish } from "./fishing-helper";
import {shortcut,menuPage} from "./ui-helper";
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (e) => list.push(e.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));
const baseSave = (position = [0, 1.01, 17], yaw = 0, pitch = -0.1) => ({
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
async function seeded(
  page: Page,
  position = [0, 1.01, 17],
  yaw = 0,
  pitch = -0.1,
) {
  await page.goto("./?diagnostics=1");
  await page.evaluate(
    (s) => {
      localStorage.setItem("blockboom.save", JSON.stringify(s));
      localStorage.removeItem("blockboom.learning.v1");
    },
    baseSave(position, yaw, pitch),
  );
  await page.reload();
  await page.locator("#play").click();
}
async function snapshot(page: Page) {
  await page.keyboard.press("Escape");
  await page.locator("#save").click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  await page.locator("#resume").click();
  return s;
}
async function travel(page: Page, position: number[], yaw = 0, pitch = -0.1) {
  await snapshot(page);
  await page.goto("./?diagnostics=1");
  await page.evaluate(
    ({ position, yaw, pitch }) => {
      const s = JSON.parse(localStorage.getItem("blockboom.save")!);
      Object.assign(s, { position, yaw, pitch });
      localStorage.setItem("blockboom.save", JSON.stringify(s));
    },
    { position, yaw, pitch },
  );
  await page.reload();
  await page.locator("#play").click();
}
async function mission(page: Page, id: string) {
  await shortcut(page,"journal");
  await page.locator(`[data-mission="${id}"]`).click();
}
async function answer(page: Page, text: string) {
  await page.locator("#learning-answer").fill(text);
  await page.locator("#answer-submit").click();
}

test("neun Baustoffe, Bauen außerhalb des Bauplatzes, Undo und Reload", async ({
  page,
}) => {
  await seeded(page, [-2, 1.01, 3], 0, -0.65);
  await page.locator("#material-next").click();
  await page.getByRole("button", { name: "Ziegel auswählen" }).click();
  await page.keyboard.press("Equal");
  let s = await snapshot(page);
  const key = Object.keys(s.changes).find((k) => s.changes[k] === "Ziegel")!;
  expect(key).toBeTruthy();
  expect(Number(key.split(",")[2])).toBeLessThan(5);
  await page.locator("#undo").click();
  s = await snapshot(page);
  expect(s.changes[key]).toBeNull();
  await page.keyboard.press("Equal");
  await page.reload();
  await page.locator("#play").click();
  s = await snapshot(page);
  expect(s.changes[key]).toBe("Ziegel");
  await page.keyboard.press("Minus");
  s = await snapshot(page);
  expect(s.extension.materials.Ziegel).toBe(1);
});

test("acht sichtbare Arten bewegen sich; Angel drillt ein wirkliches Tier", async ({
  page,
}) => {
  await seeded(page, [-11, 2.01, 2]);
  await page.waitForFunction(
    () =>
      !!document.querySelector<HTMLCanvasElement>("#world")?.dataset
        .performance,
  );
  const before = await page
    .locator("#world")
    .evaluate((c) => JSON.parse((c as HTMLCanvasElement).dataset.performance!));
  expect(new Set(before.fish.map((f: any) => f.species)).size).toBe(8);
  await page.waitForTimeout(1200);
  const moved = await page
    .locator("#world")
    .evaluate((c) => JSON.parse((c as HTMLCanvasElement).dataset.performance!));
  expect(moved.fish[0].x).not.toBe(before.fish[0].x);
  await page.locator("#interact").click();
  await page.locator("#accept").click();
  await landFish(page);
  await expect(page.locator("#toast")).toContainText("Flussbarsch");
  const s = await snapshot(page);
  expect(s.fish.Flussbarsch).toBe(1);
  expect(s.extension.catches[0]).toMatchObject({
    species: "Flussbarsch",
    method: "Angel",
  });
  expect(s.extension.catches[0].length).toBeGreaterThan(0);
});

test("direkter Fang trifft ein sichtbares Fischmodell in Reichweite", async ({
  page,
}) => {
  await seeded(page, [-10, -0.99, -3]);
  await page.locator("#tool-toggle").click();
  await page.locator('[data-tool="Holzknüppel"]').click();
  let yaw = 0,
    pitch = -0.1;
  let success = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const old = await page.locator("#world").getAttribute("data-performance");
    await expect
      .poll(() => page.locator("#world").getAttribute("data-performance"))
      .not.toBe(old);
    const data = await page
      .locator("#world")
      .evaluate((c) =>
        JSON.parse((c as HTMLCanvasElement).dataset.performance!),
      );
    const f = data.fish
      .filter(
        (f: any) => f.alive && Math.hypot(f.x + 10, f.z + 3, f.y - 0.61) < 3.3,
      )
      .sort(
        (a: any, b: any) =>
          Math.abs(Math.atan2(-(a.x + 10), -(a.z + 3)) - yaw) -
          Math.abs(Math.atan2(-(b.x + 10), -(b.z + 3)) - yaw),
      )[0];
    expect(f).toBeTruthy();
    const nextYaw = Math.atan2(-(f.x + 10), -(f.z + 3)),
      nextPitch = Math.atan2(f.y - 0.61, Math.hypot(f.x + 10, f.z + 3));
    const dx = (yaw - nextYaw) / 0.0035,
      dy = (pitch - nextPitch) / 0.0035,
      n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 60));
    await page.dispatchEvent("#look", "pointerdown", {
      pointerId: 99,
      pointerType: "touch",
      clientX: 0,
      clientY: 0,
    });
    for (let i = 1; i <= n; i++)
      await page.dispatchEvent("#look", "pointermove", {
        pointerId: 99,
        pointerType: "touch",
        clientX: (dx * i) / n,
        clientY: (dy * i) / n,
      });
    await page.dispatchEvent("#look", "pointerup", {
      pointerId: 99,
      pointerType: "touch",
    });
    yaw = nextYaw;
    pitch = nextPitch;
    await page.keyboard.press("KeyE");
    if (await page.locator("#release-fish").isVisible()) {
      await page.locator("#release-fish").click();
      success = true;
      break;
    }
  }
  expect(success).toBe(true);
  const s = await snapshot(page);
  expect(s.extension.catches.some((f: any) => f.method === "Holzknüppel")).toBe(
    true,
  );
});

test("Holzauftrag: tatsächliches Abbauen, Schreiben und Abgeben belohnt einmal", async ({
  page,
}) => {
  test.setTimeout(90000);
  await seeded(page, [-3, 1.01, 16]);
  await mission(page, "wood");
  await page.locator("#mission-accept").click();
  await page.locator("#close").click();
  await travel(page, [-18.5, 1.01, 12], 0, -0.04);
  await page.keyboard.press("Minus");
  await travel(page, [-18.5, 1.01, 12], 0, -0.415);
  await page.keyboard.press("Minus");
  await travel(page, [-18.5, 1.01, 12], 0, 0.345);
  await page.keyboard.press("Minus");
  let s = await snapshot(page);
  expect(s.extension.materials.Holz).toBe(3);
  await travel(page, [-3, 1.01, 16]);
  await mission(page, "wood");
  await answer(page, "holz");
  await expect(page.locator("#learning-feedback")).toContainText("Noch nicht");
  await page.locator("#mission-hint").click();
  await expect(page.locator("#learning-feedback")).toContainText("Holz");
  await answer(page, "Holz");
  await page.locator("#mission-claim").click();
  await expect(page.locator("#mission-progress")).toContainText("geschafft");
  await page.locator("#close").click();
  s = await snapshot(page);
  expect(s.extension.tokens).toBe(10);
  expect(s.extension.materials.Holz).toBe(0);
  expect(s.extension.badges).toContain("Holzhelfer");
});

test("Fischmission und Schatzmission: Fang, drei Rätsel, Abschluss und Save", async ({
  page,
}) => {
  await seeded(page, [-11, 2.01, 2]);
  await mission(page, "fish");
  await page.locator("#mission-accept").click();
  await page.locator("#close").click();
  await page.locator("#interact").click();
  await page.locator("#cast").click();
  await landFish(page);
  await mission(page, "fish");
  await answer(page, "Barsch");
  await page.locator("#mission-claim").click();
  await page.locator("#close").click();
  await travel(page, [7, 1.01, -2]);
  await mission(page, "treasure");
  await page.locator("#mission-accept").click();
  for (const word of ["Glas", "Holz", "Schatz"]) await answer(page, word);
  await page.locator("#mission-claim").click();
  await expect(page.locator("#mission-progress")).toContainText("geschafft");
  await page.locator("#close").click();
  let s = await snapshot(page);
  expect(s.extension.tokens).toBe(35);
  expect(s.extension.missions.fish.completed).toBe(true);
  expect(s.extension.missions.treasure.completed).toBe(true);
  await page.reload();
  await page.locator("#play").click();
  s = await snapshot(page);
  expect(s.extension.badges).toContain("Schatzfinder");
});

test("Challenge: Fehler, Silben, langsames Wort, lokale Stimme und getrennte Lernspeicherung", async ({
  page,
}) => {
  await seeded(page);
  await shortcut(page,"learn");
  await answer(page, "falsch");
  await expect(page.locator("#learning-feedback")).toContainText("Noch nicht");
  await page.locator("#challenge-syllables").click();
  await expect(page.locator("#learning-aid")).toHaveText("Fisch");
  await page.locator("#challenge-slow").click();
  await expect(page.locator("#learning-aid")).toHaveText("Fisch", {
    timeout: 3000,
  });
  await page.evaluate(() => {
    const synth = window.speechSynthesis;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
      configurable: true,
    });
    Object.defineProperty(synth, "getVoices", {
      value: () => [{ localService: true, lang: "de-DE" }],
      configurable: true,
    });
    Object.defineProperty(synth, "speak", {
      value: () => {
        (window as any).spoken = true;
      },
      configurable: true,
    });
  });
  await page.locator("#challenge-read").click();
  expect(await page.evaluate(() => (window as any).spoken)).toBe(true);
  await answer(page, "Fisch");
  await expect(page.locator("#learning-feedback")).toContainText("+2 Sterne");
  await page.locator("#close").click();
  const s = await snapshot(page);
  expect(s.extension.tokens).toBe(2);
  const learning = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.learning.v1")!),
  );
  expect(learning.mode).toBe("Lern-Challenge");
  expect(learning.results["world-01"].history).toEqual([false, true]);
  expect(s).not.toHaveProperty("results");
});

test("mobiles Lernformular bleibt bei kleiner Tastaturhöhe bedienbar; Moduswechsel sperrt nichts", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await seeded(page);
  await shortcut(page,"learn");
  await page.locator("#learning-answer").tap();
  await page.setViewportSize({ width: 390, height: 360 });
  await page.keyboard.type("Fisch");
  await expect(page.locator("#learning-answer")).toHaveValue("Fisch");
  await page.locator("#answer-submit").tap();
  await expect(page.locator("#learning-feedback")).toContainText("Geschafft");
  await page.locator("#close").tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator("#menu").tap();
  await menuPage(page,"menu-settings");await page.locator("#game-mode").selectOption("Entspannt");
  await page.locator("#close").tap();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#tool-toggle").tap();
  await page.locator('[data-tool="Axt"]').tap();
  await expect(page.locator("#tool-toggle")).toHaveText("Axt");
  await context.close();
});

test("Schatzmission auf Touchscreen: drei Texteingaben mit Tastaturhöhe und gespeicherter Belohnung", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seeded(page, [7, 1.01, -2]);
  await shortcut(page,"journal");
  await page.locator('[data-mission="treasure"]').tap();
  await page.locator("#mission-accept").tap();
  await page.setViewportSize({ width: 844, height: 260 });
  for (const word of ["Glas", "Holz", "Schatz"]) {
    await page.locator("#learning-answer").tap();
    await page.keyboard.type(word);
    await expect(page.locator("#learning-answer")).toHaveValue(word);
    await page.locator("#answer-submit").tap();
  }
  await page.locator("#mission-claim").tap();
  await expect(page.locator("#mission-progress")).toContainText("geschafft");
  await page.locator("#close").tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator("#menu").tap();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  expect(s.extension.tokens).toBe(20);
  expect(s.extension.missions.treasure.completed).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});

test.describe("Kompatibilitätsklick auf Touchgeräten", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 844, height: 390 },
  });
  test("Touchaktion ohne Klick: ein Folgeklick darf nicht in das neue Angelmenü fallen", async ({
    page,
  }) => {
    await seeded(page, [-11, 2.01, 2]);
    const r = (await page.locator("#interact").boundingBox())!;
    const pointer = {
      pointerId: 333,
      pointerType: "touch",
      clientX: r.x + r.width / 2,
      clientY: r.y + r.height / 2,
    };
    await page.dispatchEvent("#interact", "pointerdown", pointer);
    await page.dispatchEvent("#interact", "pointerup", pointer);
    await expect(page.locator("#modal")).toBeVisible();
    await expect(page.locator("#cast")).toBeVisible();
    await page.dispatchEvent("#cast", "click", {
      detail: 1,
      bubbles: true,
      cancelable: true,
    });
    await expect(page.locator("#modal")).toBeVisible();
    await page.locator("#cast").tap();
    await expect(page.locator("#modal")).toBeHidden();
    await expect(page.locator("#fish-action")).toHaveText("Auswerfen");
  });
});
