import {it,expect} from "vitest";
import {World,type Cell} from "../world/World";
import {RegionStream,REGIONS,regionAt} from "../living/Regions";
import {freshLiving,readLiving,CROPS} from "../living/State";
import {ItemStore,produce,RECIPES_LIVING,FURNACE,CATALOG} from "../living/Items";
import {farm,stage,feed,updateAnimals,checkMissions,loot,mining,sheltered} from "../living/Systems";
import {defaultExpansion,readExpansion} from "../inventory/Equipment";
import {Player} from "../player/Player";
import {decode,persist,type Save} from "../storage/Save";
import {buildRefuge} from "../nightfall/Defense";
import {LearningEngine,CHALLENGES} from "../learning/Engine";

it("erweitert sechs Regionen ohne eine einzige Ursprungszelle zu ersetzen",()=>{
 const w=new World(),before=new Map(w.blocks),stream=new RegionStream(w);stream.ensure(45,-30);
 expect(REGIONS).toHaveLength(6);for(const [key,b]of before)expect(w.blocks.get(key)).toBe(b);
 expect(regionAt(45,-6,-30).id).toBe("cave");expect(w.get(49,-5,-33)).toBe("Schatztruhe");
 expect(w.blocks.size).toBeLessThan(120000);
});
it("entlädt äußere Chunks und restauriert Bauwerke und entfernte Erze deterministisch",()=>{
 const w=new World(),s=new RegionStream(w);s.ensure(43,-30);w.set(43,-4,-27,null);w.set(44,-5,-30,"Glas");s.ensure(-45,30);expect(w.activeChunks.size).toBeLessThanOrEqual(37);
 s.ensure(43,-30);expect(w.get(43,-4,-27)).toBeUndefined();expect(w.get(44,-5,-30)).toBe("Glas");
 for(let i=0;i<10;i++)s.ensure(i%2?45:-45,i%2?-30:30);expect(w.blocks.size).toBeLessThan(120000);
});
it("markiert beim Entladen angrenzende Chunkflächen statt die gesamte Ursprungswelt",()=>{
 const w=new World(),s=new RegionStream(w);s.ensure(43,-30);w.dirty.clear();s.ensure(31,-30);
 expect(w.activeChunks.has("4,-5")).toBe(false);expect(w.dirty.has("59,0,-48")).toBe(true);expect(w.dirty.has("0,0,0")).toBe(false);
});
it("verteilt neue Regionschunks auf einzelne Bilder und stellt ihre gespeicherten Änderungen wieder her",()=>{
 const w=new World(),stream=new RegionStream(w);w.changes["43,-4,-27"]=null;const before=w.activeChunks.size;
 stream.ensure(43,-30,1);expect(w.activeChunks.size).toBe(before+1);expect(w.get(43,-4,-27)).toBeUndefined();
 for(let frame=0;frame<30;frame++){const count=w.activeChunks.size;stream.ensure(43,-30,1);expect(w.activeChunks.size-count).toBeLessThanOrEqual(1);}
 expect(w.activeChunks.has("4,-3")).toBe(true);expect(w.get(49,-5,-33)).toBe("Schatztruhe");
});
it("lässt die echte Höhle betreten und sicher speichern, ohne Bodenverlust",()=>{
 const w=new World(),s=new RegionStream(w);s.ensure(35,-30);const p=new Player(w);p.pos=[27.5,1.01,-30];p.yaw=-Math.PI/2;
 for(let i=0;i<500;i++){s.ensure(p.pos[0],p.pos[2]);p.step(1/120,0,1,false);}
 expect(p.pos[0]).toBeGreaterThan(42);expect(p.pos[1]).toBeLessThan(-3);expect(p.pos[1]).toBeGreaterThan(-7);expect(p.blocked(p.pos)).toBe(false);
 const save={version:1,position:p.pos,yaw:p.yaw,pitch:0,changes:w.changes,fish:{Rotauge:0,Flussbarsch:0,Hecht:0}};expect(decode(JSON.stringify(save))?.position).toEqual(p.pos);
});
it("erzwingt Werkzeugstufen und verbindet Ofen mit einer besseren Spitzhacke",()=>{
 const e=defaultExpansion(),store=new ItemStore(e,{Rotauge:2});e.nightfall.mode="Survival";e.materials.Kupfererz=3;e.materials.Holz=2;e.nightfall.supplies.Kohle=3;
 expect(mining("Eisenerz","Spitzhacke").allowed).toBe(false);
 for(let i=0;i<3;i++)expect(produce(store,FURNACE[0])).toBe(true);
 expect(produce(store,RECIPES_LIVING.find(r=>r.id==="Kupferspitzhacke")!)).toBe(true);expect(e.nightfall.crafted).toContain("Kupferspitzhacke");expect(store.count("Kupfer")).toBe(0);expect(e.materials.Kupfererz).toBe(0);
 expect(mining("Eisenerz","Kupferspitzhacke").allowed).toBe(true);expect(mining("Golderz","Kupferspitzhacke").allowed).toBe(false);expect(mining("Golderz","Eisenspitzhacke").seconds).toBeLessThan(mining("Kupfererz","Spitzhacke").seconds);
});
it("verschiebt Materialien, Fische und Ernte verlustfrei zwischen getrennten Truhen",()=>{
 const e=defaultExpansion(),store=new ItemStore(e,{Flussbarsch:2});store.add("Karotte",3);const a={},b={};
 expect(store.move("fish:Flussbarsch",a,true)).toBe(true);expect(store.move("Karotte",b,true)).toBe(true);expect(a).not.toEqual(b);
 expect(store.move("fish:Flussbarsch",a,false)).toBe(true);expect(store.count("fish:Flussbarsch")).toBe(2);expect(store.move("Gold",a,true)).toBe(false);
 e.living.chests["1,1,1"]=a;e.living.chests["2,1,1"]=b;const loaded=readExpansion(JSON.parse(JSON.stringify(e)));expect(loaded.living.chests["2,1,1"]).toEqual({Karotte:1});
 expect(new Set(CATALOG.map(i=>i.id)).size).toBe(CATALOG.length);
});
it("lässt alle vier Pflanzen echt wachsen und gibt Ernte plus neue Samen",()=>{
 const w=new World(),e=defaultExpansion(),store=new ItemStore(e,{});e.tool="Hacke";
 CROPS.forEach((kind,i)=>{const c:Cell=[i,0,7];e.living.selectedSeed=kind;expect(farm(w,store,c)).toContain("Acker");expect(farm(w,store,c)).toContain("gepflanzt");});
 expect(e.living.crops).toHaveLength(4);expect(stage(e.living,e.living.crops[0])).toBe(0);e.living.clock=250;
 const loaded=readLiving(JSON.parse(JSON.stringify(e.living)));expect(stage(loaded,loaded.crops[0])).toBe(3);
 for(const c of [...e.living.crops])expect(farm(w,store,c.cell)).toContain("geerntet");expect(e.living.crops).toHaveLength(0);expect(store.count("Kürbis")).toBe(3);
 expect(produce(store,FURNACE.find(r=>r.id==="Gemüsesuppe")!)).toBe(true);expect(store.count("Gemüsesuppe")).toBe(2);
});
it("zähmt und benennt Begleiter, speichert Verhalten und schützt vor Verlust",()=>{
 const e=defaultExpansion(),store=new ItemStore(e,{Rotauge:2}),a=e.living.animals[0],w=new World();expect(feed(a,store)).toBe(true);expect(a.tame).toBe(false);expect(feed(a,store)).toBe(true);a.name="Fiete";a.mode="Folgen";
 const loaded=readLiving(JSON.parse(JSON.stringify(e.living)));expect(loaded.animals[0]).toMatchObject({tame:true,name:"Fiete",mode:"Folgen"});
 loaded.animals[0].pos=[-40,1,10];updateAnimals(loaded,w,[0,1,10],.2);expect(Math.hypot(loaded.animals[0].pos[0],loaded.animals[0].pos[2]-10)).toBeLessThan(3);
 loaded.animals[0].mode="Schlafen";updateAnimals(loaded,w,[0,1,10],.2);expect(loaded.animals[0].action).toBe("Schlafen");
});
it("lässt Begleiter im Untergrund folgen und hält sie vor massiven Wänden an",()=>{
 const w=new World(),stream=new RegionStream(w);stream.ensure(35,-30);const s=freshLiving(),a=s.animals[0];
 a.pos=[42,-4.99,-30];a.home=[...a.pos];a.tame=true;a.mode="Folgen";
 const before=a.pos[0];for(let i=0;i<4;i++)updateAnimals(s,w,[46,-4.99,-30],.2);expect(a.pos[0]).toBeGreaterThan(before);
 w.set(45,-5,-30,"Stein");w.set(45,-4,-30,"Stein");for(let i=0;i<20;i++)updateAnimals(s,w,[48,-4.99,-30],.2);expect(a.pos[0]).toBeLessThan(45);
});
it("belohnt fünf Missionen nur für wirkliche Bedingungen und nur einmal",()=>{
 const w=new World();buildRefuge(w);const e=defaultExpansion(),s=e.living,store=new ItemStore(e,{});
 expect(checkMissions(s,w)).toEqual([]);w.set(4,1,20,"Bett");s.placed.push("4,1,20");expect(sheltered(w,[4,2,20])).toBe(true);expect(checkMissions(s,w)).toHaveLength(1);
 s.animals[0].tame=true;s.animals[0].name="Fiete";expect(checkMissions(s,w)).toHaveLength(1);s.regions.push("cave");s.mined=["Stein","Kohleerz","Kupfererz"];expect(checkMissions(s,w)).toHaveLength(1);
 expect(loot(s,store,[49,-5,-33])).toContain("fehlt");loot(s,store,[41,1,28]);expect(checkMissions(s,w)).toHaveLength(1);loot(s,store,[49,-5,-33]);expect(checkMissions(s,w)).toHaveLength(1);expect(s.completed).toHaveLength(5);expect(checkMissions(s,w)).toEqual([]);const n=store.count("Bergkristall");loot(s,store,[49,-5,-33]);expect(store.count("Bergkristall")).toBe(n);
});
it("wählt passende Aufgaben, erhält alte IDs und prüft alle Wahlantworten",()=>{
 expect(CHALLENGES).toHaveLength(144);const engine=new LearningEngine();engine.context="cave";expect(engine.select().context).toBe("cave");expect(CHALLENGES.some(c=>c.id==="world-01")).toBe(true);
 for(const c of CHALLENGES.filter(c=>c.id.startsWith("living-")))expect(c.options).toContain(c.solution);
});
it("ersetzt bei zu vielen Weltänderungen niemals den letzten lesbaren Speicherstand",()=>{
 const changes:Save["changes"]={};for(let i=0;i<50001;i++)changes[`${i%119-59},${Math.floor(i/14161)-17},${Math.floor(i/119)%119-59}`]="Glas";
 let raw="vorheriger Spielstand";const storage={setItem:(_k:string,v:string)=>{raw=v;}};
 const s:Save={version:1,position:[0,1,9],yaw:0,pitch:0,changes,fish:{Rotauge:0,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1}};
 expect(persist(storage,s)).toBe(false);expect(raw).toBe("vorheriger Spielstand");
});
