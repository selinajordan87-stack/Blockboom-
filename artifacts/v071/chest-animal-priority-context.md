# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: living-v06.spec.ts >> Möbelplatzierung und getrennte Truhe behalten Inhalt und Bauwerk
- Location: e2e/living-v06.spec.ts:45:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#target-label')
Expected substring: "Truhe"
Received string:    "Huhn · 16 LP"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#target-label') with timeout 5000ms
  - waiting for locator('#target-label')
    14 × locator resolved to <div id="target-label">Huhn · 16 LP</div>
       - unexpected value "Huhn · 16 LP"

```

```yaml
- text: Huhn · 16 LP
```

# Test source

```ts
  1  | import {test,expect,type Page} from "@playwright/test";
  2  | import {defaultExpansion} from "../src/inventory/Equipment";
  3  | import {shortcut} from "./ui-helper";
  4  | const blank=(position=[0,1.01,9],yaw=0,pitch=-.65)=>({version:1,position,yaw,pitch,changes:{} as Record<string,string|null>,fish:{Rotauge:2,Flussbarsch:1,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1},extension:defaultExpansion(4)});
  5  | async function seed(page:Page,s=blank()){
  6  |  await page.goto("./?diagnostics=1");await page.evaluate(v=>{localStorage.clear();localStorage.setItem("blockboom.save",JSON.stringify(v));},s);await page.reload();await page.locator("#play").click();await expect(page.locator("#hud")).toBeVisible();
  7  | }
  8  | async function save(page:Page){await page.locator("#menu").click();await page.locator("#save").click();const s=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));await page.locator("#resume").click();return s;}
  9  | async function travel(page:Page,pos:number[],yaw=0,pitch=-.5,prepare?:(s:any)=>void){await save(page);await page.goto("./?diagnostics=1");const s=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));Object.assign(s,{position:pos,yaw,pitch});prepare?.(s);await page.evaluate(v=>localStorage.setItem("blockboom.save",JSON.stringify(v)),s);await page.reload();await page.locator("#play").click();await expect.poll(async()=>{const raw=await page.locator("#world").getAttribute("data-performance");return raw?JSON.parse(raw).living.clock:0;}).toBeGreaterThan((s.extension.living.clock||0)+.4);}
  10 | async function metrics(page:Page){return page.locator("#world").evaluate(c=>JSON.parse((c as HTMLCanvasElement).dataset.performance!));}
  11 | async function tool(page:Page,name:string){await shortcut(page,"tool-toggle");await page.locator(`[data-tool="${name}"]`).click();}
  12 | async function material(page:Page,name:string){for(let i=0;i<8;i++){const b=page.getByRole("button",{name:`${name} auswählen`,exact:true});if(await b.count()){await b.click();return;}await page.locator("#material-next").click();}throw Error(`Material fehlt: ${name}`);}
  13 |
  14 | test("Regionen und Höhle sind erreichbar, äußere Bauwerke und alte Welt bleiben nach Reload",async({page})=>{
  15 |  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await seed(page,blank([27.5,1.01,-30],-Math.PI/2,0));
  16 |  await page.keyboard.down("KeyW");await expect.poll(async()=>{const raw=await page.locator("#world").getAttribute("data-performance");return raw?JSON.parse(raw).nightfall.player.pos[0]:0;},{timeout:20000}).toBeGreaterThan(42);await page.keyboard.up("KeyW");
  17 |  let s=await save(page);expect(s.position[1]).toBeLessThan(-3);await page.reload();await page.locator("#play").click();s=await save(page);expect(s.position[1]).toBeLessThan(-3);
  18 |  for(const p of [[-42,24,12],[-40,24,-35],[45,24,-40],[38,24,27]]){await travel(page,p);await expect.poll(async()=>{const raw=await page.locator("#world").getAttribute("data-performance");return raw?JSON.parse(raw).living.region:"";},{timeout:10000}).not.toBe("meadow");await page.waitForTimeout(300);}
  19 |  s=await save(page);expect(s.extension.living.regions).toEqual(expect.arrayContaining(["forest","lake","mountain","cave","village"]));
  20 |  await page.locator("#living-menu").click();await page.locator("#living-map").click();await expect(page.locator(".world-map")).toBeVisible();await page.screenshot({path:"artifacts/v06/map.png"});expect(errors).toEqual([]);
  21 | });
  22 |
  23 | test("sichtbares Erz wird zeitgesteuert abgebaut; Ofen und Kupferwerkzeug verbrauchen echte Vorräte",async({page})=>{
  24 |  const s=blank([39.5,-4.99,-30.5],Math.PI,.2);s.extension.tool="Spitzhacke";s.extension.nightfall.mode="Survival";s.extension.materials.Kupfererz=3;s.extension.materials.Holz=2;s.extension.nightfall.supplies.Kohle=3;
  25 |  await seed(page,s);await expect(page.locator("#target-label")).toContainText("Kohleerz");await page.keyboard.press("Minus");await expect(page.locator("#mining-progress")).toBeVisible();await expect(page.locator("#mining-progress")).toBeHidden({timeout:10000});
  26 |  let state=await save(page);expect(state.changes["39,-3,-28"]).toBeNull();expect(state.extension.materials.Kohleerz).toBe(1);
  27 |  await travel(page,[43.5,1.01,26.5],-Math.PI*.75,-.66);
  28 |  await expect(page.locator("#target-label")).toContainText("Ofen");await page.keyboard.press("KeyE");await expect(page.locator("#panel-tag")).toHaveText("OFEN");
  29 |  for(let i=0;i<3;i++)await page.locator('[data-living-recipe="Kupfer"]').click();await page.locator("#close").click();await page.locator("#living-menu").click();await page.locator("#living-tools").click();await page.locator('[data-living-recipe="Kupferspitzhacke"]').click();await page.locator("#close").click();
  30 |  state=await save(page);expect(state.extension.nightfall.crafted).toContain("Kupferspitzhacke");expect(state.extension.materials.Kupfererz).toBe(0);expect(state.extension.living.bag.Kupfer).toBe(0);
  31 | });
  32 |
  33 | test("Tier wird durch Füttern gezähmt, benannt und folgt nach Reload",async({page})=>{
  34 |  const s=blank([0,1.01,9],0,-.6);const a=s.extension.living.animals[0];a.pos=[0,1,7];a.home=[0,1,7];s.extension.nightfall.supplies.Fischgericht=2;
  35 |  await seed(page,s);await expect(page.locator("#target-label")).toContainText("Wolf");await page.keyboard.press("KeyE");await page.locator("#animal-feed").click();await page.locator("#animal-feed").click();await page.locator("#animal-name").fill("Fiete");await page.locator("#animal-name-save").click();await page.locator('[data-pet-mode="Folgen"]').click();
  36 |  let state=await save(page);expect(state.extension.living.animals[0]).toMatchObject({tame:true,name:"Fiete",mode:"Folgen"});await page.reload();await page.locator("#play").click();state=await save(page);expect(state.extension.living.animals[0].name).toBe("Fiete");
  37 | });
  38 |
  39 | test("Hacke, Aussaat, gespeichertes Wachstum und Ernte funktionieren auf Touch",async({browser})=>{
  40 |  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage();const s=blank([1,1.01,9]);s.extension.tool="Hacke";s.extension.nightfall.crafted.push("Hacke");
  41 |  await seed(page,s);await page.locator("#interact").tap();await expect(page.locator("#target-label")).toContainText("Acker");await page.locator("#interact").tap();let state=await save(page);expect(state.extension.living.crops).toHaveLength(1);const cell=state.extension.living.crops[0].cell;
  42 |  await page.goto("./?diagnostics=1");state=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));state.extension.living.clock+=200;await page.evaluate(v=>localStorage.setItem("blockboom.save",JSON.stringify(v)),state);await page.reload();await page.locator("#play").tap();await page.locator("#interact").tap();state=await save(page);expect(state.extension.living.crops).toHaveLength(0);expect(state.extension.living.bag.Weizen).toBe(3);expect(state.changes[cell.join(",")]).toBe("Acker");await context.close();
  43 | });
  44 |
  45 | test("Möbelplatzierung und getrennte Truhe behalten Inhalt und Bauwerk",async({page})=>{
> 46 |  await seed(page,blank([1.5,1.01,9]));await material(page,"Truhe");await page.keyboard.press("Equal");let state=await save(page);const key=Object.keys(state.changes).find(k=>state.changes[k]==="Truhe")!;expect(key).toBeTruthy();await travel(page,[1.5,1.01,9],0,-.45);await expect(page.locator("#target-label")).toContainText("Truhe");await page.keyboard.press("KeyE");await expect(page.locator("#panel-tag")).toHaveText("TRUHE");await page.locator('[data-store="fish:Rotauge"]').click();await page.locator("#close").click();state=await save(page);expect(state.extension.living.chests[key]["fish:Rotauge"]).toBe(1);expect(state.fish.Rotauge).toBe(1);
     |                                                                                                                                                                                                                                                                                                                        ^ Error: expect(locator).toContainText(expected) failed
  47 |  await page.keyboard.press("Minus");await expect(page.locator("#toast")).toContainText("Leere die Truhe");
  48 |  await page.reload();await page.locator("#play").click();await page.keyboard.press("KeyE");await page.locator('[data-take="fish:Rotauge"]').click();await page.locator("#close").click();state=await save(page);expect(state.fish.Rotauge).toBe(2);expect(state.changes[key]).toBe("Truhe");
  49 | });
  50 |
  51 | test("alte Welt wird vor v0.6 gesichert; echte Speicherquote schützt den letzten Stand",async({page})=>{
  52 |  const s:any=blank();delete s.extension.living;s.extension.materials.Holz=17;s.changes["2,1,7"]="Glas";
  53 |  await seed(page,s);const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save.pre-v06")!));expect(backup.changes).toEqual(s.changes);expect(backup.extension.living).toBeUndefined();
  54 |  const before=await save(page);expect(before.extension.materials.Holz).toBe(17);await page.locator("#menu").click();
  55 |  const original=await page.evaluate(async()=>{const raw=localStorage.getItem("blockboom.save")!;let low=0,high=6*1024*1024;
  56 |    while(low<high){const mid=Math.ceil((low+high)/2);try{localStorage.setItem("test-quota","x".repeat(mid));low=mid;}catch{high=mid-1;}await new Promise(r=>setTimeout(r,0));}
  57 |    localStorage.setItem("test-quota","x".repeat(low));return raw;
  58 |  });
  59 |  await page.locator("#resume").click();await page.keyboard.press("Equal");await expect(page.locator("#save-state")).toHaveText("Speicher nicht verfügbar");expect(await page.evaluate(()=>localStorage.getItem("blockboom.save"))).toBe(original);
  60 |  await page.evaluate(()=>localStorage.removeItem("test-quota"));const recovered=await save(page);expect(Object.keys(recovered.changes).length).toBeGreaterThan(Object.keys(before.changes).length);await page.reload();await page.locator("#play").click();expect((await save(page)).extension.materials.Holz).toBe(17);
  61 | });
  62 |
  63 | test("alle fünf Entdeckermissionen verbinden Zuhause, Tier, Bergbau und echte Schatztruhen",async({page})=>{
  64 |  test.setTimeout(180000);
  65 |  const s=blank([4.5,1.01,19],Math.PI,-.8);s.extension.nightfall.refuge=true;await seed(page,s);await material(page,"Bett");await page.keyboard.press("Equal");
  66 |  await expect.poll(async()=>{const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));return v.extension.living.completed;},{timeout:15000}).toContain("home");
  67 |  const homeState=await save(page),bed=Object.keys(homeState.changes).find(k=>homeState.changes[k]==="Bett")!.split(",").map(Number);
  68 |  await travel(page,[bed[0]+.5,bed[1]+.01,bed[2]-1.5],Math.PI,-.55,v=>{v.extension.nightfall.time=.75;v.extension.nightfall.health=50;v.extension.nightfall.difficulty="Friedlich";});
  69 |  await expect(page.locator("#target-label")).toContainText("Bett");await page.keyboard.press("KeyE");const morning=await save(page);expect(morning.extension.nightfall.time).toBeLessThan(.2);expect(morning.extension.nightfall.health).toBeGreaterThanOrEqual(75);
  70 |  await travel(page,[0,1.01,9],0,-.6,v=>{v.extension.living.animals[0].pos=[0,1,7];v.extension.living.animals[0].home=[0,1,7];v.extension.nightfall.supplies.Fischgericht=2;});await expect(page.locator("#target-label")).toContainText("Wolf");await page.keyboard.press("KeyE");await page.locator("#animal-feed").click();await page.locator("#animal-feed").click();await page.locator("#animal-name").fill("Fiete");await page.locator("#animal-name-save").click();await page.locator("#close").click();
  71 |  for(const [x,name]of [[39,"Kohleerz"],[40,"Kupfererz"],[41,"Stein"]] as const){await travel(page,[x+.5,-4.99,-30.5],Math.PI,.2);await tool(page,"Spitzhacke");await expect(page.locator("#target-label")).toContainText(name);await page.keyboard.press("Minus");if(name!=="Stein"){await expect(page.locator("#mining-progress")).toBeVisible();await expect(page.locator("#mining-progress")).toBeHidden({timeout:10000});}}
  72 |  await travel(page,[41.5,1.01,26.5],Math.PI,-.5);await expect(page.locator("#target-label")).toContainText("Schatztruhe");await page.keyboard.press("KeyE");let state=await save(page);expect(state.extension.living.blueprint).toBe(true);
  73 |  await travel(page,[49.5,-4.99,-30.5],0,-.6);await expect(page.locator("#target-label")).toContainText("Schatztruhe");await page.keyboard.press("KeyE");await expect.poll(async()=>{const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("blockboom.save")!));return v.extension.living.completed;},{timeout:15000}).toHaveLength(5);state=await save(page);expect(state.extension.living.looted).toContain("49,-5,-33");
  74 | });
  75 |
  76 | for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430}])test(`Wohnwelt mobil ${viewport.width}×${viewport.height}: Karte, Nahrung und Tiername mit Tastaturhöhe`,async({browser})=>{
  77 |  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage(),s=blank();s.extension.living.animals[0].tame=true;s.extension.living.bag.Karotte=2;s.extension.nightfall.hunger=40;
  78 |  await seed(page,s);await expect(page.locator("#compass")).toBeVisible();await expect(page.locator(".location")).toBeHidden();
  79 |  await shortcut(page,"living-menu");await page.locator("#living-map").tap();await expect(page.locator(".world-map")).toBeVisible();await page.locator("#mark-home").tap();await page.locator("#close").tap();
  80 |  await shortcut(page,"living-menu");await page.locator("#living-bag").tap();await page.locator('[data-category="Nahrung"]').tap();await page.locator('[data-eat="Karotte"]').tap();await page.locator("#close").tap();
  81 |  await shortcut(page,"living-menu");await page.locator("#living-pets").tap();await page.locator('[data-animal="animal-0"]').tap();await page.locator("#animal-name").tap();await page.setViewportSize({width:viewport.width,height:240});await page.locator("#animal-name").fill("Nala");await page.locator("#animal-name-save").tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator("#close").tap();
  82 |  const state=await save(page);expect(state.extension.living.animals[0].name).toBe("Nala");expect(state.extension.living.bag.Karotte).toBe(1);expect(state.extension.nightfall.hunger).toBeGreaterThan(65);expect(state.extension.living.home).not.toBeNull();await expect(page.locator("#interruption")).toBeHidden();await context.close();
  83 | });
  84 |
```
