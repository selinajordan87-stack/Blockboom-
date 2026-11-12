import type { NightState } from "./State";
export const BATTLE_TASKS=[
  {id:"n1",level:1,prompt:"Beschwöre den Schutzzauber: Abenteuer",solution:"Abenteuer",hint:"Aben-teu-er"},
  {id:"n2",level:1,prompt:"Schreibe den Fachbegriff: Verteidigung",solution:"Verteidigung",hint:"Ver-tei-di-gung"},
  {id:"n3",level:1,prompt:"Schreibe: Widerstandsfähigkeit",solution:"Widerstandsfähigkeit",hint:"Wi-der-stands-fä-hig-keit"},
  {id:"n4",level:2,prompt:"Schreibe den Zaubersatz: Der mutige Entdecker verteidigt seine Festung.",solution:"Der mutige Entdecker verteidigt seine Festung.",hint:"Achte auf das große D und F sowie den Punkt."},
  {id:"n5",level:2,prompt:"Schreibe: Eine stabile Mauer schützt die Vorräte.",solution:"Eine stabile Mauer schützt die Vorräte.",hint:"Mauer und Vorräte sind Nomen."},
  {id:"n6",level:2,prompt:"Verbessere: Der Zombie hatt sich hinter dem Baum versteckt.",solution:"Der Zombie hat sich hinter dem Baum versteckt.",hint:"Die Form von haben lautet: hat."},
  {id:"n7",level:3,prompt:"Verbessere: Obwohl es dunkel ist bleibt der Forscher ruhig.",solution:"Obwohl es dunkel ist, bleibt der Forscher ruhig.",hint:"Nach dem Nebensatz steht ein Komma."},
  {id:"n8",level:3,prompt:"Verbessere: Die wiederstandsfähige Barriere hält den Angreifer auf.",solution:"Die widerstandsfähige Barriere hält den Angreifer auf.",hint:"Widerstand schreibt man ohne ie."},
  {id:"n9",level:3,prompt:"Schreibe: Das Gleichgewicht im Ökosystem hängt von vielen Arten ab.",solution:"Das Gleichgewicht im Ökosystem hängt von vielen Arten ab.",hint:"Ökosystem ist ein Nomen."},
  {id:"n10",level:4,prompt:"Verbessere: Der Entdecker weis dass eine geschlossene Tür Schutz bietet.",solution:"Der Entdecker weiß, dass eine geschlossene Tür Schutz bietet.",hint:"weiß mit ß; vor dass steht ein Komma."},
  {id:"n11",level:4,prompt:"Verbessere: Die Forscherin prüft ob ihre Beobachtung zuverlässig ist.",solution:"Die Forscherin prüft, ob ihre Beobachtung zuverlässig ist.",hint:"Der mit ob beginnende Nebensatz wird durch ein Komma getrennt."},
  {id:"n12",level:4,prompt:"Schreibe: Während der Dämmerung verändert sich die Lichtintensität.",solution:"Während der Dämmerung verändert sich die Lichtintensität.",hint:"Dämmerung und Lichtintensität sind Nomen."},
] as const;
export type BattleTask=typeof BATTLE_TASKS[number];
export class WritingBattle {
  task:BattleTask;elapsed=0;attempts=0;finished=false;
  constructor(private progress:NightState["writing"]){
    const level=Math.min(4,1+Math.floor(progress.wins/3));
    const pool=BATTLE_TASKS.filter(t=>t.level===level);this.task=pool[progress.wins%pool.length];
  }
  tick(dt:number){if(!this.finished)this.elapsed+=dt;}
  get remaining(){return Math.max(0,75-this.elapsed);}
  answer(text:string){
    if(this.finished)return {correct:false,damage:0,feedback:"Der Zauber ist bereits gewirkt."};
    const correct=text.trim().normalize("NFC").replace(/\s+/g," ")===this.task.solution;
    this.attempts++;this.progress.attempts++;this.progress.history=[...this.progress.history,correct].slice(-30);
    if(correct){this.finished=true;this.progress.wins++;
      // Orthography is stored separately from speed. Dictation has no speed score.
      if(!this.progress.dictation)this.progress.speedSamples=[...this.progress.speedSamples,this.task.solution.length/Math.max(1,this.elapsed)*60].slice(-20);
      return {correct:true,damage:this.progress.timed&&this.remaining>35&&!this.progress.dictation?90:65,feedback:"Zauber wirkt! Gut überlegt."};
    }
    return {correct:false,damage:0,feedback:this.attempts>1?this.task.hint:"Versuche es in Ruhe noch einmal. Hinweise helfen dir."};
  }
  hint(){this.progress.hints++;return this.task.hint;}
}
