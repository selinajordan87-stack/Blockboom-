import type {Block} from './World';
export const MOUNTAIN_PATH:readonly (readonly[number,number,number])[]=[
 [130,-90,0],[122,-98,2],[112,-108,5],[115,-119,7],[127,-132,10],
 [141,-136,13],[155,-132,15],[165,-123,17],[166,-111,19],[158,-106,21],[145,-105,25],
];
const peaks:readonly (readonly[number,number,number,number,number])[]=[
 [145,-105,26,26,23],[124,-122,23,23,26],[164,-126,22,22,24],[150,-145,16,25,16],
];
export function mountainPathSample(x:number,z:number){
 let distance=Infinity,height=0;
 for(let i=1;i<MOUNTAIN_PATH.length;i++){
  const a=MOUNTAIN_PATH[i-1],b=MOUNTAIN_PATH[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(d<distance){distance=d;height=a[2]+(b[2]-a[2])*t;}
 }
 return {distance,height};
}
/** Experimental sculpt. Kept separate from immutable generation 1. */
export function mountainSculpt(x:number,z:number){
 const edge=Math.hypot(x-145,z+105);if(edge>=70)return null;
 let elevation=0;
 for(const[px,pz,h,rx,rz]of peaks){
  const dx=(x-px)/rx,dz=(z-pz)/rz,angle=Math.atan2(dz,dx);
  const radius=Math.hypot(dx,dz)*(1+.11*Math.sin(angle*3+px)+.07*Math.cos(angle*5));
  elevation=Math.max(elevation,h*Math.max(0,1-radius)**.83);
 }
 // Broken buttresses and high saddles, not concentric conical terraces.
 elevation+=Math.min(1,elevation/7)*(1.25*Math.sin(x*.41+z*.15)+.7*Math.sin(z*.55-x*.19));
 const {distance,height:road}=mountainPathSample(x,z),width=1.1+.45*(1+Math.sin(x*.19+z*.13));
 const shoulder=Math.max(0,Math.min(1,(distance-width)/3.4));
 const top=Math.min(26,Math.max(0,Math.floor(road*(1-shoulder)+elevation*shoulder)));
 const stratum=Math.sin(x*.12+z*.21+top*.8);
 const surface:Block=distance<width?'Kalkstein':top>21?'Kalkstein':top>13?(stratum>.15?'Schiefer':'Stein'):top>7?(stratum>.7?'Kalkstein':'Stein'):'Gras';
 return {top,surface,distance,blend:Math.min(1,(70-edge)/15)};
}
