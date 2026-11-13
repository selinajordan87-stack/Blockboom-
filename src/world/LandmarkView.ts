import * as T from "three";
import {World,LIMIT,type Cell} from "./World";
import {terrainProfile,legacyArea,RIVER_POINTS} from "./DiscoveryTerrain";

/** Distant scenery is explicitly an LOD; real collision stays in streamed voxels. */
export class LandmarkView {
 readonly group=new T.Group();
 private far:T.Mesh;private silhouettes:T.InstancedMesh;private smoke:T.InstancedMesh;
 private tileCenters:[number,number][]=[];private indices:Uint32Array;private key="";private dummy=new T.Object3D();private color=new T.Color();
 private landmarks:[number,number,number,number,number,number,number][]=[];
 constructor(scene:T.Scene,private world:World){
  this.group.name="Discovery distant LOD and river";this.group.userData.lod=true;scene.add(this.group);
  const p:number[]=[],colors:number[]=[];
  for(let x=-LIMIT;x<LIMIT;x+=12)for(let z=-LIMIT;z<LIMIT;z+=12){
   this.tileCenters.push([x+6,z+6]);
   for(const[dx,dz]of [[0,0],[12,0],[0,12],[12,12]]){
    const xx=x+dx,zz=z+dz,profile=terrainProfile(xx,zz),height=legacyArea(xx,zz)?0:profile.top;
    p.push(xx,height+.12,zz);const c=new T.Color(profile.surface==="Sand"?0xc5b47c:height>7?0x87918b:0x70935b);colors.push(c.r,c.g,c.b);
   }
  }
  this.indices=new Uint32Array(this.tileCenters.length*6);
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(p,3));geometry.setAttribute("normal",new T.Float32BufferAttribute(p.map((_,i)=>i%3===1?1:0),3));geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.setIndex(new T.BufferAttribute(this.indices,1).setUsage(T.DynamicDrawUsage));geometry.computeBoundingSphere();
  this.far=new T.Mesh(geometry,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));this.far.name="distant terrain LOD";this.group.add(this.far);
  const box=new T.BoxGeometry(1,1,1);
  this.silhouettes=new T.InstancedMesh(box,new T.MeshLambertMaterial({color:0xffffff,fog:false}),100);this.silhouettes.frustumCulled=false;this.silhouettes.name="distant landmark LOD";this.group.add(this.silhouettes);
  const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c:number)=>this.landmarks.push([x,y,z,sx,sy,sz,c]);
  for(const[cx,cz,h]of [[145,-105,24],[45,-40,11],[-108,-46,10]])for(let peak=0;peak<3;peak++)for(let tier=0;tier<5;tier++){
   const height=h*(peak===1?1:.72),step=height/5,width=36-tier*7;
   add(cx+(peak-1)*16,step*(tier+.5),cz-peak*7,width,step,width*.8,tier===4?0xc8c4aa:tier>1?0x929e9e:0x76867d);
  }
  for(const[cx,cz]of [[-100,30],[-125,17],[-87,41]])for(let i=0;i<5;i++)add(cx+Math.sin(i*2.4)*8,5+i%3,cz+Math.cos(i*2.4)*8,5,9+i%3,5,i%2?0x335e42:0x46764c);
  add(117,6.5,105,6,13,6,0x7f8578);add(102,2.5,87,9,5,9,0x966f56);add(116,3,92,9,6,9,0x89765a);add(92,2.5,83,8,5,8,0x9a8362);add(47.5,4,40.5,5,8,5,0x8c8270);
  this.smoke=new T.InstancedMesh(box,new T.MeshBasicMaterial({color:0xd1d5c7,transparent:true,opacity:.25,depthWrite:false}),10);this.smoke.frustumCulled=false;this.smoke.name="forge smoke";this.group.add(this.smoke);
  const waterPoints:number[]=[],arrows:number[]=[];
  for(let i=1;i<RIVER_POINTS.length;i++){
   const a=RIVER_POINTS[i-1],b=RIVER_POINTS[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*2.5,nz=dx/length*2.5;
   for(const v of [[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]+nx,b[1]+nz],[b[0]+nx,b[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz]])waterPoints.push(v[0],.34,v[1]);
   for(let j=1;j<=4;j++){const x=a[0]+dx*j/5,z=a[1]+dz*j/5;arrows.push(x-dx/length-nx*.3,.38,z-dz/length-nz*.3,x,.38,z,x-dx/length+nx*.3,.38,z-dz/length+nz*.3,x,.38,z);}
  }
  const waterGeometry=new T.BufferGeometry();waterGeometry.setAttribute("position",new T.Float32BufferAttribute(waterPoints,3));waterGeometry.computeVertexNormals();const river=new T.Mesh(waterGeometry,new T.MeshPhongMaterial({color:0x4e9bac,transparent:true,opacity:.54,depthWrite:false,side:T.DoubleSide}));river.name="connected river";this.group.add(river);
  const arrowsGeometry=new T.BufferGeometry();arrowsGeometry.setAttribute("position",new T.Float32BufferAttribute(arrows,3));this.group.add(new T.LineSegments(arrowsGeometry,new T.LineBasicMaterial({color:0xc4e4d8,transparent:true,opacity:.35})));
 }
 update(position:Cell,time:number){
  const[x,,z]=position,key=`${Math.floor(x/12)},${Math.floor(z/12)}:${[...this.world.activeChunks].join("|")}`;
  if(key!==this.key){this.key=key;let n=0;for(let i=0;i<this.tileCenters.length;i++){const[cx,cz]=this.tileCenters[i],distance=Math.hypot(cx-x,cz-z);if(distance>270||distance<45&&this.world.activeChunks.has(`${Math.floor(cx/12)},${Math.floor(cz/12)}`))continue;const v=i*4;for(const a of [v,v+2,v+1,v+1,v+2,v+3])this.indices[n++]=a;}this.far.geometry.setDrawRange(0,n);this.far.geometry.index!.needsUpdate=true;}
  let i=0;for(const[px,py,pz,sx,sy,sz,c]of this.landmarks){const distance=Math.hypot(px-x,pz-z);if(distance<36||distance>260||this.world.activeChunks.has(`${Math.floor(px/12)},${Math.floor(pz/12)}`))continue;this.dummy.position.set(px,py,pz);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();this.silhouettes.setMatrixAt(i,this.dummy.matrix);this.silhouettes.setColorAt(i++,this.color.set(c));}this.silhouettes.count=i;this.silhouettes.instanceMatrix.needsUpdate=true;if(this.silhouettes.instanceColor)this.silhouettes.instanceColor.needsUpdate=true;
  i=0;for(const[cx,cz,h]of [[104,90,10],[44,28,6]])for(let j=0;j<5;j++){const t=((time*.0006+j*.23)%1);this.dummy.position.set(cx+Math.sin(t*3)*1.3,h+t*9,cz+t*2);this.dummy.scale.setScalar(.6+t*2);this.dummy.updateMatrix();this.smoke.setMatrixAt(i++,this.dummy.matrix);}this.smoke.instanceMatrix.needsUpdate=true;
 }
 dispose(){const resources=new Set<T.BufferGeometry|T.Material>();this.group.traverse(o=>{const m=o as T.Mesh;if(m.geometry)resources.add(m.geometry);if(m.material)for(const a of Array.isArray(m.material)?m.material:[m.material])resources.add(a);});for(const resource of resources)resource.dispose();this.group.removeFromParent();}
}
