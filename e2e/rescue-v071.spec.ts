import {test,expect,type Page} from "@playwright/test";
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
