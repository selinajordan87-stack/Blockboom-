import type {Expansion,MissionState} from '../inventory/Equipment';
export type MissionId='wood'|'fish'|'treasure';
export const MISSIONS={wood:{title:'Der Holzauftrag',prompt:'Mara braucht drei Holzblöcke. Sammle Holz an einem Baum und bringe es zu ihr.',reward:'10 Sterne und das Holzhelfer-Abzeichen',position:[-3,1,14]},fish:{title:'Der verschwundene Fisch',prompt:'Dunkle Streifen und eine stachelige Rückenflosse: Fange diesen Fisch für den Angler.',reward:'15 Sterne und das Barsch-Abzeichen',position:[-9,2,3]},treasure:{title:'Die geheime Bauanleitung',prompt:'Die Kiste öffnet sich mit drei Wörtern. Der Hinweis: Aus Sand entsteht Glas. Bretter entstehen aus Holz.',reward:'20 Sterne und das Schatzfinder-Abzeichen',position:[7,1,-4]}} as const;
export class Missions {
 constructor(public data:Expansion){}
 state(id:MissionId):MissionState{return this.data.missions[id] ||= {accepted:false,step:0,completed:false};}
 accept(id:MissionId){const m=this.state(id);if(!m.completed)m.accepted=true;}
 wood(){const m=this.state('wood');if(m.accepted&&m.step===0&&(this.data.materials.Holz||0)>=3)m.step=1;}
 caught(species:string){const m=this.state('fish');if(m.accepted&&m.step===0&&species==='Flussbarsch')m.step=1;}
 solution(id:MissionId){const m=this.state(id);return id==='wood'?'Holz':id==='fish'?'Flussbarsch':['Glas','Holz','Schatz'][m.step]||'Schatz';}
 answer(id:MissionId,answer:string){const m=this.state(id);if(!m.accepted||m.completed||(id==='treasure'&&m.step>=3)||(id!=='treasure'&&m.step!==1))return false;const correct=answer.trim().normalize('NFC')===this.solution(id)||(id==='fish'&&answer.trim()==='Barsch');if(correct)m.step++;return correct;}
 ready(id:MissionId){const m=this.state(id);return m.accepted&&!m.completed&&m.step>=(id==='treasure'?3:2)&&(id!=='wood'||(this.data.materials.Holz||0)>=3);}
 claim(id:MissionId){if(!this.ready(id))return false;const m=this.state(id);if(id==='wood')this.data.materials.Holz=(this.data.materials.Holz||0)-3;m.completed=true;this.data.tokens+=id==='wood'?10:id==='fish'?15:20;const badge=id==='wood'?'Holzhelfer':id==='fish'?'Barsch-Abzeichen':'Schatzfinder';if(!this.data.badges.includes(badge))this.data.badges.push(badge);return true;}
}
