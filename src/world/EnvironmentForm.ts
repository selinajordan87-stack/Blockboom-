/** Art-directed shapes shared by terrain, water and distant vegetation. */
export const artHash=(x:number,z:number)=>((Math.imul(x|0,73856093)^Math.imul(z|0,19349663))>>>0);
export function lakeContour(x:number,z:number){
 const dx=(x+110)/40,dz=(z+110)/30,a=Math.atan2(dz,dx),r=Math.hypot(dx,dz);
 // Bays extend outwards: the established shoals always retain their old water.
 const bay=.035+.075*(.5+.5*Math.sin(a*3+.8))+.04*(.5+.5*Math.cos(a*7-.4));
 return r/(1+bay);
}
export const ART_RIVER:readonly (readonly[number,number])[]=[[-110,-83],[-113,-70],[-106,-56],[-109,-43],[-99,-21],[-98,-5],[-85,20],[-79,42],[-70,65],[-46,72],[-22,69],[0,75],[24,79],[45,76],[65,85],[90,87],[112,103],[135,110]];
export function artRiver(x:number,z:number){
 let d=Infinity,width=3;
 for(let i=1;i<ART_RIVER.length;i++){
  const a=ART_RIVER[i-1],b=ART_RIVER[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),v=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(v<d){d=v;width=2.6+.9*Math.sin((i+t)*1.3)**2;}
 }
 return {distance:d,width};
}
export function lakeRidge(x:number,z:number){
 const peaks=[[-119,-159,24,27,18],[-141,-150,17,22,15],[-98,-163,20,21,17]];
 let h=0;
 for(const[px,pz,height,rx,rz]of peaks){const dx=(x-px)/rx,dz=(z-pz)/rz;h=Math.max(h,height*Math.max(0,1-Math.hypot(dx,dz)));}
 return h>0?Math.max(0,h+Math.sin(x*.5+z*.18)*1.1+Math.sin(z*.65)*.65):0;
}
export type TreeSeed={x:number;z:number;h:number;kind:number;seed:number};
/** Jittered groves, two open glades, and an irregular upper treeline. */
export function groveSeeds(minX:number,maxX:number,minZ:number,maxZ:number):TreeSeed[]{
 const trees:TreeSeed[]=[];
 for(let gx=Math.floor(minX/7);gx<=Math.floor(maxX/7);gx++)for(let gz=Math.floor(minZ/7);gz<=Math.floor(maxZ/7);gz++){
  const seed=artHash(gx,gz),x=gx*7+1+seed%5,z=gz*7+1+(seed>>>4)%5;
  const forest=Math.hypot((x+104)/65,(z-22)/58)<1,shore=Math.hypot((x+111)/66,(z+116)/56)<1;
  const cluster=Math.sin(x*.095+z*.031)+Math.cos(z*.105-x*.028);
  if(forest&&(Math.hypot(x+105,z-29)<9||Math.hypot(x+127,z-4)<7))continue;
  if(!(forest?(seed%5!==0&&cluster>-.95):shore?(seed%3===0):seed%16===0))continue;
  trees.push({x,z,h:forest?6+(seed>>>8)%6:5+(seed>>>8)%5,kind:shore?seed%3:seed%4,seed});
 }
 return trees;
}
