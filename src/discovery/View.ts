import * as T from "three";
import {NOTES,type WorldNote} from "./Content";
import type {Cell} from "../world/World";

/** Small physical books, one shared geometry/material batch; never an automatic dialog. */
export class DiscoveryView {
 readonly mesh:T.InstancedMesh;
 private dummy=new T.Object3D();private color=new T.Color();private ids:string[]=[];
 constructor(scene:T.Scene){
  this.mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xffffff}),NOTES.length*3);
  this.mesh.name="Gefundene Notizbücher";this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);
 }
 update(pos:Cell,read:readonly string[]){
  let i=0;this.ids=[];
  for(const n of NOTES){if(Math.hypot(n.position[0]-pos[0],n.position[2]-pos[2])>48)continue;
   const [x,y,z]=n.position;
   for(const [dx,dy,dz,sx,sy,sz,c]of [[0,.08,0,.58,.08,.4,0x315f58],[0,.13,0,.51,.045,.35,0xe9dfbd],[.19,.16,-.12,.055,.05,.3,read.includes(n.id)?0x88a982:0xf6c972]]){
    this.dummy.position.set(x+.5+dx,y+dy,z+.5+dz);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();
    this.mesh.setMatrixAt(i,this.dummy.matrix);this.mesh.setColorAt(i,this.color.set(c));this.ids[i++]=n.id;
   }
  }
  this.mesh.count=i;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  this.mesh.updateMatrixWorld(true);
 }
 hit(ray:T.Raycaster):WorldNote|null{
  const hit=ray.intersectObject(this.mesh)[0];if(!hit||hit.distance>4.8||hit.instanceId===undefined)return null;
  return NOTES.find(n=>n.id===this.ids[hit.instanceId!])||null;
 }
}
