import { expect, it } from "vitest";
import { World, type Cell } from "../world/World";
import { freshNight, readNight, Vitals } from "../nightfall/State";
import { advanceDay, dayPhase, isNight } from "../nightfall/DayCycle";
import { ZombieEngine, findPath, lineOfSight } from "../nightfall/Zombies";
import { buildRefuge, collides, toggleDoor, damageDoor, restoreNightDamage } from "../nightfall/Defense";
import { RECIPES, cook, craft } from "../nightfall/Crafting";
import { WritingBattle } from "../nightfall/Writing";
import { readExpansion } from "../inventory/Equipment";
import { decode } from "../storage/Save";
function flat(){const world=new World();world.blocks.clear();for(let x=-23;x<24;x++)for(let z=-23;z<24;z++)world.set(x,0,z,"Gras",false);return world;}

it("durchläuft sechs Phasen kontinuierlich und zählt Nächte nur an Übergängen",()=>{
  expect([.1,.3,.55,.64,.75,.95].map(dayPhase)).toEqual(["Morgen","Mittag","Abend","Sonnenuntergang","Nacht","Sonnenaufgang"]);
  const s=freshNight();s.time=.6799;advanceDay(s,1);expect(s.night).toBe(1);expect(isNight(s.time)).toBe(true);
  for(let i=0;i<300;i++)advanceDay(s,1);expect(s.survived).toBe(1);expect(s.night).toBe(1);
});
it("spawnt keine Gegner im Spieler, in Wänden, unter Dächern oder in Luft",()=>{
  const w=flat(),engine=new ZombieEngine(w,freshNight()),p:Cell=[0,1,0];
  expect(engine.spawn("normal",[1,1,1],p)).toBeNull();
  w.set(10,1,10,"Stein");expect(engine.spawn("normal",[10,1,10],p)).toBeNull();
  w.set(12,4,12,"Bretter");expect(engine.spawn("normal",[12,1,12],p)).toBeNull();
  expect(engine.spawn("normal",[9,7,9],p)).toBeNull();
  expect(engine.spawn("normal",[8,1,8],p)).not.toBeNull();
});
it("verfolgt den Spieler und verursacht Schaden ohne massive Wände zu durchqueren",()=>{
  const w=flat(),s=freshNight("Survival"),e=new ZombieEngine(w,s),p:Cell=[0,1,0];s.time=.75;s.night=1;s.waveNight=1;
  const z=e.spawn("normal",[8,1,0],p)!;let damage=0;
  for(let i=0;i<120;i++)e.tick(.1,p,n=>damage+=n);
  expect(z.pos[0]).toBeLessThan(2);expect(damage).toBeGreaterThan(0);
  const wall=flat();for(let zz=-23;zz<=23;zz++)for(let y=1;y<4;y++)wall.set(3,y,zz,"Stein");
  const blocked=new ZombieEngine(wall,s),actor=blocked.spawn("heavy",[8,1,0],p)!;
  for(let i=0;i<100;i++)blocked.tick(.1,p,()=>{throw Error("Angriff durch Wand");});
  expect(actor.pos[0]).toBeGreaterThan(3);expect(lineOfSight(wall,[8,2,0],[0,2,0])).toBe(false);
});
it("findet einen Umweg um ein Hindernis und endet innerhalb eines festen Suchbudgets",()=>{
  const w=flat();for(let z=-2;z<=2;z++)for(let y=1;y<=3;y++)w.set(3,y,z,"Stein");
  const path=findPath(w,[6,1,0],[0,1,0]);expect(path.length).toBeGreaterThan(0);expect(path.some(p=>Math.abs(p[2])>2)).toBe(true);
});
it("beschränkt Wellen, bietet drei Typen und entfernt Gegner sofort im friedlichen Modus",()=>{
  const s=freshNight(),e=new ZombieEngine(flat(),s,()=>.4);s.time=.75;s.night=5;e.cap=4;
  e.tick(.1,[0,1,0],()=>{});expect(e.actors.length).toBeLessThanOrEqual(4);expect(e.actors.length).toBeGreaterThan(0);
  for(let i=0;i<1000;i++)e.tick(.1,[0,1,0],()=>{});expect(e.actors.length).toBeLessThanOrEqual(4);
  s.difficulty="Friedlich";e.tick(.1,[0,1,0],()=>{});expect(e.actors).toHaveLength(0);
});
it("Nahkampf hat Reichweite, Cooldown und belohnt nur einmal pro besiegtem Gegner",()=>{
  const s=freshNight(),w=flat(),e=new ZombieEngine(w,s),z=e.spawn("fast",[7,1,0],[0,1,0])!;
  z.pos=[0,1,-2];const p:Cell=[0,1,0],dir:Cell=[0,0,-1];
  expect(e.attack(p,dir,"Steinschwert")).toBe(z);expect(s.defeated).toBe(1);expect(e.attack(p,dir,"Steinschwert")).toBeNull();expect(s.supplies.Schnur).toBe(1);
});
it("Gesundheit, Nahrung, Regeneration und sicherer Wiedereinstieg erhalten Inventar",()=>{
  const s=freshNight("Survival"),v=new Vitals(s);expect(v.hit(30)).toBe(true);expect(v.hit(30)).toBe(false);
  s.hunger=30;expect(v.eat("Beeren")).toBe(true);expect(s.hunger).toBe(48);expect(s.health).toBe(75);
  s.hunger=80;v.tick(10);expect(s.health).toBeGreaterThan(75);
  s.health=0;const berries=s.supplies.Beeren;v.respawn();expect(s.health).toBe(100);expect(s.supplies.Beeren).toBe(berries);expect(v.hit(100)).toBe(false);
});
it("Crafting verbraucht passende Zutaten atomar und Kochen genau einen alten Fang",()=>{
  const s=freshNight("Survival"),m={Holz:3,Bretter:0},recipe=RECIPES.find(r=>r.id==="Bretter")!;
  expect(craft(recipe,m,s)).toBe(true);expect(m).toEqual({Holz:1,Bretter:4});
  expect(craft(recipe,m,s)).toBe(false);expect(m.Holz).toBe(1);
  const fish={Hecht:1};expect(cook(fish,s,"Hecht")).toBe(true);expect(fish.Hecht).toBe(0);expect(s.supplies.Fischgericht).toBe(1);
});
it("Haus schützt, Türen ändern Kollision, Schäden sind standardmäßig vorübergehend",()=>{
  const w=flat();buildRefuge(w);const door:Cell=[4,1,17],p:Cell=[4.5,1,16];
  expect(collides(w,[4.5,1,17.5])).toBe(true);expect(toggleDoor(w,door,p)).toBe(true);expect(collides(w,[4.5,1,17.5])).toBe(false);
  expect(toggleDoor(w,door,[4.5,1,17.5])).toBe(false);expect(toggleDoor(w,door,p)).toBe(true);
  const s=freshNight();damageDoor(w,s,door,120);expect(w.get(...door)).toBe("Tür");restoreNightDamage(s);expect(s.damage).toEqual({});
  s.buildingDamage=true;damageDoor(w,s,door,120);expect(w.get(...door)).toBeUndefined();
  expect(lineOfSight(w,[1,2,20],[4,2,20])).toBe(false);
});
it("Schreibkampf erlaubt Fehler und Wiederholung, ohne Zeitlimit oder Tempowertung bei Diktat",()=>{
  const s=freshNight();s.writing.dictation=true;const b=new WritingBattle(s.writing);
  b.tick(200);expect(b.remaining).toBe(0);expect(b.answer("falsch").correct).toBe(false);expect(b.hint()).toBeTruthy();
  expect(b.answer(b.task.solution).correct).toBe(true);expect(s.writing.wins).toBe(1);expect(s.writing.speedSamples).toEqual([]);expect(s.writing.history).toEqual([false,true]);expect(b.answer(b.task.solution).damage).toBe(0);
});
it("liest alte Saves additiv, validiert NIGHTFALL und speichert offene Türen",()=>{
  const legacy=readExpansion({version:1,edition:4,materials:{Holz:7}});expect(legacy.nightfall.mode).toBe("Kreativ");expect(legacy.materials.Holz).toBe(7);
  const s=readNight({version:1,health:-10,time:Infinity,writing:{speedSamples:[NaN,12],history:[true,"bad"]}});expect(s.health).toBe(0);expect(s.time).toBe(.3);expect(s.writing.speedSamples).toEqual([12]);
  const save={version:1,position:[0,1,0],yaw:0,pitch:0,changes:{"4,1,17":"Tür offen"},fish:{Rotauge:0,Flussbarsch:1,Hecht:0},extension:legacy};
  expect(decode(JSON.stringify(save))?.changes["4,1,17"]).toBe("Tür offen");
});
