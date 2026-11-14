export interface DiscoveryAnswer {
  attempts: number;
  history: boolean[];
  hints: number;
}
export interface DiscoveryState {
  version: 1;
  enabled: boolean;
  visited: string[];
  read: string[];
  applied: string[];
  completed: string[];
  skipped: string[];
  gatheredHolz: number;
  gatheredStein: number;
  crafted: string[];
  harvested: string[];
  caught: string[];
  slept: boolean;
  answers: Record<string, DiscoveryAnswer>;
  tower?:{origin:Cell;rewarded:boolean};
}
export function freshDiscovery(): DiscoveryState {
  return {version:1,enabled:true,visited:[],read:[],applied:[],completed:[],skipped:[],
    gatheredHolz:0,gatheredStein:0,crafted:[],harvested:[],caught:[],slept:false,answers:{}};
}
const count=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0?Math.min(Number(value),1e6):0;
const ids=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==="string"&&id.length>0&&id.length<=80))].slice(0,300):[];
/** Additive schema: no existing world or learning field is replaced. */
export function readDiscovery(raw:unknown):DiscoveryState {
  const state=freshDiscovery();if(!raw||typeof raw!=="object")return state;
  const r=raw as Partial<DiscoveryState>;if(r.version!==1)return state;
  state.enabled=r.enabled!==false;
  for(const field of ["visited","read","applied","completed","skipped","crafted","harvested","caught"] as const)state[field]=ids(r[field]);
  state.gatheredHolz=count(r.gatheredHolz);state.gatheredStein=count(r.gatheredStein);state.slept=r.slept===true;
  const t=r.tower;if(t&&Array.isArray(t.origin)&&t.origin.length===3&&t.origin.every(Number.isInteger)&&t.origin[0]>-LIMIT&&t.origin[0]+2<LIMIT&&t.origin[2]>-LIMIT&&t.origin[2]+3<LIMIT&&t.origin[1]>MIN_Y&&t.origin[1]+5<=MAX_Y)state.tower={origin:[...t.origin],rewarded:t.rewarded===true};
  if(r.answers&&typeof r.answers==="object")for(const [id,result]of Object.entries(r.answers).slice(0,100)){
    if(!/^[a-z][a-z\d-]{0,79}$/.test(id)||!result||typeof result!=="object")continue;
    state.answers[id]={attempts:count(result.attempts),hints:count(result.hints),history:Array.isArray(result.history)?result.history.filter(v=>typeof v==="boolean").slice(-20):[]};
  }
  return state;
}
import {LIMIT,MIN_Y,MAX_Y,type Cell} from "../world/World";
