import {decode,SAVE_KEY,TERRAIN2_SAVE_KEY,readSaveRaw,saveKey,assertSupportedSave,type Save} from "./Save";
import {LEARNING_KEY,loadProfile,type Profile} from "../learning/Engine";
export const IMPORT_BACKUP="blockboom.pre-import";
export interface Transfer {world:Save;learning?:Profile|null}
export function exportTransfer(world:Save,learning:Profile){return {format:"blockboom-backup",version:world.extension?.terrainRevision===2?2:1,created:new Date().toISOString(),world,learning};}
export function parseTransfer(text:string):Transfer{
 if(text.length>8*1024*1024)throw Error("Die Datei ist zu groß.");
 let raw:any;try{raw=JSON.parse(text);}catch{throw Error("Die Datei enthält keinen lesbaren Spielstand.");}
 const envelope=raw?.format==="blockboom-backup";
 if(envelope&&raw.version!==1&&raw.version!==2)throw Error("Diese Sicherungsversion wird noch nicht unterstützt.");
 assertSupportedSave(JSON.stringify(envelope?raw.world:raw));
 const world=decode(JSON.stringify(envelope?raw.world:raw));if(!world)throw Error("Dieser Spielstand ist beschädigt oder nicht kompatibel.");
 const result:Transfer={world};if(envelope&&raw.learning!==undefined){
  const p=raw.learning;if(p===null)result.learning=null;
  else{
   if(p.version!==1||!["Entspannt","Abenteuer","Lern-Challenge"].includes(p.mode)||!Number.isSafeInteger(p.clock)||p.clock<0||!p.results||typeof p.results!=="object"||!Array.isArray(p.recent))throw Error("Der Lernfortschritt in dieser Datei ist nicht lesbar.");
   result.learning=loadProfile({getItem:()=>JSON.stringify(p)});
  }
 }
 return result;
}
/** All writes happen synchronously while paused. A backup must succeed first. */
export function importTransfer(storage:Pick<Storage,"getItem"|"setItem"|"removeItem">,data:Transfer){
 let oldWorld:string|null=null,oldTerrain:string|null=null,oldLearning:string|null=null,changed=false;
 try{
  oldWorld=storage.getItem(SAVE_KEY);oldTerrain=storage.getItem(TERRAIN2_SAVE_KEY);oldLearning=storage.getItem(LEARNING_KEY);
  const active=readSaveRaw(storage),previous=active?JSON.parse(active):null;
  const backup={format:"blockboom-backup",version:previous?.extension?.terrainRevision===2?2:1,world:previous,learning:oldLearning?JSON.parse(oldLearning):null};
  assertSupportedSave(active);assertSupportedSave(JSON.stringify(data.world));
  storage.setItem(IMPORT_BACKUP,JSON.stringify(backup));
  changed=true;storage.setItem(saveKey(data.world),JSON.stringify(data.world));
  if(saveKey(data.world)===SAVE_KEY)storage.removeItem(TERRAIN2_SAVE_KEY);
  if(data.learning!==undefined){if(data.learning===null)storage.removeItem(LEARNING_KEY);else storage.setItem(LEARNING_KEY,JSON.stringify(data.learning));}
  return {ok:true,error:""};
 }catch{
  if(changed){try{if(oldWorld===null)storage.removeItem(SAVE_KEY);else storage.setItem(SAVE_KEY,oldWorld);if(oldTerrain===null)storage.removeItem(TERRAIN2_SAVE_KEY);else storage.setItem(TERRAIN2_SAVE_KEY,oldTerrain);if(oldLearning===null)storage.removeItem(LEARNING_KEY);else storage.setItem(LEARNING_KEY,oldLearning);}catch{return {ok:false,error:"Import unterbrochen. Die Sicherung liegt unter blockboom.pre-import. Lade die Seite noch nicht neu und exportiere deinen aktuellen Stand."};}}
  return {ok:false,error:"Import nicht möglich. Dein bisheriger Stand bleibt erhalten. Prüfe den verfügbaren Browserspeicher."};
 }
}
