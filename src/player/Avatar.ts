import * as T from "three";
import type {Cell} from "../world/World";
import type {Tool} from "../inventory/Equipment";
/** One batch for the complete player, including its equipped world-space tool. */
export class Avatar {
 mesh:T.InstancedMesh;private root=new T.Object3D();private joint=new T.Object3D();private part=new T.Object3D();private color=new T.Color();
 private tip=new T.Vector3();
 constructor(scene:T.Scene){
  this.mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xffffff}),24);
  this.mesh.name="BLOCKBOOM Spielfigur";this.mesh.frustumCulled=false;this.mesh.count=0;this.mesh.visible=false;scene.add(this.mesh);
 }
 update(pos:Cell,yaw:number,pitch:number,tool:Tool,moving:boolean,time:number,action:string,visible:boolean){
  this.mesh.visible=visible;if(!visible)return;
  this.root.position.set(...pos);this.root.rotation.set(0,yaw,0);this.root.updateMatrix();
  const walk=moving?Math.sin(time*8)*.42:0,swing=action==="idle"?walk:Math.sin(time*17)*.65-.6;
  const boxes=[
   [0,1.49,0,.43,.43,.42,0xd8a77d,0],[0,1.7,.02,.45,.12,.44,0x5c4438,0],
   [-.1,1.53,-.22,.05,.05,.025,0x24392f,0],[.1,1.53,-.22,.05,.05,.025,0x24392f,0],
   [0,1.01,0,.52,.56,.3,0x327365,0],[-.16,.39,0,.22,.72,.25,0x31495f,walk],[.16,.39,0,.22,.72,.25,0x31495f,-walk],
   [-.39,1,0,.19,.5,.22,0x327365,-walk],[.39,1,0,.19,.5,.22,0x327365,swing],
   [-.39,.73,0,.19,.18,.22,0xd8a77d,-walk],[.39,.73,0,.19,.18,.22,0xd8a77d,swing],
  ];
  let i=0;const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,angle=0,parent=this.root.matrix)=>{
   this.part.position.set(x,y,z);this.part.rotation.set(angle,0,0);this.part.scale.set(sx,sy,sz);this.part.updateMatrix();this.part.matrix.premultiply(parent);this.mesh.setMatrixAt(i,this.part.matrix);this.mesh.setColorAt(i++,this.color.set(color));
  };
  for(const [x,y,z,sx,sy,sz,c,a]of boxes)add(x,y,z,sx,sy,sz,c,a);
  this.joint.position.set(.39,.9,-.12);this.joint.rotation.set(-.5+swing,0,0);this.joint.updateMatrix();this.joint.matrix.premultiply(this.root.matrix);
  const parent=this.joint.matrix;
  if(tool==="Bauwerkzeug")add(0,.04,-.2,.3,.3,.3,0x5dc0b3,0,parent);
  else{
   add(0,.22,-.1,.07,.75,.07,0x966a41,0,parent);
   if(tool==="Angel"){add(0,.96,-.1,.04,1.1,.04,0x5a7969,0,parent);add(.08,.12,-.1,.14,.15,.12,0xd6b364,0,parent);}
   else if(/schwert|Schwert/.test(tool))add(0,.66,-.1,.12,.7,.06,tool==="Holzschwert"?0xbd915d:0xaab9bf,0,parent);
   else if(/spitzhacke|Spitzhacke/.test(tool))add(0,.58,-.1,.55,.1,.11,tool==="Kupferspitzhacke"?0xb48061:0xaab4b8,0,parent);
   else if(tool==="Axt"||tool==="Steinaxt"||tool==="Hacke")add(.12,.5,-.1,.3,.3,.08,0x9eafaf,0,parent);
   else if(tool==="Schaufel")add(0,.55,-.1,.24,.28,.08,0x95a4aa,0,parent);
   else if(tool==="Bogen"){add(.15,.35,-.1,.06,.9,.07,0xb08451,0,parent);add(-.08,.35,-.1,.015,.9,.015,0xe9d7a9,0,parent);}
   else add(0,.52,-.1,.16,.4,.16,0x966a41,0,parent);
  }
  this.tip.set(0,1.5,-.1).applyMatrix4(parent);this.mesh.count=i;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
 }
 rodTip(target:T.Vector3){return target.copy(this.tip);}
}
