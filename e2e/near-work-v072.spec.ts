import {test,expect} from '@playwright/test';
import {defaultExpansion} from '../src/inventory/Equipment';
test.use({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
test('touch swipes look down, mine nearby soil, undo and retain world after reload',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const extension=defaultExpansion(4);extension.camera={version:1,perspective:'third',distance:6};extension.tool='Spitzhacke';extension.nightfall.mode='Kreativ';extension.nightfall.difficulty='Friedlich';
 const save={version:1,extension,position:[0,1.01,9],yaw:0,pitch:-.12,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1}};
 await page.goto('./?diagnostics=1');await page.evaluate(s=>localStorage.setItem('blockboom.save',JSON.stringify(s)),save);await page.reload();await page.locator('#play').tap();
 const cdp=await context.newCDPSession(page);
 const swipe=async(distance:number)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,x:570,y:95}]});
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:2,x:570,y:95+distance*i/5}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 await swipe(100);
 await expect(page.locator('#break')).toBeVisible();await page.locator('#break').tap();
 await page.locator('#menu').tap();await page.locator('#save').tap();
 const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('blockboom.save')!));
 const removed=Object.entries(changed.changes).find(([,b])=>b===null);expect(removed).toBeTruthy();
 const [x,,z]=removed![0].split(',').map(Number);expect(Math.hypot(x+.5,z+.5-9)).toBeLessThan(3);
 await page.locator('#menu-undo').tap();await page.locator('#menu').tap();await page.locator('#save').tap();
 expect(await page.evaluate(k=>JSON.parse(localStorage.getItem('blockboom.save')!).changes[k],removed![0])).toBeTruthy();
 await page.locator('#resume').tap();await swipe(180);await swipe(180);
 await expect.poll(()=>page.locator('#world').evaluate(c=>JSON.parse((c as HTMLElement).dataset.performance!).nightfall.player.pitch)).toBeLessThan(-1.5);
 await page.reload();await page.locator('#play').tap();await expect(page.locator('#modal')).toBeHidden();expect(errors).toEqual([]);
});
