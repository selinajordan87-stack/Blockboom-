import * as T from "three";
import { World, type Cell } from "../world/World";
import { special } from "./Defense";
import { ZOMBIES, type ZombieEngine } from "./Zombies";
export class ZombieView {
  mesh:T.InstancedMesh;
  private dummy=new T.Object3D(); private color=new T.Color();
  constructor(scene:T.Scene) {
    this.mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xffffff}),8*9);
    this.mesh.name="NIGHTFALL voxel zombies";this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.boundingSphere=new T.Sphere(new T.Vector3(),60);scene.add(this.mesh);this.mesh.count=0;
  }
  update(engine:ZombieEngine) {
    let instance=0;
    for(const actor of engine.actors){
      const spec=ZOMBIES[actor.kind],s=spec.scale,walk=actor.state==="attack"?0:Math.sin(actor.age*spec.speed*7)*.5;
      const parts=[
        [0,1.47,0,.5,.48,.48,spec.color,0],
        [0,.92,0,.58,.62,.32,spec.shirt,0],
        [-.39,.96,.1,.18,.62,.2,spec.color,actor.state==="attack"?-1.2:walk],
        [.39,.96,.1,.18,.62,.2,spec.color,actor.state==="attack"?-1.2:-walk],
        [-.17,.34,0,.23,.65,.24,0x3d4c58,-walk],
        [.17,.34,0,.23,.65,.24,0x3d4c58,walk],
        [-.12,1.52,.245,.07,.07,.03,0xe9c878,0],
        [.12,1.52,.245,.07,.07,.03,0xe9c878,0],
        [0,1.36,.245,.16,.04,.035,0x344637,0],
      ];
      for(const [x,y,z,sx,sy,sz,color,angle] of parts){
        this.dummy.position.set(actor.pos[0]+(x*Math.cos(actor.heading)+z*Math.sin(actor.heading))*s,actor.pos[1]+y*s,actor.pos[2]+(-x*Math.sin(actor.heading)+z*Math.cos(actor.heading))*s);
        this.dummy.rotation.set(angle,actor.heading,actor.hp<=0?.85:actor.hit>0?-.08:0);
        this.dummy.scale.set(sx*s,sy*s,sz*s);this.dummy.updateMatrix();
        this.mesh.setMatrixAt(instance,this.dummy.matrix);
        this.color.set(actor.hit>0?0xffd38b:color);this.mesh.setColorAt(instance++,this.color);
      }
    }
    this.mesh.count=instance;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  }
}
export class DefenseView {
  group=new T.Group(); revision=-1;
  private dummy=new T.Object3D(); private geometry=new T.BoxGeometry(1,1,1);
  private material=new T.MeshLambertMaterial({color:0xffffff});
  private lights:T.PointLight[]=[];
  constructor(private world:World,scene:T.Scene) {
    this.group.name="NIGHTFALL build parts";scene.add(this.group);
    for(let i=0;i<3;i++){const light=new T.PointLight(0xffba64,0,8,2);scene.add(light);this.lights.push(light);}
  }
  update(origin:T.Vector3,night:boolean) {
    if(this.revision!==this.world.revision){
      const boxes:{cell:Cell;size:number[];position:number[];color:number}[]=[];
      for(const [id,block] of this.world.blocks){
        if(!special(block))continue;const cell=id.split(",").map(Number) as Cell;
        const add=(size:number[],position:number[],color=0x9b754a)=>boxes.push({cell,size,position,color});
        if(block==="Tür"||block==="Tor") {add([.9,1,.14],[.5,.5,.5]);add([.07,.07,.12],[.83,.5,.61],0xf4d184);}
        else if(block.endsWith("offen"))add([.14,1,.9],[.08,.5,.5]);
        else if(block==="Zaun"||block==="Barriere") {add([.18,1,.18],[.5,.5,.5]);add([1,.13,.12],[.5,.3,.5]);add([1,.13,.12],[.5,.78,.5]);}
        else if(block==="Treppe") {add([1,.5,1],[.5,.25,.5],0x8c969b);add([1,.5,.5],[.5,.75,.75],0x8c969b);}
        else if(block==="Leiter") {add([.09,1,.12],[.14,.5,.5]);add([.09,1,.12],[.86,.5,.5]);for(let y=.12;y<1;y+=.25)add([.8,.07,.12],[.5,y,.5]);}
        else if(block==="Fackel") {add([.09,.55,.09],[.5,.38,.5]);add([.18,.24,.18],[.5,.76,.5],0xffd578);}
        else if(block==="Falle") {add([.95,.07,.95],[.5,.035,.5],0x6e9873);for(let x=.15;x<1;x+=.3)add([.06,.16,.8],[x,.1,.5],0xc3a26a);}
        else if(block==="Lagerkiste") {add([.9,.8,.85],[.5,.4,.5]);add([.94,.12,.89],[.5,.84,.5],0x6e4e31);add([.12,.18,.08],[.5,.65,.95],0xe9c77b);}
      }
      for(const child of [...this.group.children]){if(child instanceof T.InstancedMesh)child.dispose();this.group.remove(child);}
      if(boxes.length){
        const mesh=new T.InstancedMesh(this.geometry,this.material,boxes.length);mesh.userData.cells=boxes.map(b=>b.cell);
        const color=new T.Color();
        boxes.forEach((box,i)=>{this.dummy.position.set(box.cell[0]+box.position[0],box.cell[1]+box.position[1],box.cell[2]+box.position[2]);this.dummy.scale.set(...box.size as [number,number,number]);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);mesh.setColorAt(i,color.set(box.color));});
        this.group.add(mesh);
      }
      this.revision=this.world.revision;
    }
    const torches=[...this.world.blocks].filter(([,b])=>b==="Fackel").map(([key])=>key.split(",").map(Number)).sort((a,b)=>Math.hypot(a[0]-origin.x,a[2]-origin.z)-Math.hypot(b[0]-origin.x,b[2]-origin.z));
    this.lights.forEach((light,i)=>{light.intensity=night&&torches[i]?2.6:0;if(torches[i])light.position.set(torches[i][0]+.5,torches[i][1]+.9,torches[i][2]+.5);});
  }
}
/** One context, throttled synthetic ambient/movement cues, enabled only by the sound setting. */
export class NightAudio {
  private audio:AudioContext|undefined; private clock=0;
  tick(dt:number,night:boolean,enemies:number,enabled:boolean){
    this.clock+=dt;if(!enabled||this.clock<5)return;this.clock=0;
    this.cue(enemies?"zombie":night?"night":"day");
  }
  cue(kind:"zombie"|"night"|"day"|"hit"){
    try{this.audio ||= new AudioContext();if(this.audio.state==="suspended")void this.audio.resume();
      const a=this.audio,o=a.createOscillator(),g=a.createGain();o.type=kind==="zombie"?"triangle":"sine";
      o.frequency.setValueAtTime(kind==="zombie"?68:kind==="night"?1200:kind==="hit"?280:780,a.currentTime);
      o.frequency.exponentialRampToValueAtTime(kind==="zombie"?43:kind==="hit"?520:900,a.currentTime+.22);
      g.gain.setValueAtTime(kind==="zombie"?.035:.018,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3);
      o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.31);o.onended=()=>{o.disconnect();g.disconnect();};
    }catch{}
  }
}
