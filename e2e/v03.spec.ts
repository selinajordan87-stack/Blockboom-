import { expect, test, type Page } from "@playwright/test";
import {menuPage} from "./ui-helper";
const artifactDir = process.env.BLOCKBOOM_ARTIFACT_DIR || "artifacts";

const legacySave = (position = [1, 1.01, 9], pitch = -0.65) => ({
  version: 1,
  position,
  yaw: 0,
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

async function seed(page: Page, save = legacySave()) {
  await page.goto("./?diagnostics=1");
  await page.evaluate((value) => {
    localStorage.setItem("blockboom.save", JSON.stringify(value));
    localStorage.removeItem("blockboom.learning.v1");
  }, save);
  await page.reload();
  await page.locator("#play").click();
}

async function saved(page: Page) {
  await page.keyboard.press("Escape");
  await page.locator("#save").click();
  const value = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("blockboom.save")!),
  );
  await page.locator("#resume").click();
  return value;
}

test("neue Welt migriert auf Edition 4 mit begrenztem Renderbudget", async ({
  page,
}) => {
  await page.goto("./?diagnostics=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#play").click();
  await page.waitForFunction(
    () => !!document.querySelector<HTMLCanvasElement>("#world")?.dataset.performance,
  );
  const metrics = JSON.parse(
    (await page.locator("#world").getAttribute("data-performance"))!,
  );
  console.info(
    JSON.stringify({
      v03NewWorld: {
        calls: metrics.calls,
        triangles: metrics.triangles,
        geometries: metrics.geometries,
        textures: metrics.textures,
        chunks: metrics.chunks,
        ratio: metrics.ratio,
      },
    }),
  );
  expect(metrics.chunks).toBeLessThanOrEqual(32);
  expect(metrics.calls).toBeLessThanOrEqual(110);
  expect(metrics.triangles).toBeLessThan(40_000);
  expect(metrics.textures).toBeLessThanOrEqual(12);
  const state = await saved(page);
  expect(state.extension.edition).toBe(4);
  await page.screenshot({ path: `${artifactDir}/v03-world.png` });
});

test("v0.4 erhält sieben sichtbare Werkzeuge, Animation, FOV, Zoom und Inventar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seed(page);
  await expect(page.locator(".eyebrow")).toContainText("v0.6.1");
  await page.locator("#tool-toggle").click();
  await expect(page.locator("[data-tool]")).toHaveCount(14);
  await page.locator('[data-tool="Spitzhacke"]').click();
  await expect(page.locator("#world")).toHaveAttribute(
    "data-active-tool",
    "Spitzhacke",
  );
  await page.keyboard.press("Minus");
  await expect(page.locator("#world")).toHaveAttribute(
    "data-tool-action",
    "mine",
  );
  await page.locator("#bag").click();
  await expect(page.locator(".fish-list")).toBeVisible();
  await page.locator("#tool-tab").click();
  await expect(page.locator("[data-inventory-tool]")).toHaveCount(14);
  await page.locator('[data-inventory-tool="Schwert"]').click();
  await page.locator("#close").click();
  await expect(page.locator("#world")).toHaveAttribute(
    "data-active-tool",
    "Schwert",
  );
  await page.locator("#menu").click();
  await menuPage(page,"menu-camera");
  await page.locator("#fov").fill("80");
  await page.locator("#sensitivity").fill("125");
  await page.locator("#close").click();
  await page.keyboard.press("KeyX");
  await expect(page.locator("#zoom")).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => {
      const raw = await page.locator("#world").getAttribute("data-performance");
      return raw ? JSON.parse(raw).fov : 0;
    })
    .toBeCloseTo(80, 0);
  const state = await saved(page);
  expect(state.extension.view).toEqual({ fov: 80, sensitivity: 1.25 });
  expect(errors).toEqual([]);
});

test("15 Materialien, mehrere Undo-Schritte und Reload", async ({
  page,
}) => {
  await seed(page);
  await page.locator("#material-next").click();
  await page.locator("#material-next").click();
  await page.getByRole("button", { name: "Schiefer auswählen" }).click();
  for (let i = 0; i < 2; i++) await page.keyboard.press("Equal");
  let state = await saved(page);
  const built = Object.entries(state.changes).filter(
    ([, block]) => block === "Schiefer",
  );
  expect(built).toHaveLength(2);
  await expect(page.locator("#undo")).toContainText("2");
  await page.locator("#undo").click();
  await page.locator("#undo").click();
  state = await saved(page);
  expect(Object.values(state.changes).filter((block) => block === null)).toHaveLength(2);
  expect(Object.values(state.changes).filter((block) => block === "Schiefer")).toHaveLength(0);
  await page.keyboard.press("Equal");
  await page.reload();
  await page.locator("#play").click();
  state = await saved(page);
  expect(Object.values(state.changes).filter((block) => block === "Schiefer")).toHaveLength(1);
  // Loading an old v0.1 save keeps its deltas and migrates only additive systems.
  expect(state.extension.edition).toBe(4);
  expect(state.extension.view).toEqual({ fov: 70, sensitivity: 1 });
});

for (const viewport of [
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
])
  test(`mobile Landschaft ${viewport.width}×${viewport.height}: Zoom und Werkzeuge ohne Pause`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await seed(page);
    await page.locator("#zoom").tap();
    await expect(page.locator("#zoom")).toHaveAttribute("aria-pressed", "true");
    await page.locator("#tool-toggle").tap();
    await page.locator('[data-tool="Axt"]').tap();
    await page.locator("#break").tap();
    await expect(page.locator("#modal")).toBeHidden();
    const layout = await page.evaluate(() => {
      const joy = document.querySelector("#joystick")!.getBoundingClientRect();
      const actions = document.querySelector("#mobile-actions")!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        separated: joy.right < actions.left,
      };
    });
    expect(layout).toEqual({ overflow: false, separated: true });
    await context.close();
  });

test("diagnostics: selektive Chunks und GPU-Zähler bleiben bei Bau/Undo begrenzt", async ({
  page,
}) => {
  await seed(page);
  await page.waitForFunction(
    () => !!document.querySelector<HTMLCanvasElement>("#world")?.dataset.performance,
  );
  const before = JSON.parse(
    (await page.locator("#world").getAttribute("data-performance"))!,
  );
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Equal");
    await page.locator("#undo").click();
  }
  await page.waitForTimeout(1100);
  const after = JSON.parse(
    (await page.locator("#world").getAttribute("data-performance"))!,
  );
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Equal");
    await page.locator("#undo").click();
  }
  await page.waitForTimeout(1100);
  const settled = JSON.parse(
    (await page.locator("#world").getAttribute("data-performance"))!,
  );
  console.info(
    JSON.stringify({
      v03BuildUndoPlateau: {
        first: { geometries: after.geometries, textures: after.textures },
        second: {
          geometries: settled.geometries,
          textures: settled.textures,
        },
      },
    }),
  );
  expect(after.chunks).toBeLessThanOrEqual(32);
  expect(settled.geometries).toBeLessThanOrEqual(after.geometries + 1);
  expect(settled.textures).toBeLessThanOrEqual(before.textures + 1);
  expect(settled.ratio).toBeGreaterThanOrEqual(0.75);
});
