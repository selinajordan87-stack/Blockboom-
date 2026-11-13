import { World, MIN_Y, MAX_Y, type Cell, type Block } from "../world/World";
import { collides, solid } from "../nightfall/Defense";
import { type LivingState, type Animal, type CropKind, CROPS } from "./State";
import { ItemStore } from "./Items";
import { regionAt } from "./Regions";
export const GROWTH:Record<CropKind,number>={Weizen:120,Karotte:150,Kartoffel:180,Kürbis:210};
export const stage=(s:LivingState,c:{kind:CropKind;planted:number})=>Math.min(3,Math.floor((s.clock-c.planted)/GROWTH[c.kind]*3));
export function farm(world:World,store:ItemStore,cell:Cell){
 const s=store.expansion.living,b=world.get(...cell),key=cell.join(",");
 const crop=s.crops.find(c=>c.cell.join(",")===key);
 if(crop){if(stage(s,crop)<3)return "Die Pflanze wächst noch. Du kannst inzwischen weiterbauen oder erkunden.";
   store.add(crop.kind,3);store.add(`Samen:${crop.kind}`,2);s.crops=s.crops.filter(c=>c!==crop);return `${crop.kind} geerntet: 3 Ernte und 2 Samen.`;}
 if(b==="Gras"||b==="Erde"){if(store.expansion.tool!=="Hacke")return "Bereite den Boden mit der Hacke vor.";world.set(...cell,"Acker");return "Acker vorbereitet. Wähle Samen im Gartenmenü und pflanze mit Benutzen.";}
 if(b!=="Acker")return "Pflanze auf vorbereitetem Acker.";
 if(s.crops.length>=160)return "Dein Garten ist bereits groß. Ernte zunächst einige Pflanzen.";
 if(world.get(cell[0],cell[1]+1,cell[2]))return "Über dem Acker braucht die Pflanze freien Platz.";
 if(!store.add(`Samen:${s.selectedSeed}`,-1))return "Für diese Pflanze fehlen Samen.";
 s.crops.push({cell:[...cell],kind:s.selectedSeed,planted:s.clock});return `${s.selectedSeed} gepflanzt.`;
}
export function feed(animal:Animal,store:ItemStore){
 let foods=animal.kind==="Wolf"||animal.kind==="Katze"?["supply:Fischgericht",...Object.keys(store.fish).map(f=>`fish:${f}`)]:["Weizen","Karotte","Kartoffel","supply:Beeren"];
 const food=foods.find(f=>store.count(f)>0);if(!food||!store.add(food,-1))return false;
 animal.hunger=Math.min(100,animal.hunger+35);animal.trust=Math.min(3,animal.trust+1);if(animal.trust>=2)animal.tame=true;animal.action="Fressen";return true;
}
function animalFloor(w:World,x:number,z:number,around:number){
 for(let y=Math.min(MAX_Y,Math.floor(around));y>=MIN_Y;y--)if(solid(w.get(Math.floor(x),y,Math.floor(z))))return y+1;
 return null;
}
export function updateAnimals(s:LivingState,w:World,player:Cell,dt:number){
 for(const a of s.animals){
  const distance=Math.hypot(a.pos[0]-player[0],a.pos[2]-player[2]);
  if(a.tame&&a.mode==="Folgen"&&distance>22){const p:Cell=[player[0]+1,player[1],player[2]+1];if(!collides(w,p,.8,.25)){a.pos=p;a.home=[...p];}}
  if(distance>30)continue;
  a.hunger=Math.max(0,a.hunger-dt*.02);a.phase+=dt;
  if(a.mode==="Schlafen"){a.action="Schlafen";continue;}
  if(a.tame&&a.mode==="Warten"){a.action="Ruhen";continue;}
  const following=a.tame&&a.mode==="Folgen";
  if(following&&distance<2){a.action="Ruhen";continue;}
  if(!following&&Math.sin(a.phase*.25)> .8){a.action="Ruhen";continue;}
  const tx=following?player[0]:a.home[0]+Math.sin(a.phase*.24)*2.5,tz=following?player[2]:a.home[2]+Math.cos(a.phase*.18)*2.5;
  const dx=tx-a.pos[0],dz=tz-a.pos[2],len=Math.hypot(dx,dz)||1,step=Math.min(len,dt*(following?3: .7));
  const next:Cell=[a.pos[0]+dx/len*step,a.pos[1],a.pos[2]+dz/len*step],floor=animalFloor(w,next[0],next[2],a.pos[1]);
  if(floor!==null&&Math.abs(floor-a.pos[1])<=1.05){next[1]=floor+.001;if(!collides(w,next,.75,.24)){a.pos=next;a.heading=Math.atan2(dx,dz);a.action="Gehen";}}
  // Tamed animals cannot die; an edited wall sends them to their saved safe home.
  if(a.tame&&collides(w,a.pos,.7,.2)&&!collides(w,a.home,.7,.2))a.pos=[...a.home];
 }
}
export const EXPLORER=[
 {id:"home",name:"Das erste Zuhause",hint:"Platziere Bett, Tür und Licht in einem geschlossenen Raum."},
 {id:"pet",name:"Der treue Begleiter",hint:"Füttere ein Tier zweimal und gib ihm einen Namen."},
 {id:"ore",name:"Unter der Erde",hint:"Betritt die Kupferhöhle und baue drei verschiedene Rohstoffe ab."},
 {id:"forge",name:"Das Geheimnis der Schmiede",hint:"Finde die Truhe in der alten Schmiede. Ihr Bauplan gehört zur Geschichte."},
 {id:"treasure",name:"Der Schatz im Berg",hint:"Folge dem Plan zur Kammer tief im Silbergebirge und öffne ihre Truhe."},
] as const;
export function sheltered(w:World,pos:Cell){
 const x=Math.floor(pos[0]),y=Math.floor(pos[1]),z=Math.floor(pos[2]);
 const roof=Array.from({length:6},(_,i)=>w.get(x,y+i+1,z)).some(solid);
 const enclosed=([[1,0],[-1,0],[0,1],[0,-1]] as const).every(([dx,dz])=>Array.from({length:5},(_,i)=>w.get(x+dx*(i+1),y,z+dz*(i+1))).some(solid));
 return roof&&enclosed;
}
export function checkMissions(s:LivingState,w:World){
 const bed=!s.completed.includes("home")&&s.placed.filter(k=>w.get(...k.split(",").map(Number) as Cell)==="Bett").some(k=>{
   const p=k.split(",").map(Number) as Cell;
   if(!sheltered(w,[p[0],p[1]+1,p[2]]))return false;
   let door=false,light=false;
   for(let dx=-6;dx<=6;dx++)for(let dy=-6;dy<=6;dy++)for(let dz=-6;dz<=6;dz++){
     if(dx*dx+dy*dy+dz*dz>=49)continue;const b=w.get(p[0]+dx,p[1]+dy,p[2]+dz);
     door ||= b==="Tür";light ||= b==="Fackel"||b==="Laterne";if(door&&light)return true;
   }
   return false;
 });
 const success=[bed,s.animals.some(a=>a.tame&&a.name.trim().length>0),s.regions.includes("cave")&&s.mined.length>=3,s.blueprint,s.looted.includes("49,-5,-33")];
 const earned:string[]=[];for(let i=0;i<EXPLORER.length;i++)if(success[i]&&!s.completed.includes(EXPLORER[i].id)&&(i===0||s.completed.includes(EXPLORER[i-1].id))){s.completed.push(EXPLORER[i].id);earned.push(EXPLORER[i].name);s.bag.Bergkristall=(s.bag.Bergkristall||0)+1;}return earned;
}
export function discover(s:LivingState,p:Cell){const r=regionAt(...p);if(!s.regions.includes(r.id)){s.regions.push(r.id);return r;}return null;}
export function mining(block:Block,tool:string){const tier=tool==="Eisenspitzhacke"?3:tool==="Kupferspitzhacke"?2:tool==="Spitzhacke"?1:0;
 const required=block==="Golderz"?3:block==="Eisenerz"?2:1;
 return {allowed:tier>=required,seconds:Math.max(.35,2.4-tier*.55),required};}
export function loot(s:LivingState,store:ItemStore,cell:Cell){const id=cell.join(",");if(s.looted.includes(id))return "Hier hast du bereits alles gefunden.";
 if(!["41,1,28","49,-5,-33"].includes(id))return "Diese Truhe enthält keinen alten Fund.";
 if(id==="49,-5,-33"&&!s.blueprint)return "Ein Zeichen der alten Schmiede fehlt. Suche dort den Bauplan.";
 s.looted.push(id);
 if(id==="41,1,28"){s.blueprint=true;store.add("Bauplan",1);store.add("Altes Buch",1);return "Bauplan gefunden: Unter dem Berg, hinter Kupfer, liegt die Kristallkammer. Die Schmiede wurde nach einem Sturm verlassen.";}
 store.add("Bergkristall",3);store.add("Gold",2);return "Bergschatz: drei Kristalle und zwei Goldbarren! Die alten Bergleute haben ihre Spur hinterlassen.";}
