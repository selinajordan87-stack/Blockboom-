import {it,expect} from 'vitest';
import * as T from 'three';
import {ScenicWater} from '../world/ScenicWater';
it('zeichnet Wasser nur im Blickfeld, schaltet entfernte Flächen auf grobe Geometrie und gibt Ressourcen frei',()=>{
 const scene=new T.Scene(),water=new ScenicWater(scene),camera=new T.PerspectiveCamera(70,2,.08,240),fog=new T.Color(0xb9d8dc);
 camera.position.set(-122,4,-73);camera.lookAt(-110,0,-110);camera.updateMatrixWorld();water.update(0,.3,fog,camera);
 const near=water.mesh.geometry.drawRange.count;expect(near).toBeGreaterThan(0);expect(near).toBeLessThan(water.mesh.geometry.getAttribute('position').count);
 camera.position.set(-110,4,100);camera.lookAt(-110,0,-110);camera.updateMatrixWorld();water.update(1,.3,fog,camera);
 expect(water.mesh.geometry.drawRange.count).toBeLessThan(near);
 camera.lookAt(-110,4,200);camera.updateMatrixWorld();water.update(2,.3,fog,camera);expect(water.mesh.geometry.drawRange.count).toBe(0);
 water.dispose();expect(scene.children).toHaveLength(0);
});
