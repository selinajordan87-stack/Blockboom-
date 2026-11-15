import * as T from "three";
import {groveSeeds} from "./EnvironmentForm";
import {mountainPathSample} from "./TerrainSculpt";
import {World,LIMIT,type Cell} from "./World";
import {terrainProfile,legacyArea,RIVER_POINTS} from "./DiscoveryTerrain";

/** Distant scenery is explicitly an LOD; real collision stays in streamed voxels. */
export class LandmarkView {
 readonly group=new T.Group();
 private peaks:T.InstancedMesh;private peakData:number[][]=[];
 private far:T.Mesh;private silhouettes:T.InstancedMesh;private smoke:T.InstancedMesh;
 private tileTriangles:number[][]=[];private tileCenters:[number,number][]=[];private tileLOD:number[]=[];private indices:Uint32Array;private key="";private dummy=new T.Object3D();private color=new T.Color();
 private grove:T.InstancedMesh;private trunks:T.InstancedMesh;private groveData:number[][]=[];
 private forward=new T.Vector3(0,0,-1);
 private landmarks:[number,number,number,number,number,number,number][]=[];
 constructor(scene:T.Scene,private world:World){
  this.group.name="Discovery distant LOD and river";this.group.userData.lod=true;scene.add(this.group);
  const p:number[]=[],colors:number[]=[];let vertex=0;
  const tint=(height:number,surface:string)=>new T.Color(surface==='Sand'?0xd2c698:height>20?0xd5dcd8:height>13?0x98a9b5:height>6?0x91a39b:0x82ae60);
  for(let x=-LIMIT;x<LIMIT;x+=12)for(let z=-LIMIT;z<LIMIT;z+=12){
   const detailed=world.terrainRevision===2&&(Math.hypot(x+6-145,z+6+105)<65||Math.hypot(x+6+110,z+6+125)<75);
   for(const step of detailed?[12,3]:[12])for(let tx=x;tx<x+12;tx+=step)for(let tz=z;tz<z+12;tz+=step){
    this.tileCenters.push([tx+step/2,tz+step/2]);this.tileLOD.push(detailed?(step===3?2:1):0);const list:number[]=[];
    const quad=(points:number[][],color:T.Color)=>{for(const q of points){p.push(...q);colors.push(color.r,color.g,color.b);}list.push(vertex,vertex+2,vertex+1,vertex+1,vertex+2,vertex+3);vertex+=4;};
    const profile=terrainProfile(tx+step/2,tz+step/2,world.terrainRevision);
    if(step===3){
     const h=profile.top+1,c=tint(profile.top,profile.surface);
     // Blocky medium-distance surfaces share the height field of the real voxels.
     quad([[tx,h,tz],[tx+step,h,tz],[tx,h,tz+step],[tx+step,h,tz+step]],c);
     const hx=terrainProfile(tx+step*1.5,tz+step/2,2).top+1,hz=terrainProfile(tx+step/2,tz+step*1.5,2).top+1;
     if(hx!==h)quad([[tx+step,h,tz],[tx+step,hx,tz],[tx+step,h,tz+step],[tx+step,hx,tz+step]],c.clone().multiplyScalar(.83));
     if(hz!==h)quad([[tx,h,tz+step],[tx+step,h,tz+step],[tx,hz,tz+step],[tx+step,hz,tz+step]],c.clone().multiplyScalar(.87));
    }else{
     const points:number[][]=[];for(const[dx,dz]of [[0,0],[step,0],[0,step],[step,step]]){const xx=tx+dx,zz=tz+dz,profile=terrainProfile(xx,zz,world.terrainRevision),height=legacyArea(xx,zz)?0:profile.top;points.push([xx,height+(world.terrainRevision===2?1:.12),zz]);}
     quad(points,tint(profile.top,profile.surface));
    }
    this.tileTriangles.push(list);
   }
  }
  this.indices=new Uint32Array(this.tileTriangles.flat());
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(p,3));geometry.setAttribute("normal",new T.Float32BufferAttribute(p.map((_,i)=>i%3===1?1:0),3));geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.setIndex(new T.BufferAttribute(this.indices,1).setUsage(T.DynamicDrawUsage));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const terrainMaterial=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  terrainMaterial.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 artPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nartPosition=position;');
   shader.fragmentShader='varying vec3 artPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float grain=fract(sin(dot(floor(artPosition*2.),vec3(12.9898,78.233,37.719)))*43758.5453);
    float strata=step(.88,fract(artPosition.y*.62+sin(artPosition.x*.16)*.12));
    diffuseColor.rgb*=.92+grain*.13-strata*.12;
   `);
  };
  this.far=new T.Mesh(geometry,terrainMaterial);this.far.name="distant terrain LOD";this.group.add(this.far);
  const box=new T.BoxGeometry(1,1,1);
  this.grove=new T.InstancedMesh(box,new T.MeshLambertMaterial({color:0xffffff}),1400);this.trunks=new T.InstancedMesh(box,new T.MeshLambertMaterial({color:0x69503c}),700);
  this.grove.frustumCulled=this.trunks.frustumCulled=false;this.grove.count=this.trunks.count=0;this.group.add(this.grove,this.trunks);
  if(world.terrainRevision===2)for(const t of groveSeeds(-205,210,-205,160)){
   const p=terrainProfile(t.x,t.z,2);if(legacyArea(t.x,t.z)||p.top>10||p.lake<1.17&&p.top<1||p.river<5||p.trail<4||p.village||mountainPathSample(t.x,t.z).distance<4)continue;
   this.groveData.push([t.x,p.top+1,t.z,t.h,t.kind]);
  }
  this.silhouettes=new T.InstancedMesh(box,new T.MeshLambertMaterial({color:0xffffff,fog:false}),100);this.silhouettes.frustumCulled=false;this.silhouettes.name="distant landmark LOD";this.group.add(this.silhouettes);
  const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c:number)=>this.landmarks.push([x,y,z,sx,sy,sz,c]);
  const peakGeometry=new T.ConeGeometry(1,1,4,3);peakGeometry.rotateY(Math.PI/4);
  this.peaks=new T.InstancedMesh(peakGeometry,new T.MeshLambertMaterial({color:0xffffff}),9);this.peaks.name="layered ridge silhouettes";this.peaks.frustumCulled=false;this.group.add(this.peaks);
  for(const[cx,cz,h]of [[145,-105,24],[45,-40,11],[-108,-46,10]])for(let peak=0;peak<3;peak++){
   if(this.world.terrainRevision===2&&cx===145)continue;
   const height=h*(peak===1?1:.72);this.peakData.push([cx+(peak-1)*13,height/2,cz-peak*5,15-peak*2,height,12,peak===1?0xb7c7c8:0x718995]);
  }
  if(world.terrainRevision===1)for(const[cx,cz]of [[-100,30],[-125,17],[-87,41]])for(let i=0;i<5;i++)add(cx+Math.sin(i*2.4)*8,5+i%3,cz+Math.cos(i*2.4)*8,5,9+i%3,5,i%2?0x335e42:0x46764c);
  add(117,6.5,105,6,13,6,0x7f8578);add(102,2.5,87,9,5,9,0x966f56);add(116,3,92,9,6,9,0x89765a);add(92,2.5,83,8,5,8,0x9a8362);add(47.5,4,40.5,5,8,5,0x8c8270);
  this.smoke=new T.InstancedMesh(box,new T.MeshBasicMaterial({color:0xd1d5c7,transparent:true,opacity:.25,depthWrite:false}),10);this.smoke.frustumCulled=false;this.smoke.name="forge smoke";this.group.add(this.smoke);
  const waterPoints:number[]=[],arrows:number[]=[];
  for(let i=1;i<RIVER_POINTS.length;i++){
   const a=RIVER_POINTS[i-1],b=RIVER_POINTS[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*2.5,nz=dx/length*2.5;
   for(const v of [[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]+nx,b[1]+nz],[b[0]+nx,b[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz]])waterPoints.push(v[0],.34,v[1]);
   for(let j=1;j<=4;j++){const x=a[0]+dx*j/5,z=a[1]+dz*j/5;arrows.push(x-dx/length-nx*.3,.38,z-dz/length-nz*.3,x,.38,z,x-dx/length+nx*.3,.38,z-dz/length+nz*.3,x,.38,z);}
  }
  const waterGeometry=new T.BufferGeometry();waterGeometry.setAttribute("position",new T.Float32BufferAttribute(waterPoints,3));waterGeometry.computeVertexNormals();const river=new T.Mesh(waterGeometry,new T.MeshPhongMaterial({color:0x4e9bac,transparent:true,opacity:.54,depthWrite:false,side:T.DoubleSide}));river.name="connected river";river.visible=world.terrainRevision===1;this.group.add(river);
  const arrowsGeometry=new T.BufferGeometry();arrowsGeometry.setAttribute("position",new T.Float32BufferAttribute(arrows,3));const arrowsMesh=new T.LineSegments(arrowsGeometry,new T.LineBasicMaterial({color:0xc4e4d8,transparent:true,opacity:.35}));arrowsMesh.visible=world.terrainRevision===1;this.group.add(arrowsMesh);
 }
 update(position:Cell,time:number,camera?:T.Camera){
  if(camera)camera.getWorldDirection(this.forward);
  const[x,,z]=position,yaw=Math.atan2(this.forward.x,this.forward.z),key=`${Math.floor(x/12)},${Math.floor(z/12)}:${Math.round(yaw*8/Math.PI)}:${[...this.world.activeChunks].join("|")}`;
  // A generous forward sector retains every visible distant tile while avoiding
  // thousands of triangles behind the camera in the single LOD batch.
  const horizontal=Math.hypot(this.forward.x,this.forward.z)||1;
  const behind=(px:number,pz:number,d:number)=>d>72&&((px-x)*this.forward.x+(pz-z)*this.forward.z)/horizontal<-.2*d;
  if(key!==this.key){this.key=key;let n=0;for(let i=0;i<this.tileCenters.length;i++){const[cx,cz]=this.tileCenters[i],distance=Math.hypot(cx-x,cz-z),chunkDistance=Math.hypot(Math.floor(cx/12)*12+6-x,Math.floor(cz/12)*12+6-z);
   if(this.tileLOD[i]===2&&chunkDistance>=155||this.tileLOD[i]===1&&chunkDistance<155)continue;
   if(this.world.terrainRevision===2&&terrainProfile(cx,cz,2).lake<.97)continue;
   if(distance>270||behind(cx,cz,distance)||distance<45&&this.world.activeChunks.has(`${Math.floor(cx/12)},${Math.floor(cz/12)}`))continue;for(const a of this.tileTriangles[i])this.indices[n++]=a;}this.far.geometry.setDrawRange(0,n);this.far.geometry.index!.needsUpdate=true;}
  let trees=0,canopies=0;
  for(const[tx,ty,tz,h,kind]of this.groveData){const distance=Math.hypot(tx-x,tz-z);if(distance>160||distance<30||behind(tx,tz,distance)||this.world.activeChunks.has(`${Math.floor(tx/12)},${Math.floor(tz/12)}`))continue;if(trees>=700)break;
   this.dummy.position.set(tx+.5,ty+h*.38,tz+.5);this.dummy.scale.set(.65,h*.76,.65);this.dummy.rotation.set(0,0,0);this.dummy.updateMatrix();this.trunks.setMatrixAt(trees++,this.dummy.matrix);
   for(let layer=0;layer<2;layer++){this.dummy.position.set(tx+.5+(layer?.35:0),ty+h*(layer?.92:.68),tz+.5+(layer?-.25:0));const width=(kind===0?4.2:5.4)*(layer?.65:1);this.dummy.scale.set(width,kind===0?h*.35:h*.32,width*.88);this.dummy.updateMatrix();this.grove.setMatrixAt(canopies,this.dummy.matrix);this.grove.setColorAt(canopies++,this.color.set(kind===0?0x3c6453:kind===1?0x628541:0x54844b));}
  }
  this.trunks.count=trees;this.grove.count=canopies;this.trunks.instanceMatrix.needsUpdate=this.grove.instanceMatrix.needsUpdate=true;if(this.grove.instanceColor)this.grove.instanceColor.needsUpdate=true;
  let i=0;for(const[px,py,pz,sx,sy,sz,c]of this.landmarks){const distance=Math.hypot(px-x,pz-z);if(distance<36||distance>260||behind(px,pz,distance)||this.world.activeChunks.has(`${Math.floor(px/12)},${Math.floor(pz/12)}`))continue;this.dummy.position.set(px,py,pz);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();this.silhouettes.setMatrixAt(i,this.dummy.matrix);this.silhouettes.setColorAt(i++,this.color.set(c));}this.silhouettes.count=i;this.silhouettes.instanceMatrix.needsUpdate=true;if(this.silhouettes.instanceColor)this.silhouettes.instanceColor.needsUpdate=true;
  let peakCount=0;for(const[px,py,pz,sx,sy,sz,c]of this.peakData){const distance=Math.hypot(px-x,pz-z);if(distance<36||distance>260||behind(px,pz,distance)||this.world.activeChunks.has(`${Math.floor(px/12)},${Math.floor(pz/12)}`))continue;this.dummy.position.set(px,py,pz);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();this.peaks.setMatrixAt(peakCount,this.dummy.matrix);this.peaks.setColorAt(peakCount++,this.color.set(c));}this.peaks.count=peakCount;this.peaks.instanceMatrix.needsUpdate=true;if(this.peaks.instanceColor)this.peaks.instanceColor.needsUpdate=true;
  i=0;for(const[cx,cz,h]of [[104,90,10],[44,28,6]])for(let j=0;j<5;j++){const t=((time*.0006+j*.23)%1);this.dummy.position.set(cx+Math.sin(t*3)*1.3,h+t*9,cz+t*2);this.dummy.scale.setScalar(.6+t*2);this.dummy.updateMatrix();this.smoke.setMatrixAt(i++,this.dummy.matrix);}this.smoke.instanceMatrix.needsUpdate=true;
 }
 dispose(){const resources=new Set<T.BufferGeometry|T.Material>();this.group.traverse(o=>{const m=o as T.Mesh;if(m.geometry)resources.add(m.geometry);if(m.material)for(const a of Array.isArray(m.material)?m.material:[m.material])resources.add(a);});for(const resource of resources)resource.dispose();this.group.removeFromParent();}
}
