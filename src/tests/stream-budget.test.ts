import {expect,it} from "vitest";
import * as T from "three";
import {World} from "../world/World";
import {WorldView} from "../world/Renderer";

const mesh=(view:WorldView,id:string)=>view.group.children.find(m=>m.name===id) as T.Mesh<T.BufferGeometry>|undefined;
const fakeClock=()=>{let time=0;return()=>{time+=.1;return time;};};

it("priorisiert nahe Chunks und verteilt deren Spalten über mehrere kleine Budgets",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene(),fakeClock());
 view.setFocus(18,18);view.update(1);
 expect(view.metrics.currentChunk).toBe("1,1");expect(view.metrics.queue).toBe(16);
 expect(view.metrics.columns).toBeGreaterThan(0);expect(view.metrics.columns).toBeLessThan(144);
 expect(view.group.children).toHaveLength(0);
 let slices=1;while(view.metrics.queue&&slices<2000){view.update(1);slices++;}
 expect(view.metrics.queue).toBe(0);expect(slices).toBeGreaterThan(16);
 expect(view.metrics.rebuilt).toBe(16);expect(view.metrics.activeMeshes).toBe(view.group.children.length);
 expect(view.metrics.maxBuildMs).toBeGreaterThan(0);view.dispose();
});

it("behält den vollständigen alten Chunk bis beide neuen Materialschichten fertig sind",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene(),fakeClock());view.update();
 const previous=mesh(view,"0,0:solid")!,untouched=mesh(view,"-2,-2:solid")!,oldGeometry=previous.geometry;
 let disposed=0;oldGeometry.addEventListener("dispose",()=>disposed++);
 world.set(6,1,6,"Glas");view.setFocus(6,6);view.update(1);
 expect(mesh(view,"0,0:solid")?.geometry).toBe(oldGeometry);expect(mesh(view,"0,0:glass")).toBeUndefined();expect(disposed).toBe(0);
 view.update();expect(mesh(view,"0,0:solid")?.geometry).not.toBe(oldGeometry);
 expect(mesh(view,"0,0:glass")?.material).toBe(view.glass);expect(disposed).toBe(1);
 expect(mesh(view,"-2,-2:solid")).toBe(untouched);view.dispose();
});

it("verwirft einen begonnenen alten Aufbau nach neuer Weltänderung statt veraltete Flächen einzublenden",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene(),fakeClock());view.update();view.setFocus(6,6);
 world.set(6,1,6,"Glas");view.update(1);expect(view.metrics.currentChunk).toBe("0,0");
 world.set(8,1,6,"Glas");view.update(1);expect(view.metrics.restarts).toBe(1);
 view.update();const positions=mesh(view,"0,0:glass")!.geometry.getAttribute("position");
 const xs=Array.from({length:positions.count},(_,i)=>positions.getX(i));
 expect(xs).toContain(6);expect(xs).toContain(9);expect(view.metrics.queue).toBe(0);view.dispose();
});

it("entfernt entladene Chunks samt begonnenem Aufbau und gibt alle GPU-Geometrien frei",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene(),fakeClock());view.update();view.setFocus(6,6);
 const geometries=new Set(view.group.children.map(m=>(m as T.Mesh).geometry));let disposed=0;
 for(const geometry of geometries)geometry.addEventListener("dispose",()=>disposed++);
 world.set(6,1,6,"Glas");view.update(1);
 world.activeChunks.delete("0,0");world.revision++;view.update();
 expect(mesh(view,"0,0:solid")).toBeUndefined();expect(mesh(view,"0,0:glass")).toBeUndefined();
 expect(view.metrics.queue).toBe(0);expect(disposed).toBe(1);
 view.dispose();expect(disposed).toBe(geometries.size);expect(view.group.children).toHaveLength(0);expect(view.metrics.activeMeshes).toBe(0);
});

it("aktualisiert bei einer Blockänderung an der Chunkkante nur die angrenzenden Geometrien",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene());view.update();
 const before=new Map(view.group.children.map(m=>[m.name,(m as T.Mesh).geometry]));
 world.set(11,1,6,"Stein");view.update();
 const changed=[...before].filter(([id,geometry])=>mesh(view,id)?.geometry!==geometry).map(([id])=>id);
 expect(changed.sort()).toEqual(["0,0:solid","1,0:solid"]);view.dispose();
});

it("misst reale Buildslices und hält Geometrien bei wiederholten kleinen Bauaktionen begrenzt",()=>{
 const world=new World(),view=new WorldView(world,new T.Scene());const times:number[]=[];
 do{view.update(4);times.push(view.metrics.lastBuildMs);}while(view.metrics.queue);
 const count=view.group.children.length,base=view.metrics.rebuilt;
 for(let i=0;i<12;i++){
   world.set(6,1,6,i%2?null:"Stein");
   do{view.update(4);times.push(view.metrics.lastBuildMs);}while(view.metrics.queue);
   expect(view.group.children.length).toBe(count);
 }
 expect(view.metrics.rebuilt-base).toBe(12);view.update(4);expect(view.metrics.lastBuildMs).toBe(0);
 console.info(JSON.stringify({rendererBudgetMs:4,slices:times.length,maxObservedSliceMs:+Math.max(...times).toFixed(2),meanSliceMs:+(times.reduce((a,b)=>a+b,0)/times.length).toFixed(2),maxChunkCpuMs:+view.metrics.maxChunkMs.toFixed(2),activeMeshes:view.metrics.activeMeshes}));
 view.dispose();
});
