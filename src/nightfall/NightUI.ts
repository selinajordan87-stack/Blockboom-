import { TYPES, type Block, type Cell, type World } from "../world/World";
import { RECIPES, cook, craft, stock } from "./Crafting";
import { dayPhase } from "./DayCycle";
import { repair } from "./Defense";
import { Vitals, type NightState, type Difficulty } from "./State";
import { WritingBattle } from "./Writing";
import { ZOMBIES, type ZombieEngine } from "./Zombies";
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
interface Hooks {open:(tag:string,html:string)=>void;close:()=>void;save:()=>unknown;toast:(s:string)=>void;position:()=>Cell;equip:(name:string)=>void;effect:(pos:Cell)=>void;refresh:()=>void}
export class NightUI {
  battle:WritingBattle|null=null; private target:number|null=null;
  constructor(public state:NightState,private vitals:Vitals,private zombies:ZombieEngine,private materials:Partial<Record<Block,number>>,private fish:Record<string,number>,private world:World,private hooks:Hooks){}
  settings(){
    const s=this.state;
    this.hooks.open("NIGHTFALL",`<h2>Deine Nacht. Deine Regeln.</h2><p id="night-summary">${dayPhase(s.time)} · Nacht ${s.night} · ${s.defeated} Gegner besiegt · ${s.survived} Nächte überstanden</p><div class="night-settings"><label>Spielweise<select id="survival-mode">${["Kreativ","Survival"].map(m=>`<option ${s.mode===m?"selected":""}>${m}</option>`).join("")}</select></label><label>Gegner<select id="difficulty">${["Friedlich","Normal","Herausfordernd"].map(m=>`<option ${s.difficulty===m?"selected":""}>${m}</option>`).join("")}</select></label><label>Tageslänge<select id="day-length">${[120,600,1200,1800,3600].map(v=>`<option value="${v}" ${s.dayLength===v?"selected":""}>${v/60} Minuten</option>`).join("")}</select></label><label id="time-label" ${s.mode!=="Kreativ"?"hidden":""}>Tageszeit<select id="world-time">${[[.12,"Morgen"],[.3,"Mittag"],[.55,"Abend"],[.64,"Sonnenuntergang"],[.75,"Nacht"],[.95,"Sonnenaufgang"]].map(([v,label])=>`<option value="${v}" ${dayPhase(s.time)===label?"selected":""}>${label}</option>`).join("")}</select></label></div><label class="rule-toggle"><input type="checkbox" id="building-damage" ${s.buildingDamage?"checked":""}> Dauerhafter Tür-/Torschaden (Standard: aus)</label><label class="rule-toggle"><input type="checkbox" id="writing-timer" ${s.writing.timed?"checked":""}> Freiwillige Zeitanzeige im Schreibkampf</label><label class="rule-toggle"><input type="checkbox" id="writing-dictation" ${s.writing.dictation?"checked":""}> Diktat verwenden (keine Tempowertung)</label><p class="hint">Kreativ: unbegrenztes Bauen, kein Lebensverlust. Survival: Baustoffe werden verbraucht. Friedlich schaltet Gegner sofort aus. Lernmodus und Hilfen bleiben frei wählbar. Diktieren erfolgt bei Bedarf über die Mikrofontaste deiner Gerätetastatur.</p><button id="apply-night" class="primary">Übernehmen</button><div class="learning-help"><button id="open-crafting">Werkbank</button><button id="open-food">Proviant</button><button id="open-defense">Basis & Bauteile</button></div>`);
    $("survival-mode").onchange=()=>{$("time-label").hidden=$<HTMLSelectElement>("survival-mode").value!=="Kreativ";};
    $("apply-night").onclick=()=>{
      s.mode=$<HTMLSelectElement>("survival-mode").value as NightState["mode"];
      s.difficulty=$<HTMLSelectElement>("difficulty").value as Difficulty;
      s.dayLength=Number($<HTMLSelectElement>("day-length").value);
      if(s.mode==="Kreativ")s.time=Number($<HTMLSelectElement>("world-time").value);
      s.buildingDamage=$<HTMLInputElement>("building-damage").checked;
      s.writing.timed=$<HTMLInputElement>("writing-timer").checked;s.writing.dictation=$<HTMLInputElement>("writing-dictation").checked;
      if(s.difficulty==="Friedlich")this.zombies.actors=[];
      this.hooks.save();this.hooks.close();this.hooks.refresh();
    };
    $("open-crafting").onclick=()=>this.crafting();$("open-food").onclick=()=>this.food();$("open-defense").onclick=()=>this.defense();
  }
  crafting(){
    this.hooks.open("WERKBANK",`<h2>Mach mehr aus deinen Vorräten.</h2><p>${this.state.mode==="Kreativ"?"Kreativ: Rezepte sind frei verfügbar.":"Survival: Die gezeigten Zutaten werden verbraucht."}</p><div class="recipe-list">${RECIPES.map(r=>`<button data-recipe="${r.id}" ${this.state.mode!=="Kreativ"&&Object.entries(r.inputs).some(([name,n])=>stock(this.materials,this.state,name)<n)?"disabled":""}><b>${r.output} × ${r.id}</b><small>${Object.entries(r.inputs).map(([name,n])=>`${name}: ${stock(this.materials,this.state,name)}/${n}`).join(" + ")}</small></button>`).join("")}</div><p class="hint">Steinaxt und Schwerter erscheinen in der Werkzeugauswahl; Pfeile und Rüstung im Proviant. Rutenstücke schalten die Spinnrute frei. Werkzeuge verschleißen in v0.5 noch nicht.</p>`);
    document.querySelectorAll<HTMLButtonElement>("[data-recipe]").forEach(b=>b.onclick=()=>{
      const r=RECIPES.find(r=>r.id===b.dataset.recipe)!;
      if(craft(r,this.materials,this.state)){
        if(r.kind==="tool")this.hooks.equip(r.id);
        if(r.id==="Rutenstück")this.hooks.equip("Angel");
        this.hooks.save();this.crafting();
      }
    });
  }
  food(){
    const s=this.state;
    this.hooks.open("PROVIANT",`<h2>Stärkung fürs Abenteuer</h2><p>Lebenspunkte ${Math.round(s.health)}/100 · Hunger ${Math.round(s.hunger)}/100</p><div class="learning-help"><button id="eat-berries" ${(s.supplies.Beeren||0)<1?"disabled":""}>Beeren essen · ${s.supplies.Beeren||0}</button><button id="eat-fish" ${(s.supplies.Fischgericht||0)<1?"disabled":""}>Fischgericht essen · ${s.supplies.Fischgericht||0}</button></div><h3>Fisch zubereiten</h3><p>Ein einfacher Feldkocher gehört zur Grundausrüstung. Ein Fisch wird zu einem Gericht.</p><div class="recipe-list">${Object.entries(this.fish).filter(([,n])=>n>0).map(([name,n])=>`<button data-cook="${name}">${name} zubereiten · ${n}</button>`).join("")||"<p>Versorgte Fische aus deinem Inventar erscheinen hier.</p>"}</div><h3>Weitere Vorräte</h3><p>${Object.entries(s.supplies).filter(([name])=>!["Beeren","Fischgericht"].includes(name)).map(([name,n])=>`${name}: ${n}`).join(" · ")||"Noch keine gesammelt."}</p><p class="hint">Beeren lassen sich draußen nahe Bäumen über „Sammeln“ finden. Nahrung erhöht Hunger und Lebenspunkte. Gut versorgt regenerierst du langsam.</p>`);
    $("eat-berries").onclick=()=>{this.vitals.eat("Beeren");this.hooks.save();this.food();};$("eat-fish").onclick=()=>{this.vitals.eat("Fischgericht");this.hooks.save();this.food();};
    document.querySelectorAll<HTMLButtonElement>("[data-cook]").forEach(b=>b.onclick=()=>{cook(this.fish,s,b.dataset.cook!);this.hooks.save();this.food();});
  }
  defense(){
    this.hooks.open("BASISVERTEIDIGUNG",`<h2>Baue deinen Schutz.</h2><p>Türen und Tore werden zwei Blöcke hoch gesetzt. Visiere sie an und benutze „Öffnen“. Glas dient als Fenster. Zäune, Mauern und Barrieren halten Gegner auf; Fallen bremsen ihren Vormarsch durch Schaden.</p><p>Leitern: nach vorn gehen oder Springen halten. Treppen steigen in Richtung ihrer hohen Hälfte an. Fackeln beleuchten die nähere Umgebung.</p><p>Türschaden: ${this.state.buildingDamage?"dauerhaft erlaubt":"vorübergehend; morgens vollständig repariert"}.</p><button id="repair-all">Beschädigte Türen reparieren</button><p id="repair-result" role="status"></p><div class="material-grid">${TYPES.slice(15).map(t=>`<span>${t}: ${this.materials[t]||0}</span>`).join("")}</div>`);
    $("repair-all").onclick=()=>{let count=0;for(const key of Object.keys(this.state.damage))if(repair(this.state,key.split(",").map(Number) as Cell))count++;this.hooks.save();$("repair-result").textContent=count?`${count} Bauteile repariert.`:"Alles in Ordnung. Entfernte Teile kannst du neu bauen.";};
  }
  chest(){
    this.hooks.open("LAGERKISTE",`<h2>Dein gemeinsames Vorratslager</h2><p>Alle Lagerkisten verbinden denselben lokalen Vorrat.</p><div class="recipe-list">${TYPES.map(t=>`<div class="storage-row"><b>${t}</b><button data-store="${t}" ${(this.materials[t]||0)<1?"disabled":""}>Einlagern · ${this.materials[t]||0}</button><button data-take="${t}" ${(this.state.chest[t]||0)<1?"disabled":""}>Nehmen · ${this.state.chest[t]||0}</button></div>`).join("")}</div>`);
    for(const action of ["store","take"])document.querySelectorAll<HTMLButtonElement>(`[data-${action}]`).forEach(b=>b.onclick=()=>{
      const t=b.dataset[action] as Block,from=action==="store"?this.materials:this.state.chest,to=action==="store"?this.state.chest:this.materials;
      if((from[t]||0)>0){from[t]!--;to[t]=(to[t]||0)+1;this.hooks.save();this.chest();}
    });
  }
  startBattle(){
    const p=this.hooks.position(),z=this.zombies.actors.filter(z=>z.hp>0&&Math.hypot(z.pos[0]-p[0],z.pos[2]-p[2])<12).sort((a,b)=>Math.hypot(a.pos[0]-p[0],a.pos[2]-p[2])-Math.hypot(b.pos[0]-p[0],b.pos[2]-p[2]))[0];
    if(!z){this.hooks.toast("Kein Zombie in Reichweite. Tagsüber kannst du frei erkunden.");return;}
    this.target=z.id;this.battle=new WritingBattle(this.state.writing);const battle=this.battle;
    this.hooks.open("SCHREIBKAMPF",`<h2>Wortmagie gegen ${ZOMBIES[z.kind].name}</h2><p>Die Welt wartet, während du schreibst. Du kannst jederzeit ausweichen und normal weiterkämpfen.</p><p class="mission-text">${battle.task.prompt}</p><div id="battle-clock" ${this.state.writing.timed?"":"hidden"}>Freiwillige Bonuszeit: <output id="battle-time">75</output> s</div><form id="battle-form"><label for="battle-answer">Dein Zauber</label><textarea id="battle-answer" rows="2" autocomplete="off" autocapitalize="sentences" spellcheck="false"></textarea><button class="primary" id="battle-submit">Zauber wirken</button></form><p id="battle-feedback" role="status"></p><div class="learning-help"><button id="battle-hint">Hinweis</button><button id="battle-read">▷ Vorlesen</button><button id="battle-leave">Zurück zum Kampf</button></div><p class="hint">Das Zeitlimit ist freiwillig. Nach Ablauf bleibt die Aufgabe lösbar. Schreibkompetenz und Eingabetempo werden getrennt gespeichert; Diktat erhält keine Tempowertung.</p>`);
    $("battle-form").onsubmit=e=>{e.preventDefault();const result=battle.answer($<HTMLTextAreaElement>("battle-answer").value);$("battle-feedback").textContent=result.feedback;
      if(result.correct){const target=this.zombies.actors.find(z=>z.id===this.target);if(target){this.zombies.damage(target,result.damage);this.hooks.effect(target.pos);}this.hooks.save();$<HTMLButtonElement>("battle-submit").disabled=true;$("battle-leave").textContent="Weiter ins Abenteuer";}
    };
    $("battle-hint").onclick=()=>{$("battle-feedback").textContent=battle.hint();this.hooks.save();};
    $("battle-read").onclick=()=>{if(!("speechSynthesis" in window)){this.hooks.toast("Vorlesen ist hier nicht verfügbar.");return;}const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith("de")&&v.localService);if(!voice){$("battle-feedback").textContent="Keine lokale deutsche Stimme verfügbar. Der Text bleibt lesbar.";return;}const u=new SpeechSynthesisUtterance(battle.task.prompt);u.lang="de-DE";u.voice=voice;u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u);};
    $("battle-leave").onclick=()=>{this.battle=null;this.hooks.close();};
  }
  tick(dt:number) {if(this.battle && $("battle-time") && !$("modal").hidden){this.battle.tick(dt);$("battle-time").textContent=String(Math.ceil(this.battle.remaining));}}
}
