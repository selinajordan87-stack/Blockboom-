import { World, key, MIN_Y, MAX_Y, type Cell } from "../world/World";
import { CROPS, type LivingState } from "./State";
import { GROWTH } from "./Systems";

/** An old kitchen garden illustrates the real farming loop. Call once when
 * discovery is initialized, after saved world edits have been restored. */
export function initializeDiscoveryGarden(world:World,state:LivingState){
 let added=0;
 for(let i=0;i<CROPS.length;i++){
  if(state.crops.length>=160)break;
  const cell:Cell=[8+i%2,0,18+Math.floor(i/2)],kind=CROPS[i];
  // A player's field, roof, cellar or construction always wins over decoration.
  let edited=false;
  for(let y=MIN_Y;y<=MAX_Y;y++)if(Object.hasOwn(world.changes,key(cell[0],y,cell[2]))){edited=true;break;}
  if(edited)continue;
  if(!["Gras","Erde"].includes(world.get(...cell)||"")||world.get(cell[0],1,cell[2])||state.crops.some(c=>c.cell.join(",")===cell.join(",")))continue;
  world.set(...cell,"Acker");
  state.crops.push({cell,kind,planted:state.clock,growthOffset:GROWTH[kind]*i/3});added++;
 }
 return added;
}
