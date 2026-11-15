import type {Block} from './World';
export const MOUNTAIN_PATH:readonly (readonly[number,number,number])[]=[[130,-90,0],[112,-108,5],[127,-132,10],[155,-132,15],[166,-111,19],[145,-105,24]];
/** Generation 2 is immutable and opt-in. Existing saves always decode as 1. */
export function mountainSculpt(x:number,z:number){
 const peaks=[[145,-105,25,30],[126,-116,20,26],[163,-121,22,25]];
 let elevation=0;for(const [px,pz,h,r]of peaks)elevation=Math.max(elevation,h*Math.max(0,1-Math.hypot((x-px)*.9,z-pz)/r));
 if(elevation<=0)return null;
 let distance=Infinity,road=0;
 for(let i=1;i<MOUNTAIN_PATH.length;i++){
  const a=MOUNTAIN_PATH[i-1],b=MOUNTAIN_PATH[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(d<distance){distance=d;road=a[2]+(b[2]-a[2])*t;}
 }
 // A broad shoulder blends the walking route into rock instead of cutting a trench.
 const weight=Math.max(0,Math.min(1,(distance-2)/6));
 const top=Math.min(25,Math.max(0,Math.floor(road*(1-weight)+elevation*weight)));
 const surface:Block=distance<1.8?'Kalkstein':top>21?'Kalkstein':top>14?'Schiefer':top>7?'Stein':'Gras';
 return {top,surface,distance,blend:Math.min(1,elevation/6)};
}
