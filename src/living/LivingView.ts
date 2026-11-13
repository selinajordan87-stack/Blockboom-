import * as T from "three";
import type { LivingState, Animal } from "./State";
import { stage } from "./Systems";
export class LivingView {
 group=new T.Group();animals:T.InstancedMesh;crops:T.InstancedMesh;
 private dummy=new T.Object3D();private color=new T.Color();
 constructor(scene:T.Scene){
  const box=new T.BoxGeometry(1,1,1),mat=new T.MeshLambertMaterial({color:0xffffff});
  this.animals=new T.InstancedMesh(box,mat,12*12);this.crops=new T.InstancedMesh(box,mat,160*4);
  this.animals.boundingSphere=this.crops.boundingSphere=new T.Sphere(new T.Vector3(),100);
  this.animals.name="lebende Tiere";this.crops.name="wachsender Garten";this.animals.count=this.crops.count=0;
  this.group.add(this.animals,this.crops);scene.add(this.group);
  const water=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshPhongMaterial({color:0x4797ac,transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide}));
  water.rotation.x=-Math.PI/2;water.scale.set(12,9,1);water.position.set(-40,.35,-35);scene.add(water);
  const river=new T.Mesh(new T.PlaneGeometry(3.8,20),water.material);river.rotation.x=-Math.PI/2;river.position.set(-30,.36,-25);scene.add(river);
 }
 update(s:LivingState,origin:T.Vector3){
  let i=0;const ids:string[]=[];
  for(const a of s.animals){if(Math.hypot(a.pos[0]-origin.x,a.pos[2]-origin.z)>32)continue;
   const small=a.kind==="Katze"?.62:a.kind==="Huhn"?.48:1,body=a.kind==="Kuh"?0xc2bca6:a.kind==="Schaf"?0xe8dfc6:a.kind==="Schwein"?0xc99787:a.kind==="Wolf"?0x8f9b9c:a.kind==="Huhn"?0xe6d8b5:0xa98665;
   const parts=[
    [0,.55,0,.55,.45,.85,body],[0,.78,.55,.4,.4,.4,body],
    [-.2,.2,-.25,.13,.4,.14,0x605f56],[.2,.2,-.25,.13,.4,.14,0x605f56],[-.2,.2,.25,.13,.4,.14,0x605f56],[.2,.2,.25,.13,.4,.14,0x605f56],
    [-.12,1,.55,.12,.2,.12,body],[.12,1,.55,.12,.2,.12,body],
    [-.12,.83,.77,.045,.045,.025,0x202d2b],[.12,.83,.77,.045,.045,.025,0x202d2b],
    [0,.55,-.55,.09,.15,.4,body],[0,.7,.8,.18,.1,.12,a.kind==="Huhn"?0xe0b45d:0x3d4942],
   ];
   for(let p=0;p<parts.length;p++){const [x,y,z,sx,sy,sz,c]=parts[p];
    this.dummy.position.set(a.pos[0]+(x*Math.cos(a.heading)+z*Math.sin(a.heading))*small,a.pos[1]+(a.mode==="Schlafen"?.23:y)*small,a.pos[2]+(-x*Math.sin(a.heading)+z*Math.cos(a.heading))*small);
    this.dummy.rotation.set(p>=2&&p<=5&&a.action==="Gehen"?Math.sin(s.clock*8+p)*.4:0,a.heading,a.mode==="Schlafen"?.5:0);
    this.dummy.scale.set(sx*small,sy*small,sz*small);this.dummy.updateMatrix();this.animals.setMatrixAt(i,this.dummy.matrix);this.animals.setColorAt(i,this.color.set(c));ids[i++]=a.id;
   }
  }
  this.animals.count=i;this.animals.userData.ids=ids;this.animals.instanceMatrix.needsUpdate=true;if(this.animals.instanceColor)this.animals.instanceColor.needsUpdate=true;
  i=0;const cells:number[][]=[];
  for(const crop of s.crops){if(Math.hypot(crop.cell[0]-origin.x,crop.cell[2]-origin.z)>36)continue;
   const growth=stage(s,crop),height=.15+growth*.21;
   for(let p=0;p<4;p++){
    this.dummy.position.set(crop.cell[0]+.3+(p%2)*.4,crop.cell[1]+1+height/2,crop.cell[2]+.3+Math.floor(p/2)*.4);
    this.dummy.rotation.set(0,0,0);this.dummy.scale.set(crop.kind==="Kürbis"&&growth===3?.3:.08,height,.08+(crop.kind==="Kürbis"&&growth===3?.22:0));this.dummy.updateMatrix();
    this.crops.setMatrixAt(i,this.dummy.matrix);this.crops.setColorAt(i,this.color.set(growth<3?0x7da354:crop.kind==="Weizen"?0xd6bf6a:crop.kind==="Karotte"||crop.kind==="Kürbis"?0xd9954e:0xb9a575));cells[i++]=crop.cell;
   }
  }
  this.crops.count=i;this.crops.userData.cells=cells;this.crops.instanceMatrix.needsUpdate=true;if(this.crops.instanceColor)this.crops.instanceColor.needsUpdate=true;
 }
 hit(ray:T.Raycaster,s:LivingState):Animal|null{const hit=ray.intersectObject(this.animals)[0];if(!hit||hit.distance>=4||hit.instanceId===undefined)return null;const id=this.animals.userData.ids[hit.instanceId];return s.animals.find(a=>a.id===id)||null;}
}
