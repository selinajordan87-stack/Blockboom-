import {expect,it} from 'vitest';
import {World,MAX_Y} from '../world/World';
import {terrainProfile,caveRange} from '../world/DiscoveryTerrain';
import {RegionStream} from '../living/Regions';
import {MOUNTAIN_PATH} from '../world/TerrainSculpt';

it('hält beide Kammern frei, trägt ihre Decke und erhält den Fund',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true);stream.ensure(147,-99);
 let cells=0,minRoof=Infinity;
 for(let x=136;x<=164;x++)for(let z=-111;z<=-86;z++){
  const air=caveRange(x,z);if(!air)continue;
  // Special ore/torch/chest placements are deliberately allowed at the walls/floor.
  for(let y=air.floor+1;y<=air.ceiling;y++){
   if(x===159&&y===-11&&z===-94)continue; // Deliberate gold vein at the chamber edge.
   expect(world.get(x,y,z),`${x},${y},${z}`).toBeUndefined();
  }
  const roof=terrainProfile(x,z,2).top-air.ceiling;minRoof=Math.min(minRoof,roof);
  expect(roof,`ceiling thickness at ${x},${z}`).toBeGreaterThanOrEqual(2);
  expect(world.get(x,air.ceiling+1,z),`roof at ${x},${z}`).toBeTruthy();cells++;
 }
 expect(cells).toBeGreaterThan(100);console.info(JSON.stringify({mountainCave:{columns:cells,minRoof}}));
});

it('erhält manuelle Kellerluft, Möbel und hohe Bauten nach Entladen und Neuladen',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true);stream.ensure(145,-105);
 // Basement air, furniture, a high construction and an edited empty tree column.
 const edits=[ [145,-5,-105,null],[145,-4,-105,'Bett'],[146,MAX_Y,-104,'Glas'],[140,8,-105,null] ] as const;
 for(const[x,y,z,b]of edits)world.set(x,y,z,b);
 const changes=JSON.stringify(world.changes);stream.ensure(-100,30);stream.ensure(145,-105);
 for(const[x,y,z,b]of edits)expect(world.get(x,y,z)||null).toBe(b);
 expect(JSON.stringify(world.changes)).toBe(changes);
});

it('hält den Gehweg frei von generierten Baumstämmen',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true);
 for(let i=1;i<MOUNTAIN_PATH.length;i++){
  const a=MOUNTAIN_PATH[i-1],b=MOUNTAIN_PATH[i],length=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1]));
  for(let n=0;n<=length;n++){
   const x=Math.round(a[0]+(b[0]-a[0])*n/length),z=Math.round(a[1]+(b[1]-a[1])*n/length);stream.ensure(x,z);
   const top=terrainProfile(x,z,2).top;
   for(let y=top+1;y<=Math.min(MAX_Y,top+3);y++)expect(['Holz','Dunkelholz','Laub'],`${x},${y},${z}`).not.toContain(world.get(x,y,z));
  }
 }
});
