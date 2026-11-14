import {it,expect} from "vitest";
import * as T from "three";
import {World} from "../world/World";
import {freshLiving,readLiving,MAX_ANIMALS} from "../living/State";
import {initializeDiscoveryGarden} from "../living/StarterGarden";
import {farm,stage,discover,checkMissions,loot} from "../living/Systems";
import {defaultExpansion} from "../inventory/Equipment";
import {ItemStore} from "../living/Items";
import {LivingView} from "../living/LivingView";
import {discoveryMapSVG} from "../living/LivingUI";

it("zeigt ein echtes Beispielbeet mit vier Arten und gespeicherten Wachstumsstufen",()=>{
 const w=new World(),e=defaultExpansion(),s=e.living,store=new ItemStore(e,{});
 expect(initializeDiscoveryGarden(w,s)).toBe(4);expect(s.clock).toBe(0);
 expect(s.crops.map(c=>stage(s,c))).toEqual([0,1,2,3]);
 const restored=readLiving(JSON.parse(JSON.stringify(s)));
 expect(restored.crops.map(c=>stage(restored,c))).toEqual([0,1,2,3]);
 const ripe=s.crops[3];expect(farm(w,store,ripe.cell)).toContain("geerntet");expect(store.count("Kürbis")).toBe(3);expect(store.count("Samen:Kürbis")).toBe(6);
 expect(initializeDiscoveryGarden(w,s)).toBe(0);
});

it("setzt den Beispielgarten weder über gespeicherte Bauwerke noch unter Dächer",()=>{
 const w=new World(),s=freshLiving();w.set(8,0,18,"Glas");w.set(9,1,18,"Bretter");w.set(8,-1,19,null);
 expect(initializeDiscoveryGarden(w,s)).toBe(1);expect(w.get(8,0,18)).toBe("Glas");expect(w.get(9,1,18)).toBe("Bretter");expect(w.get(8,-1,19)).toBeUndefined();
 expect(s.crops[0].cell).toEqual([9,0,19]);
});

it("behält alte Tier-IDs und eigene Haustiere vor neuen Wildtierdefaults",()=>{
 const fresh=freshLiving();expect(fresh.animals).toHaveLength(MAX_ANIMALS);expect(fresh.animals[0]).toMatchObject({id:"animal-0",kind:"Wolf",pos:[-5,1,15]});
 const old={...fresh,animals:[{...fresh.animals[0],id:"mein-alter-wolf",name:"Fiete",tame:true,mode:"Folgen"}],explored:["0,1","0,1","keinTile"],entrances:["legacyMine"]};
 const loaded=readLiving(old);expect(loaded.animals).toHaveLength(MAX_ANIMALS);expect(loaded.animals[0]).toMatchObject({id:"mein-alter-wolf",name:"Fiete",tame:true,mode:"Folgen"});expect(loaded.explored).toEqual(["0,1"]);expect(loaded.entrances).toEqual(["legacyMine"]);
});

it("schützt auch hohe gespeicherte Dächer und tiefe Kellereingriffe vor dem Starterbeet",()=>{
 const w=new World(),s=freshLiving();w.set(8,5,18,"Bretter");w.set(9,-10,18,null);
 expect(initializeDiscoveryGarden(w,s)).toBe(2);expect(w.get(8,0,18)).toBe("Gras");expect(w.get(9,0,18)).toBe("Gras");
 expect(w.get(8,5,18)).toBe("Bretter");expect(w.changes["9,-10,18"]).toBeNull();expect(s.crops.every(c=>c.cell[2]===19)).toBe(true);
});

it("rendert nahe Tiere auch weit außerhalb der alten 100-Meter-Bounds",()=>{
 const s=freshLiving(),view=new LivingView(new T.Scene());s.animals[0].pos=[145,8,-105];
 view.update(s,new T.Vector3(145,9,-105));expect(view.animals.count).toBeGreaterThanOrEqual(12);expect(view.animals.count).toBeLessThanOrEqual(MAX_ANIMALS*12);expect(view.animals.frustumCulled).toBe(false);
});

it("deckt tatsächliche Wege auf und verrät keine unbekannten Regionen oder Eingänge",()=>{
 const s=freshLiving();let svg=discoveryMapSVG(s,[0,1,17]);expect(svg).not.toContain("data-map-region=");expect(svg).not.toContain("data-map-entrance=");
 discover(s,[0,1,17]);svg=discoveryMapSVG(s,[0,1,17]);expect(svg).toContain('data-map-region="meadow"');expect(svg).not.toContain("Silbergebirge");expect(s.explored.length).toBe(9);
 discover(s,[27.5,1,-30]);svg=discoveryMapSVG(s,[27.5,1,-30]);expect(s.entrances).toContain("legacyMine");expect(svg).toContain('data-map-entrance="legacyMine"');
 expect(readLiving(JSON.parse(JSON.stringify(s))).explored).toEqual(s.explored);
});

it("blockiert Bergbau und Schmiede nicht hinter der Haustiermission und belohnt Funde einmal",()=>{
 const w=new World(),e=defaultExpansion(),s=e.living,store=new ItemStore(e,{});s.regions.push("cave");s.mined=["Stein","Kupfererz","Kohleerz"];
 expect(checkMissions(s,w)).toEqual(["Unter der Erde"]);expect(s.completed).not.toContain("pet");
 expect(loot(s,store,[159,-12,-90])).toContain("fehlt");expect(loot(s,store,[102,1,88])).toContain("Bauplan");expect(checkMissions(s,w)).toEqual(["Das Geheimnis der Schmiede"]);
 expect(loot(s,store,[159,-12,-90])).toContain("Bergschatz");const n=store.count("Bergkristall");expect(loot(s,store,[159,-12,-90])).toContain("bereits");expect(store.count("Bergkristall")).toBe(n);
});
