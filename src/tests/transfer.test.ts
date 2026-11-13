import {it,expect} from "vitest";
import {exportTransfer,parseTransfer,importTransfer,IMPORT_BACKUP} from "../storage/Transfer";
import {SAVE_KEY,type Save} from "../storage/Save";
import {freshProfile,LEARNING_KEY} from "../learning/Engine";
import {defaultExpansion} from "../inventory/Equipment";
const save=():Save=>({version:1,position:[0,1.01,9],yaw:0,pitch:-.12,changes:{"1,1,7":"Glas"},fish:{Rotauge:3,Flussbarsch:1,Hecht:0},progress:{completedMissions:["first-perch"],repetitions:1,successfulAnswers:1,voluntaryHints:2},missionActive:false,settings:{sound:false,quality:1},extension:defaultExpansion(4)});
function storage(){const values=new Map([[SAVE_KEY,JSON.stringify(save())],[LEARNING_KEY,JSON.stringify(freshProfile())]]);return {values,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};}
it("exportiert Welt, Haustiere, Kamera und Lernfortschritt verlustfrei und liest alte einzelne Saves",()=>{
 const s=save(),p=freshProfile();s.extension!.living.animals[0].name="Fiete";s.extension!.camera.perspective="third";p.results["world-01"]={attempts:2,history:[false,true],due:8,hints:1};
 const transfer=parseTransfer(JSON.stringify(exportTransfer(s,p)));expect(transfer.world).toEqual(s);expect(transfer.learning).toEqual(p);
 const legacy={...s};delete legacy.extension;const old=parseTransfer(JSON.stringify(legacy));expect(old.world.changes).toEqual(s.changes);expect(old.learning).toBeUndefined();
 expect(()=>parseTransfer("{kaputt")).toThrow();expect(()=>parseTransfer(JSON.stringify({...s,version:99}))).toThrow();
});
it("sichert den bisherigen Stand vor dem Import und übernimmt beide Speicherbereiche",()=>{
 const st=storage(),original=st.getItem(SAVE_KEY),s=save(),p=freshProfile();s.fish.Rotauge=27;p.mode="Entspannt";expect(importTransfer(st,{world:s,learning:p}).ok).toBe(true);
 expect(JSON.parse(st.getItem(SAVE_KEY)!).fish.Rotauge).toBe(27);expect(JSON.parse(st.getItem(LEARNING_KEY)!).mode).toBe("Entspannt");expect(parseTransfer(st.getItem(IMPORT_BACKUP)!).world).toEqual(JSON.parse(original!));
});
it("bricht bei fehlendem Sicherungsplatz vor dem Ersetzen von Welt oder Lernen ab",()=>{
 const st=storage(),before=new Map(st.values);st.setItem=()=>{throw Error("QuotaExceededError");};expect(importTransfer(st,{world:save(),learning:freshProfile()}).ok).toBe(false);expect(st.values).toEqual(before);
});
it("stellt nach fehlgeschlagenem zweitem Schreibschritt beide ursprünglichen Bereiche wieder her",()=>{
 const st=storage(),original=st.getItem(SAVE_KEY),learning=st.getItem(LEARNING_KEY),s=save();s.fish.Rotauge=27;let failed=false;
 st.setItem=(k,v)=>{if(k===LEARNING_KEY&&!failed){failed=true;throw Error("QuotaExceededError");}st.values.set(k,v);};expect(importTransfer(st,{world:s,learning:freshProfile()}).ok).toBe(false);expect(st.getItem(SAVE_KEY)).toBe(original);expect(st.getItem(LEARNING_KEY)).toBe(learning);expect(st.getItem(IMPORT_BACKUP)).not.toBeNull();
});
