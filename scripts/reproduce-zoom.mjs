import {chromium,expect} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.goto("https://selinajordan87-stack.github.io/Blockboom-/?diagnostics=1");await expect(page.locator(".eyebrow")).toContainText("v0.6.0");await page.locator("#play").tap();
 const metrics=()=>page.locator("#world").evaluate(c=>JSON.parse(c.dataset.performance));await expect.poll(async()=>(await metrics()).fov).toBe(70);const before=await metrics();
 await page.locator("#zoom").tap();await expect.poll(async()=>(await metrics()).fov).toBeCloseTo(43.4);const zoom=await metrics();await mkdir("artifacts/v061/before",{recursive:true});await page.screenshot({path:"artifacts/v061/before/844-narrow-view.png"});
 await page.locator("#menu").tap();await page.locator("#resume").tap();await page.waitForTimeout(1200);const after=await metrics();const result={version:"0.6.0",beforeFov:before.fov,zoomFov:zoom.fov,afterMenuFov:after.fov,renderingContinues:after.renderedFrames>zoom.renderedFrames,trueRenderFreezeReproduced:false};
 await writeFile("artifacts/v061/repro-zoom.json",JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result));await context.close();
}finally{await browser.close();}
