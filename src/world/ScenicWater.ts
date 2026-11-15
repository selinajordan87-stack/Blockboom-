import * as T from 'three';
import {terrainProfile,GREAT_LAKE,legacyArea} from './DiscoveryTerrain';
import {ART_RIVER} from './EnvironmentForm';
/** Shallow/deep tint and moving glints; no reflection pass or screen textures. */
export class ScenicWater{
 readonly mesh:T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 private bed:T.Mesh;
 constructor(scene:T.Scene){
  const p:number[]=[],depth:number[]=[],floor:number[]=[],sand:number[]=[];const tint=new T.Color();
  const quad=(x:number,z:number,s:number)=>{
   for(const[dx,dz]of [[0,0],[0,s],[s,0],[s,0],[0,s],[s,s]]){
    const xx=x+dx,zz=z+dz; p.push(xx,.38,zz);const d=Math.max(.15,.38-terrainProfile(xx,zz,2).top-1);depth.push(d);floor.push(xx,Math.min(-.25,.38-d-.05),zz);tint.set(0xd6d5a1).lerp(new T.Color(0x428e91),Math.min(1,d/5));sand.push(tint.r,tint.g,tint.b);
   }
  };
  for(let x=-160;x<-60;x+=2)for(let z=-148;z<-73;z+=2)if(terrainProfile(x+1,z+1,2).lake<1.05)quad(x,z,2);
  // The same irregular corridor is used by the river's floor and its surface.
  const seen=new Set<string>();for(const[a,b]of ART_RIVER.slice(1).map((p,i)=>[ART_RIVER[i],p])){
   for(let x=Math.floor(Math.min(a[0],b[0])-5);x<Math.max(a[0],b[0])+5;x++)for(let z=Math.floor(Math.min(a[1],b[1])-5);z<Math.max(a[1],b[1])+5;z++){
    if(legacyArea(x,z)||seen.has(`${x},${z}`))continue;const f=terrainProfile(x+.5,z+.5,2);if(f.river>2.6||f.lake<1.05)continue;seen.add(`${x},${z}`);quad(x,z,1);
   }
  }
  const bedGeometry=new T.BufferGeometry();bedGeometry.setAttribute('position',new T.Float32BufferAttribute(floor,3));bedGeometry.setAttribute('color',new T.Float32BufferAttribute(sand,3));bedGeometry.computeVertexNormals();this.bed=new T.Mesh(bedGeometry,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));scene.add(this.bed);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('waterDepth',new T.Float32BufferAttribute(depth,1));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},light:{value:1},fogColor:{value:new T.Color(0xb9d8dc)}},
   vertexShader:`attribute float waterDepth; varying vec3 vWorld; varying float vDepth; uniform float time;
    void main(){vec3 p=position;p.y+=sin(p.x*.72+time*.8)*sin(p.z*.53-time*.45)*.018;vWorld=p;vDepth=waterDepth;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
   fragmentShader:`uniform float time;uniform float light;uniform vec3 fogColor; varying vec3 vWorld; varying float vDepth;
    void main(){float deep=smoothstep(.3,4.5,vDepth);vec3 color=mix(vec3(.025,.45,.39),vec3(.006,.14,.31),deep);
     float a=sin(vWorld.x*1.6+vWorld.z*.61+time*.9),b=sin(vWorld.z*2.4-vWorld.x*.32-time*.6);
     float glint=pow(max(0.,a*b),18.);float longWave=sin(vWorld.x*.31+vWorld.z*.17+time*.38)*.025;
     float fresnel=pow(1.-max(0.,normalize(cameraPosition-vWorld).y),3.);
     color=mix(color,vec3(.45,.72,.78),fresnel*.13)+glint*.12+longWave;
     color*=light;float haze=smoothstep(65.,220.,distance(cameraPosition,vWorld));color=mix(color,fogColor,haze);
     gl_FragColor=vec4(color,mix(.38,.73,deep)+fresnel*.08);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  this.mesh=new T.Mesh(geometry,material);this.mesh.name='clear shallows and moving river';this.mesh.renderOrder=2;scene.add(this.mesh);
 }
 update(time:number,day:number,fog:T.Color){this.mesh.material.uniforms.time.value=time*.001;this.mesh.material.uniforms.light.value=.3+.7*T.MathUtils.smoothstep(Math.sin((day-.05)*Math.PI*2),-.38,.2);this.mesh.material.uniforms.fogColor.value.copy(fog);}
 dispose(){this.bed.geometry.dispose();(this.bed.material as T.Material).dispose();this.bed.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.removeFromParent();}
}
