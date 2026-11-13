import * as T from "three";
import {World,LIMIT,MAX_Y,MIN_Y,protectedCell,intersectsPlayer,type Block,type Cell} from "../world/World";
import {solid} from "../nightfall/Defense";
import type {Expansion} from "../inventory/Equipment";

export const TOWER_COST={Bretter:24,Stein:12,Fackel:4,Leiter:4} as const;
export interface PlanCell {cell:Cell;block:Block;}
/** The bill of materials is derived from the same plan that is actually built. */
export function towerPlan(origin:Cell):PlanCell[]{
 const blocks:PlanCell[]=[],add=(x:number,y:number,z:number,block:Block)=>blocks.push({cell:[origin[0]+x,origin[1]+y,origin[2]+z],block});
 for(let x=0;x<3;x++)for(let z=0;z<4;z++)add(x,0,z,"Stein");
 for(const [x,z]of [[0,0],[2,0],[2,3]])for(let y=1;y<=3;y++)add(x,y,z,"Bretter");
 // A real backing wall lets forward movement keep the player on the ladder.
 for(let y=1;y<=3;y++)add(1,y,0,"Bretter");
 for(let x=0;x<3;x++)for(let z=0;z<4;z++)if(x!==1||z!==1)add(x,4,z,"Bretter");
 add(1,5,3,"Bretter");
 for(let y=1;y<=4;y++)add(1,y,1,"Leiter");
 for(const [x,z]of [[0,0],[2,0],[0,3],[2,3]])add(x,5,z,"Fackel");
 return blocks;
}
export function towerValidity(world:World,origin:Cell|null,player:Cell){
 if(!origin)return "Visiere eine freie ebene Fläche in deiner Nähe an.";
 if(origin.some(n=>!Number.isInteger(n))||origin[1]<=MIN_Y||origin[1]+5>MAX_Y||Math.hypot(origin[0]-player[0],origin[1]-player[1],origin[2]-player[2])>6)return "Der Turmplatz ist zu weit weg oder außerhalb der Welt.";
 for(const {cell}of towerPlan(origin))if(Math.abs(cell[0])>=LIMIT||Math.abs(cell[2])>=LIMIT||protectedCell(cell)||world.get(...cell)||intersectsPlayer(cell,player))return "Der Turm braucht freie Fläche und Platz über dir. Geh einen Schritt zur Seite.";
 for(let x=0;x<3;x++)for(let z=0;z<4;z++)if(!solid(world.get(origin[0]+x,origin[1]-1,origin[2]+z)))return "Alle zwölf Fundamentfelder brauchen festen, gleich hohen Boden.";
 return "";
}
export function buildTower(world:World,expansion:Expansion,origin:Cell,player:Cell){
 if(!expansion.living.blueprint)return {ok:false,message:"Finde zuerst den Bauplan in der Schmiede."};
 const invalid=towerValidity(world,origin,player);if(invalid)return {ok:false,message:invalid};
 const creative=expansion.nightfall.mode==="Kreativ";
 if(!creative&&Object.entries(TOWER_COST).some(([b,n])=>(expansion.materials[b as Block]||0)<n))return {ok:false,message:"Es fehlen noch Materialien. Die Liste im Bauplan zeigt deinen Bestand."};
 if(!creative)for(const [b,n]of Object.entries(TOWER_COST))expansion.materials[b as Block]=(expansion.materials[b as Block]||0)-n;
 for(const {cell,block}of towerPlan(origin))world.set(...cell,block);
 expansion.discovery.tower={origin:[...origin],rewarded:expansion.discovery.tower?.rewarded===true};
 return {ok:true,message:"Turm gebaut. Klettere mit der Leiter zur Aussichtsplattform."};
}
export function towerIntact(world:World,origin:Cell){return towerPlan(origin).every(({cell,block})=>world.get(...cell)===block);}
export function observeFromTower(world:World,expansion:Expansion,player:Cell){
 const t=expansion.discovery.tower;if(!t||t.rewarded||player[1]<t.origin[1]+4.8||player[1]>t.origin[1]+8||player[0]<t.origin[0]-.4||player[0]>t.origin[0]+3.4||player[2]<t.origin[2]-.4||player[2]>t.origin[2]+4.4||!towerIntact(world,t.origin))return false;
 t.rewarded=true;const tiles=new Set(expansion.living.explored);for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)tiles.add(`${Math.floor(player[0]/16)+x},${Math.floor(player[2]/16)+z}`);expansion.living.explored=[...tiles].slice(-2500);
 if(!expansion.badges.includes("Weitblick"))expansion.badges.push("Weitblick");return true;
}
export class BlueprintPreview {
 readonly mesh:T.InstancedMesh;private part=new T.Object3D();
 constructor(scene:T.Scene){this.mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0x98e7ba,transparent:true,opacity:.22,depthWrite:false}),44);this.mesh.frustumCulled=false;this.mesh.visible=false;scene.add(this.mesh);}
 update(origin:Cell|null,valid:boolean){this.mesh.visible=!!origin;if(!origin)return;this.mesh.material=(this.mesh.material as T.MeshBasicMaterial);(this.mesh.material as T.MeshBasicMaterial).color.set(valid?0x98e7ba:0xe98d6d);let i=0;for(const{cell}of towerPlan(origin)){this.part.position.set(cell[0]+.5,cell[1]+.5,cell[2]+.5);this.part.updateMatrix();this.mesh.setMatrixAt(i++,this.part.matrix);}this.mesh.count=i;this.mesh.instanceMatrix.needsUpdate=true;}
}
