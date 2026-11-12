import * as T from "three";
import { World, type Block } from "./World";
import { special } from "../nightfall/Defense";

export const colors: Record<Block, number> = {
  Gras: 0x78b957,
  Erde: 0x956747,
  Stein: 0x87979b,
  Holz: 0x765035,
  Bretter: 0xc99a68,
  Glas: 0x9cdde0,
  Laub: 0x3d8955,
  Sand: 0xddc386,
  Boom: 0xe59a3f,
  Ziegel: 0xb95f45,
  Kopfstein: 0x737f81,
  Ton: 0xb87963,
  Moosstein: 0x667b5b,
  Dunkelholz: 0x4f372b,
  Kalkstein: 0xc8c4aa,
  Schiefer: 0x53616e,
  Tür:0x976b3d,"Tür offen":0x976b3d,Tor:0x87613b,"Tor offen":0x87613b,Zaun:0x997445,Leiter:0xb89764,Treppe:0x8e9a99,Fackel:0xf5bd5d,Falle:0x788a72,Lagerkiste:0xa37b45,Barriere:0x6d7157,Mauer:0x727d83,
};

const CHUNK = 12;
const ATLAS_COLUMNS = 8;
const ATLAS_ROWS = 4;
const TILE_SIZE = 16;
const tile: Record<Block, number> = {
  Gras: 0,
  Erde: 2,
  Stein: 3,
  Holz: 4,
  Bretter: 5,
  Glas: 6,
  Sand: 7,
  Ziegel: 8,
  Laub: 9,
  Kopfstein: 10,
  Ton: 11,
  Moosstein: 12,
  Dunkelholz: 13,
  Kalkstein: 14,
  Schiefer: 15,
  Boom: 17,
  Tür:5,"Tür offen":5,Tor:5,"Tor offen":5,Zaun:4,Leiter:4,Treppe:3,Fackel:4,Falle:4,Lagerkiste:5,Barriere:4,Mauer:10,
};

function tileFor(block: Block, normal: readonly number[]) {
  if (block === "Gras" && normal[1] === 0) return 1;
  if ((block === "Holz" || block === "Dunkelholz") && normal[1] !== 0)
    return 16;
  return tile[block];
}

/** Small deterministic atlas: structured voxel surfaces without downloads or extra assets. */
export function createVoxelAtlas() {
  const width = ATLAS_COLUMNS * TILE_SIZE;
  const height = ATLAS_ROWS * TILE_SIZE;
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < ATLAS_COLUMNS * ATLAS_ROWS; index++)
    for (let y = 0; y < TILE_SIZE; y++)
      for (let x = 0; x < TILE_SIZE; x++) {
        const px = (index % ATLAS_COLUMNS) * TILE_SIZE + x;
        const py = Math.floor(index / ATLAS_COLUMNS) * TILE_SIZE + y;
        const at = (py * width + px) * 4;
        const hash = (x * 31 + y * 17 + index * 47) % 19;
        let shade = 226 + hash - 9;
        if (index === 0) shade += (x + y * 3) % 7 === 0 ? -35 : 8;
        if (index === 1)
          shade += y < 4 ? 18 : (x * 3 + y) % 9 === 0 ? -28 : 0;
        if (index === 2) shade += (x * 5 + y * 7) % 13 === 0 ? -30 : 0;
        if ([3, 10, 12, 14, 15].includes(index))
          shade += (x + y * 2 + index) % 11 === 0 ? -42 : 4;
        if ([4, 13].includes(index))
          shade += x % 5 === 0 ? -34 : y % 7 === 0 ? 12 : 0;
        if (index === 5)
          shade += y % 8 === 0 ? -40 : x % 11 === 0 ? -18 : 8;
        if (index === 6) shade = x === y || x + y === 15 ? 255 : 220;
        if (index === 7)
          shade += (x * 7 + y * 11) % 17 === 0 ? -38 : 10;
        if (index === 8)
          shade +=
            y % 6 === 0 ||
            (x + (Math.floor(y / 6) % 2) * 4) % 8 === 0
              ? -48
              : 8;
        if (index === 9)
          shade += (x * 7 + y * 5) % 10 < 2 ? -38 : 15;
        if (index === 11) shade += (x + y) % 8 === 0 ? 16 : -4;
        if (index === 16) {
          const distance = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
          shade += Math.floor(distance) % 3 === 0 ? -40 : 8;
        }
        if (index === 17) shade += (x + y) % 6 < 2 ? -45 : 18;
        const value = Math.max(145, Math.min(255, shade));
        data[at] = data[at + 1] = data[at + 2] = value;
        data[at + 3] = 255;
      }
  const texture = new T.DataTexture(data, width, height, T.RGBAFormat);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.name = "BLOCKBOOM procedural voxel atlas";
  return texture;
}

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
] as const;
const uvCorners = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
] as const;
type ChunkData = {
  p: number[];
  n: number[];
  c: number[];
  uv: number[];
  i: number[];
};
const spatialId = (cx: number, cz: number) => `${cx},${cz}`;

export class WorldView {
  group = new T.Group();
  atlas = createVoxelAtlas();
  material = new T.MeshLambertMaterial({ vertexColors: true, map: this.atlas });
  glass = new T.MeshLambertMaterial({
    vertexColors: true,
    map: this.atlas,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  revision = -1;
  private meshes = new Map<string, T.Mesh>();
  constructor(public world: World, scene: T.Scene) {
    this.group.name = "chunked voxel world";
    scene.add(this.group);
  }
  update() {
    if (this.revision === this.world.revision) return;
    const affected = new Set<string>();
    if (this.meshes.size === 0) {
      for (const k of this.world.blocks.keys()) {
        const [x, , z] = k.split(",").map(Number);
        affected.add(spatialId(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
      }
    } else {
      for (const k of this.world.dirty) {
        const [x, , z] = k.split(",").map(Number);
        for (const [dx, dz] of [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const)
          affected.add(
            spatialId(
              Math.floor((x + dx) / CHUNK),
              Math.floor((z + dz) / CHUNK),
            ),
          );
      }
    }
    for (const id of affected) {
      const [cx, cz] = id.split(",").map(Number);
      this.rebuild(cx, cz, false);
      this.rebuild(cx, cz, true);
    }
    this.world.dirty.clear();
    this.revision = this.world.revision;
  }
  private rebuild(cx: number, cz: number, glassLayer: boolean) {
    const id = `${spatialId(cx, cz)}:${glassLayer ? "glass" : "solid"}`;
    const previous = this.meshes.get(id);
    if (previous) {
      previous.geometry.dispose();
      this.group.remove(previous);
      this.meshes.delete(id);
    }
    const data: ChunkData = { p: [], n: [], c: [], uv: [], i: [] };
    const minX = cx * CHUNK;
    const minZ = cz * CHUNK;
    for (let x = minX; x < minX + CHUNK; x++)
      for (let z = minZ; z < minZ + CHUNK; z++)
        for (let y = -3; y <= 14; y++) {
          const block = this.world.get(x, y, z);
          if (!block || special(block) || (block === "Glas") !== glassLayer) continue;
          this.blockFaces(data, x, y, z, block);
        }
    if (!data.i.length) return;
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(data.p, 3));
    geometry.setAttribute("normal", new T.Float32BufferAttribute(data.n, 3));
    geometry.setAttribute("color", new T.Float32BufferAttribute(data.c, 3));
    geometry.setAttribute("uv", new T.Float32BufferAttribute(data.uv, 2));
    geometry.setIndex(data.i);
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(
      geometry,
      glassLayer ? this.glass : this.material,
    );
    mesh.name = id;
    this.meshes.set(id, mesh);
    this.group.add(mesh);
  }
  private blockFaces(
    data: ChunkData,
    x: number,
    y: number,
    z: number,
    block: Block,
  ) {
    for (const face of faces) {
      const neighbor = this.world.get(
        x + face.n[0],
        y + face.n[1],
        z + face.n[2],
      );
      if (neighbor && !special(neighbor) && (neighbor !== "Glas" || block === "Glas")) continue;
      const offset = data.p.length / 3;
      let color = new T.Color(colors[block]);
      if (block === "Gras" && face.n[1] === 0)
        color = new T.Color(0x8d8c55);
      color.multiplyScalar(
        face.shade * (0.97 + ((x * 13 + z * 7 + y * 3) & 7) * 0.007),
      );
      const atlasTile = tileFor(block, face.n);
      const column = atlasTile % ATLAS_COLUMNS;
      const row = Math.floor(atlasTile / ATLAS_COLUMNS);
      const paddingU = 0.45 / (ATLAS_COLUMNS * TILE_SIZE);
      const paddingV = 0.45 / (ATLAS_ROWS * TILE_SIZE);
      for (let j = 0; j < face.v.length; j++) {
        const vertex = face.v[j];
        data.p.push(x + vertex[0], y + vertex[1], z + vertex[2]);
        data.n.push(...face.n);
        data.c.push(color.r, color.g, color.b);
        data.uv.push(
          (column + uvCorners[j][0]) / ATLAS_COLUMNS +
            (uvCorners[j][0] ? -paddingU : paddingU),
          (row + uvCorners[j][1]) / ATLAS_ROWS +
            (uvCorners[j][1] ? -paddingV : paddingV),
        );
      }
      data.i.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 2,
        offset + 1,
        offset + 3,
      );
    }
  }
  dispose() {
    for (const mesh of this.meshes.values()) mesh.geometry.dispose();
    this.meshes.clear();
    this.material.dispose();
    this.glass.dispose();
    this.atlas.dispose();
    this.group.removeFromParent();
  }
}
