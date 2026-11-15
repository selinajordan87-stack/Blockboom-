import type {Block} from './World';
export const MOUNTAIN_PATH:readonly (readonly[number,number,number])[]=[[130,-90,0],[112,-108,5],[127,-132,10],[155,-132,15],[166,-111,19],[145,-105,24]];
const peaks:readonly (readonly[number,number,number,number])[]=[[145,-105,25,44],[123,-121,21,32],[164,-125,23,32]];
export function mountainPathSample(x:number,z:number){
 let distance=Infinity,height=0;
 for(let i=1;i<MOUNTAIN_PATH.length;i++){
  const a=MOUNTAIN_PATH[i-1],b=MOUNTAIN_PATH[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(d<distance){distance=d;height=a[2]+(b[2]-a[2])*t;}
 }
 return {distance,height};
}
/** Generation 2 is immutable and opt-in. Existing saves always decode as 1. */
export function mountainSculpt(x:number,z:number){
 const edge=Math.hypot(x-145,z+105);
 if(edge>=70)return null;
 let elevation=0;for(const [px,pz,h,r]of peaks)elevation=Math.max(elevation,h*Math.max(0,1-Math.hypot((x-px)*.9,z-pz)/r));
 const {distance,height:road}=mountainPathSample(x,z);
 // A broad shoulder blends the walking route into rock instead of cutting a trench.
 const weight=Math.max(0,Math.min(1,(distance-2)/6));
 const top=Math.min(25,Math.max(0,Math.floor(road*(1-weight)+elevation*weight)));
 const surface:Block=distance<1.8?'Kalkstein':top>21?'Kalkstein':top>14?'Schiefer':top>7?'Stein':'Gras';
 // The whole former mountain footprint participates. Blending only inside the
 // small peaks left a ring of old high terrain around new valleys.
 return {top,surface,distance,blend:Math.min(1,(70-edge)/15)};
}
