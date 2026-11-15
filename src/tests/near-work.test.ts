import {it,expect} from 'vitest';
import * as T from 'three';
import {CameraRig} from '../player/CameraRig';
import {World,type Cell} from '../world/World';
import {castVoxels} from '../building/Target';
it('bringt Bodenarbeit in Third Person näher an die Figur, ohne die Reichweite zu erhöhen',()=>{
 const w=new World(),rig=new CameraRig(w),camera=new T.PerspectiveCamera(70,2,.08,240);
 const actor={pos:[0,1,9] as Cell,yaw:0,pitch:-.55},settings={version:1 as const,perspective:'third' as const,distance:6};
 const hit=(near:boolean)=>{rig.update(camera,actor,settings,70,1/60,true,near);return castVoxels(w,camera.position,camera.getWorldDirection(new T.Vector3()),40)!;};
 const far=hit(false),near=hit(true);
 expect(near).toBeTruthy();expect(Math.hypot(near.point[0],near.point[2]-9)).toBeLessThan(Math.hypot(far.point[0],far.point[2]-9));
 expect(Math.hypot(near.point[0],near.point[2]-9)).toBeLessThan(3);
 const eye=new T.Vector3(0,2.6,9),toward=new T.Vector3(...near.point).sub(eye).normalize();expect(castVoxels(w,eye,toward,6)?.cell).toEqual(near.cell);
 actor.pitch=-1.56;rig.update(camera,actor,settings,70,1/60,true,true);
 expect(actor.pitch).toBe(-1.56);expect(camera.getWorldDirection(new T.Vector3()).y).toBeLessThan(-.98);
});
