import {test,expect} from "@playwright/test";
import {defaultExpansion} from "../src/inventory/Equipment";
test.use({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
for(const shore of [{id:"east",x:-82,yaw:Math.PI/2},{id:"west",x:-138,yaw:-Math.PI/2}])test(`großer See: farbige Fischgruppe am ${shore.id}-Ufer über dem Seegrund`,async({page})=>{
 const extension=defaultExpansion(4);extension.nightfall.difficulty="Friedlich";extension.tool="Angel";
 const save={version:1,position:[shore.x,-.99,-110],yaw:shore.yaw,pitch:-.25,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},settings:{sound:false,quality:1},extension};
 await page.goto("./?diagnostics=1");await page.evaluate(s=>localStorage.setItem("blockboom.save",JSON.stringify(s)),save);await page.reload();await page.locator("#play").tap();
 const metrics=()=>page.locator("#world").evaluate(c=>JSON.parse((c as HTMLCanvasElement).dataset.performance!));
 await expect.poll(async()=>(await metrics()).living.clock).toBeGreaterThan(.5);
 const m=await metrics(),group=m.fish.filter((f:any)=>f.alive&&f.z<-90&&(shore.id==="east"?f.x>-96&&f.x<-75:f.x<-125));
 expect(group).toHaveLength(2);expect(m.nightfall.player.pos[1]).toBeGreaterThan(-1.1);expect(group.every((f:any)=>f.y> -1)).toBe(true);
 await page.screenshot({path:`artifacts/v071/lake-${shore.id}-fish.png`});
 const before=group.map((f:any)=>[f.x,f.z]);await page.waitForTimeout(1100);const later=(await metrics()).fish.filter((f:any)=>group.some((a:any)=>a.id===f.id));expect(later.map((f:any)=>[f.x,f.z])).not.toEqual(before);
});
