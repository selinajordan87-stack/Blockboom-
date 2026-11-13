import { LIMIT, MIN_Y, MAX_Y, type Cell } from "../world/World";
export const ANIMALS=["Wolf","Katze","Huhn","Kuh","Schaf","Schwein"] as const;
export type AnimalKind=typeof ANIMALS[number];
export const MAX_ANIMALS=18;
export interface Animal {id:string;kind:AnimalKind;name:string;pos:Cell;home:Cell;tame:boolean;trust:number;hunger:number;mode:"Folgen"|"Warten"|"Schlafen";phase:number;heading:number;action:string}
export const CROPS=["Weizen","Karotte","Kartoffel","Kürbis"] as const;
export type CropKind=typeof CROPS[number];
export interface Crop {cell:Cell;kind:CropKind;planted:number;growthOffset?:number;}
export interface LivingState {
 version:1;clock:number;bag:Record<string,number>;chests:Record<string,Record<string,number>>;
 animals:Animal[];crops:Crop[];regions:string[];looted:string[];mined:string[];completed:string[];
 placed:string[];blueprint:boolean;home:Cell|null; selectedSeed:CropKind;explored:string[];entrances:string[];
}
export function freshLiving():LivingState{
 const positions:Cell[]=[[-5,1,15],[7,1,14],[8,1,3],[-20,1,18],[-36,1,12],[28,1,18],[-8,1,12],[-12,1,20],[-18,1,5],[0,1,8],[12,1,22],[-42,1,8],[-100,8,30],[-94,8,24],[-108,8,39],[95,8,84],[105,8,91],[116,8,-103]];
 const kinds:AnimalKind[]=[...ANIMALS,"Kuh","Schaf","Schwein","Huhn","Katze","Wolf","Schaf","Kuh","Wolf","Huhn","Katze","Schaf"];
 return {version:1,clock:0,bag:{"Samen:Weizen":4,"Samen:Karotte":4,"Samen:Kartoffel":4,"Samen:Kürbis":4},chests:{},crops:[],regions:[],looted:[],mined:[],completed:[],placed:[],blueprint:false,home:null,selectedSeed:"Weizen",explored:[],entrances:[],
 animals:kinds.map((kind,i)=>({id:`animal-${i}`,kind,name:"",pos:positions[i],home:[...positions[i]],tame:false,trust:0,hunger:75,mode:"Warten",phase:i,heading:0,action:"Ruhen"}))};
}
export const validCell=(v:unknown):v is Cell=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==="number"&&Number.isFinite(n))&&Math.abs(v[0])<LIMIT&&Math.abs(v[2])<LIMIT&&v[1]>=MIN_Y&&v[1]<=MAX_Y+1;
export const safeCount=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=1e7?Number(n):0;
export function readLiving(raw:unknown){
 const s=freshLiving();if(!raw||typeof raw!=="object")return s;const r=raw as Partial<LivingState>;if(r.version!==1)return s;
 if(typeof r.clock==="number"&&Number.isFinite(r.clock)&&r.clock>=0&&r.clock<1e9)s.clock=r.clock;
 const strings=(v:unknown)=>Array.isArray(v)?[...new Set(v.filter((a):a is string=>typeof a==="string"&&a.length<100))].slice(0,200):[];
 for(const k of ["regions","looted","mined","completed","placed"] as const)s[k]=strings(r[k]);
 if(Array.isArray(r.explored))s.explored=[...new Set(r.explored.filter((id):id is string=>typeof id==="string"&&/^-?\d+,-?\d+$/.test(id)&&id.split(",").every(n=>Math.abs(Number(n))<=Math.ceil(LIMIT/16))))].slice(0,2048);
 s.entrances=strings(r.entrances);
 if(validCell(r.home))s.home=[...r.home];s.blueprint=r.blueprint===true;
 if(CROPS.includes(r.selectedSeed as CropKind))s.selectedSeed=r.selectedSeed!;
 const bag=(v:unknown)=>{const b:Record<string,number>={};if(v&&typeof v==="object")for(const [key,n]of Object.entries(v).slice(0,150))if(/^[\p{L}\d :,-]+$/u.test(key)&&key.length<70)b[key]=safeCount(n);return b;};
 if(r.bag)s.bag=bag(r.bag);
 if(r.chests&&typeof r.chests==="object")for(const [id,b]of Object.entries(r.chests).slice(0,100))if(/^[-\d,]+$/.test(id))s.chests[id]=bag(b);
 if(Array.isArray(r.animals)){
   const defaults=s.animals;s.animals=[];
   const valid=r.animals.filter(a=>a&&ANIMALS.includes(a.kind)&&typeof a.id==="string"&&validCell(a.pos)&&validCell(a.home));
   for(const a of valid){const id=a.id.slice(0,40);if(s.animals.length>=MAX_ANIMALS||s.animals.some(x=>x.id===id))continue;const clean:Animal={id,kind:a.kind,name:typeof a.name==="string"?a.name.trim().slice(0,24):"",pos:[...a.pos],home:[...a.home],tame:!!a.tame,trust:Math.min(3,safeCount(a.trust)),hunger:Math.min(100,Math.max(0,Number.isFinite(a.hunger)?a.hunger:75)),mode:["Folgen","Warten","Schlafen"].includes(a.mode)?a.mode:"Warten",phase:Number.isFinite(a.phase)?a.phase:0,heading:0,action:"Ruhen"};s.animals.push(clean);}
   for(const a of defaults)if(s.animals.length<MAX_ANIMALS&&!s.animals.some(x=>x.id===a.id))s.animals.push(a);
 }
 if(Array.isArray(r.crops))s.crops=r.crops.filter(c=>c&&validCell(c.cell)&&CROPS.includes(c.kind)&&Number.isFinite(c.planted)&&c.planted>=0&&c.planted<=s.clock).slice(0,160).map(c=>({cell:[...c.cell],kind:c.kind,planted:c.planted,...(Number.isFinite(c.growthOffset)&&c.growthOffset!>=0&&c.growthOffset!<=210?{growthOffset:c.growthOffset}:{})}));
 return s;
}
