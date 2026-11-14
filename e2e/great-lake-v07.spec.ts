import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {FreshJourney} from '../scripts/v07-player-journey.mjs';

// Unedited export of the actually walked discovery journey; imported through the UI.
test('großer See: erspielten Stand importieren, Steg betreten und einen echten Fisch mit Touch angeln',async({browser})=>{
 test.setTimeout(210000);
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage(),j=new FreshJourney(page,context,'artifacts/v07/great-lake-play');
 await j.start();await j.menu('menu-settings');await page.locator('#save-transfer').tap();
 await page.locator('#import-file').setInputFiles(fileURLToPath(new URL('./fixtures/played-discovery-v07.json',import.meta.url)));
 await page.locator('#apply-import').tap();await page.locator('#play').tap();await j.fresh();
 for(const[x,z]of [[-115,-77],[-115,-85]])await j.walk(x,z,{tolerance:.7,name:'real-wooden-jetty'});
 await page.locator('[data-quick-tool="Angel"]').tap();await j.look(0,-.12);
 await expect(page.locator('#fish-action')).toBeVisible();await j.capture('12-rod-on-great-lake-jetty');
 const before=await j.save(),cdp=j.cdp;
 const pulse=async(ms:number)=>{const b=(await page.locator('#fish-action').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:72,x:b.x+b.width/2,y:b.y+b.height/2}]});await page.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 let landed=false;
 for(let attempt=0;attempt<3&&!landed;attempt++){
  await pulse(850);await expect.poll(async()=>(await j.metrics()).angling.spot).toBe('great');
  await expect.poll(()=>page.locator('#angling-state').textContent(),{timeout:20000}).toContain('BISS');
  const m=await j.metrics(),fish=m.fish.find((f:any)=>f.id===m.angling.target);expect(fish.x).toBeLessThan(-80);expect(fish.z).toBeLessThan(-70);
  await pulse(180);await expect.poll(()=>page.locator('#angling-state').textContent()).toContain('Drill');
  const until=Date.now()+60000;
  while(Date.now()<until&&!await page.locator('#modal').isVisible()){
   if((await page.locator('#angling-state').textContent())?.includes('Bereit'))break;
   const tension=Number.parseFloat((await page.locator('#line-tension').getAttribute('style'))?.match(/[\d.]+/)?.[0]||'0');
   if(tension<62)await pulse(340);else await page.waitForTimeout(230);
  }
  landed=await page.locator('#modal').isVisible();
 }
 expect(landed).toBe(true);await expect(page.locator('#panel-tag')).toHaveText('DEIN FANG');
 await page.screenshot({path:'artifacts/v07/great-lake-play/12-great-lake-catch.png'});await page.locator('#release-fish').tap();
 const after=await j.save();expect(after.extension.catches.length).toBeGreaterThan(before.extension.catches.length);
 expect(after.extension.catches.some((c:any)=>c.spot==='great'&&c.method==='Angel'&&c.length>0)).toBe(true);
 await page.reload();await page.locator('#play').tap();const reloaded=await j.save();expect(reloaded.extension.catches).toEqual(after.extension.catches);expect(j.errors).toEqual([]);
 await context.close();
});
