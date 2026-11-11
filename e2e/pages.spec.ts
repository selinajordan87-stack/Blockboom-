import { test, expect } from "@playwright/test";

test("Pages: Unterpfad, gebündelte Assets, Manifest und direkter Neuladevorgang", async ({
  page,
  request,
  baseURL,
}) => {
  const errors: string[] = [];
  const failures: string[] = [];
  const responses: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (req) => failures.push(req.url()));
  page.on("response", (res) => {
    if (res.status() >= 400) failures.push(`${res.status()} ${res.url()}`);
    if (/\.(js|css)(\?|$)/.test(res.url())) responses.push(res.url());
  });
  await page.goto("./");
  expect(new URL(page.url()).pathname).toBe("/Blockboom-/");
  await expect(page.locator("#play")).toBeVisible();
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .evaluate((el: HTMLLinkElement) => el.href);
  expect(new URL(manifestURL).pathname).toBe("/Blockboom-/manifest.webmanifest");
  const manifestResponse = await request.get(manifestURL);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(new URL(manifest.start_url, manifestURL).pathname).toBe("/Blockboom-/");
  expect(new URL(manifest.scope, manifestURL).pathname).toBe("/Blockboom-/");
  const icon = await request.get(
    new URL(manifest.icons[0].src, manifestURL).href,
  );
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/svg+xml");
  const license = await request.get(new URL("THREE-LICENSE.txt", baseURL).href);
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain("MIT License");
  expect(responses.length).toBeGreaterThanOrEqual(2);
  expect(
    responses.every((url) => new URL(url).pathname.startsWith("/Blockboom-/")),
  ).toBe(true);
  // Three.js really created a WebGL drawing surface, not just an HTML shell.
  const buffer = await page
    .locator("canvas#world")
    .evaluate((canvas: HTMLCanvasElement) => {
      const gl = canvas.getContext("webgl2");
      return gl ? [gl.drawingBufferWidth, gl.drawingBufferHeight] : [0, 0];
    });
  expect(buffer[0]).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator("#play")).toBeVisible();
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});
