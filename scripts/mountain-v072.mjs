import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {browserOptions} from './v07-player-journey.mjs';
const out=process.env.MOUNTAIN_OUT||'artifacts/v072/mountain/fixtures';
await mkdir(out,{recursive:true});
const browser=await chromium.launch(browserOptions);
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
// Identical controlled camera/save fixtures, deliberately NOT gameplay reachability evidence.
const scenes=[['distant',[0,1.02,17],-.87,.06],['far-ridge',[64,1.01,-45],-.93,.16],['approach',[100,1.01,-70],-.9,.16],['foot',[130,1.01,-90],-.5,.22],['summit',[145.5,26.01,-105.5],.7,-.2],['entrance',[128,1.01,-90],-Math.PI/2,-.1],['chamber',[158,-11.99,-90],Math.PI/2,-.08]].filter(([name])=>!process.env.MOUNTAIN_SCENES||process.env.MOUNTAIN_SCENES.split(',').includes(name));
for(const revision of [1,2])for(const[name,position,yaw,pitch]of scenes){
 await page.goto('http://127.0.0.1:4208/Blockboom-/?diagnostics=1');
 await page.evaluate(s=>{localStorage.clear();localStorage.setItem(s.revision===2?'blockboom.save.terrain2':'blockboom.save',JSON.stringify({version:1,position:s.position,yaw:s.yaw,pitch:s.pitch,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},settings:{sound:false,quality:1},extension:{version:1,edition:4,terrainRevision:s.revision,tool:'Spitzhacke',nightfall:{version:1,mode:'Kreativ',difficulty:'Friedlich',time:.32,dayLength:1200,refuge:true}}}));},{revision,position,yaw,pitch});
 await page.reload();await page.locator('#play').tap();
 await page.waitForFunction(()=>{const r=document.querySelector('#world')?.dataset.performance;if(!r)return false;const m=JSON.parse(r),p=m.nightfall.player.pos,c=m.camera.position;return m.renderedFrames>2&&Math.abs(p[0]-c[0])<.05&&Math.abs(p[2]-c[2])<.05&&m.chunk.queue===0&&m.streaming.pendingChunks===0;},{},{timeout:90000});
 await page.waitForTimeout(1200);await page.screenshot({path:`${out}/generation-${revision}-${name}.png`});
 const m=await page.locator('#world').evaluate(c=>JSON.parse(c.dataset.performance));
 results.push({revision,name,fixture:{position,yaw,pitch},actual:m.nightfall.player.pos,calls:m.calls,triangles:m.triangles,geometries:m.geometries,textures:m.textures,blocks:m.living.blocks,chunks:m.living.loadedChunks,chunk:m.chunk,streaming:m.streaming,frame:m.frame});
 console.log(JSON.stringify(results.at(-1)));
}
const comparisons=scenes.map(([name])=>{const a=results.find(r=>r.name===name&&r.revision===1),b=results.find(r=>r.name===name&&r.revision===2);return {name,identicalStandingPosition:Math.hypot(...a.actual.map((v,i)=>v-b.actual[i]))<.05};});
await writeFile(`${out}/metrics.json`,JSON.stringify({method:'Controlled save/camera comparison fixtures; Chromium SwiftShader, not device FPS or input-route proof. Only identicalStandingPosition pairs are valid same-position terrain comparisons.',errors,comparisons,results},null,2)+'\n');
await browser.close();if(errors.length)process.exitCode=1;
