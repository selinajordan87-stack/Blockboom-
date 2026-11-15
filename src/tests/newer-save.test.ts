import {it,expect} from 'vitest';
import {decode,load,persist,NewerSaveError,SAVE_KEY,type Save} from '../storage/Save';
import {importTransfer,parseTransfer} from '../storage/Transfer';
it('lädt oder überschreibt eine unbekannte Terrainrevision niemals',()=>{
 const raw=JSON.stringify({version:1,extension:{terrainRevision:3}}),values=new Map([[SAVE_KEY,raw]]),storage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};
 expect(()=>load(storage)).toThrow(NewerSaveError);expect(persist(storage,{version:1,changes:{}} as Save)).toBe(false);expect(values.size).toBe(1);expect(values.get(SAVE_KEY)).toBe(raw);
 expect(importTransfer(storage,{world:{version:1} as Save}).ok).toBe(false);expect(values.size).toBe(1);expect(()=>parseTransfer(raw)).toThrow('neueren BLOCKBOOM-Version');
 expect(decode(raw)).toBeNull();
});
