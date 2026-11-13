import { World, intersectsPlayer, type Block, type Cell, key } from "../world/World";
import type { NightState } from "./State";
export const SPECIAL = ["Tür","Tür offen","Tor","Tor offen","Zaun","Leiter","Treppe","Fackel","Falle","Lagerkiste","Barriere","Bett","Tisch","Stuhl","Regal","Truhe","Werkbank","Ofen","Laterne","Teppich","Schatztruhe"] as const;
export function special(block: Block | undefined) { return !!block && (SPECIAL as readonly string[]).includes(block); }
export function solid(block: Block | undefined) { return !!block && !["Tür offen","Tor offen","Leiter","Fackel","Falle","Teppich","Laterne"].includes(block); }
/** Shape-aware AABB, shared by the player and zombies. Door cells are conservative closed obstacles. */
export function collides(world: World, pos: Cell, height=1.75, radius=.28) {
  for(let x=Math.floor(pos[0]-radius);x<=Math.floor(pos[0]+radius);x++)
    for(let y=Math.floor(pos[1]+.000001);y<=Math.floor(pos[1]+height-.01);y++)
      for(let z=Math.floor(pos[2]-radius);z<=Math.floor(pos[2]+radius);z++) {
        const b=world.get(x,y,z);
        if(!solid(b)) continue;
        if(b==="Treppe") {
          const top=pos[2]+radius>z+.5 ? 1:.5;
          if(pos[1]>=y+top-.001) continue;
        }
        return true;
      }
  return false;
}
export function toggleDoor(world:World, cell:Cell, player:Cell) {
  const b=world.get(...cell);
  if(!["Tür","Tür offen","Tor","Tor offen"].includes(b || "")) return false;
  const open=b!.endsWith("offen"), replacement=(open?b!.split(" ")[0]:b+" offen") as Block;
  const cells:Cell[]=[cell];
  for(const dy of [-1,1]) if(world.get(cell[0],cell[1]+dy,cell[2])===b) cells.push([cell[0],cell[1]+dy,cell[2]]);
  if(open && cells.some(c=>intersectsPlayer(c,player))) return false;
  cells.forEach(c=>world.set(...c,replacement)); return true;
}
export function damageDoor(world:World,state:NightState,cell:Cell,amount:number) {
  if(!["Tür","Tor"].includes(world.get(...cell) || "")) return false;
  const id=key(...cell); state.damage[id]=Math.min(100,(state.damage[id] || 0)+amount);
  if(state.buildingDamage && state.damage[id]>=100) {
    const block=world.get(...cell);
    for(const dy of [-1,1])if(world.get(cell[0],cell[1]+dy,cell[2])===block)world.set(cell[0],cell[1]+dy,cell[2],null);
    world.set(...cell,null); return true;
  }
  return false;
}
export function repair(state:NightState,cell:Cell) { const id=key(...cell); if(!state.damage[id])return false;delete state.damage[id];return true; }
export function restoreNightDamage(state:NightState) { if(!state.buildingDamage) state.damage={}; }
/** Only a new world receives this refuge; no old construction is touched. */
export function buildRefuge(world:World) {
  for(let x=2;x<=7;x++)for(let z=17;z<=22;z++) {
    world.set(x,0,z,"Bretter",false);
    for(let y=1;y<=3;y++) if(x===2||x===7||z===17||z===22)
      world.set(x,y,z,(y===2 && (x===2||x===7) && z===20)?"Glas":"Bretter",false);
    world.set(x,4,z,"Bretter",false);
  }
  world.set(4,1,17,"Tür",false);world.set(4,2,17,"Tür",false);
  world.set(6,1,21,"Lagerkiste",false);world.set(3,2,21,"Fackel",false);
}
