import {it,expect} from "vitest";
import {Shoal} from "../fishing/Shoal";
import {terrainProfile} from "../world/DiscoveryTerrain";
it("hält die neuen Ufergruppen über dem tatsächlichen Seegrund",()=>{
 const shoal=new Shoal();
 for(let tick=0;tick<900;tick++){
  shoal.update(1/30);
  for(const f of shoal.actors.filter(a=>a.spot==="great")){
   const floor=terrainProfile(Math.floor(f.x),Math.floor(f.z)).top+1;
   expect(f.y,`${f.species} at ${f.x.toFixed(1)},${f.z.toFixed(1)} over ${floor}`).toBeGreaterThan(floor);
  }
 }
});
