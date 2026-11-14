import {it,expect} from "vitest";
import * as T from "three";
import {World} from "../world/World";
import {WorldView} from "../world/Renderer";
import {castVoxels} from "../building/Target";
it("sieht zwei schnelle Bauaktionen sofort, auch bevor die Rendergeometrie nachgezogen hat",()=>{
 const w=new World();w.set(0,1,2,"Stein");const view=new WorldView(w,new T.Scene());view.update();const eye={x:.5,y:1.5,z:6},direction={x:0,y:0,z:-1};
 expect(castVoxels(w,eye,direction)?.cell).toEqual([0,1,2]);w.set(0,1,3,"Glas");
 const hit=castVoxels(w,eye,direction)!;expect(hit.cell).toEqual([0,1,3]);expect(hit.normal).toEqual([0,0,1]);expect(hit.point).toEqual([.5,1.5,4]);expect(hit.distance).toBe(2);view.dispose();
});
it("begrenzt die Handreichweite und behandelt beschädigte Richtungen ohne Endlosschleife",()=>{
 const w=new World();w.set(0,1,0,"Stein");const o={x:.5,y:1.5,z:9};expect(castVoxels(w,o,{x:0,y:0,z:-1},6)).toBeNull();expect(castVoxels(w,o,{x:0,y:0,z:0})).toBeNull();expect(castVoxels(w,o,{x:NaN,y:0,z:0})).toBeNull();
});
it("trifft negative Koordinaten mit der richtigen Außennormale",()=>{
 const w=new World();w.set(-1,1,-3,"Ziegel");const hit=castVoxels(w,{x:-3.5,y:1.5,z:-2.5},{x:2,y:0,z:0})!;expect(hit.cell).toEqual([-1,1,-3]);expect(hit.distance).toBeCloseTo(2.5);expect(hit.normal).toEqual([-1,0,0]);
});
it("überlässt offene Spezialformen ihrer Modellgeometrie und trifft dahinter echte Voxel",()=>{
 const w=new World();w.set(0,1,4,"Leiter");w.set(0,1,2,"Stein");expect(castVoxels(w,{x:.5,y:1.5,z:6},{x:0,y:0,z:-1})?.cell).toEqual([0,1,2]);
});
