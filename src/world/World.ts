export const TYPES = [
  "Gras",
  "Erde",
  "Stein",
  "Holz",
  "Bretter",
  "Glas",
  "Sand",
  "Ziegel",
  "Laub",
  "Kopfstein",
  "Ton",
  "Moosstein",
  "Dunkelholz",
  "Kalkstein",
  "Schiefer",
  "Tür", "Tor", "Zaun", "Leiter", "Treppe", "Fackel", "Falle", "Lagerkiste", "Barriere", "Mauer",
  "Kohleerz", "Kupfererz", "Eisenerz", "Golderz", "Acker", "Bett", "Tisch", "Stuhl", "Regal", "Truhe", "Werkbank", "Ofen", "Laterne", "Teppich",
] as const;
export type Block = (typeof TYPES)[number] | "Boom" | "Tür offen" | "Tor offen" | "Schatztruhe";
export const SPECIAL_TYPES = ["Tür","Tür offen","Tor","Tor offen","Zaun","Leiter","Treppe","Fackel","Falle","Lagerkiste","Barriere","Bett","Tisch","Stuhl","Regal","Truhe","Werkbank","Ofen","Laterne","Teppich","Schatztruhe"] as const;
const specialTypes=new Set<string>(SPECIAL_TYPES);
export type Cell = [number, number, number];
export const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
export const LIMIT = 336;
export const MIN_Y = -18, MAX_Y = 26;
export class World {
  blocks = new Map<string, Block>();
  specialBlocks=new Map<string,Block>();
  propsRevision=0;
  changes: Record<string, Block | null> = {};
  /** Cells changed since the renderer last synchronized its chunk meshes. */
  dirty = new Set<string>();
  /** Direct chunk invalidation avoids reparsing thousands of dirty cell strings. */
  dirtyChunks = new Set<string>();
  changesByChunk = new Map<string,Map<string,Block|null>>();
  revision = 0;
  activeChunks = new Set<string>();
  get(x: number, y: number, z: number) {
    return this.blocks.get(key(x, y, z));
  }
  set(x: number, y: number, z: number, b: Block | null, record = true) {
    const k = key(x, y, z);
    const previous=this.blocks.get(k);
    if (b) this.blocks.set(k, b);
    else this.blocks.delete(k);
    if(b&&specialTypes.has(b))this.specialBlocks.set(k,b);else this.specialBlocks.delete(k);
    if(previous!==b&&(specialTypes.has(previous||"")||specialTypes.has(b||"")))this.propsRevision++;
    const cx=Math.floor(x/12),cz=Math.floor(z/12),id=`${cx},${cz}`;
    if (record) {
      this.changes[k] = b;
      let changes=this.changesByChunk.get(id);if(!changes)this.changesByChunk.set(id,changes=new Map());changes.set(k,b);
    }
    this.dirty.add(k);
    this.dirtyChunks.add(id);
    const lx=((x%12)+12)%12,lz=((z%12)+12)%12;
    if(lx===0)this.dirtyChunks.add(`${cx-1},${cz}`);if(lx===11)this.dirtyChunks.add(`${cx+1},${cz}`);
    if(lz===0)this.dirtyChunks.add(`${cx},${cz-1}`);if(lz===11)this.dirtyChunks.add(`${cx},${cz+1}`);
    this.revision++;
  }
  /** Streaming forgets generated blocks, never their authoritative saved delta. */
  forgetGenerated(x:number,y:number,z:number){const id=key(x,y,z);this.blocks.delete(id);if(this.specialBlocks.delete(id))this.propsRevision++;}
  constructor() {
    for (let cx=-2;cx<2;cx++)for(let cz=-2;cz<2;cz++)this.activeChunks.add(`${cx},${cz}`);
    for (let x = -24; x < 24; x++)
      for (let z = -24; z < 24; z++) {
        const lake = (x + 10) ** 2 / 42 + (z + 5) ** 2 / 38 < 1;
        const h = lake
          ? -1
          : x > 5 && z < -7
            ? Math.floor(1 + 1.5 * Math.sin(x * 0.25) * Math.cos(z * 0.23))
            : 0;
        for (let y = -3; y <= h; y++)
          this.set(
            x,
            y,
            z,
            y === h ? (lake ? "Sand" : "Gras") : y === -3 ? "Stein" : "Erde",
            false,
          );
      }
    for (const [x, z] of [
      [-19, 9],
      [-17, -17],
      [-2, -17],
      [15, -14],
      [19, 4],
      [3, 16],
      [-9, 17],
      [18, 18],
    ]) {
      let y = 5;
      while (!this.get(x, y - 1, z) && y > -2) y--;
      for (let t = 0; t < 4; t++) this.set(x, y + t, z, "Holz", false);
      for (let a = -2; a <= 2; a++)
        for (let b = -2; b <= 2; b++)
          for (let c = 3; c <= 5; c++)
            if (Math.abs(a) + Math.abs(b) + (c === 5 ? 1 : 0) < 4)
              this.set(x + a, y + c, z + b, "Laub", false);
    }
    for (let x = -12; x <= -10; x++)
      for (let z = -1; z <= 4; z++) this.set(x, 1, z, "Bretter", false);
    // Sandstone outline of the build plot; the arena is entirely separate.
    for (let x = -3; x <= 5; x++)
      for (let z = 5; z <= 13; z++)
        if (x === -3 || x === 5 || z === 5 || z === 13)
          this.set(x, 0, z, "Sand", false);
    for (let x = 9; x <= 19; x++)
      for (let z = 6; z <= 16; z++) this.set(x, 0, z, "Stein", false);
    this.resetBoom(false);
    this.revision = 1;
  }
  resetBoom(record = true) {
    for (let x = 12; x <= 16; x++)
      for (let z = 9; z <= 13; z++)
        for (let y = 1; y <= 4; y++)
          this.set(
            x,
            y,
            z,
            (x === 12 || x === 16 || z === 9 || z === 13) && y <= 3
              ? "Boom"
              : null,
            record,
          );
  }
  apply(changes: Record<string, Block | null>) {
    for (const [k, b] of Object.entries(changes)) {
      const [x, y, z] = k.split(",").map(Number);
      this.set(x, y, z, b);
    }
  }
}
export function intersectsPlayer(c: Cell, p: Cell) {
  return (
    c[0] + 1 > p[0] - 0.29 &&
    c[0] < p[0] + 0.29 &&
    c[1] + 1 > p[1] &&
    c[1] < p[1] + 1.75 &&
    c[2] + 1 > p[2] - 0.29 &&
    c[2] < p[2] + 0.29
  );
}
export function canPlace(world: World, c: Cell, p: Cell) {
  return (
    c.every(Number.isInteger) &&
    Math.abs(c[0]) < LIMIT &&
    Math.abs(c[2]) < LIMIT &&
    c[1] > MIN_Y &&
    c[1] <= MAX_Y &&
    Math.hypot(
      c[0] + 0.5 - p[0],
      c[1] + 0.5 - (p[1] + 1.6),
      c[2] + 0.5 - p[2],
    ) <= 6 &&
    !protectedCell(c) &&
    !world.get(...c) &&
    !intersectsPlayer(c, p)
  );
}
export function place(world: World, c: Cell, b: Block, p: Cell) {
  if (!TYPES.includes(b as (typeof TYPES)[number]) || !canPlace(world, c, p))
    return false;
  world.set(...c, b);
  return true;
}
export function protectedCell(c: Cell) {
  if (
    ((c[0] === -3 && c[2] === 14) ||
      (c[0] === -9 && c[2] === 3) ||
      (c[0] === 7 && c[2] === -4)) &&
    c[1] >= 0 &&
    c[1] <= 2
  )
    return true;
  return c[0] >= -12 && c[0] <= -10 && c[2] >= -1 && c[2] <= 4 && c[1] === 1;
}
export function remove(world: World, c: Cell, p: Cell) {
  if (
    (c[1] <= (Math.abs(c[0])<24&&Math.abs(c[2])<24?-3:MIN_Y)) ||
    (protectedCell(c) &&
      !Object.prototype.hasOwnProperty.call(world.changes, key(...c))) ||
    Math.hypot(
      c[0] + 0.5 - p[0],
      c[1] + 0.5 - (p[1] + 1.6),
      c[2] + 0.5 - p[2],
    ) > 6 ||
    !world.get(...c)
  )
    return false;
  world.set(...c, null);
  return true;
}
