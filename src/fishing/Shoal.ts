import {FISH,type FishName} from './Fishing';
export interface FishActor {id:number;species:FishName;length:number;x:number;y:number;z:number;heading:number;alive:boolean;respawn:number;phase:number;}
export class Shoal {
 actors:FishActor[]=FISH.flatMap((f,i)=>Array.from({length:3},(_,j)=>({id:i*3+j,species:f.name,length:[24,32,75,52,38][i]+j*3,x:-10+Math.cos(i*1.2+j*.3)*(2+j),y:.14,z:-5+Math.sin(i*1.2+j*.3)*(2+j),heading:0,alive:true,respawn:0,phase:i+j*.7})));
 target:number|null=null; bobber={x:-11,z:-3}; time=0;
 update(dt:number){this.time+=dt;for(const f of this.actors){if(!f.alive){if(this.time>=f.respawn)f.alive=true;else continue;}let tx:number,tz:number;
 if(this.target===f.id){tx=this.bobber.x;tz=this.bobber.z;}else{const speed=f.species==='Hecht'?.22:f.species==='Forelle'?.48:.33;const a=this.time*speed+f.phase;const r=2+(f.id%3)*1.1;tx=-10+Math.cos(a)*r;tz=-5+Math.sin(a)*r*.85;}
 const dx=tx-f.x,dz=tz-f.z,dist=Math.hypot(dx,dz),step=Math.min(dist,dt*(this.target===f.id?2.4:1.3));if(dist>.03){f.x+=dx/dist*step;f.z+=dz/dist*step;f.heading=Math.atan2(dx,dz);}f.y=.14+Math.sin(this.time*2+f.phase)*.025;
 // Clamp to the common shallow-water ellipse, also valid in legacy worlds.
 const edge=Math.hypot((f.x+10)/5.3,(f.z+5)/4.9);if(edge>1){f.x=-10+(f.x+10)/edge;f.z=-5+(f.z+5)/edge;}
 }}
 catch(id:number){const f=this.actors.find(f=>f.id===id&&f.alive);if(!f)return null;f.alive=false;f.respawn=this.time+20;if(this.target===id)this.target=null;return {...f};}
}
export class LivingFishing {
 state:'idle'|'waiting'|'bite'='idle';deadline=0;target:number|null=null;
 constructor(public shoal:Shoal){}
 cast(now:number,preferred?:FishName){if(this.state!=='idle')return false;const available=this.shoal.actors.filter(f=>f.alive&&(!preferred||f.species===preferred));const f=available.sort((a,b)=>Math.hypot(a.x+11,a.z+3)-Math.hypot(b.x+11,b.z+3))[0];if(!f)return false;this.target=f.id;this.shoal.target=f.id;this.state='waiting';this.deadline=now+2500;return true;}
 tick(now:number){const f=this.shoal.actors.find(f=>f.id===this.target&&f.alive);if(this.state!=='idle'&&!f){this.cancel();return 'miss';}if(this.state==='waiting'&&now>=this.deadline&&f&&Math.hypot(f.x+11,f.z+3)<.7){this.state='bite';this.deadline=now+3500;}else if(this.state==='bite'&&now>this.deadline){this.cancel();return 'miss';}}
 reel(now:number){if(this.state!=='bite'||now>this.deadline||this.target===null)return null;const f=this.shoal.catch(this.target);this.cancel();return f;}
 cancel(){this.state='idle';this.target=null;this.shoal.target=null;}
}
