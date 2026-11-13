import type {Tool} from "../inventory/Equipment";
import type {ControlSettings,CameraSettings} from "../player/CameraRig";
export function compactNotice(text:string){
 if(text.length<=100)return text;
 if(text.includes("Auftrag geschafft"))return "Auftrag geschafft! Details im Menü.";
 const sentence=text.match(/^.+?[.!?](?:\s|$)/)?.[0].trim();
 return sentence&&sentence.length<=100?sentence:"Neuer Hinweis. Details im Menü.";
}
export interface MobileContext {tool:Tool;functional:boolean;nearby:boolean;spot:boolean;fishing:string;zombie:boolean;block:string;blockColor:string}
export function mobileActions(s:MobileContext){
 const build=s.tool==="Bauwerkzeug",weapon=/schwert|Schwert|Bogen|Holzknüppel/.test(s.tool)||s.zombie&&["Axt","Steinaxt","Spitzhacke"].includes(s.tool);
 const mine=build||["Axt","Steinaxt","Spitzhacke","Kupferspitzhacke","Eisenspitzhacke","Schaufel","Hacke"].includes(s.tool);
 const fish=s.tool==="Angel"&&s.spot||!["idle","escaped","landed"].includes(s.fishing);
 return {place:build&&!fish,break:mine&&!weapon&&!fish,attack:weapon&&!fish,interact:!fish&&(s.functional||s.nearby)||s.tool==="Angel"&&s.spot&&s.fishing==="idle",fish};
}
const $=(id:string)=>document.getElementById(id)!;
export class MobileHUD {
 readonly active=matchMedia("(pointer: coarse)").matches;
 constructor(openMaterials:()=>void){
  if(!this.active)return;
  document.body.classList.add("mobile-game");
  const actions=document.createElement("nav");actions.id="mobile-actions";actions.setAttribute("aria-label","Spielaktionen");
  for(const id of ["interact","place","break","attack","jump","fish-action"])actions.append($(id));
  const quick=document.createElement("nav");quick.id="mobile-quickbar";quick.setAttribute("aria-label","Schnellzugriff");
  const material=document.createElement("button");material.id="selected-material";material.setAttribute("aria-label","Baumaterial auswählen");material.innerHTML='<span class="block-icon"></span><small>Gras</small>';material.onclick=openMaterials;
  quick.append($("tool-toggle"),material,$("zoom"));$("hud").append(actions,quick);
  for(const [id,icon,label]of [["interact","◉","Benutzen"],["place","+","Bauen"],["break","−","Abbau"],["attack","⚔","Angriff"],["jump","↑","Sprung"],["zoom","◫","Ansicht"]]){
   $(id).textContent=icon;$(id).dataset.label=label;
  }
 }
 settings(settings:ControlSettings){
  const root=document.documentElement;root.style.setProperty("--joystick-size",`${settings.joystickSize}px`);root.style.setProperty("--control-opacity",String(settings.opacity));document.body.classList.toggle("handed-left",settings.handedness==="left");
 }
 update(s:MobileContext,camera:CameraSettings){
  if(!this.active)return;const a=mobileActions(s);
  for(const id of ["place","break","attack","interact"] as const)$(id).hidden=!a[id];$("fish-action").hidden=!a.fish;
  $("mobile-actions").classList.toggle("fishing-actions",a.fish);
  $("interact").dataset.label=s.tool==="Angel"?"Angelinfo":s.functional?"Benutzen":s.nearby?"Aktion":"Benutzen";
  $("interact").setAttribute("aria-label",s.functional?`Mit ${s.block||"Tier"} interagieren`:"Aktion am Ort");
  $("interact").textContent="◉";
  $("fish-action").textContent=s.fishing==="idle"?"Auswerfen":s.fishing==="charging"?"Loslassen":s.fishing==="bite"?"Anschlagen!":s.fishing==="drill"?"Kurbeln":"Warten …";
  const material=$("selected-material");material.querySelector("small")!.textContent=s.block;
  (material.querySelector(".block-icon") as HTMLElement).style.setProperty("--block",s.blockColor);material.setAttribute("aria-label",`Baumaterial auswählen · ${s.block}`);
  $("zoom").dataset.label=camera.perspective==="third"?`${camera.distance} m`:"Ansicht";
 }
}
