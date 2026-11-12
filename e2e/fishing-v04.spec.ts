import { expect, test, type Page } from "@playwright/test";

const legacy = (position: number[] = [-11, 2.01, 2]) => ({
  version: 1,
  position,
  yaw: 0,
  pitch: -0.15,
  changes: { "2,1,7": "Glas" },
  fish: { Rotauge: 2, Flussbarsch: 1, Hecht: 0 },
  progress: {
    completedMissions: ["first-perch"],
    repetitions: 1,
    successfulAnswers: 1,
    voluntaryHints: 1,
  },
  missionActive: false,
  settings: { sound: false, quality: 1 },
});

async function start(page: Page, save = legacy()) {
  await page.goto("./?diagnostics=1");
  await page.evaluate((value) => {
    localStorage.clear();
    localStorage.setItem("blockboom.save", JSON.stringify(value));
  }, save);
  await page.reload();
  await page.locator("#play").click();
}

test("v0.1-Spielstand erhält Welt, Fänge und Lernfortschritt mit pre-v04-Sicherung", async ({
  page,
}) => {
  await start(page);
  await page.locator("#menu").click();
  await page.locator("#save").click();
  const values = await page.evaluate(() => ({
    saved: JSON.parse(localStorage.getItem("blockboom.save")!),
    backup: JSON.parse(localStorage.getItem("blockboom.save.pre-v04")!),
  }));
  expect(values.backup).toMatchObject({
    version: 1,
    changes: { "2,1,7": "Glas" },
    fish: { Rotauge: 2, Flussbarsch: 1, Hecht: 0 },
  });
  expect(values.saved.extension.edition).toBe(4);
  expect(values.saved.extension.angling.loadout).toMatchObject({
    rod: "Stipprute",
    rig: "Posenmontage",
    bait: "Wurm",
  });
  expect(values.saved.changes["2,1,7"]).toBe("Glas");
  expect(values.saved.progress.completedMissions).toContain("first-perch");
});

test("Angelset speichert Regelhilfe und Jahreszeit ohne Lernpflicht", async ({ page }) => {
  await start(page);
  await page.locator("#tackle").click();
  await expect(page.locator("#rod-select")).toHaveValue("Stipprute");
  await page.locator("#season-select").selectOption("Herbst");
  await page.locator("#rules-enabled").uncheck();
  await page.locator("#equip-save").click();
  await expect(page.locator("#world")).toHaveAttribute("data-active-tool", "Angel");
  await page.locator("#menu").click();
  await page.locator("#save").click();
  const angling = await page.evaluate(
    () => JSON.parse(localStorage.getItem("blockboom.save")!).extension.angling,
  );
  expect(angling.season).toBe("Herbst");
  expect(angling.rulesEnabled).toBe(false);
});

test("mobile Angelaktion beendet touchcancel ohne Wurf, Hänger oder Pausenmenü", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await start(page);
  await page.locator("#tool-toggle").tap();
  await page.locator('[data-tool="Angel"]').tap();
  await expect(page.locator("#fish-action")).toBeVisible();
  const box = (await page.locator("#fish-action").boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...point, id: 71 }],
  });
  await expect(page.locator("#angling-state")).toHaveText("Wurfkraft wählen");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(page.locator("#angling-state")).toHaveText("Bereit zum Auswerfen");
  await expect(page.locator("#modal")).toBeHidden();
  await expect(page.locator("#interruption")).toBeHidden();
  await context.close();
});

test("alle vier Angelplätze werden durch Erkundung dauerhaft entdeckt", async ({ page }) => {
  await start(page);
  const positions = [
    [-13, 10.01, 16],
    [14.5, 10.01, -8],
    [4, 10.01, -15.2],
  ];
  for (const position of positions) {
    // Navigate first so pagehide persists the previous in-memory position;
    // then alter the save while the newly loaded start screen is inactive.
    await page.goto("./?diagnostics=1");
    await page.evaluate((next) => {
      const save = JSON.parse(localStorage.getItem("blockboom.save")!);
      save.position = next;
      localStorage.setItem("blockboom.save", JSON.stringify(save));
    }, position);
    await page.reload();
    await page.locator("#play").click();
    await page.waitForTimeout(300);
  }
  const spots = await page.evaluate(
    () => JSON.parse(localStorage.getItem("blockboom.save")!).extension.angling.spots,
  );
  expect(new Set(spots)).toEqual(new Set(["small", "forest", "river", "secret"]));
});
