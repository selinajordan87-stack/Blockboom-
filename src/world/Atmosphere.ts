import * as T from 'three';
/** Painted sky, grouped block clouds and sparse firelight: three small art batches. */
export class Atmosphere{
 private sky:T.Mesh<T.SphereGeometry,T.ShaderMaterial>;private clouds:T.InstancedMesh;private dummy=new T.Object3D();private warm:T.PointLight;
 constructor(scene:T.Scene){
  this.sky=new T.Mesh(new T.SphereGeometry(210,16,10),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{zenith:{value:new T.Color()},horizon:{value:new T.Color()}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 zenith;uniform vec3 horizon;void main(){float h=pow(max(0.,normalize(v).y),.58);gl_FragColor=vec4(mix(horizon,zenith,h),1.);\n#include <colorspace_fragment>\n}'}));
  this.sky.renderOrder=-10;this.sky.frustumCulled=false;scene.add(this.sky);
  this.clouds=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xf8f4e9,transparent:true,opacity:.9,depthWrite:false}),48);this.clouds.frustumCulled=false;scene.add(this.clouds);
  this.warm=new T.PointLight(0xffc482,0,12,1.5);scene.add(this.warm);
 }
 update(time:number,day:number,origin:T.Vector3){
  const light=T.MathUtils.smoothstep(Math.sin((day-.05)*Math.PI*2),-.38,.2),dusk=Math.exp(-(((day-.62)/.07)**2));
  this.sky.position.copy(origin);this.sky.material.uniforms.zenith.value.set(0x142744).lerp(new T.Color(0x368bd2),light);this.sky.material.uniforms.horizon.value.set(0x52617d).lerp(new T.Color(0xc7e4ed),light).lerp(new T.Color(0xe9af82),dusk*.65);
  let n=0;for(let cluster=0;cluster<12;cluster++){const a=cluster*2.399,px=Math.cos(a)*95+Math.sin(time*.000008)*5,pz=Math.sin(a)*95;
   for(let j=0;j<4;j++){this.dummy.position.set(origin.x+px+j*3,48+(cluster%3)*3+j%2,origin.z+pz+(j%2)*4);this.dummy.scale.set(7+(cluster%3),1.2+(j%3)*.6,4+(j%2));this.dummy.updateMatrix();this.clouds.setMatrixAt(n++,this.dummy.matrix);}}
  this.clouds.count=n;(this.clouds.material as T.MeshBasicMaterial).color.set(0x6a7894).lerp(new T.Color(0xfff6e4),light);this.clouds.instanceMatrix.needsUpdate=true;this.clouds.visible=light>.1;(this.clouds.material as T.MeshBasicMaterial).opacity=.4+light*.42;
  this.warm.position.copy(origin).add(new T.Vector3(.5,-.5,-.8));this.warm.intensity=origin.y<0?3.2:0;
 }
}
