import {speak} from "../learning/Speech";
import {CHAPTERS,NOTES,type BookCategory,type BookEntry} from "./Content";
import {DiscoveryEngine} from "./Engine";
interface Hooks {open:(tag:string,html:string)=>void;close:()=>void;save:()=>unknown;toast:(text:string)=>void;speech?:(text:string)=>string|void;}
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E|null;
/** Deliberately opened by the player; no automatic learning overlay. */
export class DiscoveryUI {
  constructor(public engine:DiscoveryEngine,private hooks:Hooks){}
  private speak(text:string){return this.hooks.speech?this.hooks.speech(text):speak(text);}
  log(){
    const goals=this.engine.activeGoals(),state=this.engine.state;
    this.hooks.open("ABENTEUERLOG",`<h2>Deine Spuren</h2><p>Du bestimmst das Tempo. Freies Bauen, Angeln und Erkunden bleiben immer möglich.</p><div class="mission-list">${goals.map(goal=>`<section class="discovery-goal" data-goal="${goal.id}"><h3>${escape(goal.title)}</h3><p>${escape(goal.hint)}</p><details><summary>Was kann ich jetzt tun?</summary><p>${escape(goal.detail)}</p></details><button data-goal-read="${goal.id}">▷ Vorlesen</button></section>`).join("")||`<p>${state.enabled?"Du hast alle Spuren dieser Reise verbunden. Deine freie Welt geht weiter.":"Abenteuerangebote sind ausgeschaltet. Deine bisherigen Entdeckungen bleiben erhalten."}</p>`}</div><p id="discovery-status" role="status"></p><div class="learning-help"><button id="discovery-book">Entdeckerbuch</button><button id="discovery-toggle">Abenteuerangebote: ${state.enabled?"an":"aus"}</button></div><details><summary>Deine abgeschlossenen Kapitel</summary><p>${CHAPTERS.filter(c=>state.completed.includes(c.id)).map(c=>`✓ ${escape(c.title)}`).join("<br>")||"Noch kein Kapitel abgeschlossen. Ein geöffnetes Fenster zählt nicht als erledigte Spielhandlung."}</p></details>`);
    document.querySelectorAll<HTMLButtonElement>("[data-goal-read]").forEach(button=>button.onclick=()=>{const goal=goals.find(g=>g.id===button.dataset.goalRead)!;const result=this.speak(`${goal.title}. ${goal.hint} ${goal.detail}`);if($("discovery-status"))$("discovery-status")!.textContent=typeof result==="string"?result:"Vorlesen gestartet.";});
    $("discovery-book")!.onclick=()=>this.book();$("discovery-toggle")!.onclick=()=>{state.enabled=!state.enabled;this.hooks.save();this.log();};
  }
  settings(){this.log();}
  book(category:BookCategory|"Alle"="Alle"){
    const entries=this.engine.unlockedEntries(),categories:BookCategory[]=["Fische","Tiere","Pflanzen","Rohstoffe","Orte","Zombies","Bauwissen","Abenteuerhinweise"];
    this.hooks.open("ENTDECKERBUCH",`<h2>Wissen aus deiner Welt</h2><p>Einträge entstehen durch echte Begegnungen, Funde und Handlungen. Was du noch nicht entdeckt hast, bleibt verborgen.</p><div class="inventory-tabs">${["Alle",...categories].map(c=>`<button data-book-category="${c}" aria-pressed="${category===c}">${c}</button>`).join("")}</div><div class="recipe-list">${entries.filter(e=>category==="Alle"||e.category===category).map(entry=>`<button data-book-entry="${entry.id}"><b>${escape(entry.title)}</b><small>${entry.category}</small></button>`).join("")||"<p>Hier ist noch eine freie Seite. Schau dich in der Welt um oder benutze ein Werkzeug.</p>"}</div><button id="discovery-log">Zum Abenteuerlog</button>`);
    document.querySelectorAll<HTMLButtonElement>("[data-book-category]").forEach(button=>button.onclick=()=>this.book(button.dataset.bookCategory as BookCategory|"Alle"));
    document.querySelectorAll<HTMLButtonElement>("[data-book-entry]").forEach(button=>button.onclick=()=>{const entry=entries.find(e=>e.id===button.dataset.bookEntry)!;if(entry.noteId)this.read(entry.noteId);else this.entry(entry);});
    $("discovery-log")!.onclick=()=>this.log();
  }
  private entry(entry:BookEntry){
    this.hooks.open(entry.category.toLocaleUpperCase("de"),`<h2>${escape(entry.title)}</h2>${entry.text.map(text=>`<p>${escape(text)}</p>`).join("")}<div class="learning-help"><button id="entry-read">▷ Vorlesen</button><button id="entry-back">Zum Entdeckerbuch</button></div><p id="discovery-status" role="status"></p>`);
    $("entry-read")!.onclick=()=>{const result=this.speak(`${entry.title}. ${entry.text.join(" ")}`);$("discovery-status")!.textContent=typeof result==="string"?result:"Vorlesen gestartet.";};$("entry-back")!.onclick=()=>this.book(entry.category);
  }
  read(id:string){
    const note=NOTES.find(n=>n.id===id);if(!note||!this.engine.canRead(id)){this.hooks.toast("Finde diese Notiz zuerst in der Welt.");return;}
    this.hooks.open("GEFUNDENE SPUR",`<article class="discovery-reading"><p class="challenge-domain">${note.category}</p><h2>${escape(note.title)}</h2>${note.text.map(text=>`<p>${escape(text)}</p>`).join("")}<div class="learning-help"><button id="note-read">▷ Vorlesen</button><button id="note-hint">Hinweis</button></div><p id="note-feedback" role="status"></p>${note.task?`<details class="discovery-task"><summary>Den Hinweis ausprobieren</summary><form id="note-answer-form"><label for="note-answer">${escape(note.task.prompt)}</label><input id="note-answer" maxlength="120" inputmode="${note.task.kind==="number"?"decimal":"text"}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button id="note-check" type="submit">Prüfen</button></form><p>Ein kurzer Begriff oder eine Zahl genügt. Diese Aufgabe ist freiwillig.</p><button id="note-skip">Mit Hilfe weiterspielen</button></details>`:""}<div class="learning-help"><button id="note-done" class="primary">Gelesen · weiter</button><button id="note-book">Im Buch blättern</button></div></article>`);
    $("note-read")!.onclick=()=>{this.engine.hint(id);const result=this.speak(`${note.title}. ${note.text.join(" ")}${note.task?" "+note.task.prompt:""}`);$("note-feedback")!.textContent=typeof result==="string"?result:"Vorlesen gestartet.";this.hooks.save();};
    $("note-hint")!.onclick=()=>{$("note-feedback")!.textContent=this.engine.hint(id);this.hooks.save();};
    $("note-done")!.onclick=()=>{this.engine.markRead(id);this.hooks.save();this.hooks.close();};
    $("note-book")!.onclick=()=>{this.engine.markRead(id);this.hooks.save();this.book(note.category);};
    if(note.task){
      $("note-answer-form")!.onsubmit=event=>{event.preventDefault();this.engine.markRead(id);const result=this.engine.answer(id,$<HTMLInputElement>("note-answer")!.value);$("note-feedback")!.textContent=result.feedback;this.hooks.save();};
      $("note-skip")!.onclick=()=>{this.engine.markRead(id);this.engine.skip(id);this.hooks.save();this.hooks.toast("Du kannst die Spur mit Hilfe weiterverfolgen. Dein Schreibversuch wird nicht als richtige Antwort gewertet.");this.hooks.close();};
    }
  }
}
