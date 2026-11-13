import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='artifacts/v07/before';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const records=[];
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:4207/Blockboom-/?diagnostics=1');await p.locator('#play').tap();await p.waitForTimeout(1300);
const cdp=await context.newCDPSession(p);
async function snap(name){const v=await p.locator('#world').evaluate(c=>JSON.parse(c.dataset.performance));records.push({name,time:Date.now(),pos:v.nightfall.player.pos,region:v.living.region,animalCount:v.living.animals.length,camera:v.camera,renderedFrames:v.renderedFrames});await p.screenshot({path:`${out}/${name}.png`});console.log(JSON.stringify(records.at(-1)));}
async function walk(x,y,seconds,name){const r=await p.locator('#joystick').boundingBox(),t={id:1,x:r.x+r.width/2+x*r.width*.34,y:r.y+r.height/2-y*r.height*.34};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t]});for(let i=0;i<seconds;i++){await p.waitForTimeout(1000);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(1100);await snap(name);}
await snap('01-new-player-start');
await p.locator('#menu').tap();await p.locator('#menu-adventure').tap();await p.locator('#living-map').tap();await p.screenshot({path:`${out}/02-map-full-known.png`});records.push({name:'map-visible-without-discovery',text:await p.locator('#panel-content').innerText()});await p.locator('#close').tap();
await p.locator('#menu').tap();await p.locator('#menu-adventure').tap();await p.locator('#living-garden').tap();await p.screenshot({path:`${out}/03-garden-hidden-in-menu.png`});records.push({name:'garden-menu',text:await p.locator('#panel-content').innerText()});await p.locator('#close').tap();
await p.locator('#menu').tap();await p.locator('#menu-adventure').tap();await p.locator('#living-tools').tap();await p.screenshot({path:`${out}/04-hacke-recipe.png`});records.push({name:'recipes',text:await p.locator('#panel-content').innerText()});await p.locator('#close').tap();
await walk(0,1,2,'05-north-from-start');await walk(-1,0,10,'06-west-toward-forest');await walk(0,1,10,'07-north-toward-lake');
await walk(1,0,15,'08-east-toward-mountains');await walk(0,-1,12,'09-south-toward-village');
await p.locator('#menu').tap();await p.locator('#save').tap();const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('blockboom.save')));await p.locator('#resume').tap();await p.reload();await p.locator('#play').tap();await p.waitForTimeout(1300);await snap('10-ordinary-reload');
records.push({name:'save-metadata',savedPosition:saved.position,regions:saved.extension.living.regions,animalCount:saved.extension.living.animals.length,crops:saved.extension.living.crops.length,errors});await writeFile(`${out}/player-audit.json`,JSON.stringify(records,null,2)+'\n');await browser.close();
