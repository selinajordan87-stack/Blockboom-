import {test,expect,type Page} from "@playwright/test";
import {FreshJourney} from "../scripts/v07-player-journey.mjs";
import {defaultExpansion} from "../src/inventory/Equipment";
const metrics=(p:Page)=>p.locator("#world").evaluate(c=>JSON.parse((c as HTMLCanvasElement).dataset.performance!));
function fixture(){
 const extension=defaultExpansion(4);extension.nightfall.difficulty="Friedlich";
 return {version:1,position:[0,1.01,9],yaw:0,pitch:-.12,changes:{} as Record<string,string|null>,fish:{Rotauge:0,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1},extension};
}
async function seed(page:Page,s=fixture()){
 await page.goto("./?diagnostics=1");await page.evaluate(v=>localStorage.setItem("blockboom.save",JSON.stringify(v)),s);await page.reload();await page.locator("#play").tap();
 await expect.poll(async()=>(await metrics(page)).living.clock).toBeGreaterThan(0);
}
test.use({viewport:{width:844,height:390},hasTouch:true,isMobile:true});

test("Kamerawahl ist direkt sichtbar: Ego, echter Abstand, Befreien und unabhängige Daumen",async({page,context})=>{
 await seed(page);const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await expect(page.getByRole("button",{name:"Kamera ändern",exact:true})).toBeVisible();
 await page.locator("#camera-shortcut").tap();await page.locator("#view-third").tap();await page.locator("#quick-camera-distance").fill("8");await page.locator("#quick-camera-done").tap();
 await expect.poll(async()=>(await metrics(page)).camera.actualDistance).toBeGreaterThan(7.9);expect((await metrics(page)).camera.avatar).toBe(true);
 const cdp=await context.newCDPSession(page),j=(await page.locator("#joystick").boundingBox())!,a={id:1,x:j.x+j.width/2,y:j.y+8},b={id:2,x:560,y:180};
 const before=(await metrics(page)).nightfall.player;
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[a,b]});await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[a,{...b,x:590}]});await page.waitForTimeout(500);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
 expect((await metrics(page)).nightfall.player.yaw).not.toBe(before.yaw);expect((await metrics(page)).nightfall.player.pos[2]).toBeLessThan(before.pos[2]);await expect(page.locator("#modal")).toBeHidden();
 await page.locator("#camera-shortcut").tap();await page.locator("#quick-camera-reset").tap();await expect(page.locator("#modal")).toBeHidden();await expect.poll(async()=>(await metrics(page)).camera.perspective).toBe("first");expect((await metrics(page)).fov).toBe(70);expect(errors).toEqual([]);
 await page.screenshot({path:"artifacts/v071/direct-camera.png"});
});

test("enge Third-Person-Sicht nutzt Augen und Hand, statt im unsichtbaren Körper zu bleiben",async({page})=>{
 const s=fixture();s.extension.camera.perspective="third";s.changes["0,2,10"]="Stein";s.changes["0,3,10"]="Stein";
 await seed(page,s);await expect.poll(async()=>(await metrics(page)).camera.temporaryFirst).toBe(true);
 const m=await metrics(page);expect(m.camera.actualDistance).toBeLessThan(1.45);expect(m.camera.position[1]).toBeCloseTo(m.nightfall.player.pos[1]+1.6,1);
 const before=m.renderedFrames;await expect.poll(async()=>(await metrics(page)).renderedFrames).toBeGreaterThan(before+5);
 await page.locator("#camera-shortcut").tap();await page.locator("#quick-camera-reset").tap();await expect.poll(async()=>(await metrics(page)).camera.perspective).toBe("first");await expect(page.locator("#modal")).toBeHidden();
});


test("Wildtier anvisieren, jagen, Grill herstellen und platzieren, Fleisch garen, essen und laden",async({page,context})=>{
 test.setTimeout(120000);
 const s=fixture();s.pitch=-.45;s.extension.nightfall.mode="Survival";s.extension.nightfall.hunger=35;s.extension.tool="Schwert";s.extension.materials.Stein=4;s.extension.nightfall.supplies.Kohle=3;
 for(const a of s.extension.living.animals){a.pos=[40+a.phase,1,40];a.home=[...a.pos];}
 const cow=s.extension.living.animals[3];cow.pos=[0,1,7];cow.home=[...cow.pos];
 await seed(page,s);const j=new FreshJourney(page,context,"artifacts/v071");j.cdp=await context.newCDPSession(page);
 await expect(page.locator("#target-label")).toContainText("Kuh");await expect(page.locator("#attack")).toBeVisible();await expect(page.locator("#interact")).toBeVisible();
 await page.screenshot({path:"artifacts/v071/animal-target.png"});await page.locator("#attack").tap();
 await expect.poll(async()=>(await metrics(page)).living.animals.find((a:any)=>a.id===cow.id).health).toBe(20);
 await page.waitForTimeout(700);await page.locator("#attack").tap();await expect(page.locator("#toast")).toContainText("Rohfleisch");
 await page.locator("#menu").tap();await page.locator("#menu-workbench").tap();await page.locator('[data-living-recipe="Grill"]').tap();await page.locator("#close").tap();
 await page.locator("#selected-material").tap();await page.locator("#selected-material").tap();await page.getByRole("button",{name:"Grill auswählen",exact:true}).tap();
 await j.look(0,-.65);await expect(page.locator("#place")).toBeVisible();await page.locator("#place").tap();
 const stored=await j.save(),entry=Object.entries(stored.changes).find(([,b])=>b==="Grill");expect(entry).toBeTruthy();
 const [x,y,z]=entry![0].split(",").map(Number);await j.aim(x+.5,y+.4,z+.5);await expect(page.locator("#target-label")).toContainText("Grill");await page.screenshot({path:"artifacts/v071/placed-grill.png"});
 await page.locator("#interact").tap();await expect(page.locator("#panel-tag")).toHaveText("GRILL");await page.locator('[data-living-recipe="Grillfleisch"]').tap();await page.screenshot({path:"artifacts/v071/grilling.png"});await page.locator("#close").tap();
 const cooked=await j.save();expect(cooked.extension.living.bag.Rohfleisch).toBe(2);expect(cooked.extension.living.bag.Grillfleisch).toBe(1);
 await page.locator("#quick-food").tap();const eaten=await j.save();expect(eaten.extension.living.bag.Grillfleisch).toBe(0);expect(eaten.extension.nightfall.hunger).toBeGreaterThan(cooked.extension.nightfall.hunger+30);
 await page.reload();await page.locator("#play").tap();const loaded=await j.save();expect(loaded.changes[entry![0]]).toBe("Grill");expect(loaded.extension.living.animals.find((a:any)=>a.id===cow.id).health).toBe(0);expect(loaded.extension.living.bag.Rohfleisch).toBe(2);expect(j.errors).toEqual([]);
});

test("Angelblick zeigt lebende Fischmodelle beim großen Steg ohne Kamera-Vergrößerung",async({page})=>{
 const s=fixture();s.position=[-115,1.01,-85];s.extension.tool="Angel";await seed(page,s);
 await page.locator("#camera-shortcut").tap();await expect(page.locator("#camera-water")).toBeVisible();await page.locator("#camera-water").tap();
 await expect.poll(async()=>(await metrics(page)).nightfall.player.pitch).toBeLessThan(-.25);
 const m=await metrics(page);expect(m.fov).toBe(70);expect(m.camera.perspective).toBe("first");expect(m.fish.filter((f:any)=>f.x<-80&&f.z<-70&&f.alive).length).toBe(8);
 await page.screenshot({path:"artifacts/v071/lake-visible-fish.png"});
 const before=m.fish.filter((f:any)=>f.x<-80&&f.z<-70).map((f:any)=>[f.x,f.z]);await page.waitForTimeout(1200);
 expect((await metrics(page)).fish.filter((f:any)=>f.x<-80&&f.z<-70).map((f:any)=>[f.x,f.z])).not.toEqual(before);
});
