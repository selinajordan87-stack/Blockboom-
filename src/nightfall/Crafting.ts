import type { NightState } from "./State";
import type { Block } from "../world/World";
export const RECIPES = [
  { id:"Bretter", inputs:{Holz:2}, output:4, kind:"material" },
  { id:"Holzschwert", inputs:{Bretter:2,Holz:1}, output:1, kind:"tool" },
  { id:"Steinschwert", inputs:{Holz:1,Stein:3}, output:1, kind:"tool" },
  { id:"Steinaxt", inputs:{Holz:2,Stein:3}, output:1, kind:"tool" },
  { id:"Spitzhacke", inputs:{Holz:2,Stein:3}, output:1, kind:"tool" },
  { id:"Kohle", inputs:{Holz:3}, output:2, kind:"supply" },
  { id:"Fackel", inputs:{Holz:1,Kohle:1}, output:4, kind:"material" },
  { id:"Schnur", inputs:{Laub:3}, output:2, kind:"supply" },
  { id:"Rutenstück", inputs:{Holz:1,Schnur:1}, output:1, kind:"supply" },
  { id:"Bogen", inputs:{Holz:3,Schnur:2}, output:1, kind:"tool" },
  { id:"Pfeile", inputs:{Holz:1,Stein:1}, output:8, kind:"supply" },
  { id:"Tür", inputs:{Bretter:3}, output:2, kind:"material" },
  { id:"Zaun", inputs:{Holz:2}, output:4, kind:"material" },
  { id:"Tor", inputs:{Bretter:2}, output:2, kind:"material" },
  { id:"Leiter", inputs:{Holz:2}, output:4, kind:"material" },
  { id:"Treppe", inputs:{Stein:2}, output:4, kind:"material" },
  { id:"Mauer", inputs:{Stein:2}, output:4, kind:"material" },
  { id:"Barriere", inputs:{Holz:2,Stein:1}, output:3, kind:"material" },
  { id:"Falle", inputs:{Holz:2,Schnur:1}, output:2, kind:"material" },
  { id:"Lagerkiste", inputs:{Bretter:3}, output:1, kind:"material" },
  { id:"Rüstung", inputs:{Stein:5,Schnur:2}, output:1, kind:"supply" },
] as const;
export type Recipe = typeof RECIPES[number];
export function stock(materials: Partial<Record<Block,number>>, state: NightState, name:string) {
  return materials[name as Block] || state.supplies[name] || 0;
}
export function craft(recipe: Recipe, materials: Partial<Record<Block,number>>, state: NightState) {
  const inputs = Object.entries(recipe.inputs);
  if (state.mode !== "Kreativ" && inputs.some(([name,count])=>stock(materials,state,name)<count)) return false;
  if(state.mode !== "Kreativ") for(const [name,count] of inputs) {
    if (materials[name as Block] !== undefined) materials[name as Block] = materials[name as Block]! - count;
    else state.supplies[name] = (state.supplies[name] || 0)-count;
  }
  if(recipe.kind === "material") materials[recipe.id as Block]=(materials[recipe.id as Block] || 0)+recipe.output;
  if(recipe.kind === "supply") state.supplies[recipe.id]=(state.supplies[recipe.id] || 0)+recipe.output;
  if(!state.crafted.includes(recipe.id)) state.crafted.push(recipe.id);
  return true;
}
export function cook(fish: Record<string,number>, state: NightState, species:string) {
  if((fish[species] || 0)<1) return false;
  fish[species]--; state.supplies.Fischgericht=(state.supplies.Fischgericht || 0)+1;
  return true;
}
