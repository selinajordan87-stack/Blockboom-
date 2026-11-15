import {expect,it} from 'vitest';
import * as T from 'three';
import {World} from '../world/World';
import {WorldView} from '../world/Renderer';
import {RegionStream} from '../living/Regions';
import {MOUNTAIN_PATH} from '../world/TerrainSculpt';
it('misst budgetierte Berg-Chunkaufbauten und gibt ihre Geometrien vollständig frei',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true),view=new WorldView(world,new T.Scene());
 const samples=[];
 for(const[x,z]of [...MOUNTAIN_PATH,...MOUNTAIN_PATH.slice().reverse()]){
  let iterations=0;view.setFocus(x,z);
  do{stream.ensure(x,z,4);view.update(4);iterations++;}while((stream.metrics.pendingChunks||view.metrics.queue)&&iterations<2000);
  expect(iterations).toBeLessThan(2000);expect(world.activeChunks.size).toBeLessThanOrEqual(37);expect(view.metrics.activeMeshes).toBeLessThanOrEqual(40);
  samples.push({x,z,blocks:world.blocks.size,chunks:world.activeChunks.size,meshes:view.metrics.activeMeshes,maxSliceMs:view.metrics.maxRuntimeBuildMs,maxChunkCpuMs:view.metrics.maxChunkMs,maxGenerationSliceMs:stream.metrics.maxRuntimeMs});
 }
 const geometries=new Set(view.group.children.map(m=>(m as T.Mesh).geometry));let disposed=0;for(const g of geometries)g.addEventListener('dispose',()=>disposed++);
 view.dispose();expect(disposed).toBe(geometries.size);expect(view.group.children).toHaveLength(0);
 console.info(JSON.stringify({method:'Node CPU geometry benchmark, controlled focus coordinates; not GPU or device FPS',generation2Mountain:samples}));
},30000);
