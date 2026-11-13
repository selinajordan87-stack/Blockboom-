import { expect,test,type Page } from "@playwright/test";
import {shortcut} from "./ui-helper";
const base=()=>({version:1,position:[0,1.01,9],yaw:0,pitch:-.1,changes:{},fish:{Rotauge:0,Flussbarsch:1,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1},extension:{version:1,edition:4,materials:{Holz:10,Stein:10},nightfall:{version:1,mode:"Kreativ",time:.3,dayLength:1200}}});
async function seed(page:Page,save=base()){
  await page.goto("./?diagnostics=1");await page.evaluate(s=>{localStorage.clear();localStorage.setItem("blockboom.save",JSON.stringify(s));},save);await page.reload();await page.locator("#play").click();
}
async function nightMenu(page:Page){await page.locator("#menu").click();await page.locator("#night-menu").click();}
async function setNight(page:Page){await nightMenu(page);await page.locator("#world-time").selectOption("0.75");await page.locator("#apply-night").click();await expect(page.locator("#day-label")).toContainText("Nacht");}
async function metrics(page:Page){return page.locator("#world").evaluate(c=>JSON.parse((c as HTMLCanvasElement).dataset.performance!));}
async function save(page:Page){await page.locator("#menu").click();await page.locator("#save").click();const s=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));await page.locator("#resume").click();return s;}

test("Tag/Nacht, drei Zombiearten, echte Verfolgung und friedlicher Modus",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const s=base();s.extension.nightfall={...s.extension.nightfall,time:.75,...{night:5}};await seed(page,s);
  await expect.poll(async()=>{
    const raw=await page.locator("#world").getAttribute("data-performance");
    return raw?JSON.parse(raw).nightfall.zombies.length:0;
  },{timeout:12000}).toBeGreaterThan(0);
  const before=await metrics(page);expect(before.nightfall.zombies.length).toBeGreaterThan(0);expect(new Set(before.nightfall.zombies.map((z:any)=>z.kind))).toEqual(new Set(["normal","fast","heavy"]));
  await page.waitForTimeout(1600);const after=await metrics(page);expect(after.nightfall.zombies[0].pos).not.toEqual(before.nightfall.zombies[0].pos);
  await page.screenshot({path:"artifacts/v05/zombie-night.png"});
  await nightMenu(page);await page.locator("#difficulty").selectOption("Friedlich");await page.locator("#apply-night").click();await expect(page.locator("#wave-label")).toBeEmpty();
  expect(errors).toEqual([]);
});

test("Survival-Werkbank verbraucht Material; Fisch kochen, essen und Reload",async({page})=>{
  await seed(page);await nightMenu(page);await page.locator("#survival-mode").selectOption("Survival");await page.locator("#apply-night").click();
  await nightMenu(page);await page.locator("#open-crafting").click();await page.locator('[data-recipe="Bretter"]').click();await page.locator('[data-recipe="Holzschwert"]').click();await page.locator("#close").click();
  let state=await save(page);expect(state.extension.materials).toMatchObject({Holz:7,Bretter:2});expect(state.extension.nightfall.crafted).toContain("Holzschwert");
  for(let i=0;i<11;i++){
    await page.keyboard.press("KeyQ");
    expect(["Bogen","Steinschwert","Steinaxt"]).not.toContain(await page.locator("#tool-toggle").textContent());
  }
  await nightMenu(page);await page.locator("#open-food").click();await page.locator('[data-cook="Flussbarsch"]').click();await page.locator("#eat-fish").click();await page.locator("#close").click();
  state=await save(page);expect(state.fish.Flussbarsch).toBe(0);expect(state.extension.nightfall.supplies.Fischgericht).toBe(0);
  await page.reload();await page.locator("#play").click();state=await save(page);expect(state.extension.nightfall.crafted).toContain("Holzschwert");expect(state.extension.materials.Holz).toBe(7);
});

test("Schreibkampf schützt die Eingabe, hilft nach Fehlern und wirkt ohne Zeitlimit",async({page})=>{
  await seed(page);await setNight(page);await expect(page.locator("#word-battle")).toBeVisible({timeout:15000});await page.locator("#word-battle").click();
  await expect(page.locator("#battle-clock")).toBeHidden();await page.locator("#battle-answer").fill("Abenteur");await page.locator("#battle-submit").click();await expect(page.locator("#battle-feedback")).toContainText("Versuche");
  await page.locator("#battle-hint").click();await expect(page.locator("#battle-feedback")).toContainText("Aben-teu-er");
  await page.waitForTimeout(1300);await page.locator("#battle-answer").fill("Abenteuer");await page.locator("#battle-submit").click();await expect(page.locator("#battle-feedback")).toContainText("Zauber wirkt");
  await page.locator("#battle-leave").click();const s=await save(page);expect(s.extension.nightfall.writing.history).toEqual([false,true]);expect(s.extension.nightfall.writing.wins).toBe(1);expect(s.extension.nightfall.defeated).toBeGreaterThan(0);
});

test("Pause friert einen laufenden Angriff ein; alte Saves erhalten eine Sicherung",async({page})=>{
  const s=base();s.extension.nightfall.time=.75;await seed(page,s);await page.waitForTimeout(1000);await page.locator("#menu").click();await page.locator("#save").click();
  const before=await page.evaluate(()=>localStorage.getItem("blockboom.save"));await page.waitForTimeout(1800);await page.locator("#save").click();const after=await page.evaluate(()=>localStorage.getItem("blockboom.save"));expect(after).toBe(before);
});

test("echter Zombieangriff führt zum freundlichen Wiedereinstieg ohne Inventarverlust",async({page})=>{
  const s=base();Object.assign(s.extension.nightfall,{mode:"Survival",time:.75,health:1,hunger:30});await seed(page,s);
  await expect(page.locator("#respawn")).toBeVisible({timeout:45000});await page.locator("#respawn").click();await expect(page.locator("#modal")).toBeHidden();
  const state=await save(page);expect(state.extension.nightfall.health).toBe(100);expect(state.fish.Flussbarsch).toBe(1);expect(state.extension.materials.Holz).toBe(10);
});

test("Haustür öffnet beide Zellen, Spieler geht hindurch und offene Tür bleibt gespeichert",async({page})=>{
  const s=base();s.position=[4.5,1.01,15.5];s.yaw=Math.PI;s.pitch=-.3;Object.assign(s.extension.nightfall,{refuge:true});await seed(page,s);
  await expect(page.locator("#interact")).toContainText("Öffnen");await page.keyboard.press("KeyE");
  let state=await save(page);expect(state.changes["4,1,17"]).toBe("Tür offen");expect(state.changes["4,2,17"]).toBe("Tür offen");
  await page.keyboard.down("KeyW");await expect.poll(async()=>((await metrics(page)).nightfall.player.pos[2]),{timeout:15000}).toBeGreaterThan(18);await page.keyboard.up("KeyW");state=await save(page);expect(state.position[2]).toBeGreaterThan(18);
  await page.reload();await page.locator("#play").click();state=await save(page);expect(state.changes["4,1,17"]).toBe("Tür offen");
});

test("v0.4-Save erhält eine pre-v05-Sicherung und alle bisherigen Angelwerte",async({page})=>{
  const s=base();delete (s.extension as any).nightfall;await seed(page,s);await save(page);
  const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save.pre-v05")!));expect(backup.fish.Flussbarsch).toBe(1);expect(backup.extension.materials.Holz).toBe(10);expect(backup.extension.nightfall).toBeUndefined();
});

test("offene Tür abbauen und Undo erhalten einen gültigen Tür-Vorrat nach Reload",async({page})=>{
  const s=base();s.position=[4.1,1.01,15.5];s.yaw=Math.PI;s.pitch=-.3;
  Object.assign(s.extension.nightfall,{refuge:true});Object.assign(s.changes,{"4,1,17":"Tür offen","4,2,17":"Tür offen"});
  await seed(page,s);await expect(page.locator("#target-label")).toContainText("Tür offen");
  await page.keyboard.press("Minus");let state=await save(page);expect(state.extension.materials.Tür).toBe(1);expect(state.extension.materials["Tür offen"]).toBeUndefined();
  await page.locator("#undo").click();state=await save(page);expect(state.extension.materials.Tür).toBe(0);
  await page.keyboard.press("Minus");await page.reload();await page.locator("#play").click();state=await save(page);expect(state.extension.materials.Tür).toBe(1);
});

test("Nahkampf über sichtbare Waffe trifft einen echten Zombie und belohnt den Sieg",async({page})=>{
  await seed(page);await setNight(page);await page.locator("#tool-toggle").click();await page.locator('[data-tool="Schwert"]').click();
  await expect(page.locator("#world")).toHaveAttribute("data-active-tool","Schwert");
  let yaw=0,pitch=-.1,kills=0;
  for(let attempt=0;attempt<24&&!kills;attempt++){
    await page.waitForTimeout(600);const data=await metrics(page);
    const z=data.nightfall.zombies.filter((z:any)=>z.hp>0).sort((a:any,b:any)=>Math.hypot(a.pos[0],a.pos[2]-9)-Math.hypot(b.pos[0],b.pos[2]-9))[0];
    if(!z)break;
    const nextYaw=Math.atan2(-z.pos[0],-(z.pos[2]-9)),nextPitch=Math.atan2(z.pos[1]+1-2.6,Math.hypot(z.pos[0],z.pos[2]-9));
    const dx=(yaw-nextYaw)/.0035,dy=(pitch-nextPitch)/.0035,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/65)||1;
    await page.dispatchEvent("#look","pointerdown",{pointerId:31,pointerType:"touch",clientX:0,clientY:0});
    for(let i=1;i<=n;i++)await page.dispatchEvent("#look","pointermove",{pointerId:31,pointerType:"touch",clientX:dx*i/n,clientY:dy*i/n});
    await page.dispatchEvent("#look","pointerup",{pointerId:31,pointerType:"touch"});yaw=nextYaw;pitch=nextPitch;
    await page.keyboard.press("KeyF");
    kills=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!)?.extension?.nightfall?.defeated||0);
  }
  expect(kills).toBeGreaterThan(0);await page.screenshot({path:"artifacts/v05/melee.png"});
});

test("drei Touchkontakte: Bewegung, Kamera und Angriff bleiben unabhängig",async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage();await seed(page);
  await page.locator("#tool-toggle").tap();await page.locator('[data-tool="Schwert"]').tap();await expect(page.locator("#attack")).toBeVisible();
  const joy=(await page.locator("#joystick").boundingBox())!,look=(await page.locator("#look").boundingBox())!,attack=(await page.locator("#attack").boundingBox())!,cdp=await context.newCDPSession(page);
  const a={id:1,x:joy.x+joy.width/2,y:joy.y+12},b={id:2,x:look.x+30,y:look.y+70},c={id:3,x:attack.x+attack.width/2,y:attack.y+attack.height/2};
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[a,b]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[a,{...b,x:b.x+25}]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[a,{...b,x:b.x+25},c]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[c]});
  await expect(page.locator("#world")).toHaveAttribute("data-tool-action","strike");await page.waitForTimeout(300);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await expect(page.locator("#modal")).toBeHidden();await expect(page.locator("#interruption")).toBeHidden();
  const state=await save(page);expect(state.position[2]).toBeLessThan(8.9);expect(state.yaw).not.toBe(0);await context.close();
});

for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430}])test(`Schreibkampf mobil ${viewport.width}×${viewport.height} mit Tastaturhöhe`,async({browser})=>{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();
  await seed(page);await setNight(page);await expect.poll(async()=>{const raw=await page.locator("#world").getAttribute("data-performance");return raw?JSON.parse(raw).nightfall.zombies.length:0;},{timeout:15000}).toBeGreaterThan(0);await shortcut(page,"word-battle");
  await page.locator("#battle-answer").tap();await page.setViewportSize({width:viewport.width,height:240});await page.locator("#battle-answer").fill("Abenteuer");await page.locator("#battle-submit").tap();await expect(page.locator("#battle-feedback")).toContainText("Zauber wirkt");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/v05/writing-${viewport.width}.png`});await page.locator("#battle-leave").tap();await expect(page.locator("#modal")).toBeHidden();await context.close();
});
