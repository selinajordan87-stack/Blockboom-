import {expect,it} from "vitest";
import * as T from "three";
import {SPOTS,spotById,readAngling,defaultAngling} from "../fishing/AnglingData";
import {Shoal,MAX_FISH_ACTORS} from "../fishing/Shoal";
import {AnglingEngine,type AnglingEvent} from "../fishing/AnglingEngine";
import {FishingWaters,enrichFishingWorld,nearAnglingSpot,discoverySpot} from "../fishing/FishingWorld";
import {FishView} from "../fishing/FishView";
import {World} from "../world/World";
import {RegionStream} from "../living/Regions";

it("ergänzt den erreichbaren großen Angelplatz und bewahrt alte Entdeckungen",()=>{
 const great=spotById("great");expect(great.center).toEqual({x:-110,z:-110});
 expect(nearAnglingSpot(great.shore.x,1,great.shore.z)?.id).toBe("great");
 expect(discoverySpot(great.shore.x,great.shore.z)?.id).toBe("great");
 const old={...defaultAngling(),spots:["small","forest","river","secret"]};
 expect(readAngling(old).spots).toEqual(old.spots);
 expect(readAngling({...old,spots:[...old.spots,"great"]}).spots).toEqual([...old.spots,"great"]);
});

it("verteilt sichtbare Fische in Ufernähe des großen Sees ohne die Population unbeschränkt zu erhöhen",()=>{
 const shoal=new Shoal(),great=spotById("great"),school=shoal.actors.filter(f=>f.spot==="great");
 expect(shoal.actors.length).toBeLessThanOrEqual(MAX_FISH_ACTORS);expect(school).toHaveLength(5);
 expect(shoal.actors[0]).toMatchObject({id:0,species:"Rotauge",spot:"small"});
 const before=school.map(f=>[f.x,f.z]);for(let i=0;i<300;i++)shoal.update(.016);
 expect(school.map(f=>[f.x,f.z])).not.toEqual(before);
 for(const fish of school){
   expect(Math.hypot(fish.x-great.shore.x,fish.z-great.shore.z)).toBeLessThan(17);
   expect(Math.hypot((fish.x-great.center.x)/(great.radius.x*.8),(fish.z-great.center.z)/(great.radius.z*.8))).toBeLessThanOrEqual(1.001);
 }
});

it("lässt am großen See tatsächlich auswerfen, einen Fisch heranschwimmen, beißen und anlanden",()=>{
 const shoal=new Shoal(),engine=new AnglingEngine(shoal,()=>0),spot=spotById("great");
 expect(engine.beginCharge(0)).toBe(true);expect(engine.releaseCast(900,spot,defaultAngling().loadout,{x:spot.shore.x,y:2.6,z:spot.shore.z},{x:0,y:-.1,z:-1})).toBe(true);
 let now=900,event:AnglingEvent|null=null;
 for(let i=0;i<1800&&event!=="bite";i++){now+=16;shoal.update(.016);event=engine.tick(now,.016);}
 expect(event).toBe("bite");expect(shoal.actors.find(f=>f.id===engine.target)?.spot).toBe("great");expect(engine.hook(now)).toBe(true);
 for(let i=0;i<2600&&event!=="landed";i++){engine.setReeling(engine.tension<.63);now+=16;shoal.update(.016);event=engine.tick(now,.016);}
 expect(event).toBe("landed");const caught=engine.finishLanded(true);expect(caught?.spot).toBe("great");
 expect(shoal.actors.find(f=>f.id===caught!.id)?.alive).toBe(true);
});

it("zeigt entfernte Fischinstanzen im Frustum und trifft sie durch echte Mesh-Raycasts",()=>{
 const scene=new T.Scene(),shoal=new Shoal(),view=new FishView(shoal,scene),fish=shoal.actors.find(f=>f.spot==="great")!;
 const camera=new T.PerspectiveCamera(70,1.7,.08,80);camera.position.set(fish.x,fish.y+1,fish.z+4);camera.lookAt(fish.x,fish.y,fish.z);camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 expect(view.group.children.every(child=>frustum.intersectsObject(child))).toBe(true);
 const body=view.group.children[0] as T.InstancedMesh;expect(body.boundingSphere?.containsPoint(new T.Vector3(fish.x,fish.y,fish.z))).toBe(true);
 const ray=new T.Raycaster(new T.Vector3(fish.x,fish.y,fish.z+3),new T.Vector3(0,0,-1));
 expect(ray.intersectObjects(view.group.children,false).some(hit=>hit.instanceId!==undefined&&shoal.actors[(hit.object.userData.part==="eyes"?Math.floor(hit.instanceId/2):hit.instanceId)]?.spot==="great")).toBe(true);
 expect(view.hit(ray,6)?.fish.spot).toBe("great");
});

it("zeichnet die neue Wasserfläche richtig und reserviert genug Instanzen ohne Fernterrain vorzuladen",()=>{
 const waters=new FishingWaters(new T.Scene()),surface=waters.group.children.find(child=>child.userData.spot==="great")!;
 const bounds=new T.Box3().setFromObject(surface);expect(bounds.max.x-bounds.min.x).toBeCloseTo(80);expect(bounds.max.z-bounds.min.z).toBeCloseTo(60);expect(bounds.max.y-bounds.min.y).toBeLessThan(.001);
 const reeds=waters.group.getObjectByName("Schilf") as T.InstancedMesh,logs=waters.group.getObjectByName("Totholz") as T.InstancedMesh;
 expect(reeds.count).toBe(SPOTS.reduce((n,spot)=>n+(spot.id==="river"?8:11),0));expect(reeds.instanceMatrix.count).toBeGreaterThanOrEqual(reeds.count);expect(logs.count).toBe(SPOTS.length);
 const world=new World();enrichFishingWorld(world);expect(world.get(-110,-2,-110)).toBeUndefined();expect([...world.blocks.keys()].some(key=>Math.abs(Number(key.split(",")[0]))>=60)).toBe(false);
});

it("erkennt den tatsächlich begehbaren großen Holzsteg als Angelplatz",()=>{
 const w=new World(),stream=new RegionStream(w,true);stream.ensure(-115,-90);
 for(const z of [-79,-87,-108]){expect(w.get(-115,0,z)).toBe("Bretter");expect(nearAnglingSpot(-114.5,1,z+.5)?.id).toBe("great");expect(discoverySpot(-114.5,z+.5)?.id).toBe("great");}
 expect(nearAnglingSpot(-122,1,-90)).toBeNull();expect(nearAnglingSpot(-114.5,12,-86.5)).toBeNull();
});
