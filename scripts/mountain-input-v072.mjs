import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {FreshJourney,browserOptions} from './v07-player-journey.mjs';
const out='artifacts/v072/mountain/input';await mkdir(out,{recursive:true});
const browser=await chromium.launch(browserOptions),context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=new FreshJourney(page,context,out);
try{
 await page.goto('http://127.0.0.1:4208/Blockboom-/');
 // Revision 2 has no product activation yet. Bootstrap a fresh experimental
 // world at the NORMAL spawn, with no deltas; never move the player by script.
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('blockboom.save.terrain2',JSON.stringify({version:1,position:[0,1.02,17],yaw:0,pitch:-.12,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},settings:{sound:false,quality:1},extension:{version:1,edition:4,terrainRevision:2,tool:'Spitzhacke',nightfall:{version:1,mode:'Kreativ',difficulty:'Friedlich',time:.32,dayLength:1200,refuge:true}}}));});
 await j.start('http://127.0.0.1:4208/Blockboom-/');
 j.events.push({event:'experimental-bootstrap',method:'Revision-2 fixture at normal new-game spawn. No position writes after load. All travel uses CDP touch joystick/camera and normal Space jump; known route, not human finding-time proof.'});
 await j.capture('01-start-distant');
 const walk=async(x,z,name)=>{await j.walk(x,z,{name,timeout:180000,tolerance:.7});console.log(JSON.stringify({arrived:name,pos:(await j.metrics()).nightfall.player.pos}));};
 for(const[x,z]of [[0,23],[12,24],[24,24],[54,23],[64,27],[64,-45],[100,-70],[122,-84],[130,-90]])await walk(x,z,`approach:${x},${z}`);
 await j.aim(145,24,-105);await j.capture('02-foot');
 const path=[[112,-108],[127,-132],[155,-132],[166,-111],[145,-105]];
 for(let i=0;i<path.length;i++){const[x,z]=path[i];await walk(x,z,`ascent:${i}`);await j.look(i===4?Math.PI:.2,-.12);await j.capture(['03-serpentine','04-middle','05-viewpoint','06-upper-ridge','07-summit'][i]);}
 await j.look(.6,-.3);await j.capture('08-valley');
 for(const[x,z]of [...path.slice(0,-1).reverse(),[130,-90]])await walk(x,z,`descent:${x},${z}`);
 await j.aim(137,-2,-90);await j.capture('09-entrance');
 for(const[x,z]of [[137,-90],[147,-90],[147,-106]])await walk(x,z,`first-chamber:${x},${z}`);
 await j.capture('10-first-chamber');
 for(const[x,z]of [[147,-90],[154,-90],[158,-90]])await walk(x,z,`deep-chamber:${x},${z}`);
 await j.aim(159.5,-11.5,-89.5);await j.capture('11-deep-chamber');
 for(const[x,z]of [[154,-90],[147,-90],[137,-90],[130,-90]])await walk(x,z,`return:${x},${z}`);
 await j.capture('12-return');const saved=await j.save();await page.reload();await page.locator('#play').tap();await j.capture('13-reload');
 if(saved.extension.terrainRevision!==2)throw Error('Terrain revision lost during save');
 j.events.push({event:'passed',method:'Normal-spawn approach, ascent, descent, both chambers, return, save/reload'});
}catch(error){j.events.push({event:'failure',message:String(error)});await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});console.error(error);process.exitCode=1;}
finally{await j.finish();await writeFile(`${out}/status.json`,JSON.stringify({errors:j.errors,events:j.events},null,2));await browser.close();}
