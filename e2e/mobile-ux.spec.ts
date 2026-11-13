import {test,expect,type Page} from "@playwright/test";
import {defaultExpansion} from "../src/inventory/Equipment";
import {menuPage,shortcut} from "./ui-helper";
import {landFish} from "./fishing-helper";
const base=(position=[0,1.01,17],yaw=0,pitch=-.12)=>({version:1,position,yaw,pitch,changes:{} as Record<string,string|null>,fish:{Rotauge:2,Flussbarsch:1,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1},extension:defaultExpansion(4)});
async function seed(page:Page,s=base()){
 await page.goto("./?diagnostics=1");await page.evaluate(v=>{localStorage.clear();localStorage.setItem("blockboom.save",JSON.stringify(v));},s);await page.reload();await page.locator("#play").click();await expect(page.locator("#hud")).toBeVisible();
 await expect.poll(async()=>{const raw=await page.locator("#world").getAttribute("data-performance");return raw?JSON.parse(raw).living.clock:0;}).toBeGreaterThan(0);
}
const metrics=(p:Page)=>p.locator("#world").evaluate(c=>JSON.parse((c as HTMLCanvasElement).dataset.performance!));
async function saved(p:Page){await p.locator("#menu").click();await p.locator("#save").click();const s=await p.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));await p.locator("#resume").click();return s;}
for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430}])test(`aufgeräumtes mobiles HUD und Safe Areas ${viewport.width}×${viewport.height}`,async({browser})=>{
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await seed(page);
 await page.evaluate(()=>{document.documentElement.style.setProperty("--safe-left","44px");document.documentElement.style.setProperty("--safe-right","44px");document.documentElement.style.setProperty("--safe-bottom","21px");});
 for(const id of ["bag","living-menu","tackle","learn","journal","context","night-actions"])await expect(page.locator(`#${id}`)).toBeHidden();
 expect(await page.locator("#mobile-quickbar button").count()).toBeLessThanOrEqual(6);
 const layout=await page.evaluate(()=>{const ids=["joystick","mobile-actions","mobile-quickbar","menu","survival-hud"],r=ids.map(id=>({id,rect:document.getElementById(id)!.getBoundingClientRect()}));return {overflow:document.documentElement.scrollWidth>innerWidth,rects:r.map(({id,rect:b})=>({id,x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height})),overlap:r.some((a,i)=>r.slice(i+1).some(b=>a.rect.x<b.rect.right&&a.rect.right>b.rect.x&&a.rect.y<b.rect.bottom&&a.rect.bottom>b.rect.y))};});
 expect(layout.overflow).toBe(false);expect(layout.overlap).toBe(false);for(const b of layout.rects){expect(b.x).toBeGreaterThanOrEqual(44);expect(b.right).toBeLessThanOrEqual(viewport.width-44);expect(b.bottom).toBeLessThanOrEqual(viewport.height-21);}
 const joystick=(await page.locator("#joystick").boundingBox())!,stick=(await page.locator("#stick").boundingBox())!;expect(stick.x+stick.width/2).toBeCloseTo(joystick.x+joystick.width/2,0);expect(stick.y+stick.height/2).toBeCloseTo(joystick.y+joystick.height/2,0);
 await page.screenshot({path:`artifacts/v061/after/${viewport.width}-safe.png`});expect(errors).toEqual([]);await context.close();
});

test("Third Person zeigt die Figur, erhöht echte Kameradistanz und speichert die Auswahl",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();await seed(page);await page.locator("#zoom").tap();await expect.poll(async()=>(await metrics(page)).camera.avatar).toBe(true);
 const first=await metrics(page);expect(first.fov).toBe(70);expect(first.camera.actualDistance).toBeGreaterThan(3.8);await page.locator("#zoom").tap();await expect.poll(async()=>(await metrics(page)).camera.actualDistance).toBeGreaterThan(5.8);const farther=await metrics(page);expect(farther.camera.position).not.toEqual(first.camera.position);expect(farther.fov).toBe(70);
 await page.screenshot({path:"artifacts/v061/after/third-person.png"});let s=await saved(page);expect(s.extension.camera).toMatchObject({perspective:"third",distance:6});await page.reload();await page.locator("#play").tap();await expect.poll(async()=>(await metrics(page)).camera.avatar).toBe(true);s=await saved(page);expect(s.extension.camera.distance).toBe(6);await context.close();
});

test("Baumkollision verkürzt die Sicht vorübergehend; Weglaufen stellt den Abstand wieder her",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),s=base([3.5,1.01,17.5],Math.PI,-.12);s.extension.camera.perspective="third";
 await seed(page,s);await expect.poll(async()=>(await metrics(page)).camera.blocked).toBe(true);expect((await metrics(page)).camera.actualDistance).toBeLessThan(3);const cdp=await context.newCDPSession(page),j=(await page.locator("#joystick").boundingBox())!;const t={id:1,x:j.x+j.width/2,y:j.y+8};
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[t]});await expect.poll(async()=>(await metrics(page)).nightfall.player.pos[2],{timeout:15000}).toBeGreaterThan(22);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await expect.poll(async()=>(await metrics(page)).camera.actualDistance,{timeout:10000}).toBeGreaterThan(3.9);expect((await saved(page)).extension.camera.distance).toBe(4);await context.close();
});

test("Kamera-Reset löst enge Sicht, bleibt nach Menüwechsel erreichbar und stoppt alte Eingaben",async({browser})=>{
 const context=await browser.newContext({viewport:{width:667,height:375},isMobile:true,hasTouch:true}),page=await context.newPage(),s=base([1,1.01,9],0,1.35);s.extension.camera={version:1,perspective:"third",distance:8};
 for(let x=0;x<3;x++)for(let z=8;z<14;z++)s.changes[`${x},3,${z}`]="Stein";
 await seed(page,s);await page.locator("#menu").tap();await page.locator("#camera-reset").tap();await expect(page.locator("#modal")).toBeHidden();await expect.poll(async()=>(await metrics(page)).camera.perspective).toBe("first");const m=await metrics(page);expect(m.fov).toBe(70);expect(m.nightfall.player.pitch).toBeCloseTo(-.12);expect(m.input).toEqual({joystick:null,look:null});
 await page.keyboard.down("KeyW");await expect.poll(async()=>(await metrics(page)).nightfall.player.pos[2],{timeout:10000}).toBeLessThan(8);await page.keyboard.up("KeyW");await context.close();
});

test("zwei Daumen, zusätzlicher Finger, Rotation und Browserwechsel behalten stabile Steuerung",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();await seed(page,base([0,1.01,9]));const cdp=await context.newCDPSession(page),j=(await page.locator("#joystick").boundingBox())!,a={id:1,x:j.x+j.width/2,y:j.y+8},b={id:2,x:520,y:150},c={id:3,x:600,y:150};
 await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[a,b]});await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[a,{...b,x:550}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[a,{...b,x:550},c]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[a,{...b,x:550}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[a]});
 await expect.poll(async()=>(await metrics(page)).nightfall.player.pos[2]).toBeLessThan(8.5);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});const m=await metrics(page);expect(m.nightfall.player.yaw).not.toBe(0);await expect(page.locator("#modal")).toBeHidden();
 await page.setViewportSize({width:390,height:844});await page.setViewportSize({width:844,height:390});await expect.poll(async()=>(await metrics(page)).input).toEqual({joystick:null,look:null});
 await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));});await expect(page.locator("#interruption")).toBeVisible();await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"));});await page.locator("#continue").tap();await expect(page.locator("#modal")).toBeHidden();await expect(page.locator("#interruption")).toBeHidden();await context.close();
});

test("Third-Person-Bauen, Abbauen und Inventar sind über kleine Touchflächen nutzbar",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),s=base([1,1.01,9],0,-.65);s.extension.camera.perspective="third";await seed(page,s);
 await page.locator("#selected-material").tap();await page.locator('[data-material="5"]').tap();await page.locator("#place").tap();let state=await saved(page);const key=Object.keys(state.changes).find(k=>state.changes[k]==="Glas");expect(key).toBeTruthy();await page.locator("#break").tap();state=await saved(page);expect(state.changes[key!]).toBeNull();
 await shortcut(page,"bag");await page.locator("#tool-tab").tap();await page.locator('[data-inventory-tool="Angel"]').tap();await page.locator("#close").tap();await expect(page.locator("#world")).toHaveAttribute("data-active-tool","Angel");await shortcut(page,"learn");await page.locator("#learning-answer").fill("Fisch");await page.locator("#answer-form button[type=submit]").click();await expect(page.locator("#learning-feedback")).toContainText("Geschafft");await context.close();
});

test("sichtbare Third-Person-Angel führt einen wirklichen Fang bis ins Inventar",async({browser})=>{
 test.setTimeout(100000);const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),s=base([-11,2.01,2],0,-.2);s.extension.tool="Angel";s.extension.camera.perspective="third";
 await seed(page,s);await page.locator("#interact").tap();await page.locator("#accept").tap();await landFish(page);const state=await saved(page);expect(Object.values(state.fish).reduce((a:number,b)=>a+Number(b),0)).toBe(4);await context.close();
});

test("Steuerungsoptionen, Linkshand-Belegung und Diagnoseexport bleiben gespeichert",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();await seed(page);await menuPage(page,"menu-camera");await page.locator("#camera-distance").fill("7.5");await page.locator("#joystick-size").fill("104");await page.locator("#control-opacity").fill("35");await page.locator("#handedness").selectOption("left");await page.locator("#sensitivity").fill("125");await page.locator("#close").tap();
 const j=(await page.locator("#joystick").boundingBox())!,a=(await page.locator("#mobile-actions").boundingBox())!;expect(j.x).toBeGreaterThan(a.x);expect(j.width).toBe(104);const state=await saved(page);expect(state.extension.controls).toEqual({joystickSize:104,opacity:.35,handedness:"left"});expect(state.extension.camera.distance).toBe(7.5);await menuPage(page,"menu-settings");const download=page.waitForEvent("download");await page.locator("#diagnostic-export").tap();expect((await download).suggestedFilename()).toBe("blockboom-diagnose.json");await context.close();
});

test("Export ist eine echte Datei; geprüfter Import überlebt Reload und legt eine Sicherung an",async({page})=>{
 await seed(page);await menuPage(page,"menu-settings");await page.locator("#save-transfer").click();const event=page.waitForEvent("download");await page.locator("#export-save").click();const download=await event;expect(download.suggestedFilename()).toBe("blockboom-spielstand.json");const stream=(await download.createReadStream())!;const chunks=[];for await(const chunk of stream)chunks.push(chunk);const original=JSON.parse(Buffer.concat(chunks).toString());expect(original.world.fish.Rotauge).toBe(2);
 await page.locator("#import-file").setInputFiles({name:"kaputt.json",mimeType:"application/json",buffer:Buffer.from("{kaputt")});await expect(page.locator("#apply-import")).toBeDisabled();
 const imported=structuredClone(original);imported.world.fish.Rotauge=29;imported.world.changes["2,1,7"]="Ziegel";await page.locator("#import-file").setInputFiles({name:"welt.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(imported))});await expect(page.locator("#apply-import")).toBeEnabled();await page.locator("#apply-import").click();await expect(page.locator("#play")).toBeVisible();await page.locator("#play").click();const s=await saved(page);expect(s.fish.Rotauge).toBe(29);expect(s.changes["2,1,7"]).toBe("Ziegel");expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.pre-import")!).world.fish.Rotauge)).toBe(2);
});

test("WebGL-Unterbrechung hält Menü und Kamera-Reset erreichbar und kann wieder fortgesetzt werden",async({page})=>{
 await seed(page);const before=(await metrics(page)).renderedFrames;const available=await page.evaluate(()=>!!(document.getElementById("world") as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context"));test.skip(!available,"Browser stellt keine kontrollierte WebGL-Kontextunterbrechung bereit");
 await page.evaluate(()=>{const gl=(document.getElementById("world") as HTMLCanvasElement).getContext("webgl2")!;(window as any).__lostContext=gl.getExtension("WEBGL_lose_context");(window as any).__lostContext.loseContext();});await expect(page.locator("#interruption")).toBeVisible();await page.locator("#menu").click();await expect(page.locator("#camera-reset")).toBeVisible();await page.locator("#camera-reset").click();
 await page.evaluate(()=>(window as any).__lostContext.restoreContext());await expect(page.locator("#continue")).toBeEnabled({timeout:10000});await page.locator("#resume").click();await expect(page.locator("#modal")).toBeHidden();await expect.poll(async()=>(await metrics(page)).lifecycle.webglLost).toBe(false);await expect.poll(async()=>(await metrics(page)).renderedFrames).toBeGreaterThan(before+3);expect((await metrics(page)).camera.perspective).toBe("first");
});

test("Browser-Vergrößerung wird vom Kameraabstand getrennt diagnostiziert",async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();await seed(page);const cdp=await context.newCDPSession(page),before=await metrics(page);
 await cdp.send("Emulation.setPageScaleFactor",{pageScaleFactor:2});await expect.poll(async()=>(await metrics(page)).renderedFrames).toBeGreaterThan(before.renderedFrames+2);expect(await page.evaluate(()=>window.visualViewport?.scale)).toBe(1);
 // Test-only HTML fixture: the browser must parse the zoom override before layout.
 // Dynamically changing viewport metadata races Chromium's scale constraints.
 const html=await page.evaluate(async()=>await(await fetch(location.href)).text());expect(html).toContain("maximum-scale=1,user-scalable=no");
 await page.route(page.url(),route=>route.fulfill({status:200,contentType:"text/html",body:html.replace("maximum-scale=1,user-scalable=no","maximum-scale=4,user-scalable=yes")}));await page.reload();await page.locator("#play").tap();await expect.poll(async()=>await page.locator("#world").getAttribute("data-performance")).not.toBeNull();
 await cdp.send("Emulation.setPageScaleFactor",{pageScaleFactor:2});await expect.poll(()=>page.evaluate(()=>window.visualViewport?.scale)).toBe(2);await expect.poll(async()=>(await metrics(page)).events.some((e:any)=>e.event==="browser-viewport-scale"&&e.detail==="2")).toBe(true);const enlarged=await metrics(page);expect(enlarged.fov).toBe(before.fov);expect(enlarged.camera.desiredDistance).toBe(before.camera.desiredDistance);
 await cdp.send("Emulation.setPageScaleFactor",{pageScaleFactor:1});await menuPage(page,"menu-settings");const event=page.waitForEvent("download");await page.locator("#diagnostic-export").tap();const stream=(await(await event).createReadStream())!,chunks=[];for await(const chunk of stream)chunks.push(chunk);const report=JSON.parse(Buffer.concat(chunks).toString());expect(report.events.some((e:any)=>e.event==="browser-viewport-scale"&&e.detail==="2")).toBe(true);expect(report.visualViewport.scale).toBe(1);await context.close();
});
