import {World} from './World';
/** Edition 2 only. Legacy saves retain the exact v1 base map. */
export function enrich(world:World){
 for(let x=-21;x<-2;x++)for(let z=-15;z<2;z++)if((x+11)**2/70+(z+6)**2/55<1){for(let y=-2;y<=0;y++)world.set(x,y,z,y===-2?'Sand':null,false);}
 for(const [x,z] of [[-20,-18],[-14,19],[-18,18],[-21,14],[9,-20],[12,-20],[20,-17]]){
  for(let y=1;y<=4;y++)world.set(x,y,z,'Holz',false);
  for(let y=3;y<=6;y++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)+Math.abs(dz)<=6-y)world.set(x+dx,y,z+dz,'Laub',false);
 }
 for(let x=8;x<=15;x++)for(let z=-22;z<=-16;z++)for(let y=1;y<=Math.max(1,3-Math.floor(Math.hypot(x-12,z+19)/2));y++)world.set(x,y,z,'Stein',false);
 // A small ruin and a lookout, kept away from all established interaction zones.
 for(let y=1;y<=3;y++)for(let z=17;z<=20;z++)world.set(-17,y,z,'Ziegel',false);
 for(let x=8;x<=11;x++)world.set(x,3,-18,'Bretter',false);
}
