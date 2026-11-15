import {it,expect} from 'vitest';
import * as T from 'three';
import {World} from '../world/World';
import {NatureDetails} from '../world/NatureDetails';
import {LandmarkView} from '../world/LandmarkView';
it('begrenzt Pflanzen und verändert weder Terrain noch gespeicherte Bauwerke',()=>{
 const world=new World(),scene=new T.Scene(),before=new Map(world.blocks),revision=world.revision,changes=JSON.stringify(world.changes),art=new NatureDetails(world,scene);
 art.update([0,1,9],1000);expect(world.blocks).toEqual(before);expect(world.revision).toBe(revision);expect(JSON.stringify(world.changes)).toBe(changes);
 const meshes=art.group.children as T.InstancedMesh[];expect(meshes.map(m=>m.count)).toEqual(expect.arrayContaining([expect.any(Number)]));expect(meshes.length).toBe(5);expect(meshes[0].count).toBeLessThanOrEqual(100);expect(meshes[1].count).toBeLessThanOrEqual(360);expect(meshes[2].count).toBeLessThanOrEqual(64);expect(meshes[3].count).toBeLessThanOrEqual(90);expect(meshes[4].count).toBeLessThanOrEqual(28);expect(meshes[1].count).toBeGreaterThan(0);
 const geometries=meshes.map(m=>m.geometry);for(let i=0;i<30;i++)art.update([i*.2,1,9],2000+i*1100);expect(meshes.map(m=>m.geometry)).toEqual(geometries);art.dispose();expect(scene.children).not.toContain(art.group);
});
it('ersetzt Fernplatten durch begrenzte Gipfelgeometrie und entsorgt alle Ressourcen',()=>{
 const world=new World(),scene=new T.Scene(),art=new LandmarkView(scene,world);art.update([0,1,17],1000);
 const peaks=art.group.getObjectByName('layered ridge silhouettes') as T.InstancedMesh;expect(peaks).toBeTruthy();expect(peaks.count).toBeLessThanOrEqual(9);expect(peaks.geometry.getAttribute('position').count).toBeLessThan(200);art.dispose();expect(scene.children).not.toContain(art.group);
});
it('zeigt die feinere Berg-LOD nur in der Nähe statt ihr Budget von der Startwiese aus zu verbrauchen',()=>{
 const camera=new T.PerspectiveCamera();camera.position.set(0,2.6,17);camera.lookAt(145,22,-105);
 const old=new LandmarkView(new T.Scene(),new World()),world=new World();world.terrainRevision=2;const fresh=new LandmarkView(new T.Scene(),world);
 old.update([0,1,17],1000,camera);fresh.update([0,1,17],1000,camera);
 const count=(view:LandmarkView)=>(view.group.getObjectByName('distant terrain LOD') as T.Mesh).geometry.drawRange.count;
 expect(count(fresh)).toBeLessThanOrEqual(count(old)+300);
 const peaks=fresh.group.getObjectByName('layered ridge silhouettes') as T.InstancedMesh;
 expect(peaks.count).toBeLessThanOrEqual(6);old.dispose();fresh.dispose();
});
