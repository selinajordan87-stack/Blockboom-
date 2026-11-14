import {it,expect} from "vitest";
import {LIMIT,MAX_Y} from "../world/World";
import {freshDiscovery,readDiscovery} from "../discovery/State";
import {freshLiving,readLiving} from "../living/State";
it("erhält einen zulässigen Aussichtsturm am Rand und auf höchster zulässiger Bauhöhe",()=>{
 for(const origin of [[LIMIT-3,MAX_Y-5,LIMIT-4],[-LIMIT+1,1,-LIMIT+1]] as [number,number,number][]){const s=freshDiscovery();s.tower={origin,rewarded:true};expect(readDiscovery(JSON.parse(JSON.stringify(s))).tower).toEqual(s.tower);}
 const s=freshDiscovery();s.tower={origin:[LIMIT-2,1,0],rewarded:true};expect(readDiscovery(s).tower).toBeUndefined();
});
it("verliert einen benannten Begleiter nicht durch die kleine Boden-Toleranz am Berggipfel",()=>{
 const s=freshLiving(),pet=s.animals[0];pet.name="Fiete";pet.tame=true;pet.pos=[145,MAX_Y+1.001,-105];pet.home=[...pet.pos];const loaded=readLiving(JSON.parse(JSON.stringify(s)));expect(loaded.animals.find(a=>a.id===pet.id)).toMatchObject({name:"Fiete",tame:true,pos:pet.pos,home:pet.home});
});
