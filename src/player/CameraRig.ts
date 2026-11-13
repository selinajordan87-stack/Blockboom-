import * as T from "three";
import {World,LIMIT,MIN_Y,type Cell} from "../world/World";
import {collides} from "../nightfall/Defense";

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
 private mode="first";private pivot=new T.Vector3();private direction=new T.Vector3();private offset=new T.Vector3();private sample=new T.Vector3();
 constructor(private world:World){}
 update(camera:T.PerspectiveCamera,actor:{pos:Cell;yaw:number;pitch:number},settings:CameraSettings,fov:number,dt:number,force=false){
  if(!Number.isFinite(actor.yaw)||!Number.isFinite(actor.pitch)){actor.yaw=0;actor.pitch=-.12;this.recoveries++;force=true;}
  if(!Number.isFinite(this.actualDistance)){this.actualDistance=0;this.recoveries++;force=true;}
  actor.yaw%=Math.PI*2;actor.pitch=Math.max(-1.45,Math.min(1.45,actor.pitch));
  camera.fov=finite(fov,55,90,70);camera.rotation.order="YXZ";
  this.direction.set(-Math.sin(actor.yaw)*Math.cos(actor.pitch),Math.sin(actor.pitch),-Math.cos(actor.yaw)*Math.cos(actor.pitch));
  this.pivot.set(actor.pos[0],actor.pos[1]+1.35,actor.pos[2]);
  force ||= this.mode!==settings.perspective;this.mode=settings.perspective;
  this.blocked=false;this.temporaryFirst=false;
  if(settings.perspective==="third"){
   const desired=finite(settings.distance,2,9,4);
   this.offset.copy(this.direction).multiplyScalar(-desired).add(new T.Vector3(Math.cos(actor.yaw)*.4,.65,-Math.sin(actor.yaw)*.4)).normalize();
   let allowed=desired;
   for(let distance=.08;distance<=desired+.08;distance+=.08){
    const d=Math.min(distance,desired);this.sample.copy(this.pivot).addScaledVector(this.offset,d);
    if(Math.abs(this.sample.x)>=LIMIT-.1||Math.abs(this.sample.z)>=LIMIT-.1||this.sample.y<MIN_Y+.2||collides(this.world,[this.sample.x,this.sample.y-.2,this.sample.z],.4,.2)){
     allowed=Math.max(0,d-.12);this.blocked=true;break;
    }
   }
   const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;
   this.actualDistance=force||allowed<this.actualDistance?allowed:this.actualDistance+(allowed-this.actualDistance)*(1-Math.exp(-8*elapsed));
   if(this.actualDistance>=.32){
    camera.position.copy(this.pivot).addScaledVector(this.offset,this.actualDistance);
    this.sample.copy(this.pivot).addScaledVector(this.direction,5);camera.lookAt(this.sample);
   }else this.temporaryFirst=true;
  }else this.actualDistance=0;
  if(settings.perspective==="first"||this.temporaryFirst){camera.position.set(actor.pos[0],actor.pos[1]+1.6,actor.pos[2]);camera.rotation.set(actor.pitch,actor.yaw,0);}
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 }
 reset(settings:CameraSettings){settings.perspective="first";settings.distance=4;this.actualDistance=0;this.mode="first";this.blocked=false;this.temporaryFirst=false;this.recoveries++;}
 get thirdVisible(){return this.mode==="third"&&this.actualDistance>1.05&&!this.temporaryFirst;}
}
