// Isolated comparison builds. Never writes into either original checkout or save.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';

const repository=resolve(import.meta.dirname,'..');
const output=resolve(process.argv[2]||'/workspace/blockboom-history-public');
const base=process.argv[3]||'/Blockboom-viewport-history/';
const current='abd4d3742fd5b9dc9cccf8380403499ce6447a5b';
const early=execFileSync('git',['rev-parse','6946d9f'],{cwd:repository,encoding:'utf8'}).trim();
mkdirSync(output,{recursive:true});
for(const [id,commit,title] of [['a',early,'Test A · BLOCKBOOM v0.1'],['b',current,'Test B · BLOCKBOOM aktuelles main']]){
 const source=mkdtempSync(join(tmpdir(),`blockboom-history-${id}-`));
 execFileSync('tar',['-x','-C',source],{input:execFileSync('git',['archive',commit,'src','public','index.html','vite.config.ts','package.json','tsconfig.json'],{cwd:repository,maxBuffer:32*1024*1024})});
 // Same compiler/dependencies for both builds; no gameplay/layout edits.
 symlinkSync(join(repository,'node_modules'),join(source,'node_modules'),'dir');
 const save=join(source,'src/storage/Save.ts');
 if(id==='a')writeFileSync(save,readFileSync(save,'utf8').replace('"blockboom.save"','"blockboom.history-comparison.a.save"'));
 else {
  const preview=join(source,'src/Preview.ts');
  const text=readFileSync(preview,'utf8');
  const start=text.indexOf('export const storageKey=');
  if(start<0)throw Error('Storage isolation hook missing');
  writeFileSync(preview,text.slice(0,start)+'export const storageKey=(name:string)=>`blockboom.history-comparison.b.${name.replace(/^blockboom\\./,\'\')}`;\n');
 }
 const html=join(source,'index.html');
 writeFileSync(html,readFileSync(html,'utf8').replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`));
 execFileSync(process.execPath,[join(repository,'node_modules/vite/bin/vite.js'),'build','--base',`${base}${id}/`,'--outDir',join(output,id)],{cwd:source,stdio:'inherit'});
 // Avoid installing comparison builds as PWAs and changing the live app scope.
 const manifest=join(output,id,'manifest.webmanifest');
 const data=JSON.parse(readFileSync(manifest,'utf8'));
 data.name=title;data.short_name=`BLOCKBOOM ${id.toUpperCase()}`;data.start_url=`${base}${id}/`;data.scope=`${base}${id}/`;
 writeFileSync(manifest,JSON.stringify(data,null,2)+'\n');
}
writeFileSync(join(output,'index.html'),`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BLOCKBOOM · historischer Vergleich</title><body><h1>Historischer Vergleich</h1><p>Beide Tests in Chrome mit derselben Ausrichtung öffnen. Getrennte Test-Spielstände; keine Übernahme aus dem Live-Spiel.</p><p><a href="a/">Test A · v0.1 · ${early.slice(0,7)}</a></p><p><a href="b/">Test B · main · ${current.slice(0,7)}</a></p><p>Ungeprüft auf echtem iPhone. Die alte Version ist nicht als fehlerfrei bestätigt.</p></body></html>`);
writeFileSync(join(output,'comparison.json'),JSON.stringify({a:early,b:current,base,changes:['asset base paths','separate storage keys','document titles','scoped manifests'],history:{firstPlayable:'a1f4902',pagesReady:'6946d9f',largerWorldAndRendering:'d09541f',livingWorld:'b1ccf11'}},null,2)+'\n');
writeFileSync(join(output,'.nojekyll'),'');
console.log(`Comparison output: ${output}`);
