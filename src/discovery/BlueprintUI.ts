import type {Expansion} from "../inventory/Equipment";
import type {Block} from "../world/World";
import {towerPlan,TOWER_COST} from "./Blueprint";
interface Hooks{open:(tag:string,html:string)=>void;close:()=>void;begin:()=>void;speech:(text:string)=>string;}
export class BlueprintUI {
 constructor(private expansion:Expansion,private hooks:Hooks){}
 show(){
  const e=this.expansion,colors:Record<string,string>={Stein:"#9ba9ab",Bretter:"#bf9561",Leiter:"#dbbb7e",Fackel:"#f3cc65"};
  const drawing=towerPlan([0,0,0]).map(({cell:[x,y,z],block})=>`<rect x="${62+(x-z)*11}" y="${72+(x+z)*4-y*11}" width="11" height="11" fill="${colors[block]}" stroke="#173d35" stroke-width=".8"/>`).join("");
  this.hooks.open("GEFUNDENER BAUPLAN",`<h2>Aussichtsturm</h2><div class="blueprint-layout"><svg viewBox="0 0 115 115" role="img" aria-label="Schema des Aussichtsturms mit Fundament, Pfosten, Plattform und Leiter">${drawing}</svg><div><p>Ein fester Aussichtspunkt. Von der Plattform deckst du Gelände auf deiner Entdeckerkarte auf.</p><p>Grundfläche: 3 × 4 Blöcke. Vier Leitern führen zur Plattform. Gehe von der offenen Rückseite an die Leiter. Bewege dich vorwärts an der Wand hoch und oben auf die Plattform.</p></div></div><div class="recipe-list">${Object.entries(TOWER_COST).map(([b,n])=>`<div class="storage-row"><span>${b}</span><b>${e.nightfall.mode==="Kreativ"?"∞":e.materials[b as Block]||0} / ${n}</b></div>`).join("")}</div><p>Für 24 Bretter brauchst du sechs Viererportionen. Prüfe deine Vorräte, bevor du den Platz wählst. Beim Bauen werden die aufgeführten Blöcke verbraucht.</p><p>${e.living.blueprint?"Bauplan gefunden ✓. Die grüne Vorschau zeigt einen gültigen freien Platz; rote Vorschau erklärt, warum er nicht passt.":"Dieser Plan ist noch verschlossen. Suche die Fundtruhe in einer der alten Schmieden. Freies Bauen bleibt jederzeit möglich."}</p><button id="tower-place" ${e.living.blueprint?"":"disabled"}>Turmplatz auswählen</button><button id="tower-read">▷ Vorlesen</button><p id="tower-feedback" role="status"></p>`);
  document.getElementById("tower-place")!.onclick=()=>{if(!e.living.blueprint)return;this.hooks.close();this.hooks.begin();};
  document.getElementById("tower-read")!.onclick=()=>{document.getElementById("tower-feedback")!.textContent=this.hooks.speech("Aussichtsturm. Du brauchst 24 Bretter, zwölf Stein, vier Fackeln und vier Leitern. Wähle ebenen freien Boden. Klettere nach dem Bauen nach oben, um die Umgebung auf der Karte aufzudecken.");};
 }
}
