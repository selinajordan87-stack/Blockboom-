import {it,expect} from 'vitest';
import * as T from 'three';
import {World} from '../world/World';
import {NatureDetails} from '../world/NatureDetails';
import {LandmarkView} from '../world/LandmarkView';
it('begrenzt Pflanzen und verändert weder Terrain noch gespeicherte Bauwerke',()=>{
 const world=new World(),scene=new T.Scene(),before=new Map(world.blocks),revision=world.revision,changes=JSON.stringify(world.changes),art=new NatureDetails(world,scene);
 art.update([0,1,9],1000);expect(world.blocks).toEqual(before);expect(world.revision).toBe(revision);expect(JSON.stringify(world.changes)).toBe(changes);
 const meshes=art.group.children as T.InstancedMesh[];expect(meshes[0].count).toBeLessThanOrEqual(96);expect(meshes[1].count).toBeLessThanOrEqual(12);expect(meshes[0].count).toBeGreaterThan(0);
 const geometries=meshes.map(m=>m.geometry);for(let i=0;i<30;i++)art.update([i*.2,1,9],2000+i*1100);expect(meshes.map(m=>m.geometry)).toEqual(geometries);art.dispose();expect(scene.children).not.toContain(art.group);
});
it('ersetzt Fernplatten durch begrenzte Gipfelgeometrie und entsorgt alle Ressourcen',()=>{
 const world=new World(),scene=new T.Scene(),art=new LandmarkView(scene,world);art.update([0,1,17],1000);
 const peaks=art.group.getObjectByName('layered ridge silhouettes') as T.InstancedMesh;expect(peaks).toBeTruthy();expect(peaks.count).toBeLessThanOrEqual(9);expect(peaks.geometry.getAttribute('position').count).toBeLessThan(200);art.dispose();expect(scene.children).not.toContain(art.group);
});
