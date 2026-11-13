import {it,expect} from "vitest";
import * as T from "three";
import {CameraRig,defaultCamera,readCamera,readControls} from "../player/CameraRig";
import {Avatar} from "../player/Avatar";
import {World,type Cell} from "../world/World";
import {collides} from "../nightfall/Defense";
import {readExpansion} from "../inventory/Equipment";
import {mobileActions} from "../ui/MobileHUD";
const setup=()=>{const world=new World(),rig=new CameraRig(world),camera=new T.PerspectiveCamera(70,1.7,.08,80),actor={pos:[0,1,9] as Cell,yaw:0,pitch:-.12},settings=defaultCamera();return {world,rig,camera,actor,settings};};
it("zoomt wirklich hinter die sichtbare Figur und verändert dabei das Sichtfeld nicht",()=>{
 const s=setup();s.rig.update(s.camera,s.actor,s.settings,70,.016);expect(s.camera.position.y).toBe(2.6);
 s.settings.perspective="third";s.rig.update(s.camera,s.actor,s.settings,70,.016);const first=s.camera.position.distanceTo(new T.Vector3(0,2.35,9));expect(first).toBeCloseTo(4);expect(s.rig.thirdVisible).toBe(true);
 s.settings.distance=8;s.rig.update(s.camera,s.actor,s.settings,70,.016,true);expect(s.camera.position.distanceTo(new T.Vector3(0,2.35,9))).toBeGreaterThan(first+3.5);expect(s.camera.fov).toBe(70);
});
it("weicht Mauern aus und kehrt nach Freigabe zur gewählten Entfernung zurück",()=>{
 const s=setup();s.settings.perspective="third";s.settings.distance=6;
 for(let x=-1;x<=1;x++)for(let y=1;y<=5;y++)s.world.set(x,y,12,"Stein");s.rig.update(s.camera,s.actor,s.settings,70,.016,true);
 expect(s.rig.blocked).toBe(true);expect(s.rig.actualDistance).toBeLessThan(3);expect(s.settings.distance).toBe(6);expect(collides(s.world,[s.camera.position.x,s.camera.position.y-.19,s.camera.position.z],.38,.19)).toBe(false);
 for(let x=-1;x<=1;x++)for(let y=1;y<=5;y++)s.world.set(x,y,12,null);for(let i=0;i<120;i++)s.rig.update(s.camera,s.actor,s.settings,70,1/60);
 expect(s.rig.blocked).toBe(false);expect(s.rig.actualDistance).toBeGreaterThan(5.99);expect(s.rig.thirdVisible).toBe(true);
});
it("behandelt Baumblätter und niedrige Decken ohne dauerhafte Nahansicht",()=>{
 const s=setup();s.settings.perspective="third";s.world.set(0,3,12,"Laub");s.rig.update(s.camera,s.actor,s.settings,70,.016,true);expect(s.rig.blocked).toBe(true);
 s.world.set(0,3,12,null);for(let x=-1;x<=1;x++)for(let z=8;z<15;z++)s.world.set(x,3,z,"Stein");s.rig.update(s.camera,s.actor,s.settings,70,.016,true);expect(s.rig.actualDistance).toBeLessThan(2);expect(s.settings.distance).toBe(4);
 for(let x=-1;x<=1;x++)for(let z=8;z<15;z++)s.world.set(x,3,z,null);for(let i=0;i<120;i++)s.rig.update(s.camera,s.actor,s.settings,70,1/60);expect(s.rig.actualDistance).toBeGreaterThan(3.99);
});
it("setzt die Kamera sicher zurück und repariert ungültige Blickwinkel",()=>{
 const s=setup();s.actor.yaw=NaN;s.actor.pitch=Infinity;s.settings.perspective="third";s.rig.update(s.camera,s.actor,s.settings,NaN,.016);expect(s.camera.position.toArray().every(Number.isFinite)).toBe(true);expect(s.camera.fov).toBe(70);expect(s.rig.recoveries).toBe(1);
 s.rig.reset(s.settings);s.rig.update(s.camera,s.actor,s.settings,70,.016,true);expect(s.settings.perspective).toBe("first");expect(s.rig.actualDistance).toBe(0);expect(s.camera.position.z).toBe(9);
});
it("behält alte Kamerawerte, Weltedition und Materialien und ergänzt neue Optionen additiv",()=>{
 const e=readExpansion({version:1,edition:4,materials:{Holz:17},view:{fov:80,sensitivity:1.25}});expect(e.view).toEqual({fov:80,sensitivity:1.25});expect(e.materials.Holz).toBe(17);expect(e.camera).toEqual(defaultCamera());
 expect(readCamera({version:1,perspective:"third",distance:Infinity}).distance).toBe(4);expect(readControls({joystickSize:10000,opacity:-1,handedness:"left"})).toEqual({joystickSize:112,opacity:.2,handedness:"left"});
});
it("stellt eine vollständige Figur mit ausgerüstetem Werkzeug als einen Batch dar",()=>{
 const avatar=new Avatar(new T.Scene());avatar.update([0,1,9],0,0,"Angel",true,1,"cast",true);expect(avatar.mesh.visible).toBe(true);expect(avatar.mesh.count).toBeGreaterThan(11);expect(avatar.mesh.count).toBeLessThanOrEqual(24);expect(avatar.rodTip(new T.Vector3()).toArray().every(Number.isFinite)).toBe(true);
 avatar.update([0,1,9],0,0,"Angel",false,1,"idle",false);expect(avatar.mesh.visible).toBe(false);
});
it("zeigt nur tatsächlich bedienbare, zur Ausrüstung passende mobile Aktionen",()=>{
 const s={tool:"Bauwerkzeug" as const,functional:false,nearby:false,spot:false,fishing:"idle",zombie:false,block:"Gras",blockColor:"#abc"};expect(mobileActions(s)).toMatchObject({place:true,break:true,interact:false,attack:false});
 expect(mobileActions({...s,tool:"Schwert"})).toMatchObject({place:false,break:false,attack:true});expect(mobileActions({...s,tool:"Angel",spot:true})).toMatchObject({fish:true,attack:false,interact:true});expect(mobileActions({...s,tool:"Angel",zombie:true})).toMatchObject({attack:false,break:false});
});
