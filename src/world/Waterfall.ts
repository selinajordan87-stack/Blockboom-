import * as T from 'three';
import {terrainProfile} from './DiscoveryTerrain';
/** A narrow, terrain-following cascade on the lake's north ridge. */
export class Waterfall{
 private water:T.Mesh<T.BufferGeometry,T.ShaderMaterial>;private foam:T.InstancedMesh;private dummy=new T.Object3D();
 constructor(scene:T.Scene){
  const p:number[]=[],uv:number[]=[];const x=-126;
  for(let z=-156;z<-140;z++){
   const a=Math.max(.4,terrainProfile(x,z,2).top+1.04),b=Math.max(.4,terrainProfile(x,z+1,2).top+1.04);
   for(const[xx,y,zz,u,v]of [[x-.9,a,z,0,z],[x+.9,a,z,1,z],[x-.9,a,z+1,0,z+1],[x+.9,a,z,1,z],[x+.9,a,z+1,1,z+1],[x-.9,a,z+1,0,z+1],[x-.9,a,z+1,0,z+1],[x+.9,a,z+1,1,z+1],[x-.9,b,z+1,0,z+1+a-b],[x+.9,a,z+1,1,z+1],[x+.9,b,z+1,1,z+1+a-b],[x-.9,b,z+1,0,z+1+a-b]]){p.push(xx,y,zz);uv.push(u,v);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const m=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{time:{value:0},day:{value:1}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;uniform float day;void main(){float flow=sin(v.y*2.-time*3.+sin(v.x*25.))*sin(v.x*35.);vec3 c=mix(vec3(.12,.52,.64),vec3(.65,.9,.93),smoothstep(-.15,.9,flow));gl_FragColor=vec4(c*day,.78);
#include <colorspace_fragment>
}`});
  this.water=new T.Mesh(g,m);this.water.name='Silberbach cascade';scene.add(this.water);
  this.foam=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xd5f3ef,transparent:true,opacity:.45,depthWrite:false}),12);this.foam.frustumCulled=false;scene.add(this.foam);
 }
 update(time:number,day:number){this.water.material.uniforms.time.value=time*.001;this.water.material.uniforms.day.value=.32+.68*T.MathUtils.smoothstep(Math.sin((day-.05)*Math.PI*2),-.38,.2);
  for(let i=0;i<12;i++){const t=(time*.00045+i/12)%1;this.dummy.position.set(-126+Math.sin(i*2.4)*(.3+t),.45+Math.sin(t*Math.PI)*.6,-140+Math.cos(i*2.4)*(.3+t));this.dummy.scale.setScalar(.09+t*.18);this.dummy.updateMatrix();this.foam.setMatrixAt(i,this.dummy.matrix);}this.foam.instanceMatrix.needsUpdate=true;}
 dispose(){this.water.geometry.dispose();this.water.material.dispose();this.water.removeFromParent();this.foam.geometry.dispose();(this.foam.material as T.Material).dispose();this.foam.dispose();this.foam.removeFromParent();}
}
