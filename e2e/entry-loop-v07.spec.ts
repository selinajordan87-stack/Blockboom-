import {test,expect} from "@playwright/test";
import {FreshJourney} from "../scripts/v07-player-journey.mjs";

test("Neuer Survivalstart: Holz und Stein sammeln, Gartenblatt anwenden, Grundrezepte und eigenes Beet",async({browser})=>{
 test.setTimeout(180000);const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=new FreshJourney(page,context,"artifacts/v07/entry-loop");
 await j.start(test.info().project.use.baseURL as string||process.env.BLOCKBOOM_TEST_URL);
 await page.locator("#quick-axe").tap();
 // The original starter tree has three exposed logs; its top cell is foliage.
 for(let y=1;y<=3;y++){await j.aim(3.5,y+.5,16.5);await expect(page.locator("#target-label")).toContainText("Holz");await page.locator("#break").tap();}
 await j.walk(-6,15,{name:"second-visible-tree"});await j.aim(-8.5,1.5,17.5);await expect(page.locator("#target-label")).toHaveText("Holz");await page.locator("#break").tap();
 let state=await j.save();expect(state.extension.materials.Holz).toBe(4);expect(state.extension.discovery.gatheredHolz).toBe(4);
 await j.walk(7,14,{name:"visible-stone-near-garden"});await page.locator("#quick-pickaxe").tap();await j.aim(9.5,.99,13.5);await expect(page.locator("#target-label")).toHaveText("Stein");await page.locator("#break").tap();
 await j.menu("menu-book");await page.locator('[data-book-entry="garden-page"]').tap();await expect(page.locator("#panel-content")).toContainText("zwei Holzblöcken und einem Stein");await page.locator("#note-read").tap();await expect(page.locator("#note-feedback")).not.toBeEmpty();await page.screenshot({path:"artifacts/v07/entry-loop/garden-knowledge.png"});await page.locator("#note-done").tap();
 await j.menu("menu-workbench");await page.locator('[data-living-recipe="Bretter"]').tap();await page.locator('[data-living-recipe="Hacke"]').tap();await page.locator("#close").tap();await expect(page.locator("#world")).toHaveAttribute("data-active-tool","Hacke");
 state=await j.save();expect(state.extension.materials.Holz).toBe(0);expect(state.extension.materials.Stein).toBe(0);expect(state.extension.materials.Bretter).toBe(4);
 await j.aim(7.5,.99,13.5);await page.locator("#interact").tap();state=await j.save();expect(state.changes["7,0,13"]).toBe("Acker");
 await j.menu("menu-garden");await page.locator('[data-seed="Karotte"]').tap();await j.aim(7.5,.99,13.5);await page.locator("#interact").tap();state=await j.save();expect(state.extension.living.crops.some((c:any)=>c.kind==="Karotte"&&c.cell.join(",")==="7,0,13")).toBe(true);expect(state.extension.living.bag["Samen:Karotte"]).toBe(3);
 await j.capture("self-planted-garden");await page.reload();await page.locator("#play").tap();state=await j.save();expect(state.changes["7,0,13"]).toBe("Acker");expect(state.extension.discovery.read).toContain("garden-page");expect(j.errors).toEqual([]);await context.close();
});
