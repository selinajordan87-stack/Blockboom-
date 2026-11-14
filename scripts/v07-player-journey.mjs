import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const browserOptions={executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** Input-only technical route. Coordinates are observed, never assigned. This is not a human finding-time test. */
export class FreshJourney{
 constructor(page,context,out='artifacts/v07/after') {this.page=page;this.context=context;this.out=out;this.events=[];this.errors=[];this.startedAt=Date.now();page.on('pageerror',e=>this.errors.push(e.message));}
 async start(url=process.env.BLOCKBOOM_TEST_URL||'http://127.0.0.1:4208/Blockboom-/'){
  await mkdir(this.out,{recursive:true});await this.page.goto(url+'?diagnostics=1');
  const text=await this.page.locator('.eyebrow').textContent();if(!/v0\.7/.test(text||''))throw Error(`Journey requires v0.7, found ${text}`);
  await this.page.locator('#play').tap();this.cdp=await this.context.newCDPSession(this.page);await this.fresh();this.events.push({event:'start',version:text,method:'fresh isolated context, UI and input only; technical known route, no save/position injection; no human finding-time claim'});
 }
 async metrics(){const raw=await this.page.locator('#world').getAttribute('data-performance');return raw?JSON.parse(raw):null;}
 async fresh(){const before=(await this.metrics())?.renderedFrames??-1;for(let i=0;i<40;i++){await delay(80);const m=await this.metrics();if(m&&m.renderedFrames>before)return m;}throw Error('No fresh diagnostic frame; game may be paused/interrupted');}
 async capture(name){const m=await this.fresh();await this.page.screenshot({path:`${this.out}/${name}.png`});this.events.push({event:'capture',name,seconds:(Date.now()-this.startedAt)/1000,position:m.nightfall.player.pos,region:m.living.region,frames:m.renderedFrames,performance:{calls:m.calls,geometries:m.geometries,textures:m.textures,frame:m.frame,chunk:m.chunk,stream:m.streaming,activeMeshes:m.activeMeshes,activeAnimals:m.activeAnimals,activeZombies:m.activeZombies,heap:m.heap}});return m;}
 async swipe(dx,dy=0){
  // Separate short swipes keep the contact in the right camera half and outside buttons.
  const size=this.page.viewportSize(),x=size.width*.72,y=Math.min(130,size.height*.33),n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/70));
  for(let i=0;i<n;i++){const t={id:90,x,y};await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t]});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...t,x:x+dx/n,y:y+dy/n}]});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 }
 async look(yaw,pitch=-.12){
  for(let i=0;i<3;i++){const m=await this.fresh(),p=m.nightfall.player,dy=angle(yaw-p.yaw),dp=pitch-p.pitch;if(Math.abs(dy)<.025&&Math.abs(dp)<.025)return;
   await this.swipe(-dy/.0035,-dp/.0035);
  }
  const p=(await this.fresh()).nightfall.player;if(Math.abs(angle(yaw-p.yaw))>.09)throw Error(`Look input did not reach yaw ${yaw}: ${p.yaw}`);
 }
 async aim(x,y,z){const p=(await this.fresh()).nightfall.player.pos,dx=x-p[0],dz=z-p[2];await this.look(Math.atan2(-dx,-dz),Math.atan2(y-(p[1]+1.6),Math.hypot(dx,dz)));await delay(100);}
 async move(side,forward,ms,jump=false){const r=await this.page.locator('#joystick').boundingBox();if(!r)throw Error('Joystick is not visible');const t={id:91,x:r.x+r.width/2+side*r.width*.36,y:r.y+r.height/2-forward*r.height*.36};await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t]});if(jump)await this.page.keyboard.press('Space');await delay(ms);await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 async walk(x,z,{tolerance=1.15,timeout=65000,name=`${x},${z}`}={}){
  const start=Date.now();let stalled=0,prev=null;
  while(Date.now()-start<timeout){const m=await this.fresh(),p=m.nightfall.player.pos,d=Math.hypot(x-p[0],z-p[2]);if(d<tolerance){this.events.push({event:'arrived',name,position:p,seconds:(Date.now()-start)/1000});return m;}
   if(prev&&Math.hypot(p[0]-prev[0],p[2]-prev[2])<.15)stalled++;else stalled=0;prev=[...p];
   await this.look(Math.atan2(-(x-p[0]),-(z-p[2])),-.12);await this.move(0,1,Math.min(1000,Math.max(180,(d-.5)/4.5*1000)),stalled>0);
   if(stalled===3||stalled===6)await this.move(stalled===3?1:-1,0,800,true);
   if(stalled>9)throw Error(`Route blocked at ${name}: ${JSON.stringify(p)}; no teleport fallback was used`);
  }
  throw Error(`Walk timeout at ${name}; position ${JSON.stringify((await this.metrics()).nightfall.player.pos)}; no teleport fallback was used`);
 }
 async menu(id){if(!await this.page.locator(`#${id}`).isVisible())await this.page.locator('#menu').tap();await this.page.locator(`#${id}`).tap();}
 async close(){if(await this.page.locator('#close').isVisible())await this.page.locator('#close').tap();}
 async save(){await this.menu('save');const state=await this.page.evaluate(()=>JSON.parse(localStorage.getItem('blockboom.save')));await this.page.locator('#resume').tap();return state;}
 async readEntry(id,photo){await this.menu('menu-book');await this.page.locator(`[data-book-entry="${id}"]`).tap();const text=await this.page.locator('#panel-content').innerText();this.events.push({event:'read-text',id,text});if(photo)await this.page.screenshot({path:`${this.out}/${photo}.png`});await this.page.locator('#note-done').tap();return text;}
 async finish(){try{await this.menu('menu-settings');await this.page.locator('#save-transfer').tap();const pending=this.page.waitForEvent('download');await this.page.locator('#export-save').tap();await(await pending).saveAs(`${this.out}/played-save.json`);const storage=await this.page.evaluate(()=>{const raw=localStorage.getItem('blockboom.save')||'',s=JSON.parse(raw);return {characters:raw.length,estimatedUTF16Bytes:raw.length*2,worldChanges:Object.keys(s.changes).length,mapTiles:s.extension.living.explored.length};});this.events.push({event:'export',method:'normal save export UI, actual played state',storage});}catch(error){this.events.push({event:'export-failure',message:String(error)});}await writeFile(`${this.out}/journey.json`,JSON.stringify({kind:'input-only known-route technical gameplay proof, not independent human exploration',events:this.events,errors:this.errors},null,2)+'\n');}
}

async function run(){
 const browser=await chromium.launch(browserOptions),context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),j=new FreshJourney(page,context,process.env.BLOCKBOOM_ARTIFACT_DIR||'artifacts/v07/after');
 try{
  await j.start();
  if(process.env.BLOCKBOOM_CONTINUE_SAVE){await j.menu('menu-settings');await page.locator('#save-transfer').tap();await page.locator('#import-file').setInputFiles(process.env.BLOCKBOOM_CONTINUE_SAVE);await page.locator('#apply-import').tap();await page.locator('#play').tap();await j.fresh();j.events.push({event:'continue',method:'actual previously exported played save imported through normal UI'});}
  await j.capture(process.env.BLOCKBOOM_CONTINUE_SAVE?'00-continued-played-position':'01-start-region');await j.capture('16-mobile-hud');
  await j.menu('menu-map');await page.screenshot({path:`${j.out}/15-discovery-map.png`});await j.close();
  await j.readEntry('start-plan','14-reading-adventure');
  await j.menu('night-menu');await page.locator('#difficulty').selectOption('Friedlich');await page.locator('#apply-night').tap();j.events.push({event:'setting',difficulty:'Friedlich',method:'normal settings UI; exploration control run, combat tested separately'});
  if(['overview','daylake'].includes(process.env.BLOCKBOOM_JOURNEY_ROUTE)){
   await j.menu('night-menu');await page.locator('#survival-mode').selectOption('Kreativ');await page.locator('#apply-night').tap();
   await j.menu('night-menu');await page.locator('#world-time').selectOption('0.3');await page.locator('#apply-night').tap();
   j.events.push({event:'photo-setting',method:'normal creative/time settings UI for daylight visibility; separate visual check, not fresh survival gameplay'});
  }
  const route=[
   {name:'forest',points:[[0,7],[-27,7],[-30,8]],photo:'02-forest'},
   {name:'lake',points:[[-26,7],[-26,-20],[-30,-35],[-36,-35]],photo:'04-lake'},
   {name:'mountain-approach',points:[[-25,-34],[20,-34],[26,-30]],photo:'06-cave-entrance'},
   {name:'old-mine',points:[[28,-30],[34,-30],[41,-30],[46,-30]],photo:'07-cave-interior'},
   {name:'old-settlement',points:[[41,-30],[34,-30],[27,-30],[24,-30],[24,20],[28,22]],photo:'08-abandoned-settlement',look:[42,3,34]},
   {name:'outer-settlement',points:[[28,22],[54,23],[64,27],[76,43],[88,59],[100,75]],photo:'08b-larger-settlement',look:[107,4,91]},
   {name:'mountains',points:[[88,59],[76,43],[64,27],[64,-45],[100,-70],[122,-84],[129,-90]],photo:'03-mountain',look:[145,18,-105]},
   {name:'outer-forest',points:[[149,-90],[143,-90],[137,-90],[131,-90],[129,-90],[122,-84],[100,-70],[64,-45],[64,27],[54,23],[24,23],[-24,23],[-64,23],[-108,30]],photo:'02b-outer-forest',look:[-115,4,25]},
   {name:'great-lake',points:[[-145,-25],[-145,-77],[-110,-78]],photo:'04b-great-lake',look:[-110,.4,-100]},
  ];
  const active=process.env.BLOCKBOOM_JOURNEY_ROUTE==='overview'?[{name:'mountain-overview',points:[[64,-30],[64,-45],[85,-60]],photo:'03-mountain-overview',look:[145,18,-105]}]:process.env.BLOCKBOOM_JOURNEY_ROUTE==='daylake'?[{name:'day-lake',points:[],photo:'04c-day-great-lake',look:[-110,.4,-100]}]:process.env.BLOCKBOOM_JOURNEY_ROUTE==='return-west'?[{...route[7],points:[[64,-30],[64,27],[54,23],[24,23],[-24,23],[-64,23],[-108,30]]},route[8]]:process.env.BLOCKBOOM_JOURNEY_ROUTE==='continue-mine'?route.slice(6).map((leg,i)=>i===0?{...leg,points:leg.points.slice(2)}:leg):process.env.BLOCKBOOM_JOURNEY_ROUTE==='outer'?route.slice(5):process.env.BLOCKBOOM_JOURNEY_ROUTE==='west'?route.slice(7):route;
  for(const leg of active){
   for(const [x,z]of leg.points)await j.walk(x,z,{name:`${leg.name}:${x},${z}`});
   if(leg.look)await j.aim(...leg.look);await j.capture(leg.photo);
   console.log(JSON.stringify({arrived:leg.name,elapsedSeconds:+((Date.now()-j.startedAt)/1000).toFixed(1)}));
   if(leg.name==='outer-settlement'){
    await j.walk(100.5,81.5,{tolerance:.65,name:'forge-front-door'});await j.aim(100.5,1.6,83.5);
    if(!(await page.locator('#target-label').textContent()).includes('Tür'))throw Error('Forge door was not actually targeted');
    await page.locator('#interact').tap();await j.walk(100.5,84.5,{tolerance:.65,name:'through-open-forge-door'});
    await j.readEntry('forge-diary','14b-forge-reading');await j.capture('08c-inside-forge');
    await j.walk(104.5,85.5,{tolerance:.65,name:'forge-store'});await j.aim(102.5,1.5,88.5);
    if(!(await page.locator('#target-label').textContent()).includes('Schatztruhe'))throw Error('Forge blueprint chest was not actually targeted');
    await page.locator('#interact').tap();await j.menu('menu-plan');await page.screenshot({path:`${j.out}/09-found-blueprint.png`});await j.close();
    await j.walk(100.5,84.5,{tolerance:.65,name:'return-to-forge-door'});
    await j.walk(100.5,80,{name:'leave-forge'});await j.walk(100,75,{name:'return-to-mine-trail'});
   }
   if(leg.name==='mountains'){
    await j.readEntry('mine-map','14c-mine-reading');
    for(const x of [132,137,143,149,154])await j.walk(x,-90,{name:`real-mine-descent:${x}`});
    await j.capture('07b-deep-mine');await j.readEntry('crystal-code','14d-chamber-reading');
    await j.aim(159.5,-11.5,-89.5);
    if(!(await page.locator('#target-label').textContent()).includes('Schatztruhe'))throw Error('Deep chamber chest was not actually targeted');
    await page.locator('#interact').tap();const state=await j.save();
    if(!state.extension.living.looted.includes('159,-12,-90'))throw Error('Deep chamber loot was not actually awarded');
    await j.capture('09b-chamber-find');
   }
   if(['great-lake','day-lake'].includes(leg.name)){await j.look(Math.PI,-.14);await j.capture('05-connected-river');}
  }
  await j.save();await page.reload();await page.locator('#play').tap();await j.capture('17-save-reload');
 }catch(error){j.events.push({event:'failure',message:String(error)});await page.screenshot({path:`j.out/failure.png`.replace('j.out',j.out)}).catch(()=>{});throw error;}finally{await j.finish();await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{console.error(e);process.exitCode=1;});
