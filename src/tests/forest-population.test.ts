import {it,expect} from 'vitest';
import * as T from 'three';
import {World} from '../world/World';
import {RegionStream} from '../living/Regions';
import {Player} from '../player/Player';
import {WorldView} from '../world/Renderer';

it('erzeugt einen tatsächlichen Wald mit hohen Stämmen, freien Wegen und begrenzter Geometrie',()=>{
 const w=new World(),stream=new RegionStream(w,true);stream.ensure(-108,30);
 const trunks=()=>[...w.blocks].filter(([id,b])=>{const[x,y,z]=id.split(',').map(Number);return x<-65&&z>0&&y>=2&&(b==='Holz'||b==='Dunkelholz');});
 const logs=trunks();expect(logs.length).toBeGreaterThanOrEqual(50);
 expect(new Set(logs.map(([id])=>{const[x,,z]=id.split(',');return `${x},${z}`;})).size).toBeGreaterThanOrEqual(20);
 expect(new Set(logs.map(([,b])=>b))).toEqual(new Set(['Holz','Dunkelholz']));
 const p=new Player(w);stream.ensure(-64,23);p.pos=[-64.5,1.001,23.5];
 for(let i=0;i<3500&&Math.hypot(p.pos[0]+108,p.pos[2]-30)>1;i++){
  stream.ensure(p.pos[0],p.pos[2]);p.yaw=Math.atan2(-(-108-p.pos[0]),-(30-p.pos[2]));p.step(1/120,0,1,false);
 }
 expect(Math.hypot(p.pos[0]+108,p.pos[2]-30)).toBeLessThan(1);
 expect(p.blocked([-100,1.001,30])).toBe(false);expect(p.blocked([-108,1.001,39])).toBe(false);
 const view=new WorldView(w,new T.Scene()),slices:number[]=[];
 do{view.update(4);slices.push(view.metrics.lastBuildMs);}while(view.metrics.queue);
 const triangles=view.group.children.reduce((sum,o)=>{const g=(o as T.Mesh).geometry;return sum+(g.index?.count||g.getAttribute('position').count)/3;},0);
 expect(view.group.children.length).toBeLessThanOrEqual(64);expect(triangles).toBeLessThan(90000);
 console.info(JSON.stringify({forest:{logs:trunks().length,triangles,chunkMeshes:view.group.children.length,slices:slices.length,maxSliceMs:+Math.max(...slices).toFixed(2),blocks:w.blocks.size}}));view.dispose();
});
