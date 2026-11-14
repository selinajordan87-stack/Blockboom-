import {type World,type Cell} from "../world/World";
import {lineOfSight,WEAPONS} from "../nightfall/Zombies";
import {ANIMAL_HEALTH,type Animal} from "./State";
import {ItemStore} from "./Items";
import {animalScale} from "./AnimalTarget";

const MEAT={Wolf:1,Katze:1,Huhn:1,Kuh:3,Schaf:2,Schwein:3};
export const animalHealth=(a:Animal)=>a.health??ANIMAL_HEALTH[a.kind];
/** Caller shares the existing weapon cooldown with zombie combat. No gore or bodies. */
export function huntAnimal(store:ItemStore,world:World,a:Animal,player:Cell,tool:string){
 if(a.tame)return {status:"protected" as const,message:"Dein Haustier ist geschützt. Mit Benutzen kannst du es versorgen."};
 if(a.health===0)return {status:"gone" as const,message:"Hier ist kein Wildtier mehr."};
 const weapon=WEAPONS[tool];
 if(!weapon)return {status:"tool" as const,message:"Wähle ein Schwert, eine Axt oder den Holzknüppel."};
 const eye:Cell=[player[0],player[1]+1.2,player[2]],body:Cell=[a.pos[0],a.pos[1]+.6*animalScale(a),a.pos[2]];
 if(Math.hypot(...body.map((n,i)=>n-eye[i]))>weapon.range+.2)return {status:"far" as const,message:"Geh etwas näher an das Tier heran."};
 if(!lineOfSight(world,eye,body))return {status:"blocked" as const,message:"Eine Wand steht zwischen dir und dem Tier."};
 if(tool==="Bogen"&&store.expansion.nightfall.mode!=="Kreativ"&&!store.add("supply:Pfeile",-1))return {status:"ammo" as const,message:"Für den Bogen fehlen Pfeile."};
 a.health=Math.max(0,animalHealth(a)-weapon.damage);
 a.action="Treffer";
 if(a.health>0)return {status:"hit" as const,message:`${a.kind} getroffen · ${a.health} LP`};
 a.respawnAt=store.expansion.living.clock+180;
 const count=MEAT[a.kind];store.add("Rohfleisch",count);
 return {status:"harvested" as const,message:`${a.kind}: +${count} Rohfleisch. Auf einem Grill oder im Ofen garen.`};
}
