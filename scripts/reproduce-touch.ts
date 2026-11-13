import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {TouchControls} from "../src/player/TouchControls";
const directory=await mkdtemp(`${tmpdir()}/blockboom-touch-`);
try{
 const path=`${directory}/old.ts`;await writeFile(path,execFileSync("git",["show","df8c664:src/player/TouchControls.ts"]));const Old=(await import(path)).TouchControls;
 class Surface extends EventTarget{getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}setPointerCapture(){throw Error("capture rejected");}hasPointerCapture(){return false;}}
 const result:any={scenario:"Capture rejected; pointerup is delivered outside its surface",baseline:"df8c664"};
 for(const [name,Type]of [["before",Old],["after",TouchControls]] as const){
  const joy=new Surface(),look=new Surface(),win=new EventTarget(),movement:number[][]=[];const controls=new Type(joy as unknown as HTMLElement,look as unknown as HTMLElement,()=>true,(x:number,y:number)=>movement.push([x,y]),()=>{},win);
  const emit=(target:EventTarget,type:string,id:number,x=50,y=16)=>target.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId:id,pointerType:"touch",clientX:x,clientY:y}));
  emit(joy,"pointerdown",1);emit(win,"pointerup",1);const afterRelease=movement.at(-1);emit(joy,"pointerdown",2,84,50);result[name]={afterRelease,nextFinger:movement.at(-1)};controls.dispose();
 }
 if(result.before.afterRelease[1]!==1||result.after.afterRelease[1]!==0||result.after.nextFinger[0]!==1)throw Error("Reproduction differs from expected observable movement");
 await mkdir("artifacts/v061",{recursive:true});await writeFile("artifacts/v061/repro-touch.json",JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result));
}finally{await rm(directory,{recursive:true,force:true});}
