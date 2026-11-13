import type {Tool} from "../inventory/Equipment";
import type {ControlSettings,CameraSettings} from "../player/CameraRig";
import {bindTap} from "../player/TouchControls";
export function compactNotice(text:string){
 if(text.length<=100)return text;
 if(text.includes("Auftrag geschafft"))return "Auftrag geschafft! Details im Menü.";
 const sentence=text.match(/^.+?[.!?](?:\s|$)/)?.[0].trim();
 return sentence&&sentence.length<=100?sentence:"Neuer Hinweis. Details im Menü.";
}
export interface MobileContext {
 tool:Tool;functional:boolean;nearby:boolean;spot:boolean;fishing:string;zombie:boolean;
 /** Selected material, independent of the object under the crosshair. */
 block:string;blockColor:string;blockCount?:number;
 targetBlock?:string;targetLabel?:string;hasTarget?:boolean;animal?:boolean;
 cropAction?:"Pflanzen"|"Ernten"|"Wächst";noteAction?:string;
}
export interface MobileHooks {equipTool?:(tool:Tool)=>void;eatFood?:()=>void;openInventory?:()=>void}
export const QUICK_TOOLS=[
 {id:"quick-pickaxe",tool:"Spitzhacke",icon:"⛏"},
 {id:"quick-axe",tool:"Axt",icon:"◢"},
 {id:"quick-sword",tool:"Schwert",icon:"⚔"},
 {id:"quick-rod",tool:"Angel",icon:"⌁"},
] as const;
export function mobileActions(s:MobileContext){
 const build=s.tool==="Bauwerkzeug",weapon=/schwert|Schwert|Bogen|Holzknüppel/.test(s.tool)||s.zombie&&["Axt","Steinaxt","Spitzhacke"].includes(s.tool);
 const mine=build||["Axt","Steinaxt","Spitzhacke","Kupferspitzhacke","Eisenspitzhacke","Schaufel","Hacke"].includes(s.tool);
 const fish=s.tool==="Angel"&&s.spot||!["idle","escaped","landed"].includes(s.fishing),target=s.hasTarget!==false;
 const none={place:false,break:false,attack:false,interact:false,fish:false};
 if(fish)return {...none,fish:true,interact:s.fishing==="idle"&&s.tool==="Angel"&&s.spot};
 if(s.zombie&&weapon)return {...none,attack:true};
 if(s.functional||s.animal||s.cropAction||s.noteAction)return {...none,interact:true,break:build&&target&&!s.animal&&!s.noteAction};
 if(weapon)return {...none,attack:true};
 return {...none,place:build&&target,break:mine&&target&&!(build&&s.nearby),interact:s.nearby&&build};
}
export function interactionLabel(s:MobileContext){
 if(s.noteAction)return "Lesen";
 if(s.animal)return "Tier";
 if(s.cropAction)return s.cropAction==="Wächst"?"Prüfen":s.cropAction;
 if(s.targetBlock==="Bett")return "Schlafen";
 if(["Truhe","Schatztruhe","Lagerkiste","Tür","Tor"].includes(s.targetBlock||""))return "Öffnen";
 if(["Tür offen","Tor offen"].includes(s.targetBlock||""))return "Schließen";
 if(s.tool==="Hacke"&&["Gras","Erde"].includes(s.targetBlock||""))return "Umgraben";
 if(s.tool==="Angel"&&s.spot)return "Angelinfo";
 return s.functional?"Benutzen":"Aktion";
}
/** A long hold has one owner; drags and interruptions cannot open a menu. */
export class SlotHold {
 private owner:number|null=null;private x=0;private y=0;private timer:ReturnType<typeof setTimeout>|undefined;
 private blocked=false;private fired=false;
 constructor(private open:()=>void){}
 start(id:number,x:number,y:number){if(this.owner!==null)return;this.owner=id;this.x=x;this.y=y;this.blocked=false;this.fired=false;this.timer=setTimeout(()=>{this.timer=undefined;this.fired=true;this.open();},450);}
 move(id:number,x:number,y:number){if(id===this.owner&&Math.hypot(x-this.x,y-this.y)>=12){this.stopTimer();this.blocked=true;}}
 end(id:number){if(id===this.owner){this.stopTimer();this.owner=null;}}
 cancelPointer(id:number){if(id===this.owner)this.cancel();}
 cancel(){this.stopTimer();this.owner=null;this.blocked=true;}
 keyboard(){this.cancel();this.blocked=false;this.fired=false;}
 get tapAllowed(){return !this.blocked&&!this.fired;}
 private stopTimer(){if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;}
}
const $=(id:string)=>document.getElementById(id)!;
const quickIcon=(tool:string)=>`<svg viewBox="0 0 28 28" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tool==="Spitzhacke"?'<path d="M8 24L18 9" stroke="#bd9462"/><path d="M5 9Q13 1 24 13L18 9L11 7Z" fill="#a2bac0"/>':tool==="Axt"?'<path d="M8 24L17 6" stroke="#bd9462"/><path d="M15 6L24 10L20 17L11 12Z" fill="#a2bac0"/>':tool==="Schwert"?'<path d="M6 24L12 18M9 16L15 22" stroke="#c4a367"/><path d="M12 18L21 4L24 5L23 10L15 21Z" fill="#a2bac0"/>':'<path d="M7 24L20 4L22 7" stroke="#c4a367"/><path d="M21 6L23 20Q23 25 19 23M9 19L13 20" stroke-width="1.4"/>'}</svg>`;
export class MobileHUD {
 readonly active=matchMedia("(pointer: coarse)").matches;
 private currentTool:Tool="Bauwerkzeug";private holds:SlotHold[]=[];
 constructor(openMaterials:()=>void,hooks:MobileHooks={}){
  if(!this.active)return;
  document.body.classList.add("mobile-game");
  const actions=document.createElement("nav");actions.id="mobile-actions";actions.setAttribute("aria-label","Spielaktionen");
  for(const id of ["interact","place","break","attack","jump","fish-action"])actions.append($(id));
  const quick=document.createElement("nav");quick.id="mobile-quickbar";quick.setAttribute("aria-label","Schnellzugriff");
  const allowed=()=>!document.hidden&&$("hud").hidden===false&&$("modal").hidden&&$("interruption").hidden;
  const inventory=()=>{if(allowed()){if(hooks.openInventory)hooks.openInventory();else $("bag").click();}};
  const choose=(tool:Tool)=>{if(!allowed())return;if(hooks.equipTool)hooks.equipTool(tool);else document.querySelector<HTMLButtonElement>(`[data-tool="${tool}"]`)?.click();};
  const slot=(button:HTMLButtonElement,action:()=>void)=>{
   const hold=new SlotHold(inventory);this.holds.push(hold);
   button.addEventListener("pointerdown",e=>{if(allowed())hold.start(e.pointerId,e.clientX,e.clientY);});
   button.addEventListener("pointermove",e=>hold.move(e.pointerId,e.clientX,e.clientY));
   button.addEventListener("pointerup",e=>hold.end(e.pointerId));
   for(const event of ["pointercancel","lostpointercapture"])button.addEventListener(event,e=>hold.cancelPointer((e as PointerEvent).pointerId));
   button.addEventListener("touchcancel",e=>{if(!e.targetTouches.length)hold.cancel();},{passive:true});
   button.addEventListener("click",e=>{if(e.detail===0)hold.keyboard();},true);
   bindTap(button,()=>{if(hold.tapAllowed&&allowed())action();});quick.append(button);
  };
  for(const entry of QUICK_TOOLS){const b=document.createElement("button");b.id=entry.id;b.dataset.quickTool=entry.tool;b.innerHTML=quickIcon(entry.tool);b.setAttribute("aria-label",`${entry.tool} ausrüsten · halten für Inventar`);slot(b,()=>choose(entry.tool));}
  const material=document.createElement("button");material.id="selected-material";material.setAttribute("aria-label","Baumaterial auswählen");material.innerHTML='<span class="block-icon"></span><small>Gras</small><span class="quick-count"></span>';
  slot(material,()=>{if(this.currentTool==="Bauwerkzeug")openMaterials();else choose("Bauwerkzeug");});
  const food=document.createElement("button");food.id="quick-food";food.textContent="◉";food.setAttribute("aria-label","Nahrung verwenden · halten für Inventar");slot(food,()=>hooks.eatFood?hooks.eatFood():inventory());
  $("hud").append(actions,quick);
  window.addEventListener("pointerup",e=>this.holds.forEach(h=>h.end(e.pointerId)));window.addEventListener("pointercancel",e=>this.holds.forEach(h=>h.cancelPointer(e.pointerId)));
  const cancel=()=>this.holds.forEach(h=>h.cancel());for(const event of ["touchend","touchcancel"])window.addEventListener(event,e=>{if((e as TouchEvent).touches?.length===0)cancel();},{passive:true});
  window.addEventListener("resize",cancel);window.addEventListener("blur",cancel);document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();});
  for(const [id,icon,label]of [["interact","◉","Benutzen"],["place","+","Bauen"],["break","−","Abbau"],["attack","⚔","Angriff"],["jump","↑","Sprung"]]){
   $(id).textContent=icon;$(id).dataset.label=label;
  }
 }
 settings(settings:ControlSettings){
  const root=document.documentElement;root.style.setProperty("--joystick-size",`${settings.joystickSize}px`);root.style.setProperty("--control-opacity",String(settings.opacity));document.body.classList.toggle("handed-left",settings.handedness==="left");
 }
 update(s:MobileContext,camera:CameraSettings){
  if(!this.active)return;this.currentTool=s.tool;const a=mobileActions(s);
  for(const id of ["place","break","attack","interact"] as const)$(id).hidden=!a[id];$("fish-action").hidden=!a.fish;
  $("mobile-actions").classList.toggle("fishing-actions",a.fish);
  const label=interactionLabel(s);$("interact").dataset.label=label;
  $("interact").setAttribute("aria-label",`${label}${s.targetLabel||s.targetBlock?` · ${s.targetLabel||s.targetBlock}`:""}`);
  $("interact").textContent="◉";
  $("fish-action").textContent=s.fishing==="idle"?"Auswerfen":s.fishing==="charging"?"Loslassen":s.fishing==="bite"?"Anschlagen!":s.fishing==="drill"?"Kurbeln":"Warten …";
  const material=$("selected-material");material.querySelector("small")!.textContent=s.block;
  (material.querySelector(".block-icon") as HTMLElement).style.setProperty("--block",s.blockColor);material.setAttribute("aria-label",`Baumaterial auswählen · ${s.block}`);
  material.setAttribute("aria-pressed",String(s.tool==="Bauwerkzeug"));material.querySelector(".quick-count")!.textContent=s.blockCount===undefined?"":String(s.blockCount);
  for(const entry of QUICK_TOOLS){const selected=entry.tool==="Spitzhacke"?/spitzhacke|Spitzhacke/.test(s.tool):entry.tool==="Axt"?/Axt|Steinaxt/.test(s.tool):entry.tool==="Schwert"?/schwert|Schwert/.test(s.tool):s.tool===entry.tool;$(entry.id).setAttribute("aria-pressed",String(selected));}
  $("zoom").dataset.label=camera.perspective==="third"?`${camera.distance} m`:"Ansicht";
  $("zoom").setAttribute("aria-label",camera.perspective==="third"?`Ansicht wechseln · Third Person, ${camera.distance} Meter`:"Ansicht wechseln · Ego-Perspektive");
 }
}
