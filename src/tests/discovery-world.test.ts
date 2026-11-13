import {it,expect} from "vitest";
import * as T from "three";
import {World} from "../world/World";
import {RegionStream,regionAt} from "../living/Regions";
import {CAVE_ENTRANCES,terrainProfile} from "../world/DiscoveryTerrain";
import {Player} from "../player/Player";
import {collides} from "../nightfall/Defense";
import {WaterView} from "../world/WaterView";
import {LandmarkView} from "../world/LandmarkView";

it("stellt Startwasser als horizontale Fläche in beiden Geländeachsen dar",()=>{
 const water=new WaterView(new T.Scene(),4);water.group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(water.surface);
 expect(bounds.max.x-bounds.min.x).toBeCloseTo(16.6);expect(bounds.max.z-bounds.min.z).toBeCloseTo(14.8);expect(bounds.max.y).toBeCloseTo(.38);
});
it("zählt einen Bergrand nicht als unterirdischen Höhlenbesuch",()=>{
 expect(regionAt(29,1,-34).id).not.toBe("cave");expect(regionAt(42,-4,-30).id).toBe("cave");
});
it("erzeugt echte offene Eingänge und durchgehende Mine bis zur tiefen Fundkammer",()=>{
 for(const entrance of CAVE_ENTRANCES){const w=new World(),stream=new RegionStream(w,true);stream.ensure(entrance.position[0],entrance.position[2]);
  expect(collides(w,entrance.position)).toBe(false);
 }
 const w=new World(),stream=new RegionStream(w,true),p=new Player(w);stream.ensure(130,-90);p.pos=[130.5,1.001,-90];p.yaw=-Math.PI/2;
 for(let i=0;i<2400&&p.pos[0]<159;i++){stream.ensure(p.pos[0],p.pos[2]);p.step(1/120,0,1,i%70===0);}
 expect(p.pos[0]).toBeGreaterThan(157);expect(p.pos[1]).toBeLessThan(-10);expect(w.get(159,-12,-90)).toBe("Schatztruhe");
});
it("erhält gespeicherte Häuser und abgebaute Zellen beim Verlassen und Wiederladen",()=>{
 const w=new World(),stream=new RegionStream(w,true);stream.ensure(102,88);w.set(104,2,87,"Glas");w.set(104,0,87,null);
 stream.ensure(-100,30);stream.ensure(102,88);expect(w.get(104,2,87)).toBe("Glas");expect(w.get(104,0,87)).toBeUndefined();
 expect(w.changesByChunk.get("8,7")?.get("104,2,87")).toBe("Glas");
});
it("begrenzt Runtime-Generierung pro Schritt und misst tatsächliche Laufzeit",()=>{
 const w=new World(),stream=new RegionStream(w,true);stream.ensure(0,17);let steps=0,columns=stream.metrics.generatedColumns;
 do{stream.ensure(100,85,1);expect(stream.metrics.generatedColumns-columns).toBeLessThanOrEqual(8);columns=stream.metrics.generatedColumns;steps++;}while(stream.metrics.pendingChunks>0&&steps<700);
 expect(stream.metrics.pendingChunks).toBe(0);expect(stream.metrics.generatedChunks).toBeGreaterThan(15);expect(w.activeChunks.size).toBeLessThan(45);
 console.info(JSON.stringify({streamSteps:steps,...stream.metrics,blocks:w.blocks.size}));
});
it("erzeugt markante Berge und begrenzte, freigegebene Ferngeometrie",()=>{
 expect(terrainProfile(145,-105).top).toBeGreaterThan(20);const scene=new T.Scene(),view=new LandmarkView(scene,new World());view.update([0,1,17],1000);
 expect(view.group.children.length).toBeLessThan(7);let disposed=0;view.group.traverse(o=>(o as T.Mesh).geometry?.addEventListener("dispose",()=>disposed++));view.dispose();expect(scene.children).not.toContain(view.group);expect(disposed).toBeGreaterThan(3);
});
