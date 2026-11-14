import {SPECIAL_TYPES,World,type Cell} from "../world/World";
const special=new Set<string>(SPECIAL_TYPES);
interface Vector {x:number;y:number;z:number}
export interface VoxelHit {cell:Cell;normal:Cell;point:Cell;distance:number;}
/** Authoritative voxel targeting: a second build never waits for a GPU chunk rebuild. */
export function castVoxels(world:World,origin:Vector,direction:Vector,reach=6):VoxelHit|null{
 const o:Cell=[origin.x,origin.y,origin.z],d:Cell=[direction.x,direction.y,direction.z];
 if(!o.every(Number.isFinite)||!d.every(Number.isFinite)||!Number.isFinite(reach)||reach<=0)return null;
 const length=Math.hypot(...d);if(!length)return null;for(let a=0;a<3;a++)d[a]/=length;
 const cell=o.map(Math.floor) as Cell,step=d.map(Math.sign) as Cell,delta=d.map(n=>n?Math.abs(1/n):Infinity),next=d.map((n,a)=>n>0?(cell[a]+1-o[a])/n:n<0?(cell[a]-o[a])/n:Infinity);
 let distance=0,normal:Cell=[0,0,0];
 for(let count=0;count<256&&distance<=reach;count++){
  const block=world.get(...cell);
  if(block&&!special.has(block))return {cell:[...cell],normal,point:o.map((n,a)=>n+d[a]*distance) as Cell,distance};
  let axis=0;if(next[1]<next[axis])axis=1;if(next[2]<next[axis])axis=2;
  distance=next[axis];cell[axis]+=step[axis];next[axis]+=delta[axis];normal=[0,0,0];normal[axis]=-step[axis];
 }
 return null;
}
