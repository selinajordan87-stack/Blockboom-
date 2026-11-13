import * as T from "three";
import { World, MIN_Y, MAX_Y, type Block } from "./World";
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
  Kohleerz:0x4e5357,Kupfererz:0xba8260,Eisenerz:0xa0a3a1,Golderz:0xd1ac4d,Acker:0x68503b,Bett:0x9f7772,Tisch:0xad8256,Stuhl:0x9a734d,Regal:0x8a6847,Truhe:0xba8d51,Werkbank:0xa78a61,Ofen:0x626f78,Laterne:0xf2d18a,Teppich:0x6f96a2,Schatztruhe:0xd1ad55,
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
  Kohleerz:3,Kupfererz:3,Eisenerz:3,Golderz:3,Acker:2,Bett:5,Tisch:5,Stuhl:5,Regal:5,Truhe:5,Werkbank:5,Ofen:10,Laterne:5,Teppich:5,Schatztruhe:5,
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
const emptyData = ():ChunkData => ({p:[],n:[],c:[],uv:[],i:[]});
type ChunkBuild = {id:string;cx:number;cz:number;column:number;solid:ChunkData;glass:ChunkData;cpuMs:number};
export interface WorldRenderMetrics {
  /** CPU time spent in the latest update, rather than elapsed time across frames. */
  lastBuildMs:number;maxBuildMs:number;totalBuildMs:number;
  lastChunkMs:number;maxChunkMs:number;queue:number;rebuilt:number;
  columns:number;restarts:number;activeMeshes:number;currentChunk:string|null;
}

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
  private knownChunks = new Set<string>();
  private pending = new Set<string>();
  private current:ChunkBuild|undefined;
  private initialized=false;
  private focusX=0;
  private focusZ=17;
  private visibleDistance=64;
  private faceColors=Object.fromEntries(Object.entries(colors).map(([block,color])=>[block,new T.Color(color)])) as Record<Block,T.Color>;
  private grassSide=new T.Color(0x8d8c55);
  readonly metrics:WorldRenderMetrics={lastBuildMs:0,maxBuildMs:0,totalBuildMs:0,lastChunkMs:0,maxChunkMs:0,queue:0,rebuilt:0,columns:0,restarts:0,activeMeshes:0,currentChunk:null};
  constructor(public world: World, scene: T.Scene, private clock:()=>number=()=>performance.now()) {
    this.group.name = "chunked voxel world";
    scene.add(this.group);
  }
  /** Existing callers can drain synchronously. Gameplay passes its small frame budget. */
  update(budgetMs=Infinity) {
    this.metrics.lastBuildMs=0;this.metrics.columns=0;
    if(this.revision===this.world.revision&&!this.current&&!this.pending.size)return;
    const started=this.clock();
    if(this.revision!==this.world.revision)this.collectChanges();
    const budget=Number.isNaN(budgetMs)?0:Math.max(0,budgetMs);
    while(budget>0&&(budget===Infinity||this.clock()-started<budget)){
      if(!this.current){
        const id=this.nextChunk();if(id===undefined)break;
        const [cx,cz]=id.split(",").map(Number);
        this.current={id,cx,cz,column:0,solid:emptyData(),glass:emptyData(),cpuMs:0};
      }
      const job=this.current,partStarted=this.clock();
      // One column is the smallest interruptible terrain unit. Both layers share
      // the same scan; expensive second scans of buried blocks are avoided.
      const x=job.cx*CHUNK+Math.floor(job.column/CHUNK),z=job.cz*CHUNK+job.column%CHUNK;
      for(let y=MIN_Y;y<=MAX_Y;y++){
        const block=this.world.get(x,y,z);
        if(block&&!special(block))this.blockFaces(block==="Glas"?job.glass:job.solid,x,y,z,block);
      }
      job.column++;this.metrics.columns++;
      if(job.column===CHUNK*CHUNK){
        this.finish(job);this.current=undefined;
        job.cpuMs+=this.clock()-partStarted;
        this.metrics.lastChunkMs=job.cpuMs;this.metrics.maxChunkMs=Math.max(this.metrics.maxChunkMs,job.cpuMs);this.metrics.rebuilt++;
      }else job.cpuMs+=this.clock()-partStarted;
    }
    this.metrics.lastBuildMs=this.clock()-started;
    this.metrics.maxBuildMs=Math.max(this.metrics.maxBuildMs,this.metrics.lastBuildMs);
    this.metrics.totalBuildMs+=this.metrics.lastBuildMs;
    this.syncMetrics();
  }
  setFocus(x:number,z:number){if(Number.isFinite(x)&&Number.isFinite(z)){this.focusX=x;this.focusZ=z;}}
  private syncMetrics(){this.metrics.queue=this.pending.size+(this.current?1:0);this.metrics.currentChunk=this.current?.id||null;this.metrics.activeMeshes=this.meshes.size;}
  private enqueue(id:string){
    if(!this.world.activeChunks.has(id))return;
    if(this.current?.id===id){this.current=undefined;this.metrics.restarts++;}
    this.pending.add(id);
  }
  private collectChanges(){
    for(const [id,mesh]of this.meshes)if(!this.world.activeChunks.has(id.split(":")[0])){
      mesh.geometry.dispose();this.group.remove(mesh);this.meshes.delete(id);
    }
    for(const id of this.knownChunks)if(!this.world.activeChunks.has(id))this.knownChunks.delete(id);
    for(const id of this.pending)if(!this.world.activeChunks.has(id))this.pending.delete(id);
    if(this.current&&!this.world.activeChunks.has(this.current.id))this.current=undefined;
    if(!this.initialized){
      for(const id of this.world.activeChunks)this.pending.add(id);
      this.initialized=true;
    }else{
      // v0.7 World records chunk identities at mutation time. The cell fallback
      // keeps this renderer compatible with older World adapters and tests.
      const dirtyChunks=(this.world as World&{dirtyChunks?:Set<string>}).dirtyChunks;
      if(dirtyChunks?.size){for(const id of dirtyChunks)this.enqueue(id);}
      else for(const key of this.world.dirty){
        const [x,,z]=key.split(",").map(Number),cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);
        this.enqueue(spatialId(cx,cz));
        if(x%CHUNK===0)this.enqueue(spatialId(cx-1,cz));
        if(((x%CHUNK)+CHUNK)%CHUNK===CHUNK-1)this.enqueue(spatialId(cx+1,cz));
        if(z%CHUNK===0)this.enqueue(spatialId(cx,cz-1));
        if(((z%CHUNK)+CHUNK)%CHUNK===CHUNK-1)this.enqueue(spatialId(cx,cz+1));
      }
      for(const id of this.world.activeChunks)if(!this.knownChunks.has(id)&&this.current?.id!==id)this.pending.add(id);
    }
    this.world.dirty.clear();
    (this.world as World&{dirtyChunks?:Set<string>}).dirtyChunks?.clear();
    this.revision=this.world.revision;
  }
  private nextChunk(){
    let closest:string|undefined,nearest=Infinity;
    for(const id of this.pending){const [cx,cz]=id.split(",").map(Number),distance=(cx*CHUNK+CHUNK/2-this.focusX)**2+(cz*CHUNK+CHUNK/2-this.focusZ)**2;if(distance<nearest){nearest=distance;closest=id;}}
    if(closest!==undefined)this.pending.delete(closest);return closest;
  }
  private layer(data:ChunkData,job:ChunkBuild,glassLayer:boolean){
    if(!data.i.length)return undefined;
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
    const id=`${job.id}:${glassLayer?"glass":"solid"}`;
    mesh.name = id;
    mesh.userData.center=[job.cx*CHUNK+6,job.cz*CHUNK+6];
    mesh.visible=Math.hypot(mesh.userData.center[0]-this.focusX,mesh.userData.center[1]-this.focusZ)<this.visibleDistance;
    return mesh;
  }
  private finish(job:ChunkBuild){
    const solid=this.layer(job.solid,job,false),glass=this.layer(job.glass,job,true);
    // Keep the previous whole chunk visible until both replacement layers are
    // ready, then swap them in the same task so partial builds never make holes.
    for(const [layer,mesh]of [["solid",solid],["glass",glass]] as const){
      const id=`${job.id}:${layer}`,previous=this.meshes.get(id);
      if(previous){previous.geometry.dispose();this.group.remove(previous);this.meshes.delete(id);}
      if(mesh){this.meshes.set(id,mesh);this.group.add(mesh);}
    }
    this.knownChunks.add(job.id);
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
      const color=block==="Gras"&&face.n[1]===0?this.grassSide:this.faceColors[block];
      const shade=face.shade*(0.97+((x*13+z*7+y*3)&7)*0.007);
      const atlasTile = tileFor(block, face.n);
      const column = atlasTile % ATLAS_COLUMNS;
      const row = Math.floor(atlasTile / ATLAS_COLUMNS);
      const paddingU = 0.45 / (ATLAS_COLUMNS * TILE_SIZE);
      const paddingV = 0.45 / (ATLAS_ROWS * TILE_SIZE);
      for (let j = 0; j < face.v.length; j++) {
        const vertex = face.v[j];
        data.p.push(x + vertex[0], y + vertex[1], z + vertex[2]);
        data.n.push(...face.n);
        data.c.push(color.r*shade,color.g*shade,color.b*shade);
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
    this.group.clear();
    this.pending.clear();this.knownChunks.clear();this.current=undefined;this.syncMetrics();
    this.material.dispose();
    this.glass.dispose();
    this.atlas.dispose();
    this.group.removeFromParent();
  }
  visibility(x:number,z:number,distance=64){this.setFocus(x,z);this.visibleDistance=distance;for(const mesh of this.meshes.values()){const [cx,cz]=mesh.userData.center;mesh.visible=Math.hypot(cx-x,cz-z)<distance;}}
}
