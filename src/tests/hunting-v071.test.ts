import {it,expect} from "vitest";
import {World} from "../world/World";
import {defaultExpansion,readExpansion} from "../inventory/Equipment";
import {ItemStore,produce,GRILL,RECIPES_LIVING,eatHarvest} from "../living/Items";
import {huntAnimal} from "../living/Hunting";
import {updateAnimals} from "../living/Systems";
import {targetAnimal} from "../living/AnimalTarget";
import * as T from "three";
const setup=()=>{
 const expansion=defaultExpansion(4),store=new ItemStore(expansion,{}),world=new World(),animal=expansion.living.animals[3];
 expansion.nightfall.mode="Survival";animal.pos=[0,1,7];animal.home=[0,1,7];expansion.living.animals=[animal];
 return {expansion,store,world,animal};
};
it("jagt ein Wildtier tatsächlich, vergibt Nahrung einmal und erhält den Zustand nach Reload",()=>{
 const {expansion,store,world,animal}=setup();
 expect(huntAnimal(store,world,animal,[0,1,9],"Schwert").status).toBe("hit");
 expect(huntAnimal(store,world,animal,[0,1,9],"Schwert").status).toBe("harvested");expect(store.count("Rohfleisch")).toBe(3);
 expect(huntAnimal(store,world,animal,[0,1,9],"Schwert").status).toBe("gone");expect(store.count("Rohfleisch")).toBe(3);
 const loaded=readExpansion(JSON.parse(JSON.stringify(expansion)));expect(loaded.living.animals[0]).toMatchObject({health:0,respawnAt:180});expect(loaded.living.bag.Rohfleisch).toBe(3);
 expect(targetAnimal(new T.Ray(new T.Vector3(0,1.6,9),new T.Vector3(0,0,-1)),loaded.living)?.animal.id).not.toBe(animal.id);
 loaded.living.clock=179;updateAnimals(loaded.living,world,[0,1,9],.2);expect(loaded.living.animals[0].health).toBe(0);
 loaded.living.clock=181;updateAnimals(loaded.living,world,[10,1,9],.2);expect(loaded.living.animals[0].health).toBeGreaterThan(0);
});
it("schützt Begleiter und verhindert Schaden durch Wände oder außerhalb der Reichweite",()=>{
 const {store,world,animal}=setup();animal.tame=true;animal.name="Fiete";
 expect(huntAnimal(store,world,animal,[0,1,9],"Schwert").status).toBe("protected");expect(animal.health).toBeUndefined();
 animal.tame=false;expect(huntAnimal(store,world,animal,[0,1,20],"Schwert").status).toBe("far");
 world.set(0,1,8,"Stein");world.set(0,2,8,"Stein");expect(huntAnimal(store,world,animal,[0,1,9],"Schwert").status).toBe("blocked");expect(store.count("Rohfleisch")).toBe(0);
});
it("braucht für Bogenjagd Pfeile und verbraucht sie nur bei einem gültigen Schuss",()=>{
 const {store,world,animal}=setup();expect(huntAnimal(store,world,animal,[0,1,9],"Bogen").status).toBe("ammo");
 store.add("supply:Pfeile",1);expect(huntAnimal(store,world,animal,[0,1,9],"Bogen").status).toBe("hit");expect(store.count("supply:Pfeile")).toBe(0);
});
it("verbindet Stein und Kohle zu einem Grill, gart Fleisch und Fisch und verbraucht Essen",()=>{
 const {store,expansion}=setup();store.add("block:Stein",4);store.add("supply:Kohle",3);store.add("Rohfleisch",2);
 expect(produce(store,RECIPES_LIVING.find(r=>r.id==="Grill")!)).toBe(true);expect(store.count("block:Grill")).toBe(1);
 expect(eatHarvest(store,"Rohfleisch")).toBe(false);
 const meat=GRILL.find(r=>r.id==="Grillfleisch")!;expect(produce(store,meat)).toBe(true);expect(store.count("Rohfleisch")).toBe(1);expect(store.count("Grillfleisch")).toBe(1);
 expansion.nightfall.hunger=35;expect(eatHarvest(store,"Grillfleisch")).toBe(true);expect(expansion.nightfall.hunger).toBeGreaterThan(35);expect(store.count("Grillfleisch")).toBe(0);expect(eatHarvest(store,"Grillfleisch")).toBe(false);
 store.add("fish:Rotauge",1);expect(produce(store,GRILL.find(r=>r.id==="Rotauge grillen")!)).toBe(true);expect(store.count("fish:Rotauge")).toBe(0);expect(store.count("supply:Fischgericht")).toBe(1);
 expect(produce(store,meat)).toBe(false);expect(store.count("Rohfleisch")).toBe(1);
});
