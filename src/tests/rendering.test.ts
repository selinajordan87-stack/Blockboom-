import { it, expect } from "vitest";
import * as T from "three";
import { World } from "../world/World";
import { WorldView } from "../world/Renderer";
import { RegionStream } from "../living/Regions";
it("behält eine begrenzte Geometriezahl und baut nur betroffene Chunks neu", () => {
  const w = new World(),
    scene = new T.Scene(),
    view = new WorldView(w, scene);
  const start = performance.now();
  view.update();
  const buildMs = performance.now() - start;
  expect(view.group.children.length).toBeLessThanOrEqual(32);
  const original = (view.group.children[0] as T.Mesh).geometry;
  expect(original.getAttribute("uv")).toBeDefined();
  expect(view.material.map).toBe(view.atlas);
  view.update();
  expect((view.group.children[0] as T.Mesh).geometry).toBe(original);
  let disposed = 0;
  for (const m of view.group.children)
    (m as T.Mesh).geometry.addEventListener("dispose", () => disposed++);
  const count = view.group.children.length;
  const untouched = view.group.children.find((m) => m.name === "-2,-2:solid");
  const untouchedGeometry = (untouched as T.Mesh | undefined)?.geometry;
  w.resetBoom();
  view.update();
  expect(disposed).toBeGreaterThan(0);
  expect(disposed).toBeLessThan(count);
  expect(view.group.children.length).toBe(count);
  expect(
    (view.group.children.find((m) => m.name === "-2,-2:solid") as T.Mesh)
      .geometry,
  ).toBe(untouchedGeometry);
  const camera = new T.PerspectiveCamera(70, 1, 0.08, 80);
  camera.position.set(0, 2.6, 17);
  camera.lookAt(0, 1, 5);
  camera.updateMatrixWorld();
  scene.updateMatrixWorld(true);
  const ray = new T.Raycaster();
  ray.setFromCamera(new T.Vector2(), camera);
  const t = performance.now();
  for (let i = 0; i < 100; i++)
    ray.intersectObjects(view.group.children, false);
  const pickMs = (performance.now() - t) / 100;
  console.info(
    JSON.stringify({
      worldMeshes: count,
      buildMs: +buildMs.toFixed(2),
      meanPickMs: +pickMs.toFixed(3),
      oldPickBudgetPer60Frames: 60,
      newMaxPicksPerSecond: 20,
      rebuiltMeshes: disposed,
    }),
  );
});

it("gibt Geometrien entladener Regionen frei und hält Materialien beim Streaming gemeinsam",()=>{
 const w=new World(),stream=new RegionStream(w),scene=new T.Scene(),view=new WorldView(w,scene);
 const tracked=new Map<T.BufferGeometry,boolean>();let peakMeshes=0,peakBlocks=0,maxRebuildMs=0;
 for(const [x,z]of [[0,17],[-43,12],[45,-30],[39,29],[-43,-35],[45,-30],[-43,12],[0,17]]){
   const t=performance.now();stream.ensure(x,z);view.update();maxRebuildMs=Math.max(maxRebuildMs,performance.now()-t);
   peakMeshes=Math.max(peakMeshes,view.group.children.length);peakBlocks=Math.max(peakBlocks,w.blocks.size);
   for(const m of view.group.children){const mesh=m as T.Mesh;expect([view.material,view.glass]).toContain(mesh.material);
     if(!tracked.has(mesh.geometry)){tracked.set(mesh.geometry,false);mesh.geometry.addEventListener("dispose",()=>tracked.set(mesh.geometry,true));}
   }
   expect([...tracked.values()].filter(disposed=>!disposed)).toHaveLength(view.group.children.length);
 }
 expect(peakMeshes).toBeLessThanOrEqual(74);expect(peakBlocks).toBeLessThan(120000);expect([...tracked.values()].filter(Boolean).length).toBeGreaterThan(50);
 console.info(JSON.stringify({streamingPasses:8,peakMeshes,peakBlocks,remainingGeometry:view.group.children.length,disposedGeometry:[...tracked.values()].filter(Boolean).length,maxRebuildMs:+maxRebuildMs.toFixed(2)}));
});
