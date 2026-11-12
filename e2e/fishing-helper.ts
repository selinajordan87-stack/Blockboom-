import { expect, type Page } from "@playwright/test";

async function fishingState(page: Page) {
  return page.locator("#angling-state").textContent();
}

async function pulse(page: Page, _pointerId: number, duration: number) {
  const action = page.locator("#fish-action");
  const box = await action.boundingBox();
  if (!box) throw new Error("Angelaktion ist nicht sichtbar");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(duration);
  await page.mouse.up();
}

/** Exercises the same hold/release controls used on phones; no game internals are mutated. */
export async function landFish(
  page: Page,
  disposition: "keep" | "release" = "keep",
  landingScreenshot?: string,
) {
  const action = page.locator("#fish-action");
  await expect(action).toBeVisible();
  await pulse(page, 301, 850);
  await expect
    .poll(() => fishingState(page), { timeout: 18_000 })
    .toContain("BISS");
  await pulse(page, 302, 180);
  await expect
    .poll(() => fishingState(page), { timeout: 3_000 })
    .toContain("Drill");
  const deadline = Date.now() + 38_000;
  let pointer = 310;
  while (!(await page.locator("#modal").isVisible()) && Date.now() < deadline) {
    const tension = Number.parseFloat(
      (await page.locator("#line-tension").getAttribute("style"))?.match(
        /[\d.]+/,
      )?.[0] || "0",
    );
    if (tension < 62) await pulse(page, pointer++, 340);
    else await page.waitForTimeout(230);
  }
  await expect(page.locator("#panel-tag")).toHaveText("DEIN FANG", {
    timeout: 2_000,
  });
  if (landingScreenshot) await page.screenshot({ path: landingScreenshot });
  if (disposition === "release") await page.locator("#release-fish").click();
  else {
    await expect(page.locator("#keep-fish")).toBeEnabled();
    await page.locator("#keep-fish").click();
    await expect(page.locator("#modal")).toBeHidden({ timeout: 3_000 });
  }
}
