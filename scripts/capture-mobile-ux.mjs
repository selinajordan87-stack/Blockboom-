import {chromium} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
const phase=process.argv[2]||"after",out=`artifacts/v061/${phase}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const result=[];
try{
 for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
  for(const mode of ["world","fishing"]){
   await page.goto("http://127.0.0.1:4206/Blockboom-/?diagnostics=1");
   await page.evaluate(({mode})=>{localStorage.clear();localStorage.setItem("blockboom.save",JSON.stringify({version:1,position:mode==="world"?[0,1.01,17]:[-11,2.01,2],yaw:0,pitch:-.2,changes:{},fish:{Rotauge:0,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{quality:1,sound:false},extension:{version:1,edition:4,tool:mode==="world"?"Bauwerkzeug":"Angel",nightfall:{version:1,mode:"Kreativ",time:.3}}}));},{mode});
   await page.reload();await page.locator("#play").tap();await page.waitForTimeout(1200);
   const coverage=await page.evaluate(()=>{
    const selectors=["header button",".brand",".location","#mission-pin","#survival-hud","#night-actions","#joystick",".touch-actions","#context","footer","#angling-hud","#mobile-actions","#mobile-quickbar"];
    const mask=new Uint8Array(innerWidth*innerHeight);const rects=[];
    for(const el of document.querySelectorAll(selectors.join(","))){const s=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height||s.visibility==="hidden"||s.display==="none")continue;rects.push({id:el.id||el.className,x:r.x,y:r.y,w:r.width,h:r.height});for(let y=Math.max(0,Math.floor(r.top));y<Math.min(innerHeight,r.bottom);y++)for(let x=Math.max(0,Math.floor(r.left));x<Math.min(innerWidth,r.right);x++)mask[y*innerWidth+x]=1;}
    return {fraction:mask.reduce((a,b)=>a+b,0)/mask.length,rects};
   });
   result.push({viewport,mode,...coverage});await page.screenshot({path:`${out}/${viewport.width}-${mode}.png`});
  }
  await context.close();
 }
 await writeFile(`${out}/coverage.json`,JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result.map(({viewport,mode,fraction})=>({viewport,mode,fraction})),null,2));
}finally{await browser.close();}
