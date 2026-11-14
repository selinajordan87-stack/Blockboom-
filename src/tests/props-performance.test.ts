import {it,expect} from "vitest";
import * as T from "three";
import {World} from "../world/World";
import {DefenseView} from "../nightfall/Views";
import {RegionStream} from "../living/Regions";
it("behält dieselbe Möbelgeometrie bei reinen Terrainänderungen und aktualisiert tatsächliche Türen",()=>{
 const w=new World();w.set(1,1,7,"Tür");const view=new DefenseView(w,new T.Scene()),origin=new T.Vector3(0,2,9);view.update(origin,false);const mesh=view.group.children[0];
 for(let x=2;x<12;x++)w.set(x,0,7,"Stein");view.update(origin,false);expect(view.group.children[0]).toBe(mesh);
 w.set(1,1,7,"Tür offen");view.update(origin,false);expect(view.group.children[0]).not.toBe(mesh);expect(w.specialBlocks.get("1,1,7")).toBe("Tür offen");
});
it("entfernt generierte Einrichtung beim Entladen und restauriert ihren gespeicherten Inhaltsträger",()=>{
 const w=new World(),stream=new RegionStream(w,true);stream.ensure(102,88);w.set(105,1,87,"Truhe");expect(w.specialBlocks.has("105,1,87")).toBe(true);
 stream.ensure(-100,30);expect(w.specialBlocks.has("105,1,87")).toBe(false);expect(w.changes["105,1,87"]).toBe("Truhe");
 stream.ensure(102,88);expect(w.specialBlocks.get("105,1,87")).toBe("Truhe");
});
it("führt nur tatsächliche Spezialblöcke im kleinen Renderindex",()=>{
 const w=new World();for(let x=0;x<10;x++)for(let z=0;z<10;z++)w.set(x,0,z,"Stein");w.set(1,1,7,"Fackel");w.set(2,1,7,"Werkbank");expect(w.specialBlocks.size).toBe(2);
 w.set(1,1,7,null);expect(w.specialBlocks.size).toBe(1);expect(w.propsRevision).toBe(3);
});
