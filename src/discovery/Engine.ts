import type {Expansion} from "../inventory/Equipment";
import {World,key,type Cell,type Block} from "../world/World";
import {solid} from "../nightfall/Defense";
import {CHAPTERS,NOTES,type WorldNote,type BookEntry} from "./Content";
import type {DiscoveryState} from "./State";
const add=(list:string[],id:string)=>{if(!list.includes(id))list.push(id);};
const distance=(a:Cell,b:Cell)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const WALLS=new Set<Block>(["Gras","Erde","Stein","Holz","Bretter","Glas","Sand","Ziegel","Laub","Kopfstein","Ton","Moosstein","Dunkelholz","Kalkstein","Schiefer","Mauer","Barriere","Tür","Tür offen","Tor","Tor offen"]);
export interface ShelterCheck {built:boolean;bed:boolean;walls:boolean;roof:boolean;door:boolean;light:boolean;workbench:boolean;chest:boolean;}
const noShelter=():ShelterCheck=>({built:false,bed:false,walls:false,roof:false,door:false,light:false,workbench:false,chest:false});
/** Only recorded, still-existing construction counts: the generated starter hut cannot qualify. */
export function ownShelter(world:World):ShelterCheck {
  const own=(x:number,y:number,z:number)=>{const id=key(x,y,z),b=world.get(x,y,z);return b&&world.changes[id]!==undefined&&world.changes[id]!==null?b:undefined;};
  const beds=Object.keys(world.changes).filter(id=>world.changes[id]==="Bett"&&world.get(...id.split(",").map(Number) as Cell)==="Bett").slice(-12);
  let best=noShelter();
  for(const id of beds){
    const [x,y,z]=id.split(",").map(Number),check=noShelter();check.bed=true;
    const wall=(xx:number,zz:number)=>[y,y+1].every(yy=>WALLS.has(own(xx,yy,zz)!));
    const edge=(dx:number,dz:number)=>{for(let d=1;d<=6;d++)if(wall(x+dx*d,z+dz*d))return d;return 0;};
    const west=edge(-1,0),east=edge(1,0),north=edge(0,-1),south=edge(0,1);
    if(west&&east&&north&&south){
      const minX=x-west,maxX=x+east,minZ=z-north,maxZ=z+south;
      check.walls=true;
      for(let xx=minX;xx<=maxX;xx++)for(let zz=minZ;zz<=maxZ;zz++){
        if(xx===minX||xx===maxX||zz===minZ||zz===maxZ){
          if(!wall(xx,zz))check.walls=false;
          for(let yy=y;yy<=y+1;yy++)if(["Tür","Tür offen","Tor","Tor offen"].includes(own(xx,yy,zz)||""))check.door=true;
        }
      }
      check.roof=true;
      for(let xx=minX+1;xx<maxX;xx++)for(let zz=minZ+1;zz<maxZ;zz++){
        let covered=false;for(let yy=y+2;yy<=y+5;yy++)covered ||= solid(own(xx,yy,zz));if(!covered)check.roof=false;
      }
      for(let xx=minX+1;xx<maxX;xx++)for(let zz=minZ+1;zz<maxZ;zz++)for(let yy=y;yy<=y+4;yy++){
        const block=own(xx,yy,zz);check.light ||= block==="Fackel"||block==="Laterne";check.workbench ||= block==="Werkbank";check.chest ||= block==="Truhe";
      }
    }
    check.built=check.bed&&check.walls&&check.roof&&check.door&&check.light&&check.workbench&&check.chest;
    if(check.built)return check;
    if(Object.values(check).filter(Boolean).length>Object.values(best).filter(Boolean).length)best=check;
  }
  return best;
}
export interface DiscoveryGoal {id:string;title:string;hint:string;detail:string;}
export class DiscoveryEngine {
  shelter: ShelterCheck=noShelter();
  private revision=-1;
  constructor(public state:DiscoveryState,public expansion:Expansion){}
  event(name:string,detail=""){
    if(!this.state.enabled)return;
    const s=this.state;
    if(name==="gather"){
      if(detail==="Holz"||detail==="Dunkelholz")s.gatheredHolz=Math.min(1e6,s.gatheredHolz+1);
      if(detail==="Stein"||detail==="Kopfstein")s.gatheredStein=Math.min(1e6,s.gatheredStein+1);
    }
    if(name==="craft"&&detail)add(s.crafted,detail);
    if(name==="sleep")s.slept=true;
    if(name==="harvest"&&detail)add(s.harvested,detail);
    if(name==="catch"&&detail)add(s.caught,detail);
  }
  tick(world:World,pos:Cell):string[]{
    const s=this.state;if(!s.enabled)return [];
    for(const note of NOTES)if(distance(pos,note.position)<=4.5)add(s.visited,`note:${note.id}`);
    for(const region of this.expansion.living.regions)add(s.visited,`region:${region}`);
    for(const animal of this.expansion.living.animals)if(distance(pos,animal.pos)<9)add(s.visited,`animal:${animal.kind}`);
    const oldMine=pos[0]>=26&&pos[0]<=54&&pos[2]>=-45&&pos[2]<=-25;
    const newMine=pos[0]>=128&&pos[0]<=166&&pos[2]>=-105&&pos[2]<=-76;
    if((oldMine||newMine)&&pos[1]<0){
      let roof=false;for(let y=Math.ceil(pos[1]+2);y<=Math.min(26,pos[1]+11);y++)roof ||= solid(world.get(Math.floor(pos[0]),y,Math.floor(pos[2])));
      if(roof){add(s.visited,"inside-mine");if(newMine)add(s.visited,"inside-old-mountain");}
    }
    if(this.revision!==world.revision){this.shelter=ownShelter(world);this.revision=world.revision;}
    if(this.shelter.built)add(s.applied,"own-shelter");
    if(this.expansion.living.crops.length)add(s.applied,"planting");
    if(s.harvested.length)add(s.applied,"harvest");
    const read=(id:string)=>s.read.includes(id),has=(id:string)=>s.visited.includes(id);
    const iron=this.expansion.living.mined.includes("Eisenerz")&&((this.expansion.living.bag.Eisen||0)>0||this.expansion.nightfall.crafted.includes("Eisenspitzhacke")||s.crafted.includes("Eisen"));
    const proof=[
      this.shelter.built&&s.gatheredHolz>=3&&s.gatheredStein>=3&&s.slept,
      read("river-trace")&&has("note:river-trace"),
      read("forge-diary")&&has("note:forge-diary"),
      read("mine-map")&&has("inside-old-mountain"),
      iron,
      read("crystal-code")&&(s.applied.includes("crystal-code")||s.skipped.includes("crystal-code"))&&has("inside-old-mountain"),
      this.expansion.living.looted.includes("159,-12,-90"),
    ];
    const earned:string[]=[];
    for(let i=0;i<CHAPTERS.length;i++){
      const chapter=CHAPTERS[i];if((i===0||s.completed.includes(CHAPTERS[i-1].id))&&proof[i]&&!s.completed.includes(chapter.id)){
        s.completed.push(chapter.id);this.expansion.tokens+=3;earned.push(chapter.title);
        if(chapter.id==="find"&&!this.expansion.badges.includes("Spurenleser"))this.expansion.badges.push("Spurenleser");
      }
    }
    return earned;
  }
  near(pos:Cell):WorldNote|undefined {
    if(!this.state.enabled)return;
    const notes=NOTES.filter(note=>distance(pos,note.position)<=4.5);
    return notes.sort((a,b)=>Number(this.state.read.includes(a.id))-Number(this.state.read.includes(b.id))||distance(pos,a.position)-distance(pos,b.position))[0];
  }
  encounter(id:string,pos:Cell){const note=NOTES.find(n=>n.id===id);if(!note||distance(pos,note.position)>4.5)return false;add(this.state.visited,`note:${id}`);return true;}
  canRead(id:string){return this.state.visited.includes(`note:${id}`);}
  markRead(id:string){if(!this.canRead(id)||!NOTES.some(n=>n.id===id))return false;add(this.state.read,id);return true;}
  answer(id:string,text:string){
    const note=NOTES.find(n=>n.id===id),task=note?.task;
    if(!task||!this.canRead(id))return {correct:false,feedback:"Finde zuerst die Notiz in der Welt."};
    const normalized=text.trim().normalize("NFC").replace(/\s+/g," "),correct=[task.solution,...task.variants||[]].includes(normalized);
    const result=this.state.answers[id]||{attempts:0,history:[],hints:0};result.attempts++;result.history=[...result.history,correct].slice(-20);this.state.answers[id]=result;
    if(correct)add(this.state.applied,id);
    return {correct,feedback:correct?"Das passt. Du kannst die Information jetzt im Abenteuer nutzen.":result.attempts>1?note!.hints[Math.min(result.hints,note!.hints.length-1)]:"Noch nicht ganz. Lies die Spur erneut oder nutze einen Hinweis. Es geht nichts verloren."};
  }
  hint(id:string){
    const note=NOTES.find(n=>n.id===id);if(!note||!this.canRead(id))return "Finde zuerst die Notiz in der Welt.";
    const result=this.state.answers[id]||{attempts:0,history:[],hints:0};result.hints++;this.state.answers[id]=result;return note.hints[Math.min(result.hints-1,note.hints.length-1)];
  }
  skip(id:string){if(!this.canRead(id))return false;add(this.state.skipped,id);return true;}
  activeGoals():DiscoveryGoal[]{
    if(!this.state.enabled)return [];
    const current=CHAPTERS.find(c=>!this.state.completed.includes(c.id)),goals:DiscoveryGoal[]=[];
    if(current)goals.push({...current,detail:current.id==="shelter"?`Gesammelt: Holz ${Math.min(3,this.state.gatheredHolz)}/3 · Stein ${Math.min(3,this.state.gatheredStein)}/3. Eigene Wände ${this.shelter.walls?"✓":"○"}, Dach ${this.shelter.roof?"✓":"○"}, Tür ${this.shelter.door?"✓":"○"}, Licht ${this.shelter.light?"✓":"○"}, Bett ${this.shelter.bed?"✓":"○"}, Werkbank ${this.shelter.workbench?"✓":"○"}, Truhe ${this.shelter.chest?"✓":"○"}. ${this.state.slept?"Ausgeruht ✓":"Schlafe in deinem sicheren Zuhause."}`:current.hint});
    if(!this.state.applied.includes("harvest"))goals.push({id:"garden",title:"Die erste Ernte",hint:"Suche das Gartenblatt bei den Tieren. Stelle eine Hacke her und ziehe eine Pflanze groß.",detail:"Die Samen sind im Rucksack. Bearbeiten → Samen wählen → Pflanzen → reif ernten. Ein Ofen verarbeitet die Ernte."});
    if(!this.state.read.includes("angler-notes"))goals.push({id:"water",title:"Zwischen den Wasserpflanzen",hint:"Am Steg liegt ein Angelblatt. Sein Hinweis hilft beim Köder und beim Suchen nach Räubern.",detail:"Lies es, beobachte die Fische und probiere deine Ausrüstung. Angeln bleibt unabhängig von diesen Zielen verfügbar."});
    return goals.slice(0,3);
  }
  unlockedEntries():BookEntry[]{
    const entries:BookEntry[]=NOTES.filter(n=>this.canRead(n.id)).map(n=>({id:n.id,title:n.title,category:n.category,text:n.text,noteId:n.id}));
    const addEntry=(id:string,title:string,category:BookEntry["category"],text:string[])=>entries.push({id,title,category,text});
    if(this.state.tower?.rewarded)addEntry("tower-view","Weitblick","Orte",["Du hast deinen Aussichtsturm gebaut und die Plattform erreicht. Die umliegenden Felder sind jetzt auf deiner Entdeckerkarte sichtbar.","Suche am Horizont nach hellem Kalkstein am Berg und nach Rauch über der Schmiede. Das sind echte Orientierungspunkte deiner Welt."]);
    for(const kind of ["Wolf","Katze","Huhn","Kuh","Schaf","Schwein"])if(this.state.visited.includes(`animal:${kind}`))addEntry(`animal-${kind}`,kind,"Tiere",[kind==="Wolf"||kind==="Katze"?"Fisch oder Fischgerichte können Vertrauen aufbauen. Nach zwei Fütterungen kann das Tier zu deinem Begleiter werden.":"Ernte oder Beeren eignen sich als Futter. Ein gezähmtes Tier kannst du benennen und sicher warten lassen."]);
    for(const species of new Set([...this.state.caught,...this.expansion.catches.map(c=>c.species)]))addEntry(`fish-${species}`,species,"Fische",["Diesen Fisch hast du tatsächlich gefangen. Im Fangbuch findest du seine Merkmale, Fangmethode und deinen Größenrekord."]);
    for(const ore of this.expansion.living.mined)if(["Stein","Kohleerz","Kupfererz","Eisenerz","Golderz"].includes(ore))addEntry(`ore-${ore}`,ore,"Rohstoffe",[ore==="Kohleerz"?"Kohleerz liefert beim Abbauen Brennstoff. Im Ofen brauchst du Kohle, um Metall aus Erz zu gewinnen.":ore==="Stein"?"Stein ist ein Baumaterial und wird für Hacke und Ofen gebraucht.":"Erz ist noch kein fertiger Metallbarren. Verarbeite es mit Kohle im Ofen; bessere Spitzhacken erschließen weitere Erze."]);
    if(this.state.visited.includes("inside-mine"))addEntry("place-mine","Unter dem Berg","Orte",["Du hast einen unterirdischen Gang mit Dach über dem Kopf betreten. Merke dir Abzweigungen und halte den Rückweg frei."]);
    for(const crop of this.state.harvested)addEntry(`plant-${crop}`,crop,"Pflanzen",["Diese Pflanze hast du reif geerntet. Ernte und zurückgewonnene Samen verbinden Garten, Nahrung und die nächste Aussaat."]);
    return entries;
  }
}
