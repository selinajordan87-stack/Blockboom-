import {test,expect,type Page} from '@playwright/test';
import {FreshJourney} from '../scripts/v07-player-journey.mjs';

async function fresh(page:Page,context:any){const j=new FreshJourney(page,context,'artifacts/v07/gameplay');await j.start();return j;}
const stored=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('blockboom.save')!));

test('v0.7 frischer Touchstart: sechs direkte Slots, echte Fundtexte und freiwillige Mathematik',async({browser})=>{
 test.setTimeout(120000);const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=await fresh(page,context);
 expect(await page.locator('#mobile-quickbar button').count()).toBe(6);
 for(const tool of ['Spitzhacke','Axt','Schwert','Angel']){await page.locator(`[data-quick-tool="${tool}"]`).tap();await expect(page.locator('#world')).toHaveAttribute('data-active-tool',tool);}
 const actions=await page.locator('#mobile-actions button:not(#jump)').evaluateAll(bs=>bs.filter(b=>!b.hidden&&getComputedStyle(b).display!=='none').length);expect(actions).toBeLessThanOrEqual(2);
 await expect(page.locator('#compass')).toBeVisible();await expect(page.locator('.location')).toBeHidden();
 await j.aim(2.5,1.15,14.5);await expect(page.locator('#interact')).toHaveAttribute('data-label','Lesen');await page.locator('#interact').tap();await expect(page.locator('#panel-content')).toContainText('Ein Platz für die Nacht');await page.locator('#note-hint').tap();await expect(page.locator('#note-feedback')).not.toBeEmpty();await page.locator('#note-done').tap();
 await j.menu('menu-book');await page.locator('[data-book-entry="wall-plan"]').tap();await page.locator('.discovery-task summary').tap();await page.locator('#note-answer').fill('31');await page.locator('#note-check').tap();await expect(page.locator('#note-feedback')).toContainText('Noch nicht');await page.locator('#note-hint').tap();await page.locator('#note-answer').fill('32');await page.locator('#note-check').tap();await expect(page.locator('#note-feedback')).toContainText('Das passt');await page.screenshot({path:'artifacts/v07/gameplay/reading-maths.png'});await page.locator('#note-done').tap();
 await j.menu('menu-log');expect(await page.locator('.discovery-goal').count()).toBeLessThanOrEqual(3);await j.close();const state=await j.save();expect(state.extension.discovery.read).toEqual(expect.arrayContaining(['start-plan','wall-plan']));expect(state.extension.discovery.answers['wall-plan'].history).toEqual([false,true]);expect(state.extension.discovery.completed).not.toContain('shelter');
 await page.reload();await page.locator('#play').tap();await j.menu('menu-book');await expect(page.locator('[data-book-entry="start-plan"]')).toBeVisible();expect(j.errors).toEqual([]);await context.close();
});

test('v0.7 neue Entdeckerkarte verbirgt unbekannte Orte und normale Bewegung erschließt den Wald',async({browser})=>{
 test.setTimeout(180000);const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=await fresh(page,context);
 await j.menu('menu-map');await expect(page.locator('.world-map')).toBeVisible();await expect(page.locator('.world-map')).not.toContainText('Verlassene Siedlung');await page.screenshot({path:'artifacts/v07/gameplay/map-before-discovery.png'});await j.close();
 for(const [x,z]of [[0,7],[-24,7],[-30,8]])await j.walk(x,z,{name:'forest-input-path'});const state=await j.save();expect(state.extension.living.regions).toContain('forest');await j.capture('forest-walked-from-start');await j.menu('menu-map');await expect(page.locator('.world-map')).toContainText('Wald');await page.reload();await page.locator('#play').tap();const restored=await j.save();expect(restored.extension.living.regions).toContain('forest');expect(Math.abs(restored.position[0]-state.position[0])).toBeLessThan(.5);expect(j.errors).toEqual([]);await context.close();
});

test('v0.7 Feld ist vom Start aus zu Fuß nutzbar: echte Ernte, Aussaat, aktive Wachstumszeit und Reload',async({browser})=>{
 test.setTimeout(270000);const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=await fresh(page,context);
 for(const [x,z]of [[0,14],[10.5,14],[10.5,18]])await j.walk(x,z,{name:'starter-garden-path'});
 await j.aim(9.5,.99,19.5);await expect(page.locator('#interact')).toHaveAttribute('data-label','Ernten');await page.locator('#interact').tap();let s=await j.save();expect(s.extension.living.bag.Kürbis).toBeGreaterThanOrEqual(3);expect(s.extension.discovery.harvested).toContain('Kürbis');
 await j.menu('menu-garden');await page.locator('[data-seed="Weizen"]').tap();await j.aim(9.5,.99,19.5);await expect(page.locator('#interact')).toHaveAttribute('data-label','Pflanzen');await page.locator('#interact').tap();s=await j.save();expect(s.extension.living.crops.some((c:any)=>c.kind==='Weizen'&&c.cell.join(',')==='9,0,19')).toBe(true);const plantedClock=s.extension.living.clock;
 await page.reload();await page.locator('#play').tap();await j.aim(9.5,.99,19.5);await j.capture('garden-real-growth');
 // No clock injection: the actual game runs until this newly planted wheat is ripe.
 await expect.poll(async()=>{const m=await j.metrics();return m?.living.clock||0;},{timeout:165000,intervals:[1000]}).toBeGreaterThan(plantedClock+121);
 await j.aim(9.5,.99,19.5);await expect(page.locator('#interact')).toHaveAttribute('data-label','Ernten');await page.locator('#interact').tap();s=await j.save();expect(s.extension.living.bag.Weizen).toBeGreaterThanOrEqual(3);expect(s.extension.discovery.harvested).toContain('Weizen');expect(j.errors).toEqual([]);await context.close();
});

test('v0.7 Langdruck-Inventar und zwei Daumen bleiben unabhängig vom neuen HUD',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=await fresh(page,context),cdp=j.cdp;
 const slot=(await page.locator('#quick-axe').boundingBox())!,hold={id:41,x:slot.x+slot.width/2,y:slot.y+slot.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[hold]});await expect(page.locator('#modal')).toBeVisible();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator('#close').tap();
 const joy=(await page.locator('#joystick').boundingBox())!,a={id:42,x:joy.x+joy.width/2,y:joy.y+10},b={id:43,x:610,y:140};const before=await j.metrics();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a,{...b,x:650}]});await page.waitForTimeout(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[a]});await page.waitForTimeout(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const after=await j.fresh();expect(after.nightfall.player.pos[2]).toBeLessThan(before.nightfall.player.pos[2]-.5);expect(after.nightfall.player.yaw).not.toBe(before.nightfall.player.yaw);await expect(page.locator('#modal')).toBeHidden();await expect.poll(async()=>(await j.metrics()).input).toEqual({joystick:null,look:null});expect(j.errors).toEqual([]);await context.close();
});
