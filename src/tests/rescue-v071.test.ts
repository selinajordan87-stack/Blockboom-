import {it,expect} from "vitest";
import * as T from "three";
import {CameraRig,defaultCamera} from "../player/CameraRig";
import {World,type Cell} from "../world/World";
import {LivingView} from "../living/LivingView";
import {freshLiving} from "../living/State";
import {FishView} from "../fishing/FishView";
import {Shoal,MAX_FISH_ACTORS} from "../fishing/Shoal";

it("wechselt bei stark zusammengedrückter Kamera in einen bedienbaren Ego-Blick und kommt wieder heraus",()=>{
 const world=new World(),rig=new CameraRig(world),camera=new T.PerspectiveCamera(),actor={pos:[0,1,9] as Cell,yaw:0,pitch:-.12},settings=defaultCamera();
 settings.perspective="third";settings.distance=6;
 world.set(0,2,10,"Stein");world.set(0,3,10,"Stein");
 rig.update(camera,actor,settings,70,1/60,true);
 expect(rig.actualDistance).toBeGreaterThan(.32);expect(rig.actualDistance).toBeLessThan(1.45);
 expect(rig.temporaryFirst).toBe(true);expect(camera.position.y).toBeCloseTo(2.6);
 expect(settings.perspective).toBe("third");expect(settings.distance).toBe(6);
 world.set(0,2,10,null);world.set(0,3,10,null);
 for(let i=0;i<120;i++)rig.update(camera,actor,settings,70,1/60);
 expect(rig.actualDistance).toBeGreaterThan(5.99);expect(rig.temporaryFirst).toBe(false);expect(rig.thirdVisible).toBe(true);
});

it("erkennt dasselbe Tier nach Bewegung über seine frühere Trefferbegrenzung hinaus",()=>{
 const state=freshLiving(),a=state.animals[3];state.animals=[a];a.pos=[0,1,0];a.heading=0;
 const view=new LivingView(new T.Scene()),ray=new T.Raycaster(new T.Vector3(0,1.6,3),new T.Vector3(0,0,-1));
 view.update(state,new T.Vector3(0,2,3));expect(view.hit(ray,state)?.id).toBe(a.id);
 a.pos=[20,1,0];view.update(state,new T.Vector3(20,2,3));ray.ray.origin.x=20;
 expect(view.hit(ray,state)?.id).toBe(a.id);expect(view.pick(ray,state)?.precise).toBe(true);
});

it("verteilt sichtbare Fische im großen See auf mehrere Ufergruppen innerhalb des festen Limits",()=>{
 const shoal=new Shoal(),fish=shoal.actors.filter(a=>a.spot==="great");
 expect(shoal.actors.length).toBeLessThanOrEqual(MAX_FISH_ACTORS);expect(fish.length).toBeGreaterThanOrEqual(8);
 expect(fish.filter(a=>Math.hypot(a.x+115,a.z+91)<6).length).toBeGreaterThanOrEqual(3);
 expect(Math.max(...fish.map(a=>a.x))-Math.min(...fish.map(a=>a.x))).toBeGreaterThan(40);
 for(let i=0;i<600;i++)shoal.update(1/30);
 expect(fish.filter(a=>Math.hypot(a.x+115,a.z+91)<7).length).toBeGreaterThanOrEqual(3);
});


it("zeichnet Fischfarben ohne ungebundene schwarze Vertexfarbattribute",()=>{
 const view=new FishView(new Shoal(),new T.Scene());
 for(const mesh of view.group.children as T.InstancedMesh[]){
  const material=mesh.material as T.MeshLambertMaterial;
  expect(material.vertexColors&&!mesh.geometry.getAttribute("color")).toBe(false);
 }
 const body=view.group.children[0] as T.InstancedMesh;
 expect(body.instanceColor).toBeTruthy();const color=new T.Color();body.getColorAt(0,color);expect(color.r+color.g+color.b).toBeGreaterThan(.5);
});


it("rendert nur nahe Fischgruppen und behält ihre tatsächliche Identität beim Raycast",()=>{
 const shoal=new Shoal(),scene=new T.Scene(),view=new FishView(shoal,scene);
 view.update(0,new T.Vector3(-115,2,-85));scene.updateMatrixWorld(true);
 expect((view.group.children[0] as T.InstancedMesh).count).toBe(8);
 const fish=shoal.actors.find(a=>a.spot==="great")!,ray=new T.Raycaster(new T.Vector3(fish.x,fish.y,fish.z+2),new T.Vector3(0,0,-1));
 expect(view.hit(ray,3)?.fish.spot).toBe("great");
 view.update(0,new T.Vector3(0,2,9));expect((view.group.children[0] as T.InstancedMesh).count).toBe(24);expect(view.group.children).toHaveLength(7);
});
