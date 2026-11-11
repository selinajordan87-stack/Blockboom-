import { it, expect } from "vitest";
import * as T from "three";
import { World } from "../world/World";
import { WorldView } from "../world/Renderer";
it("behält eine begrenzte Geometriezahl und entsorgt alte GPU-Geometrie nach Weltänderungen", () => {
  const w = new World(),
    scene = new T.Scene(),
    view = new WorldView(w, scene);
  const start = performance.now();
  view.update();
  const buildMs = performance.now() - start;
  expect(view.group.children.length).toBeLessThanOrEqual(32);
  const original = (view.group.children[0] as T.Mesh).geometry;
  view.update();
  expect((view.group.children[0] as T.Mesh).geometry).toBe(original);
  let disposed = 0;
  for (const m of view.group.children)
    (m as T.Mesh).geometry.addEventListener("dispose", () => disposed++);
  const count = view.group.children.length;
  w.resetBoom();
  view.update();
  expect(disposed).toBe(count);
  expect(view.group.children.length).toBe(count);
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
    }),
  );
});
