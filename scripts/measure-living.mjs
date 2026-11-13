import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Run against a production preview; measurements describe software WebGL only.
const base=process.env.BLOCKBOOM_TEST_URL||"http://127.0.0.1:4206/Blockboom-/";
const out=process.env.BLOCKBOOM_ARTIFACT_DIR||"artifacts/v06";
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const report={base,renderer:"Chromium / SwiftShader, no physical device",measurements:[],scenes:[],errors:[]};
const state=(quality=1,position=[0,1.01,17],yaw=0,pitch=-.12)=>({version:1,position,yaw,pitch,changes:{},fish:{Rotauge:0,Flussbarsch:1,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality},extension:{version:1,edition:4,nightfall:{version:1,mode:"Kreativ",time:.32,difficulty:"Friedlich",refuge:true}}});
async function start(page,s){
 await page.goto(base+"?diagnostics=1");await page.evaluate(v=>{localStorage.clear();localStorage.setItem("blockboom.save",JSON.stringify(v));},s);await page.reload();await page.locator("#play").click();
 await page.waitForFunction(()=>{const raw=document.querySelector("#world")?.getAttribute("data-performance");return raw&&JSON.parse(raw).living.clock>.5;});
}
const metrics=page=>page.locator("#world").evaluate(c=>JSON.parse(c.dataset.performance));
try{
 for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430}])for(const quality of [1,1.5]){
  const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();page.on("pageerror",e=>report.errors.push(e.message));
  await start(page,state(quality));const first=await metrics(page),at=Date.now();await page.waitForTimeout(2300);const last=await metrics(page);
  const memory=await page.evaluate(()=>({heap:performance.memory?.usedJSHeapSize||null,localStorageUTF16Bytes:Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i);return(k.length+localStorage.getItem(k).length)*2;}).reduce((a,b)=>a+b,0)}));
  report.measurements.push({viewport,requestedQuality:quality,effectiveRatio:last.ratio,calls:last.calls,triangles:last.triangles,geometries:last.geometries,textures:last.textures,chunks:last.chunks,activeChunks:last.living.loadedChunks,blocks:last.living.blocks,softwareFPS:+((last.renderedFrames-first.renderedFrames)/((Date.now()-at)/1000)).toFixed(1),...memory});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1100,height:650}}),page=await context.newPage();page.on("pageerror",e=>report.errors.push(e.message));
 for(const [name,pos,yaw,pitch]of [["wolf",[-5,1.01,18],0,-.28],["forest",[-42,10,18],0,-.25],["village",[38.5,10,22],Math.PI,-.3],["mountain",[48,15,-24],0,.1],["lake",[-40,7,-21],0,-.15],["cave",[44.5,-4.99,-30.5],0,-.12]]){
  const s=state(1,pos,yaw,pitch);if(name==="cave")s.changes["43,-4,-29"]="Fackel";
  await start(page,s);await page.waitForTimeout(1300);await page.screenshot({path:`${out}/${name}.png`});const m=await metrics(page);report.scenes.push({name,calls:m.calls,triangles:m.triangles,geometries:m.geometries,chunks:m.chunks,activeChunks:m.living.loadedChunks,blocks:m.living.blocks});
 }
 await page.locator("#menu").click();await page.locator("#save").click();report.storage=await page.evaluate(()=>{const raw=localStorage.getItem("blockboom.save"),s=JSON.parse(raw);s.changes={};for(let i=0;i<50000;i++)s.changes[`${i%119-59},${Math.floor(i/14161)-17},${Math.floor(i/119)%119-59}`]="Kupfererz";return{sampleSaveUTF16Bytes:raw.length*2,fiftyThousandDeltasUTF16Bytes:JSON.stringify(s).length*2};});await context.close();
 await writeFile(`${out}/measurements.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
}finally{await browser.close();}
