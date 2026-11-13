import {test,expect} from "@playwright/test";
import {defaultExpansion} from "../src/inventory/Equipment";
import {TOWER_COST,towerPlan} from "../src/discovery/Blueprint";
import {FreshJourney} from "../scripts/v07-player-journey.mjs";

test("Bauplan aus einem vorhandenen Spielstand: Vorschau, echte Kosten, Aufstieg und Reload",async({browser})=>{
 test.setTimeout(160000);
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();
 // Controlled save-migration/integration fixture. This is not a fresh-player finding-time test.
 const e=defaultExpansion(4);e.living.blueprint=true;e.materials={...TOWER_COST};e.nightfall.mode="Survival";e.nightfall.difficulty="Friedlich";
 await page.goto("./");await page.evaluate(extension=>localStorage.setItem("blockboom.save",JSON.stringify({version:1,position:[-14,1.01,10],yaw:-Math.PI/2,pitch:-.4,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},settings:{quality:1,sound:false},missionActive:false,extension})),e);
 const j=new FreshJourney(page,context,"artifacts/v07/blueprint");await j.start(test.info().project.use.baseURL as string||process.env.BLOCKBOOM_TEST_URL);
 await j.aim(-11.5,.99,10.5);await j.menu("menu-plan");await expect(page.locator("#panel-content")).toContainText("24 / 24");await page.screenshot({path:"artifacts/v07/blueprint/plan.png"});await page.locator("#tower-place").tap();
 await expect.poll(async()=>(await j.metrics()).blueprint?.valid).toBe(true);expect((await j.metrics()).blueprint.cells).toBe(44);await page.screenshot({path:"artifacts/v07/blueprint/valid-preview.png"});await page.locator("#place").tap();
 let save=await j.save();const origin=save.extension.discovery.tower.origin;for(const[b]of Object.entries(TOWER_COST))expect(save.extension.materials[b]).toBe(0);for(const p of towerPlan(origin))expect(save.changes[p.cell.join(",")]).toBe(p.block);expect(save.extension.discovery.tower.rewarded).toBe(false);
 await j.walk(origin[0]-1.4,origin[2]+4.9,{name:"around-tower"});await j.walk(origin[0]+1.5,origin[2]+4.9,{name:"open-back-of-tower"});await j.look(0,-.12);
 const cdp=j.cdp,r=(await page.locator("#joystick").boundingBox())!,finger={id:121,x:r.x+r.width/2,y:r.y+8};await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[finger]});await page.keyboard.press("Space");
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!).extension.discovery.tower.rewarded),{timeout:15000,intervals:[100]}).toBe(true);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
 save=await j.save();expect(save.extension.living.explored.length).toBeGreaterThan(30);expect(save.extension.badges).toContain("Weitblick");await j.capture("built-tower");
 await page.reload();await page.locator("#play").tap();save=await j.save();expect(save.extension.discovery.tower.rewarded).toBe(true);expect(save.extension.discovery.tower.origin).toEqual(origin);expect(j.errors).toEqual([]);await context.close();
});
