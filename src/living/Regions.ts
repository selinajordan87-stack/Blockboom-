import { World, LIMIT, MIN_Y, MAX_Y, type Block, type Cell } from "../world/World";
export const REGIONS = [
  {id:"meadow",name:"Wiesenland",x:0,z:10,color:"#8ab86f"},
  {id:"forest",name:"Dichter Wald",x:-42,z:12,color:"#52886b"},
  {id:"mountain",name:"Silbergebirge",x:45,z:-40,color:"#a0afb6"},
  {id:"lake",name:"Großer See",x:-40,z:-35,color:"#76bac9"},
  {id:"cave",name:"Kupferhöhlen",x:29,z:-30,color:"#c88e67"},
  {id:"village",name:"Verlassene Siedlung",x:39,z:29,color:"#d2b77e"},
] as const;
export function regionAt(x:number,y:number,z:number){
  if(x>=26&&z<-20&&y<3)return REGIONS[4];
  return REGIONS.reduce((a,b)=>Math.hypot(x-a.x,z-a.z)<Math.hypot(x-b.x,z-b.z)?a:b);
}
export const LANDMARKS = {
  cave:[28,1,-30], forge:[39,1,29], cellar:[43,-4,37], treasure:[49,-5,-33], home:[4,1,19],
} satisfies Record<string,Cell>;
export function terrainHeight(x:number,z:number){
  const mountain=Math.max(0,1-Math.hypot(x-46,z+40)/20)*11;
  const edge=Math.min(1,Math.max(0,(Math.max(Math.abs(x),Math.abs(z))-24)/8));
  return Math.max(0,Math.floor((mountain+Math.sin(x*.18)*Math.cos(z*.15)*1.8)*edge));
}
function tree(w:World,x:number,z:number,h:number,tall=false){
  for(let y=1;y<=h;y++)w.set(x,y+terrainHeight(x,z),z,tall?"Dunkelholz":"Holz",false);
  for(let dy=h-1;dy<=h+2;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)
    if(Math.abs(dx)+Math.abs(dz)<=(dy===h+2?1:3)&&Math.max(Math.abs(x+dx),Math.abs(z+dz))>=24)
      w.set(x+dx,terrainHeight(x,z)+dy,z+dz,"Laub",false);
}
function structure(w:World,cx:number,cz:number,kind:"house"|"forge"|"tower"){
  for(let x=cx;x<=cx+5;x++)for(let z=cz;z<=cz+5;z++){
    w.set(x,0,z,"Kopfstein",false);
    for(let y=1;y<=(kind==="tower"?6:3);y++)w.set(x,y,z,(x===cx||x===cx+5||z===cz||z===cz+5)?(y===2&&z===cz+3?"Glas":kind==="forge"?"Ziegel":"Bretter"):null,false);
    w.set(x,kind==="tower"?7:4,z,"Bretter",false);
  }
  w.set(cx+2,1,cz,"Tür",false);w.set(cx+2,2,cz,"Tür",false);
  w.set(cx+1,1,cz+3,kind==="forge"?"Ofen":"Truhe",false);w.set(cx+4,2,cz+4,"Laterne",false);
  if(kind==="forge")w.set(cx+3,1,cz+3,"Werkbank",false);
  if(kind==="tower")for(let y=1;y<=6;y++)w.set(cx+1,y,cz+1,"Leiter",false);
}
/** Deterministic external chunks; origin [-24,24) is never generated over. */
export class RegionStream {
  private center="";
  constructor(private world:World){}
  ensure(x:number,z:number){
    const cx=Math.floor(x/12),cz=Math.floor(z/12),center=`${cx},${cz}`;if(center===this.center)return;
    this.center=center;const wanted=new Set<string>();
    for(let a=cx-2;a<=cx+2;a++)for(let b=cz-2;b<=cz+2;b++)
      if(a>=-5&&a<5&&b>=-5&&b<5&&(a-cx)**2+(b-cz)**2<=5)wanted.add(`${a},${b}`);
    for(const id of [...this.world.activeChunks]){
      const [a,b]=id.split(",").map(Number);if(a>=-2&&a<2&&b>=-2&&b<2)continue;
      if(!wanted.has(id)){
        for(let xx=a*12;xx<a*12+12;xx++)for(let zz=b*12;zz<b*12+12;zz++)for(let y=MIN_Y;y<=MAX_Y;y++)this.world.blocks.delete(`${xx},${y},${zz}`);
        this.world.activeChunks.delete(id);this.world.revision++;
      }
    }
    const generated:string[]=[];
    for(const id of wanted)if(!this.world.activeChunks.has(id)){
      const [a,b]=id.split(",").map(Number);this.generate(a,b);this.world.activeChunks.add(id);generated.push(id);
    }
    if(generated.length)for(const [key,block]of Object.entries(this.world.changes)){
      const [xx,y,zz]=key.split(",").map(Number);if(generated.includes(`${Math.floor(xx/12)},${Math.floor(zz/12)}`))this.world.set(xx,y,zz,block,false);
    }
  }
  private generate(cx:number,cz:number){
    const w=this.world;
    for(let x=cx*12;x<cx*12+12;x++)for(let z=cz*12;z<cz*12+12;z++){
      const lake=(x+40)**2/144+(z+35)**2/81<1 || (Math.abs(x+30)<2&&z>-35&&z<-15);
      const settlement=x>=30&&x<=53&&z>=24&&z<=46;
      const top=lake?-2:settlement?0:terrainHeight(x,z);
      for(let y=MIN_Y;y<=top;y++){
        let block:Block=y===MIN_Y?"Stein":y===top?(lake?"Sand":"Gras"):y>=top-2?"Erde":"Stein";
        const hash=Math.abs(x*73856093^y*19349663^z*83492791);
        if(y<top-3&&y>MIN_Y&&hash%47===0)block="Kohleerz";
        if(y<-2&&hash%61===0)block="Kupfererz";
        if(y<-5&&hash%71===0)block="Eisenerz";
        if(y<-9&&hash%83===0)block="Golderz";
        w.set(x,y,z,block,false);
      }
      // A three-block-high sloping entrance leads into a branching chamber.
      if(x>=27&&x<=49&&Math.abs(z+30)<=1){
        const floor=1-Math.min(6,Math.floor((x-27)/2));
        w.set(x,floor-1,z,"Stein",false);for(let y=floor;y<=floor+3;y++)w.set(x,y,z,null,false);
      }
      if((x-47)**2+(z+30)**2<30){w.set(x,-6,z,"Stein",false);for(let y=-5;y<=-2;y++)w.set(x,y,z,null,false);}
      if(x>=42&&x<=48&&z>=-42&&z<=-30){w.set(x,-11,z,"Stein",false);if(Math.abs(x-44)<=1)for(let y=-10;y<=-7;y++)w.set(x,y,z,null,false);}
      // Stair branch descends from the chamber to deeper ore.
      if(x>=43&&x<=45&&z>=-40&&z<=-31){const floor=-5-Math.min(5,Math.floor((-z-31)/2));w.set(x,floor-1,z,"Stein",false);for(let y=floor;y<floor+3;y++)w.set(x,y,z,null,false);}
      if(x>=30&&x<=53&&z>=24&&z<=46){for(let y=1;y<12;y++)w.set(x,y,z,null,false);}
      if(x>=40&&x<=45&&z>=33&&z<=39){w.set(x,-5,z,"Kopfstein",false);for(let y=-4;y<=-2;y++)w.set(x,y,z,null,false);}
      if(x===42&&z>=30&&z<=36){const floor=1-Math.min(5,z-30);w.set(x,floor-1,z,"Stein",false);for(let y=floor;y<=floor+2;y++)w.set(x,y,z,null,false);}
    }
    // Decoration is constrained to the generated chunk, preventing cross-chunk order dependence.
    for(let x=cx*12+2;x<cx*12+10;x+=5)for(let z=cz*12+2;z<cz*12+10;z+=5)
      if((x<-27&&z>0)||((x+z)%4===0&&z>8&&x<20))tree(w,x,z,4+Math.abs(x+z)%3,(x+z)%2===0);
    for(const [x,z,kind] of [[32,25,"house"],[40,25,"forge"],[32,36,"house"],[45,38,"tower"]] as const)
      if(x>=cx*12-5&&x<cx*12+12&&z>=cz*12-5&&z<cz*12+12){
        // Build into a temporary map, then copy only this chunk.
        const temp={set:(xx:number,y:number,zz:number,b:Block|null)=>{if(Math.floor(xx/12)===cx&&Math.floor(zz/12)===cz)w.set(xx,y,zz,b,false);}} as World;
        structure(temp,x,z,kind);
      }
    const deposits:[number,number,number,Block][]=[[39,-3,-28,"Kohleerz"],[40,-3,-28,"Kupfererz"],[43,-4,-27,"Eisenerz"],[44,-9,-38,"Golderz"],[49,-5,-33,"Schatztruhe"],[41,1,28,"Schatztruhe"]];
    for(const [x,y,z,b]of deposits)if(Math.floor(x/12)===cx&&Math.floor(z/12)===cz)w.set(x,y,z,b,false);
  }
}
