import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';

// Chrome/iOS itself is not available in CI. This reproduces the relevant
// container contract: the document must not be a second fixed clipping box,
// and app/canvas/start must follow the browser viewport as its visible height
// changes (for example when browser bars appear or disappear).
test('single fullscreen container follows landscape browser-height changes',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  Object.defineProperty(window,'innerHeight',{get:()=>254});
  const clientHeight=Object.getOwnPropertyDescriptor(Element.prototype,'clientHeight')!.get!;
  Object.defineProperty(Element.prototype,'clientHeight',{get(){return this===document.documentElement?254:clientHeight.call(this);}});
  Object.defineProperty(window,'visualViewport',{value:{width:844,height:254,scale:1,offsetLeft:0,offsetTop:0,addEventListener(){},removeEventListener(){}}});
 });
 const page=await context.newPage();
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://blockboom.test/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/Blockboom-\//,'/');
  await route.fulfill({path:resolve('dist',path==='/'?'index.html':path.slice(1))});
 });
 await page.goto('http://blockboom.test/');
 await expect(page.locator('#play')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--game-scale'))).toBe('1');
 const root=await page.evaluate(()=>({
  bodyPosition:getComputedStyle(document.body).position,
  appPosition:getComputedStyle(document.getElementById('app')!).position,
  appRight:getComputedStyle(document.getElementById('app')!).right,
  appBottom:getComputedStyle(document.getElementById('app')!).bottom,
 }));
 expect(root).toMatchObject({bodyPosition:'static',appPosition:'fixed',appRight:'0px',appBottom:'0px'});
 for(const size of [{width:844,height:390},{width:390,height:844},{width:844,height:330},{width:844,height:390}]){
  await page.setViewportSize(size);
  await expect.poll(()=>page.locator('#app').evaluate(el=>Math.round(el.getBoundingClientRect().height))).toBe(size.height);
  const actual=await page.evaluate(()=>{
   const app=document.getElementById('app')!,world=document.getElementById('world')!.getBoundingClientRect(),start=document.getElementById('start')!.getBoundingClientRect();
   return {
    world:{width:world.width,height:world.height,left:world.left,top:world.top},
    start:{width:start.width,height:start.height,left:start.left,top:start.top},
    appAspect:app.clientWidth/app.clientHeight,
    scroll:document.scrollingElement!.scrollWidth>document.scrollingElement!.clientWidth,
   };
  });
  for(const r of [actual.world,actual.start]){
   expect(r.width).toBe(size.width);expect(r.height).toBe(size.height);expect(r.left).toBe(0);expect(r.top).toBe(0);
  }
  await expect.poll(()=>page.locator('#world').evaluate((el:HTMLCanvasElement)=>el.width/el.height)).toBeCloseTo(size.width/size.height,2);
  expect(actual.appAspect).toBeCloseTo(size.width/size.height,2);expect(actual.scroll).toBe(false);
 }
 expect(errors).toEqual([]);
 await context.close();
});
