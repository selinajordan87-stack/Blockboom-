import {World,type Block} from './World';
/** Voxel architecture: actual walls, roofs, openings and usable interior fittings. */
export function artBuilding(w:World,x:number,z:number,width:number,depth:number,height:number,kind:string){
 const tower=kind==='tower',forge=kind==='forge';
 const wall:Block=forge?'Kalkstein':tower?'Kopfstein':'Bretter';
 for(let dx=-1;dx<=width;dx++)for(let dz=-1;dz<=depth;dz++){
  const inside=dx>=0&&dx<width&&dz>=0&&dz<depth;
  if(inside){
   w.set(x+dx,0,z+dz,'Kopfstein',false);
   for(let y=1;y<=height+5;y++){
    const edge=dx===0||dz===0||dx===width-1||dz===depth-1;
    let b:Block|null=null;
    if(y<=height&&edge)b=y===1?'Kopfstein':((dx===0||dx===width-1)&&(dz===0||dz===depth-1)||dx===Math.floor(width/2)&&dz===0||y===height)?'Dunkelholz':wall;
    if(tower&&y>height-3)b=(dx===0||dx===width-1)&&(dz===0||dz===depth-1)?'Dunkelholz':null;
    w.set(x+dx,y,z+dz,b,false);
   }
  }
  const ridge=tower?Math.min(dx+1,width-dx,dz+1,depth-dz):Math.min(dx+1,width-dx);
  const roof=height+1+Math.max(0,Math.floor(ridge*(forge?.72:1)));
  w.set(x+dx,roof,z+dz,forge?'Schiefer':tower?'Dunkelholz':'Ziegel',false);
  if(!tower&&inside&&(dz===0||dz===depth-1))for(let y=height+1;y<roof;y++)w.set(x+dx,y,z+dz,dx===Math.floor(width/2)?'Dunkelholz':'Bretter',false);
 }
 const door=x+2;w.set(door,1,z,'Tür',false);w.set(door,2,z,'Tür',false);
 for(const dx of [width-3]){w.set(x+dx,2,z,'Glas',false);w.set(x+dx,3,z,'Glas',false);w.set(x+dx,1,z-1,'Laub',false);}
 for(const dz of [2,depth-3])for(const dx of [0,width-1]){w.set(x+dx,2,z+dz,'Glas',false);w.set(x+dx,3,z+dz,'Glas',false);}
 w.set(x+1,2,z+depth-2,'Laterne',false);
 if(forge){
  for(let y=1;y<=height+7;y++)for(let dx=0;dx<=1;dx++)for(let dz=0;dz<=1;dz++)w.set(x+width-3+dx,y,z+depth-3+dz,y%3===0?'Kopfstein':'Ziegel',false);
  // Open-sided workshop awning beside the solid forge.
  for(let dx=-4;dx<=-1;dx++)for(let dz=2;dz<depth;dz++)w.set(x+dx,4,z+dz,'Dunkelholz',false);
  for(const dz of [2,depth-1])for(let y=1;y<4;y++)w.set(x-4,y,z+dz,'Holz',false);
  w.set(x-2,1,z+4,'Werkbank',false);w.set(x-2,1,z+6,'Ofen',false);w.set(x-3,3,z+3,'Laterne',false);
  for(let dz=2;dz<6;dz++)w.set(x+width,1,z+dz,'Holz',false);
  w.set(x+2,1,z+3,'Werkbank',false);w.set(x+4,1,z+3,'Ofen',false);
  w.set(x+4,2,z+4,'Laterne',false);
 }else if(tower){
  for(let dx=-1;dx<=width;dx++)for(let dz=-1;dz<=depth;dz++){
   w.set(x+dx,height-3,z+dz,'Bretter',false);
   if(dx===-1||dx===width||dz===-1||dz===depth)w.set(x+dx,height-2,z+dz,'Zaun',false);
  }
  for(let y=1;y<height;y++)w.set(x+1,y,z+1,'Leiter',false);
  w.set(x+1,height-1,z+1,null,false);w.set(x+1,height-3,z+1,'Leiter',false);
  for(const dx of [1,width-2])w.set(x+dx,height-1,z+1,'Laterne',false);
 }else{
  w.set(x+1,1,z+depth-2,kind==='warehouse'?'Truhe':'Bett',false);
  w.set(x+width-2,1,z+depth-2,'Tisch',false);w.set(x+1,1,z+2,'Truhe',false);
  for(let dx=0;dx<width;dx++)if(dx!==2&&dx!==3)w.set(x+dx,1,z-3,'Zaun',false);
  w.set(x+width-1,1,z+depth,'Laub',false);
 }
}
