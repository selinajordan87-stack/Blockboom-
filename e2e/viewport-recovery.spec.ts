import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';

// Exercise the actual built CSS and app in Chromium, with iOS-style stale
// visualViewport values. This does not emulate an actual iPhone WebKit engine.
for(const scale of [1,1.6])test(`viewport fills page after stale browser metrics, scale ${scale}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(({scale})=>{
  Object.defineProperty(window,'visualViewport',{value:{width:726/scale,height:254/scale,scale,offsetLeft:scale===1?59:0,offsetTop:0,addEventListener(){},removeEventListener(){}}});
 },{scale});
 const page=await context.newPage();
 await page.route('http://blockboom.test/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  await route.fulfill({path:resolve('dist',path==='/'?'index.html':path.slice(1))});
 });
 await page.goto('http://blockboom.test/');
 await expect.poll(()=>page.evaluate(()=>document.getElementById('app')?.style!==undefined&&getComputedStyle(document.documentElement).getPropertyValue('--game-width'))).toBe('844px');
 const dimensions=await page.evaluate(()=>{
  const app=document.getElementById('app')!.getBoundingClientRect(),canvas=document.getElementById('world')!.getBoundingClientRect();
  return {left:app.left,top:app.top,width:app.width,height:app.height,canvasWidth:canvas.width,canvasHeight:canvas.height};
 });
 expect(dimensions.left).toBe(0);expect(dimensions.top).toBe(0);
 expect(dimensions.width*scale).toBeCloseTo(844);expect(dimensions.height*scale).toBeCloseTo(390);
 expect(dimensions.canvasWidth).toBeCloseTo(dimensions.width);expect(dimensions.canvasHeight).toBeCloseTo(dimensions.height);
 await context.close();
});
