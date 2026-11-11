import { test, expect } from "@playwright/test";

test("Pages: Unterpfad, gebündelte Assets, Manifest und direkter Neuladevorgang", async ({
  page,
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
  await expect(page.locator(".eyebrow")).toContainText("v0.1.1");
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .evaluate((el: HTMLLinkElement) => el.href);
  expect(new URL(manifestURL).pathname).toBe(
    "/Blockboom-/manifest.webmanifest",
  );
  // Browser fetch follows the same trusted networking path as the actual app.
  const fetchAsset = (url: string) =>
    page.evaluate(async (url) => {
      const r = await fetch(url);
      return {
        status: r.status,
        headers: Object.fromEntries(r.headers),
        text: await r.text(),
      };
    }, url);
  const manifestResponse = await fetchAsset(manifestURL);
  expect(manifestResponse.status).toBe(200);
  const manifest = JSON.parse(manifestResponse.text);
  expect(new URL(manifest.start_url, manifestURL).pathname).toBe(
    "/Blockboom-/",
  );
  expect(new URL(manifest.scope, manifestURL).pathname).toBe("/Blockboom-/");
  const icon = await fetchAsset(
    new URL(manifest.icons[0].src, manifestURL).href,
  );
  expect(icon.status).toBe(200);
  expect(icon.headers["content-type"]).toContain("image/svg+xml");
  const license = await fetchAsset(new URL("THREE-LICENSE.txt", baseURL).href);
  expect(license.status).toBe(200);
  expect(license.text).toContain("MIT License");
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
