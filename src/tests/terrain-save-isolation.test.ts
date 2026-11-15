import {it,expect} from 'vitest';
import {decode,load,persist,SAVE_KEY,TERRAIN2_SAVE_KEY,type Save} from '../storage/Save';
import {defaultExpansion} from '../inventory/Equipment';
import {exportTransfer,importTransfer,parseTransfer,IMPORT_BACKUP} from '../storage/Transfer';
import {freshProfile,LEARNING_KEY} from '../learning/Engine';
const world=(revision:1|2):Save=>({version:1,position:[130,1.01,-90],yaw:0,pitch:0,changes:{'140,-5,-90':null,'140,26,-90':'Glas'},fish:{Rotauge:3,Flussbarsch:0,Hecht:0},progress:{completedMissions:[],repetitions:0,successfulAnswers:0,voluntaryHints:0},missionActive:false,settings:{sound:false,quality:1},extension:{...defaultExpansion(4),terrainRevision:revision}});
function memory(){const values=new Map<string,string>(),s={values,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};return s;}
it('speichert Revision 2 getrennt und erhält den vom alten Client gelesenen Stand bytegenau',()=>{
 const s=memory(),old=world(1),fresh=world(2);persist(s,old);const legacy=s.getItem(SAVE_KEY);
 expect(persist(s,fresh)).toBe(true);expect(s.getItem(SAVE_KEY)).toBe(legacy);expect(load(s)).toEqual(fresh);
 // An old client can only edit its own key; the generation-2 terrain/deltas survive.
 s.setItem(SAVE_KEY,JSON.stringify({...old,yaw:1}));expect(load(s)).toEqual(fresh);
 expect(persist(s,old)).toBe(false);expect(decode(s.getItem(TERRAIN2_SAVE_KEY))).toEqual(fresh);
});
it('kennzeichnet Revision-2-Exporte mit einer von v0.7.1 abgelehnten Sicherungsversion',()=>{
 const exported=exportTransfer(world(2),freshProfile());expect(exported.version).toBe(2);
 expect(parseTransfer(JSON.stringify(exported)).world).toEqual(world(2));
 expect(exportTransfer(world(1),freshProfile()).version).toBe(1);
});
it('importiert beide Revisionen mit Sicherung und kann ausdrücklich zur alten Welt wechseln',()=>{
 const s=memory();persist(s,world(1));const original=s.getItem(SAVE_KEY);
 expect(importTransfer(s,{world:world(2),learning:freshProfile()}).ok).toBe(true);
 expect(s.getItem(SAVE_KEY)).toBe(original);expect(load(s)?.extension?.terrainRevision).toBe(2);
 expect(parseTransfer(s.getItem(IMPORT_BACKUP)!).world.extension?.terrainRevision).toBe(1);
 expect(importTransfer(s,{world:world(1)}).ok).toBe(true);expect(s.getItem(TERRAIN2_SAVE_KEY)).toBeNull();
 expect(parseTransfer(s.getItem(IMPORT_BACKUP)!).world.extension?.terrainRevision).toBe(2);
 expect(load(s)?.extension?.terrainRevision).toBe(1);
});
it('stellt bei Quota-Fehler im Import beide Weltbereiche wieder her',()=>{
 const s=memory();persist(s,world(1));persist(s,world(2));const old=s.getItem(SAVE_KEY),second=s.getItem(TERRAIN2_SAVE_KEY);let failed=false;
 const put=s.setItem;s.setItem=(k,v)=>{if(k===LEARNING_KEY&&!failed){failed=true;throw Error('quota');}put(k,v);};
 expect(importTransfer(s,{world:world(1),learning:freshProfile()}).ok).toBe(false);
 expect(s.getItem(SAVE_KEY)).toBe(old);expect(s.getItem(TERRAIN2_SAVE_KEY)).toBe(second);
});
