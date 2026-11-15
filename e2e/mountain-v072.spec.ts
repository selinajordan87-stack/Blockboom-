import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
test.use({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
for(const[name,position,yaw,pitch]of [
 ['start',[0,1.02,17],0,-.12],
 ['foot',[130,1.01,-90],-.5,.22],
 ['summit',[145.5,25.01,-105.5],.7,-.2],
 ['chamber',[158,-11.99,-90],Math.PI/2,-.08],
] as const)test(`experimenteller Berg: Renderbudget ${name}`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./?diagnostics=1');
 await page.evaluate(({position,yaw,pitch})=>{localStorage.clear();localStorage.setItem('blockboom.save.terrain2',JSON.stringify({version:1,position,yaw,pitch,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},settings:{sound:false,quality:1},extension:{version:1,edition:4,terrainRevision:2,tool:'Spitzhacke',nightfall:{version:1,mode:'Kreativ',difficulty:'Friedlich',time:.32,dayLength:1200,refuge:true}}}));},{position,yaw,pitch});
 await page.reload();await page.locator('#play').tap();
 await page.waitForFunction(()=>{const r=(document.querySelector('#world') as HTMLElement)?.dataset.performance;if(!r)return false;const m=JSON.parse(r),p=m.nightfall.player.pos,c=m.camera.position;return m.renderedFrames>2&&Math.abs(p[0]-c[0])<.05&&Math.abs(p[2]-c[2])<.05&&m.chunk.queue===0&&m.streaming.pendingChunks===0;});
 const m=await page.locator('#world').evaluate(c=>JSON.parse((c as HTMLElement).dataset.performance!));
 expect(Math.hypot(m.nightfall.player.pos[0]-position[0],m.nightfall.player.pos[2]-position[2])).toBeLessThan(.5);
 expect(m.calls).toBeGreaterThan(0);expect(m.calls).toBeLessThanOrEqual(110);expect(m.triangles).toBeLessThanOrEqual(40000);
 expect(m.living.blocks).toBeGreaterThan(10000);expect(m.living.loadedChunks).toBeLessThanOrEqual(37);
 expect(m.textures).toBeLessThanOrEqual(4);expect(m.chunk.queue).toBe(0);expect(errors).toEqual([]);
 const metrics=info.outputPath('metrics.json'),photo=info.outputPath(`${name}.png`);
 await writeFile(metrics,JSON.stringify({method:'Controlled camera fixture, Chromium SwiftShader; no device FPS claim',...m},null,2));
 await page.screenshot({path:photo});
 await info.attach('controlled-fixture-metrics',{path:metrics,contentType:'application/json'});
 await info.attach(name,{path:photo,contentType:'image/png'});
});

test('Revision-2-Export, Import, Sicherung und Reload behalten Terrain und Deltas',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('blockboom.save',JSON.stringify({version:1,position:[0,1.02,17],yaw:0,pitch:0,changes:{'0,10,17':'Glas'},fish:{Rotauge:1,Flussbarsch:0,Hecht:0},settings:{quality:1}}));localStorage.setItem('blockboom.save.terrain2',JSON.stringify({version:1,position:[130,1.01,-90],yaw:0,pitch:0,changes:{'145,26,-105':'Glas','145,-5,-105':null},fish:{Rotauge:3,Flussbarsch:0,Hecht:0},settings:{sound:false,quality:1},extension:{version:1,edition:4,terrainRevision:2}}));});
 const legacy=await page.evaluate(()=>localStorage.getItem('blockboom.save'));
 await page.reload();await page.locator('#play').tap();await page.locator('#menu').tap();await page.locator('#menu-settings').tap();await page.locator('#save-transfer').tap();
 const download=page.waitForEvent('download');await page.locator('#export-save').tap();const file=await(await download).path();
 expect(file).toBeTruthy();expect(JSON.parse(await readFile(file!,'utf8')).version).toBe(2);await page.locator('#import-file').setInputFiles(file!);await page.locator('#apply-import').tap();
 await expect(page.locator('#play')).toBeVisible();await page.locator('#play').tap();
 const saved=await page.evaluate(()=>({legacy:localStorage.getItem('blockboom.save'),world:JSON.parse(localStorage.getItem('blockboom.save.terrain2')!),backup:JSON.parse(localStorage.getItem('blockboom.pre-import')!)}));
 expect(saved.legacy).toBe(legacy);expect(saved.world.extension.terrainRevision).toBe(2);expect(saved.world.changes['145,26,-105']).toBe('Glas');expect(saved.world.changes['145,-5,-105']).toBeNull();expect(saved.backup.version).toBe(2);
});
