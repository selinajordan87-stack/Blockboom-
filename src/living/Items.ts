import { TYPES, type Block } from "../world/World";
import { TOOLS, type Expansion } from "../inventory/Equipment";
import { FISH } from "../fishing/Fishing";
export type Category="Material"|"Nahrung"|"Werkzeug"|"Waffe"|"Ausrüstung"|"Besonderes";
export interface Item {id:string;name:string;symbol:string;category:Category;}
export const EXTRAS:Item[]=[
 ...["Kupfer","Eisen","Gold"].map(name=>({id:name,name,symbol:"◆",category:"Material" as const})),
 ...["Weizen","Karotte","Kartoffel","Kürbis","Brot","Ofenkartoffel","Gemüsesuppe"].map(name=>({id:name,name,symbol:"◉",category:"Nahrung" as const})),
 ...["Weizen","Karotte","Kartoffel","Kürbis"].map(n=>({id:`Samen:${n}`,name:`${n}-Samen`,symbol:"❧",category:"Material" as const})),
 ...["Bauplan","Bergkristall","Altes Buch"].map(name=>({id:name,name,symbol:"✦",category:"Besonderes" as const})),
];
export const CATALOG:Item[]=[...TYPES.map(name=>({id:`block:${name}`,name,symbol:"▣",category:"Material" as const})),...TOOLS.map(name=>({id:`tool:${name}`,name,symbol:"⚒",category:/schwert|Schwert|Bogen|knüppel/.test(name)?"Waffe" as const:"Werkzeug" as const})),...FISH.map(f=>({id:`fish:${f.name}`,name:f.name,symbol:"≈",category:"Nahrung" as const})),...["Beeren","Fischgericht","Kohle","Schnur","Rüstung","Pfeile"].map(name=>({id:`supply:${name}`,name,symbol:"◈",category:"Ausrüstung" as const})),...EXTRAS];
export class ItemStore {
 constructor(public expansion:Expansion,public fish:Record<string,number>){}
 count(id:string){const [kind,...parts]=id.split(":"),name=parts.join(":");
   if(kind==="block")return this.expansion.materials[name as Block]||0;
   if(kind==="fish")return this.fish[name]||0;
   if(kind==="supply")return this.expansion.nightfall.supplies[name]||0;
   if(kind==="tool")return this.expansion.nightfall.crafted.includes(name)||TOOLS.slice(0,7).includes(name as never)?1:0;
   return this.expansion.living.bag[id]||0;
 }
 add(id:string,n:number){if(!CATALOG.some(i=>i.id===id)||!Number.isInteger(n))return false;const value=this.count(id)+n;if(value<0)return false;
   const [kind,...parts]=id.split(":"),name=parts.join(":");
   if(kind==="tool")return false;
   if(kind==="block")this.expansion.materials[name as Block]=value;
   else if(kind==="fish")this.fish[name]=value;
   else if(kind==="supply")this.expansion.nightfall.supplies[name]=value;
   else this.expansion.living.bag[id]=value;return true;
 }
 chest(id:string){
   const chests=this.expansion.living.chests;if(chests[id])return chests[id];
   for(const [key,items]of Object.entries(chests))if(!Object.values(items).some(n=>n>0))delete chests[key];
   if(Object.keys(chests).length>=100)return null;
   return chests[id]={};
 }
 move(id:string,chest:Record<string,number>,toChest:boolean){if(id.startsWith("tool:"))return false;
   if(toChest){if(!this.add(id,-1))return false;chest[id]=(chest[id]||0)+1;}
   else{if((chest[id]||0)<1||!this.add(id,1))return false;chest[id]--;}return true;
 }
}
export interface LivingRecipe{id:string;cost:Record<string,number>;out:string;count:number;}
export const RECIPES_LIVING:LivingRecipe[]=[
 {id:"Bretter",cost:{"block:Holz":2},out:"block:Bretter",count:4},
 {id:"Bretter aus Dunkelholz",cost:{"block:Dunkelholz":2},out:"block:Bretter",count:4},
 {id:"Tür",cost:{"block:Bretter":3},out:"block:Tür",count:2},
 {id:"Fackel",cost:{"block:Holz":1,"supply:Kohle":1},out:"block:Fackel",count:4},
 {id:"Leiter",cost:{"block:Holz":2},out:"block:Leiter",count:4},
 {id:"Kohle",cost:{"block:Holz":3},out:"supply:Kohle",count:2},
 {id:"Bett",cost:{"block:Holz":3,"block:Bretter":3},out:"block:Bett",count:1},
 ...["Tisch","Stuhl","Regal","Truhe","Werkbank"].map(id=>({id,cost:{"block:Bretter":3},out:`block:${id}`,count:1})),
 {id:"Ofen",cost:{"block:Stein":6},out:"block:Ofen",count:1},
 {id:"Laterne",cost:{"block:Stein":1,"supply:Kohle":1},out:"block:Laterne",count:1},
 {id:"Teppich",cost:{"block:Laub":3},out:"block:Teppich",count:2},
 {id:"Hacke",cost:{"block:Holz":2,"block:Stein":1},out:"tool:Hacke",count:1},
 {id:"Kupferspitzhacke",cost:{Kupfer:3,"block:Holz":2},out:"tool:Kupferspitzhacke",count:1},
 {id:"Eisenspitzhacke",cost:{Eisen:3,"block:Holz":2},out:"tool:Eisenspitzhacke",count:1},
];
export const FURNACE:LivingRecipe[]=[
 {id:"Kupfer",cost:{"block:Kupfererz":1,"supply:Kohle":1},out:"Kupfer",count:1},
 {id:"Eisen",cost:{"block:Eisenerz":1,"supply:Kohle":1},out:"Eisen",count:1},
 {id:"Gold",cost:{"block:Golderz":1,"supply:Kohle":1},out:"Gold",count:1},
 {id:"Brot",cost:{Weizen:3},out:"Brot",count:1},
 {id:"Ofenkartoffel",cost:{Kartoffel:1},out:"Ofenkartoffel",count:1},
 {id:"Gemüsesuppe",cost:{Karotte:1,Kartoffel:1,Kürbis:1},out:"Gemüsesuppe",count:2},
];
export function produce(store:ItemStore,recipe:{id:string;cost:Record<string,number>;out:string;count:number},creative=false){
 const inputs=Object.entries(recipe.cost);if(!creative&&inputs.some(([id,n])=>store.count(id)<n))return false;
 if(!creative)inputs.forEach(([id,n])=>store.add(id,-n));
 if(recipe.out.startsWith("tool:")){if(!store.expansion.nightfall.crafted.includes(recipe.id))store.expansion.nightfall.crafted.push(recipe.id);}
 else store.add(recipe.out,recipe.count);return true;
}
