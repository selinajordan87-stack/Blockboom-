import * as T from "three";
import type {Animal,LivingState} from "./State";

export const animalScale=(a:Animal)=>a.kind==="Katze"?.62:a.kind==="Huhn"?.48:a.kind==="Kuh"?1.15:1;
/** Stable body-shaped targets, independent of moving instance bounds and tiny legs. */
export function targetAnimal(ray:T.Ray,state:LivingState,range=4.5){
 let best:{animal:Animal;distance:number;point:T.Vector3}|null=null;
 const local=new T.Ray(),box=new T.Box3(),point=new T.Vector3(),axis=new T.Vector3(0,1,0);
 for(const animal of state.animals){
  if(animal.health===0)continue;
  const s=animalScale(animal),padding=.17;
  local.origin.copy(ray.origin).sub(new T.Vector3(...animal.pos)).applyAxisAngle(axis,-animal.heading);
  local.direction.copy(ray.direction).applyAxisAngle(axis,-animal.heading);
  box.min.set(-.42*s-padding,-.04,-.62*s-padding);box.max.set(.42*s+padding,1.15*s+padding,.94*s+padding);
  if(!local.intersectBox(box,point))continue;
  const distance=point.distanceTo(local.origin);
  if(distance>range||best&&distance>=best.distance)continue;
  best={animal,distance,point:point.clone().applyAxisAngle(axis,animal.heading).add(new T.Vector3(...animal.pos))};
 }
 return best;
}
