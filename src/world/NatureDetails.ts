import * as T from "three";
import {World,MAX_Y,MIN_Y,type Cell} from "./World";
/** Small non-solid plants only. Never writes terrain, saved blocks or navigation. */
export class NatureDetails {
 readonly group=new T.Group();private grass:T.InstancedMesh;private flowers:T.InstancedMesh;
 private dummy=new T.Object3D();private color=new T.Color();private key="";private revision=-1;private next=0;
 constructor(private world:World,scene:T.Scene){
  this.group.name="nearby meadow and woodland plants";
  const blade=new T.PlaneGeometry(1,1),vertices=blade.getAttribute("position");for(let i=0;i<vertices.count;i++)if(vertices.getY(i)>0)vertices.setX(i,vertices.getX(i)*.12);
  this.grass=new T.InstancedMesh(blade,new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),96);
  this.flowers=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xffffff}),12);
  this.grass.count=this.flowers.count=0;this.grass.frustumCulled=this.flowers.frustumCulled=false;this.group.add(this.grass,this.flowers);scene.add(this.group);
 }
 update(position:Cell,time:number){
  const cx=Math.floor(position[0]/8)*8,cz=Math.floor(position[2]/8)*8,key=`${cx},${cz}`;
  if(time<this.next||key===this.key&&this.revision===this.world.revision)return;
  this.next=time+1000;this.key=key;this.revision=this.world.revision;let blades=0,blooms=0;
  for(let x=cx-15;x<=cx+15;x+=3)for(let z=cz-15;z<=cz+15;z+=3){
   const hash=(Math.imul(x,73856093)^Math.imul(z,19349663))>>>0;
   const px=x+.2+(hash%19)/23,pz=z+.2+((hash>>>5)%19)/23;
   if(Math.hypot(px-position[0],pz-position[2])>20)continue;
   let y=MAX_Y;while(y>=MIN_Y&&!this.world.get(x,y,z))y--;
   const block=this.world.get(x,y,z);if(block!=="Gras"||this.world.get(x,y+1,z))continue;
   // Built/dug columns retain the player's intended appearance.
   let edited=false;for(let yy=MIN_Y;yy<=MAX_Y;yy++)if(Object.hasOwn(this.world.changes,`${x},${yy},${z}`)){edited=true;break;}
   if(edited)continue;
   if(blades<96){this.dummy.position.set(px,y+1.21,pz);this.dummy.rotation.set(0,(hash%31)*.2,0);this.dummy.scale.set(.26+(hash%4)*.07,.24+(hash%7)*.04,1);this.dummy.updateMatrix();this.grass.setMatrixAt(blades,this.dummy.matrix);this.grass.setColorAt(blades++,this.color.set(hash%3?0x678542:0x8b9f51));}
   if(hash%7===0&&blooms<12){this.dummy.position.set(px,y+1.3,pz);this.dummy.rotation.set(0,hash*.01,0);this.dummy.scale.set(.14,.11,.14);this.dummy.updateMatrix();this.flowers.setMatrixAt(blooms,this.dummy.matrix);this.flowers.setColorAt(blooms++,this.color.set([0xe7bd67,0xe7dcbc,0xb484a1][hash%3]));}
  }
  this.grass.count=blades;this.flowers.count=blooms;
  for(const mesh of [this.grass,this.flowers]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 dispose(){for(const mesh of [this.grass,this.flowers]){mesh.dispose();mesh.geometry.dispose();(mesh.material as T.Material).dispose();}this.group.removeFromParent();}
}
