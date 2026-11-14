import {it,expect} from "vitest";
import {defaultExpansion} from "../inventory/Equipment";
import {ItemStore,produce,RECIPES_LIVING} from "../living/Items";
it("bietet Grundmaterialien und Hausbestandteile im selben Werkbankablauf an",()=>{
 for(const id of ["Bretter","Tür","Fackel","Leiter","Kohle","Hacke","Werkbank","Bett","Truhe","Ofen"])expect(RECIPES_LIVING.some(r=>r.id===id)).toBe(true);
});
it("verarbeitet regionale Dunkelholzvorräte zu tatsächlich verwendbaren Brettern",()=>{
 const e=defaultExpansion(4);e.nightfall.mode="Survival";e.materials.Dunkelholz=2;const store=new ItemStore(e,{}),recipe=RECIPES_LIVING.find(r=>r.id==="Bretter aus Dunkelholz")!;expect(recipe).toBeDefined();expect(produce(store,recipe)).toBe(true);expect(e.materials.Dunkelholz).toBe(0);expect(e.materials.Bretter).toBe(4);
});
it("ermöglicht den zusammenhängenden Haus- und Gartenweg mit wirklichem Verbrauch",()=>{
 const e=defaultExpansion(4);e.nightfall.mode="Survival";e.materials={Holz:15,Stein:8};e.nightfall.supplies.Kohle=1;const store=new ItemStore(e,{});
 for(const id of ["Bretter","Bretter","Bretter","Tür","Werkbank","Bett","Truhe","Ofen","Fackel","Leiter","Hacke"]){const r=RECIPES_LIVING.find(r=>r.id===id)!;expect(r).toBeDefined();expect(produce(store,r)).toBe(true);}
 expect(e.materials.Holz).toBe(1);expect(e.materials.Stein).toBe(1);expect(e.materials.Bretter).toBe(0);expect(e.materials.Tür).toBe(2);expect(e.materials.Fackel).toBe(4);expect(e.materials.Leiter).toBe(4);for(const id of ["Bett","Werkbank","Truhe","Ofen"] as const)expect(e.materials[id]).toBe(1);expect(e.nightfall.crafted).toContain("Hacke");
});
