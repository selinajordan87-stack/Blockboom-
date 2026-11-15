import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {World,MAX_Y,MIN_Y,type Cell} from './World';
import {terrainProfile,legacyArea} from './DiscoveryTerrain';
import {artHash} from './EnvironmentForm';
function tuft(){
 const pieces:T.BufferGeometry[]=[];
 for(let i=0;i<3;i++){const g=new T.PlaneGeometry(.55,1),v=g.getAttribute('position');for(let j=0;j<v.count;j++){if(v.getY(j)>0)v.setX(j,v.getX(j)*.08+.1);v.setY(j,v.getY(j)+.5);}g.rotateY(i*Math.PI/3);pieces.push(g);}
 const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}
function flower(){
 const stem=new T.BoxGeometry(.055,.55,.055);stem.translate(0,.275,0);const pieces=[stem];
 for(let i=0;i<4;i++){const g=new T.BoxGeometry(.16,.055,.13);g.translate(Math.cos(i*Math.PI/2)*.1,.55,Math.sin(i*Math.PI/2)*.1);pieces.push(g);}
 const r=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return r;
}
/** Small clustered art batches; no collision or writes to saved terrain. */
export class NatureDetails{
 readonly group=new T.Group();private grass:T.InstancedMesh;private flowers:T.InstancedMesh;private reeds:T.InstancedMesh;private stones:T.InstancedMesh;
 private dummy=new T.Object3D();private color=new T.Color();private key='';private revision=-1;private next=0;
 constructor(private world:World,scene:T.Scene){
  const mat=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide});
  this.grass=new T.InstancedMesh(tuft(),mat,360);this.flowers=new T.InstancedMesh(flower(),mat,64);
  const reedParts=[new T.BoxGeometry(.055,1,.055).translate(0,.5,0),new T.BoxGeometry(.11,.25,.11).translate(0,1,0)];
  const reed=mergeGeometries(reedParts);reedParts.forEach(g=>g.dispose());this.reeds=new T.InstancedMesh(reed,mat,90);
  this.stones=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat,28);
  for(const mesh of [this.grass,this.flowers,this.reeds,this.stones]){mesh.count=0;mesh.frustumCulled=false;this.group.add(mesh);}scene.add(this.group);
 }
 update(position:Cell,time:number){
  const cx=Math.floor(position[0]/6)*6,cz=Math.floor(position[2]/6)*6,key=`${cx},${cz}`;
  if(time<this.next||key===this.key&&this.revision===this.world.revision)return;
  this.next=time+1400;this.key=key;this.revision=this.world.revision;
  const counts=new Map<T.InstancedMesh,number>([[this.grass,0],[this.flowers,0],[this.reeds,0],[this.stones,0]]);
  const put=(mesh:T.InstancedMesh,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,turn:number)=>{const i=counts.get(mesh)!;if(i>=mesh.instanceMatrix.count)return;this.dummy.position.set(x,y,z);this.dummy.rotation.set(0,turn,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);mesh.setColorAt(i,this.color.set(color));counts.set(mesh,i+1);};
  for(let x=cx-23;x<cx+23;x+=2)for(let z=cz-23;z<cz+23;z+=2){
   const h=artHash(x,z),px=x+.2+(h%29)/40,pz=z+.2+((h>>>6)%29)/40;
   if(Math.hypot(px-position[0],pz-position[2])>24)continue;
   let y=MAX_Y;while(y>=MIN_Y&&!this.world.get(x,y,z))y--;const b=this.world.get(x,y,z);
   if(!b||!['Gras','Sand','Erde','Kopfstein'].includes(b))continue;
   let edited=false;for(let yy=MIN_Y;yy<=MAX_Y;yy++)if(Object.hasOwn(this.world.changes,`${x},${yy},${z}`)){edited=true;break;}if(edited)continue;
   const p=terrainProfile(x,z,this.world.terrainRevision),forest=x<-65&&z>-30;
   if(!legacyArea(x,z)&&(p.trail<2.3||p.village))continue;
   if(b==='Gras'){
    const patch=Math.sin(x*.26)+Math.cos(z*.28)+Math.sin((x-z)*.13);if(patch<-.7)continue;
    for(let t=0;t<(patch>1?3:1);t++)put(this.grass,px+t*.19,y+1,pz+t*.23,.55,.35+((h+t)%9)*.045,.55,forest?0x48683b:[0x668b3f,0x81a44c,0x9aac5b][h%3],h*.1+t);
    if(h%4===0)put(this.flowers,px+.2,y+1,pz-.2,.75,.65+(h%4)*.12,.75,[0xeeb352,0xe4d9b2,0xae8ac4,0xd88a6a][(h>>>4)%4],h*.1);
   }
   if((p.lake>.92&&p.lake<1.14||p.river>2&&p.river<4)&&y<1&&this.world.terrainRevision===2){
    for(let j=0;j<3;j++)put(this.reeds,px+j*.22,y+1,pz+j*.2,1,.8+(h%7)*.12,1,h%2?0x77894b:0x967441,h*.2);
   }else if(h%23===0&&b==='Gras')put(this.stones,px,y+1.1,pz,.32+(h%3)*.13,.22,.38,forest?0x63734f:0x8b9891,h*.2);
  }
  for(const[mesh,n]of counts){mesh.count=n;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 dispose(){const mats=new Set<T.Material>();for(const o of this.group.children){const m=o as T.InstancedMesh;m.dispose();m.geometry.dispose();mats.add(m.material as T.Material);}mats.forEach(m=>m.dispose());this.group.removeFromParent();}
}
