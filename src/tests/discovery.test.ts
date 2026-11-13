import {describe,it,expect} from "vitest";
import {World,type Cell} from "../world/World";
import {buildRefuge} from "../nightfall/Defense";
import {defaultExpansion} from "../inventory/Equipment";
import {freshDiscovery,readDiscovery} from "../discovery/State";
import {DiscoveryEngine,ownShelter} from "../discovery/Engine";
import {NOTES,CHAPTERS} from "../discovery/Content";

function house(world:World){
  for(let x=0;x<=6;x++)for(let z=-10;z<=-4;z++){
    for(let y=1;y<=10;y++)world.set(x,y,z,null,false);
    world.set(x,0,z,"Stein",false);
    if(x===0||x===6||z===-10||z===-4)for(let y=1;y<=2;y++)world.set(x,y,z,"Bretter");
    world.set(x,4,z,"Bretter");
  }
  world.set(3,1,-10,"Tür");world.set(3,2,-10,"Tür");
  world.set(2,1,-8,"Bett");world.set(4,1,-8,"Werkbank");world.set(4,1,-6,"Truhe");world.set(3,2,-5,"Fackel");
}
function setup(){const world=new World(),expansion=defaultExpansion(4),state=freshDiscovery(),engine=new DiscoveryEngine(state,expansion);return {world,expansion,state,engine};}
function read(engine:DiscoveryEngine,id:string){const note=NOTES.find(n=>n.id===id)!;expect(engine.encounter(id,note.position)).toBe(true);expect(engine.markRead(id)).toBe(true);return note.position;}

describe("Entdeckung und tatsächlich angewandtes Wissen",()=>{
  it("ergänzt alte Spielstände mit validierten Feldern, ohne Welt oder Lernprofile zu ersetzen",()=>{
    expect(readDiscovery(undefined)).toEqual(freshDiscovery());expect(readDiscovery({version:99})).toEqual(freshDiscovery());
    const source={...freshDiscovery(),enabled:false,read:["start-plan","start-plan"],gatheredHolz:17,answers:{"wall-plan":{attempts:2,history:[false,true],hints:1}}};
    expect(readDiscovery(source)).toMatchObject({version:1,enabled:false,read:["start-plan"],gatheredHolz:17,answers:source.answers});
    expect(readDiscovery({...source,gatheredStein:Infinity,completed:[4,null,"trail"]})).toMatchObject({gatheredStein:0,completed:["trail"]});
  });
  it("vergibt weder Gelesenstatus noch Fortschritt oder Sterne durch Nähe und bloße Fensterfreigabe",()=>{
    const {world,engine,state,expansion}=setup();expect(engine.markRead("forge-diary")).toBe(false);
    expect(engine.encounter("forge-diary",[0,1,17])).toBe(false);
    const p:Cell=[2,1,14];expect(engine.tick(world,p)).toEqual([]);expect(engine.canRead("start-plan")).toBe(true);
    expect(state.read).toEqual([]);expect(state.completed).toEqual([]);expect(expansion.tokens).toBe(0);
    expect(engine.markRead("start-plan")).toBe(true);expect(engine.tick(world,p)).toEqual([]);expect(expansion.tokens).toBe(0);
  });
  it("erkennt ein eigenes vollständiges Haus und weist das Starterhaus mit einem neuen Bett zurück",()=>{
    const old=new World();buildRefuge(old);old.set(4,1,19,"Bett");expect(ownShelter(old).built).toBe(false);
    const world=new World();house(world);expect(ownShelter(world)).toMatchObject({built:true,roof:true,walls:true,door:true,light:true,bed:true,workbench:true,chest:true});
    world.set(0,2,-9,null);expect(ownShelter(world).built).toBe(false);world.set(0,2,-9,"Bretter");
    world.set(3,4,-7,null);expect(ownShelter(world).built).toBe(false);world.set(3,4,-7,"Bretter");
    world.set(3,2,-5,null);expect(ownShelter(world).built).toBe(false);
  });
  it("verlangt Sammeln, eigenen Bau und sicheren Schlaf, statt Inventarwerte oder Rezeptfenster zu belohnen",()=>{
    const {world,engine,state,expansion}=setup();house(world);expansion.materials.Holz=99;expansion.materials.Stein=99;
    expect(engine.tick(world,[3,1,-7])).toEqual([]);for(let i=0;i<3;i++){engine.event("gather","Holz");engine.event("gather","Stein");}
    expect(engine.tick(world,[3,1,-7])).toEqual([]);engine.event("sleep");expect(engine.tick(world,[3,1,-7])).toEqual(["Ein Platz für die Nacht"]);
    expect(state.completed).toEqual(["shelter"]);expect(expansion.tokens).toBe(3);expect(engine.tick(world,[3,1,-7])).toEqual([]);expect(expansion.tokens).toBe(3);
  });
  it("führt sieben Kapitel mit realen Weltbelegen ohne Haustierpflicht und ohne doppelte Belohnung zusammen",()=>{
    const {world,engine,state,expansion}=setup();house(world);for(let i=0;i<3;i++){engine.event("gather","Holz");engine.event("gather","Stein");}engine.event("sleep");engine.tick(world,[3,1,-7]);
    engine.tick(world,read(engine,"river-trace"));engine.tick(world,read(engine,"forge-diary"));
    read(engine,"mine-map");expect(state.completed).not.toContain("mine");
    world.set(135,-2,-90,"Stein",false);engine.tick(world,[135,-5,-90]);expect(state.completed).toContain("mine");
    expansion.living.mined.push("Eisenerz");expansion.living.bag.Eisen=1;engine.tick(world,[135,-5,-90]);expect(state.completed).toContain("iron");
    read(engine,"crystal-code");expect(engine.answer("crystal-code","Kristall").correct).toBe(true);engine.tick(world,[135,-5,-90]);expect(state.completed).toContain("chamber");
    expansion.living.looted.push("159,-12,-90");engine.tick(world,[135,-5,-90]);expect(state.completed).toEqual(CHAPTERS.map(c=>c.id));
    expect(expansion.living.animals.every(a=>!a.tame)).toBe(true);expect(expansion.tokens).toBe(21);expect(expansion.badges).toContain("Spurenleser");
    const restored=new DiscoveryEngine(readDiscovery(state),expansion);restored.tick(world,[135,-5,-90]);expect(expansion.tokens).toBe(21);
  });
  it("verwechselt die Höhlenregion an der Oberfläche oder die alte kleine Höhle nicht mit dem großen unterirdischen Weg",()=>{
    const {world,engine,state,expansion}=setup();expansion.living.regions.push("cave");engine.tick(world,[29,1,-35]);expect(state.visited).not.toContain("inside-mine");
    world.set(29,-2,-35,"Stein",false);engine.tick(world,[29,-5,-35]);expect(state.visited).toContain("inside-mine");expect(state.visited).not.toContain("inside-old-mountain");
  });
  it("unterscheidet Fehler, Hilfen, freiwilliges Überspringen und eine richtige Anwendung",()=>{
    const {engine,state}=setup();read(engine,"wall-plan");expect(engine.answer("wall-plan","24").correct).toBe(false);expect(state.applied).not.toContain("wall-plan");
    expect(engine.hint("wall-plan")).toContain("Reihen");expect(engine.answer("wall-plan","32 Blöcke").correct).toBe(true);expect(state.applied).toContain("wall-plan");
    read(engine,"crystal-code");engine.answer("crystal-code","Gold");engine.hint("crystal-code");engine.skip("crystal-code");expect(state.skipped).toContain("crystal-code");expect(state.applied).not.toContain("crystal-code");expect(state.answers["crystal-code"].history).toEqual([false]);
  });
  it("hält höchstens drei aktive Ziele und bewahrt gefundene Informationen bei ausgeschalteten Angeboten",()=>{
    const {engine,state,world}=setup();engine.tick(world,[2,1,14]);expect(engine.activeGoals()).toHaveLength(3);expect(engine.unlockedEntries().some(e=>e.id==="start-plan")).toBe(true);
    state.enabled=false;expect(engine.activeGoals()).toEqual([]);engine.event("gather","Holz");expect(state.gatheredHolz).toBe(0);engine.tick(world,[103,1,88]);expect(engine.canRead("forge-diary")).toBe(false);expect(engine.unlockedEntries().some(e=>e.id==="start-plan")).toBe(true);
  });
  it("schaltet Fang-, Pflanzen- und Rohstoffwissen nur durch entsprechende Spielhandlungen frei",()=>{
    const {engine,expansion}=setup();expect(engine.unlockedEntries().some(e=>e.category==="Fische")).toBe(false);
    engine.event("catch","Hecht");engine.event("harvest","Weizen");expansion.living.mined.push("Eisenerz");const entries=engine.unlockedEntries();expect(entries.map(e=>e.id)).toEqual(expect.arrayContaining(["fish-Hecht","plant-Weizen","ore-Eisenerz"]));
  });
  it("enthält einzigartige, räumliche Lesestücke und kurze Antworten statt Abschreibpflicht",()=>{
    expect(NOTES.length).toBeGreaterThanOrEqual(12);expect(new Set(NOTES.map(n=>n.id)).size).toBe(NOTES.length);expect(new Set(NOTES.map(n=>n.difficulty))).toEqual(new Set(["A","B","C","D"]));
    expect(NOTES.every(n=>n.position.length===3&&n.hints.length>=2&&n.text.length>0)).toBe(true);expect(NOTES.filter(n=>n.task).every(n=>n.task!.solution.length<30)).toBe(true);
  });
});
