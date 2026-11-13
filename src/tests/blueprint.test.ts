import {it,expect} from "vitest";
import {World,type Cell} from "../world/World";
import {defaultExpansion,readExpansion} from "../inventory/Equipment";
import {TOWER_COST,towerPlan,towerValidity,buildTower,observeFromTower} from "../discovery/Blueprint";
import {Player} from "../player/Player";
const origin:Cell=[-12,1,10],player:Cell=[-14,1.01,10];
it("zeigt genau die Materialien, die der wirkliche Turm verbaut, ohne doppelte Zellen",()=>{
 const plan=towerPlan(origin),counts:Record<string,number>={};for(const p of plan)counts[p.block]=(counts[p.block]||0)+1;
 expect(counts).toEqual(TOWER_COST);expect(new Set(plan.map(p=>p.cell.join(","))).size).toBe(plan.length);
});
it("baut nur nach einem echten Bauplanfund und verbraucht alle verlangten Vorräte",()=>{
 const w=new World(),e=defaultExpansion(4);e.nightfall.mode="Survival";e.materials={...TOWER_COST};
 expect(buildTower(w,e,origin,player).ok).toBe(false);e.living.blueprint=true;expect(buildTower(w,e,origin,player).ok).toBe(true);
 for(const[b,n]of Object.entries(TOWER_COST)){expect(n).toBeGreaterThan(0);expect(e.materials[b as keyof typeof TOWER_COST]).toBe(0);}
 for(const p of towerPlan(origin))expect(w.get(...p.cell)).toBe(p.block);expect(readExpansion(e).discovery.tower?.origin).toEqual(origin);
});
it("bewahrt bei fehlenden Materialien, belegtem Boden und Spielerüberschneidung den vorherigen Stand",()=>{
 const w=new World(),e=defaultExpansion(4);e.nightfall.mode="Survival";e.living.blueprint=true;e.materials={...TOWER_COST,Bretter:23};
 expect(buildTower(w,e,origin,player).ok).toBe(false);expect(w.changes).toEqual({});expect(e.materials.Bretter).toBe(23);
 expect(towerValidity(w,origin,[-11,1,11])).not.toBe("");w.set(-11,2,11,"Glas");e.materials.Bretter=24;expect(buildTower(w,e,origin,player).ok).toBe(false);expect(w.get(-11,2,11)).toBe("Glas");
});
it("belohnt erst den tatsächlichen Aufstieg auf einen vollständigen Turm und nur einmal",()=>{
 const w=new World(),e=defaultExpansion(4);e.living.blueprint=true;e.nightfall.mode="Kreativ";expect(buildTower(w,e,origin,player).ok).toBe(true);
 expect(observeFromTower(w,e,player)).toBe(false);w.set(-12,6,10,null);expect(observeFromTower(w,e,[-11,6.01,12])).toBe(false);w.set(-12,6,10,"Fackel");
 expect(observeFromTower(w,e,[-11,6.01,12])).toBe(true);expect(e.living.explored.length).toBe(49);expect(e.badges).toContain("Weitblick");expect(observeFromTower(w,e,[-11,6.01,12])).toBe(false);
});
it("ermöglicht den Aufstieg mit normalen Vorwärts- und Sprungeingaben statt Kamera-Teleport",()=>{
 const w=new World(),e=defaultExpansion(4);e.living.blueprint=true;e.nightfall.mode="Kreativ";buildTower(w,e,origin,player);
 const p=new Player(w);p.pos=[-10.5,1.001,15];p.yaw=0;let highest=1;
 for(let i=0;i<1500&&!e.discovery.tower?.rewarded;i++){p.step(1/120,0,1,i%70===0);highest=Math.max(highest,p.pos[1]);observeFromTower(w,e,p.pos);}
 expect(highest).toBeGreaterThan(5.8);expect(e.discovery.tower?.rewarded).toBe(true);
});
