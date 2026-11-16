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
  // Content, not just the overlay rectangle, must stay reachable in short windows.
  await page.locator('#start').evaluate(el=>{el.scrollTop=0;});
  expect(await page.locator('.start-copy').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.locator('.start-copy > small').scrollIntoViewIfNeeded();
  expect(await page.locator('.start-copy > small').evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(size.height);
 }
 await expect(page.locator('#viewport-debug')).toHaveCount(0);
 await page.locator('#play').click();
 await expect(page.locator('#start')).toBeHidden();
 await expect.poll(()=>page.locator('#world').evaluate(el=>el.getBoundingClientRect().height)).toBe(390);
 expect(errors).toEqual([]);
 await context.close();
});

test('opt-in diagnosis reports viewport and asset identity without resizing the game',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:330},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://blockboom.test/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/Blockboom-\//,'/');
  await route.fulfill({path:resolve('dist',path==='/'?'index.html':path.slice(1))});
 });
 await page.goto('http://blockboom.test/?debugViewport=1');
 await expect(page.locator('#viewport-debug #values')).toContainText('app 844 × 330');
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('#viewport-debug #values')).toContainText('app 390 × 844');
 await page.setViewportSize({width:844,height:390});
 await expect(page.locator('#viewport-debug #values')).toContainText('app 844 × 390');
 // Exercise the manual-copy fallback (clipboard may be blocked in embedded browsers).
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('blocked'))}}));
 await page.getByRole('button',{name:'Werte kopieren'}).click();
 const report=page.getByRole('textbox',{name:'Diagnose zum Kopieren'});
 await expect(report).toBeVisible();
 const data=JSON.parse(await report.inputValue());
 expect(data.diagnostic).toBe('v075-1');
 expect(data.window.innerHeight).toBe(390);
 expect(data.app.height).toBe(390);
 expect(data.canvas.height).toBe(390);
 expect(data.cameraAspect).toBeCloseTo(844/390,2);
 expect(data.assets.some((url:string)=>url.includes('/assets/index-'))).toBe(true);
 expect(data.recent.length).toBeLessThanOrEqual(8);
 await page.locator('#viewport-debug summary').click();
 await expect(page.locator('#viewport-debug section')).toBeHidden();
 expect(errors).toEqual([]);
 await context.close();
});
