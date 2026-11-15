import * as T from "three";
import {World,LIMIT,MIN_Y,type Cell} from "../world/World";

export interface CameraSettings {version:1;perspective:"first"|"third";distance:number}
export interface ControlSettings {joystickSize:number;opacity:number;handedness:"right"|"left"}
export const defaultCamera=():CameraSettings=>({version:1,perspective:"first",distance:4});
export const defaultControls=():ControlSettings=>({joystickSize:88,opacity:.42,handedness:"right"});
const finite=(n:unknown,lo:number,hi:number,fallback:number)=>typeof n==="number"&&Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):fallback;
export function readCamera(raw:unknown):CameraSettings{
 const r=raw as Partial<CameraSettings>|null,d=defaultCamera();if(!r||r.version!==1)return d;
 d.perspective=r.perspective==="third"?"third":"first";d.distance=finite(r.distance,2,9,4);return d;
}
export function readControls(raw:unknown):ControlSettings{
 const r=raw as Partial<ControlSettings>|null,d=defaultControls();if(!r)return d;
 d.joystickSize=finite(r.joystickSize,72,112,88);d.opacity=finite(r.opacity,.2,.75,.42);d.handedness=r.handedness==="left"?"left":"right";return d;
}

/** Desired distance is persistent; collision compression is temporary and never saved. */
export class CameraRig {
 actualDistance=0;blocked=false;temporaryFirst=false;recoveries=0;
 private mode="first";private compressed=false;private pivot=new T.Vector3();private direction=new T.Vector3();private offset=new T.Vector3();private sample=new T.Vector3();
 private cameraOffset=new T.Vector3();private right=new T.Vector3();
 private passThrough=new Set(["Laub","Glas","Fackel","Laterne","Zaun","Leiter","Teppich"]);
 constructor(private world:World){}
  /** Leaves, glass and small props must not force a first-person camera. */
  private cameraBlocked(at:T.Vector3){
   for(let x=Math.floor(at.x-.24);x<=Math.floor(at.x+.24);x++)
    for(let y=Math.floor(at.y-.18);y<=Math.floor(at.y+.28);y++)
     for(let z=Math.floor(at.z-.24);z<=Math.floor(at.z+.24);z++){
      const block=this.world.get(x,y,z);
      if(block&&!this.passThrough.has(block))return true;
     }
   return false;
  }
  private clearance(offset:T.Vector3,desired:number){
   for(let distance=.12;distance<=desired+.01;distance+=.12){
    const d=Math.min(distance,desired);this.sample.copy(this.pivot).addScaledVector(offset,d);
    if(Math.abs(this.sample.x)>=LIMIT-.25||Math.abs(this.sample.z)>=LIMIT-.25||this.sample.y<MIN_Y+.25||this.cameraBlocked(this.sample))return Math.max(0,d-.16);
   }
   return desired;
  }
 update(camera:T.PerspectiveCamera,actor:{pos:Cell;yaw:number;pitch:number},settings:CameraSettings,fov:number,dt:number,force=false,nearWork=false){
  if(!Number.isFinite(actor.yaw)||!Number.isFinite(actor.pitch)){actor.yaw=0;actor.pitch=-.12;this.recoveries++;force=true;}
  if(!Number.isFinite(this.actualDistance)){this.actualDistance=0;this.recoveries++;force=true;}
  actor.yaw%=Math.PI*2;actor.pitch=Math.max(-1.56,Math.min(1.56,actor.pitch));
  camera.fov=finite(fov,55,90,70);camera.rotation.order="YXZ";
  this.direction.set(-Math.sin(actor.yaw)*Math.cos(actor.pitch),Math.sin(actor.pitch),-Math.cos(actor.yaw)*Math.cos(actor.pitch));
  this.pivot.set(actor.pos[0],actor.pos[1]+1.35,actor.pos[2]);
  if(this.mode!==settings.perspective)this.compressed=false;
  force ||= this.mode!==settings.perspective;this.mode=settings.perspective;
  this.blocked=false;this.temporaryFirst=false;
  if(settings.perspective==="third"){
   const desired=finite(settings.distance,2,9,4);
   this.right.set(Math.cos(actor.yaw),0,-Math.sin(actor.yaw));
   // Prefer the usual over-the-shoulder view. If a real wall is behind the
   // player, try both shoulders and a slightly higher angle before moving in.
   const candidates=[
    this.direction.clone().multiplyScalar(-1).addScaledVector(this.right,.32).add(new T.Vector3(0,.38,0)).normalize(),
    this.direction.clone().multiplyScalar(-1).addScaledVector(this.right,-.52).add(new T.Vector3(0,.52,0)).normalize(),
    this.direction.clone().multiplyScalar(-1).add(new T.Vector3(0,.9,0)).normalize(),
   ];
   let allowed=0;this.cameraOffset.copy(candidates[0]);
   for(const candidate of candidates){const clear=this.clearance(candidate,desired);if(clear>allowed){allowed=clear;this.cameraOffset.copy(candidate);}}
   this.blocked=allowed<desired-.08;
   const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;
   this.actualDistance=force||allowed<this.actualDistance?allowed:this.actualDistance+(allowed-this.actualDistance)*(1-Math.exp(-11*elapsed));
   // Do not collapse to an extreme close-up because of a tree or fence. The
   // alternate angles above keep third person useful in almost every place.
   this.compressed=allowed<(this.compressed?.72:.52);
   this.temporaryFirst=this.compressed||this.actualDistance<.52;
   if(!this.temporaryFirst){
    camera.position.copy(this.pivot).addScaledVector(this.cameraOffset,this.actualDistance);
    // Converge near the hands for ground work. The old five-block focus
    // kept the centre reticle far ahead of the avatar at ordinary down angles.
    this.sample.copy(this.pivot).addScaledVector(this.direction,nearWork?2.5:5);camera.lookAt(this.sample);
   }
  }else {this.actualDistance=0;this.compressed=false;}
  if(settings.perspective==="first"||this.temporaryFirst){camera.position.set(actor.pos[0],actor.pos[1]+1.6,actor.pos[2]);camera.rotation.set(actor.pitch,actor.yaw,0);}
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 }
 reset(settings:CameraSettings){
  // Resetting frees a blocked rig but does not silently replace the player's
  // selected perspective with a close first-person view.
  settings.distance=finite(settings.distance,2,9,4);
  this.actualDistance=settings.perspective==="third"?settings.distance:0;
  this.mode=settings.perspective;this.compressed=false;this.blocked=false;this.temporaryFirst=false;this.recoveries++;
 }
 get thirdVisible(){return this.mode==="third"&&this.actualDistance>1.05&&!this.temporaryFirst;}
}
