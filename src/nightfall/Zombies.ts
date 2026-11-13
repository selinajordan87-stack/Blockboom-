import { World, LIMIT, type Cell } from "../world/World";
import { collides, damageDoor, solid } from "./Defense";
import { isNight } from "./DayCycle";
import type { NightState } from "./State";
export const ZOMBIES = {
  normal: {name:"Wanderer",hp:55,speed:1.05,damage:10,color:0x719965,shirt:0x4c7780,scale:1},
  fast: {name:"Sprinter",hp:34,speed:1.95,damage:8,color:0x8bab68,shirt:0x967552,scale:.87},
  heavy: {name:"Koloss",hp:110,speed:.68,damage:20,color:0x667a68,shirt:0x626784,scale:1.18},
} as const;
export type ZombieKind=keyof typeof ZOMBIES;
export type ZombieState="idle"|"wander"|"discover"|"chase"|"attack"|"retreat"|"defeated";
export interface Zombie {id:number;kind:ZombieKind;pos:Cell;hp:number;state:ZombieState;heading:number;cooldown:number;age:number;hit:number;path:Cell[];repath:number}
export const WEAPONS:Record<string,{range:number;damage:number;cooldown:number}>={
  Holzknüppel:{range:3,damage:18,cooldown:.58},Holzschwert:{range:3.2,damage:24,cooldown:.45},
  Schwert:{range:3.4,damage:30,cooldown:.48},Steinschwert:{range:3.4,damage:36,cooldown:.62},
  Axt:{range:2.8,damage:26,cooldown:.75},Steinaxt:{range:2.9,damage:34,cooldown:.85},
  Spitzhacke:{range:2.8,damage:20,cooldown:.75},Bogen:{range:16,damage:28,cooldown:.85},
};
function ground(world:World,x:number,z:number,around=1):number|null {
  const ix=Math.floor(x),iz=Math.floor(z);
  for(let y=Math.min(13,Math.floor(around)+1);y>=-1;y--)
    if(solid(world.get(ix,y,iz))) {
      const top=y+1;
      if(collides(world,[x,top+.001,z])) return null;
      return top;
    }
  return null;
}
export function lineOfSight(world:World,from:Cell,to:Cell) {
  const steps=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1],to[2]-from[2])*5);
  for(let i=1;i<steps;i++) {
    const t=i/steps;
    if(solid(world.get(Math.floor(from[0]+(to[0]-from[0])*t),Math.floor(from[1]+(to[1]-from[1])*t),Math.floor(from[2]+(to[2]-from[2])*t)))) return false;
  }
  return true;
}
/** Bounded breadth-first routing, recomputed at most once per second per actor. */
export function findPath(world:World,start:Cell,target:Cell) {
  const queue:Cell[]=[[Math.floor(start[0])+.5,start[1],Math.floor(start[2])+.5]], parents=new Map<string,Cell|null>();
  const id=(p:Cell)=>`${Math.floor(p[0])},${Math.floor(p[2])}`;
  parents.set(id(queue[0]),null);
  let end:Cell|null=null;
  for(let cursor=0;cursor<queue.length && cursor<500;cursor++) {
    const p=queue[cursor];
    if(Math.hypot(p[0]-target[0],p[2]-target[2])<1.3){end=p;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x=p[0]+dx,z=p[2]+dz;
      if(Math.abs(x)>LIMIT-1||Math.abs(z)>LIMIT-1)continue;
      const y=ground(world,x,z,p[1]);
      if(y===null||Math.abs(y-p[1])>.55)continue;
      const next:Cell=[x,y,z];if(parents.has(id(next)))continue;
      parents.set(id(next),p);queue.push(next);
    }
  }
  const path:Cell[]=[];
  while(end && parents.get(id(end))) {path.unshift(end);end=parents.get(id(end))!;}
  return path;
}
export class ZombieEngine {
  actors:Zombie[]=[]; cap=8; attackCooldown=0; private nextId=1; private wasNight=false;
  constructor(public world:World,public state:NightState,private rng= Math.random){}
  spawn(kind:ZombieKind,pos:Cell,player:Cell) {
    if(this.actors.filter(z=>z.hp>0).length>=this.cap || Math.hypot(pos[0]-player[0],pos[2]-player[2])<6 || collides(this.world,pos,1.75*ZOMBIES[kind].scale,.32*ZOMBIES[kind].scale))return null;
    if(this.actors.some(z=>z.hp>0&&Math.hypot(z.pos[0]-pos[0],z.pos[2]-pos[2])<1.4))return null;
    // No spawn under a roof, in trees, water, or on unsupported air.
    if(!solid(this.world.get(Math.floor(pos[0]),Math.floor(pos[1]-.01),Math.floor(pos[2]))))return null;
    for(let y=Math.ceil(pos[1]+1.8);y<=14;y++)if(this.world.get(Math.floor(pos[0]),y,Math.floor(pos[2])))return null;
    const actor:Zombie={id:this.nextId++,kind,pos:[...pos],hp:ZOMBIES[kind].hp,state:"idle",heading:0,cooldown:1.5,age:0,hit:0,path:[],repath:0};
    this.actors.push(actor);return actor;
  }
  spawnWave(player:Cell) {
    const night=Math.max(1,this.state.night),count=Math.min(this.cap,night===1?2:night===2?3:night===3?4:night===4?5:6);
    for(let i=0;i<count;i++)for(let attempt=0;attempt<80;attempt++){
      const angle=this.rng()*Math.PI*2, radius=9+this.rng()*7;
      const x=Math.max(-LIMIT+2,Math.min(LIMIT-2,player[0]+Math.cos(angle)*radius));
      const z=Math.max(-LIMIT+2,Math.min(LIMIT-2,player[2]+Math.sin(angle)*radius));
      const y=ground(this.world,x,z,Math.max(4,player[1]+1));if(y===null||y<1)continue;
      const kind:ZombieKind=night>=4&&i%3===2?"heavy":night>=3&&i%3===1?"fast":"normal";
      if(this.spawn(kind,[x,y+.001,z],player))break;
    }
  }
  tick(dt:number,player:Cell,onDamage:(amount:number)=>void) {
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    const night=isNight(this.state.time);
    if(this.state.difficulty==="Friedlich"){this.actors=[];this.wasNight=night;return;}
    if(night&&this.state.waveNight!==this.state.night){this.spawnWave(player);this.state.waveNight=this.state.night;}
    if(this.wasNight&&!night){this.actors.forEach(z=>z.state="retreat");}
    this.wasNight=night;
    if(this.actors.length>this.cap)this.actors=this.actors.sort((a,b)=>Math.hypot(a.pos[0]-player[0],a.pos[2]-player[2])-Math.hypot(b.pos[0]-player[0],b.pos[2]-player[2])).slice(0,this.cap);
    for(const z of this.actors){
      z.age+=dt;z.cooldown=Math.max(0,z.cooldown-dt);z.hit=Math.max(0,z.hit-dt);z.repath-=dt;
      if(z.hp<=0){z.state="defeated";continue;}
      if(this.world.get(Math.floor(z.pos[0]),Math.floor(z.pos[1]),Math.floor(z.pos[2]))==="Falle"){
        this.damage(z,dt*12);if(z.hp<=0)continue;
      }
      const spec=ZOMBIES[z.kind],distance=Math.hypot(player[0]-z.pos[0],player[1]-z.pos[1],player[2]-z.pos[2]);
      const see=lineOfSight(this.world,[z.pos[0],z.pos[1]+1.3,z.pos[2]],[player[0],player[1]+1.1,player[2]]);
      if(z.state!=="retreat")z.state=distance<1.6&&see?"attack":distance<18?(z.state==="idle"?"discover":"chase"):"wander";
      if(z.state==="attack"){
        if(z.cooldown===0){onDamage(spec.damage*(this.state.difficulty==="Herausfordernd"?1.4:1));z.cooldown=1.6;}
        continue;
      }
      const target:Cell=z.state==="retreat"?[z.pos[0]+Math.sign(z.pos[0])*10,z.pos[1],z.pos[2]+10]:z.state==="wander"?[z.pos[0]+Math.sin(z.age*.3+z.id)*2,z.pos[1],z.pos[2]+Math.cos(z.age*.3+z.id)*2]:player;
      if(z.repath<=0){z.path=findPath(this.world,z.pos,target);z.repath=1+(z.id%3)*.15;}
      const next=see && Math.abs(player[1]-z.pos[1])<.6 ? target : z.path[0];
      if(next){
        const dx=next[0]-z.pos[0],dz=next[2]-z.pos[2],len=Math.hypot(dx,dz)||1;
        const speed=spec.speed*(this.state.difficulty==="Herausfordernd"?1.15:1)*(z.hit>0?.35:1);
        const step=Math.min(len,speed*dt);
        z.heading=Math.atan2(dx,dz);
        for(const [axis,amount] of [[0,dx/len*step],[2,dz/len*step]] as const){
          const pos=[...z.pos] as Cell;pos[axis]+=amount;
          const y=ground(this.world,pos[0],pos[2],pos[1]);
          if(y!==null&&Math.abs(y-pos[1])<.55){pos[1]=y+.001;if(!collides(this.world,pos,1.75*spec.scale,.32*spec.scale))z.pos=pos;}
          else if(z.kind!=="fast" && z.cooldown===0){
            const c:Cell=[Math.floor(pos[0]+Math.sign(dx)*.4),Math.floor(z.pos[1]),Math.floor(pos[2]+Math.sign(dz)*.4)];
            if(damageDoor(this.world,this.state,c,z.kind==="heavy"?30:12))z.path=[];
            z.cooldown=1.8;
          }
        }
        if(z.path[0]&&Math.hypot(z.pos[0]-z.path[0][0],z.pos[2]-z.path[0][2])<.25)z.path.shift();
      }
    }
    this.actors=this.actors.filter(z=>z.hp>0||z.hit>0).filter(z=>z.state!=="retreat"||z.age<50);
  }
  damage(z:Zombie,amount:number) {
    if(z.hp<=0)return false;z.hp=Math.max(0,z.hp-amount);z.hit=.32;
    if(!z.hp){z.state="defeated";this.state.defeated++;this.state.supplies.Schnur=(this.state.supplies.Schnur||0)+1;if(this.state.defeated%3===0)this.state.supplies.Kohle=(this.state.supplies.Kohle||0)+1;}
    return true;
  }
  attack(player:Cell,direction:Cell,tool:string) {
    const weapon=WEAPONS[tool];if(!weapon||this.attackCooldown>0)return null;
    if(tool==="Bogen"&&this.state.mode!=="Kreativ"&&(this.state.supplies.Pfeile||0)<1)return null;
    this.attackCooldown=weapon.cooldown;
    if(tool==="Bogen"&&this.state.mode!=="Kreativ")this.state.supplies.Pfeile--;
    const origin:Cell=[player[0],player[1]+1.2,player[2]];
    const target=this.actors.filter(z=>z.hp>0).map(z=>{
      const delta:Cell=[z.pos[0]-origin[0],z.pos[1]+.9-origin[1],z.pos[2]-origin[2]];
      const distance=Math.hypot(...delta);return {z,distance,dot:(delta[0]*direction[0]+delta[1]*direction[1]+delta[2]*direction[2])/(distance||1)};
    }).filter(v=>v.distance<=weapon.range&&v.dot>(tool==="Bogen"?.975:.65)&&lineOfSight(this.world,origin,[v.z.pos[0],v.z.pos[1]+1,v.z.pos[2]])).sort((a,b)=>a.distance-b.distance)[0];
    if(!target)return null;this.damage(target.z,weapon.damage);return target.z;
  }
}
