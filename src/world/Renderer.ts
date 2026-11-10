import * as T from "three";
import { World, key, type Block } from "./World";
export const colors: Record<Block, number> = {
  Gras: 0x83b85c,
  Erde: 0x9b7050,
  Stein: 0x8b9c9e,
  Holz: 0x79563b,
  Bretter: 0xcba275,
  Glas: 0xa2e1e1,
  Laub: 0x43895c,
  Sand: 0xdec697,
  Boom: 0xe6a148,
};
const faces = [
  {
    n: [1, 0, 0],
    v: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 1],
      [1, 1, 0],
    ],
    shade: 0.83,
  },
  {
    n: [-1, 0, 0],
    v: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
      [0, 1, 1],
    ],
    shade: 0.7,
  },
  {
    n: [0, 1, 0],
    v: [
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 0],
    ],
    shade: 1.12,
  },
  {
    n: [0, -1, 0],
    v: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
    ],
    shade: 0.6,
  },
  {
    n: [0, 0, 1],
    v: [
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ],
    shade: 0.92,
  },
  {
    n: [0, 0, -1],
    v: [
      [1, 0, 0],
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
    shade: 0.76,
  },
];
export class WorldView {
  group = new T.Group();
  material = new T.MeshLambertMaterial({ vertexColors: true });
  glass = new T.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.48,
  });
  revision = -1;
  constructor(
    public world: World,
    scene: T.Scene,
  ) {
    scene.add(this.group);
  }
  update() {
    if (this.revision === this.world.revision) return;
    this.revision = this.world.revision;
    for (const m of [...this.group.children]) {
      (m as T.Mesh).geometry.dispose();
      this.group.remove(m);
    }
    const chunks = new Map<
      string,
      { p: number[]; n: number[]; c: number[]; i: number[]; glass: boolean }
    >();
    for (const [k, b] of this.world.blocks) {
      const [x, y, z] = k.split(",").map(Number);
      const id = key(
        Math.floor(x / 12),
        b === "Glas" ? 1 : 0,
        Math.floor(z / 12),
      );
      let chunk = chunks.get(id);
      if (!chunk) {
        chunk = { p: [], n: [], c: [], i: [], glass: b === "Glas" };
        chunks.set(id, chunk);
      }
      for (const f of faces) {
        const neighbor = this.world.get(x + f.n[0], y + f.n[1], z + f.n[2]);
        if (neighbor && (neighbor !== "Glas" || b === "Glas")) continue;
        const offset = chunk.p.length / 3;
        let color = new T.Color(colors[b]);
        if (b === "Gras" && f.n[1] === 0) color = new T.Color(0x8d9760);
        color.multiplyScalar(
          f.shade * (0.96 + ((x * 13 + z * 7 + y * 3) & 7) * 0.009),
        );
        for (const v of f.v) {
          chunk.p.push(x + v[0], y + v[1], z + v[2]);
          chunk.n.push(...f.n);
          chunk.c.push(color.r, color.g, color.b);
        }
        chunk.i.push(
          offset,
          offset + 1,
          offset + 2,
          offset + 2,
          offset + 1,
          offset + 3,
        );
      }
    }
    for (const c of chunks.values()) {
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(c.p, 3));
      g.setAttribute("normal", new T.Float32BufferAttribute(c.n, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(c.c, 3));
      g.setIndex(c.i);
      g.computeBoundingSphere();
      this.group.add(new T.Mesh(g, c.glass ? this.glass : this.material));
    }
  }
}
