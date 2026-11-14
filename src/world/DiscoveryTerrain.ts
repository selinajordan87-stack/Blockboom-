import {World,MIN_Y,MAX_Y,type Block,type Cell} from "./World";

/** v0.7 is an additive outer ring. All v0.1–v0.6 terrain coordinates survive. */
export const DISCOVERY_REGIONS=[
 {id:"meadow",name:"Wiesenland",x:0,z:10,color:"#91bd70"},
 {id:"forest",name:"Flüsterwald",x:-100,z:30,color:"#477852"},
 {id:"mountain",name:"Silbergebirge",x:145,z:-105,color:"#a9afb3"},
 {id:"lake",name:"Spiegelsee",x:-110,z:-110,color:"#66adbf"},
 {id:"river",name:"Flussauen",x:-70,z:65,color:"#82bcb0"},
 {id:"cave",name:"Alte Minen",x:130,z:-90,color:"#ac8972"},
 {id:"village",name:"Verlassene Siedlung",x:100,z:85,color:"#b79c77"},
] as const;
export const CAVE_ENTRANCES:readonly {id:string;name:string;position:Cell}[]=[
 {id:"legacyMine",name:"Kupferhöhle",position:[27.5,1,-30]},
 {id:"forestMine",name:"Waldspalte",position:[-93.5,1,-46]},
 {id:"mountainMine",name:"Alte Mine",position:[130.5,1,-90]},
];
export const DISCOVERY_LANDMARKS={
 forge:[100,1,85],village:[100,1,85],warehouse:[112,1,88],tower:[114,1,102],
 cellar:[105,-4,100],treasure:[159,-12,-90],forestCave:[-94,1,-46],mountainCave:[130,1,-90],
} satisfies Record<string,Cell>;
export const GREAT_LAKE={x:-110,z:-110,rx:40,rz:30,waterY:.35};
export const RIVER_POINTS:readonly (readonly[number,number])[]=[[-110,-83],[-110,-60],[-85,20],[-70,65],[0,75],[65,85],[135,110]];
/** Gentle roads lead between regions; their target is still reached by walking. */
export const TRAILS:readonly (readonly (readonly[number,number])[])[]=[
 [[-24,23],[-64,23],[-108,30],[-128,-20],[-94,-46]],
 [[-108,30],[-145,-25],[-145,-77],[-110,-78]],
 [[24,23],[64,27],[100,75],[100,85],[114,102]],
 // Connect the settlement road to the mine road without crossing steep woodland.
 [[64,27],[64,-45]],
 [[64,-45],[100,-70],[130,-90]],
 [[100,85],[40,78],[-30,72],[-70,65],[-108,30]],
];
export const legacyArea=(x:number,z:number)=>x>=-60&&x<60&&z>=-60&&z<60;
export function segmentDistance(x:number,z:number,a:readonly[number,number],b:readonly[number,number]){
 const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz,t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
 return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}
export function trailDistance(x:number,z:number){let distance=Infinity;for(const path of TRAILS)for(let i=1;i<path.length;i++)distance=Math.min(distance,segmentDistance(x,z,path[i-1],path[i]));return distance;}
export function riverDistance(x:number,z:number){let distance=Infinity;for(let i=1;i<RIVER_POINTS.length;i++)distance=Math.min(distance,segmentDistance(x,z,RIVER_POINTS[i-1],RIVER_POINTS[i]));return distance;}
export function terrainProfile(x:number,z:number){
 const lake=Math.hypot((x-GREAT_LAKE.x)/GREAT_LAKE.rx,(z-GREAT_LAKE.z)/GREAT_LAKE.rz),island=Math.hypot(x+110,z+110)<5.5;
 const river=riverDistance(x,z),trail=trailDistance(x,z);
 const village=x>=88&&x<=126&&z>=70&&z<=114;
 const mountain=Math.max(0,1-Math.hypot(x-145,z+105)/65)*24;
 const woodlandRock=Math.max(0,1-Math.hypot(x+108,z+46)/19)*10;
 const rolling=Math.sin(x*.043)*Math.cos(z*.037)*2+Math.sin((x+z)*.021)*1.5;
 let top=Math.max(0,Math.floor(Math.max(mountain,woodlandRock)+rolling));
 let surface:Block=top>12?"Schiefer":top>7?"Stein":"Gras";
 if(village||trail<2.15){top=0;surface=trail<1.5?"Erde":"Gras";}
 if(lake<1.08){top=lake<.74?-2-Math.floor((.74-lake)*4):lake<.94?-1:0;surface="Sand";}
 if(river<3.7){top=river<1.5?-2:river<2.4?-1:0;surface=river<2.4?"Sand":"Ton";}
 if(island){top=1;surface="Gras";}
 // A timber crossing at the river, and a jetty to the island, are real solids.
 const bridge=river<3.9&&trail<2.15;
 const jetty=Math.abs(x+115)<1.6&&z>=-111&&z<=-77;
 return {top,surface,lake,river,trail,bridge,jetty,village};
}
type AirRange={floor:number;ceiling:number};
export function caveRange(x:number,z:number):AirRange|null{
 // Woodland cave: two branches, with shallow and lower chambers.
 if(x>=-118&&x<=-94&&Math.abs(z+46)<=1)return {floor:1-Math.min(10,Math.floor((-x-94)/2)),ceiling:4-Math.min(10,Math.floor((-x-94)/2))};
 if((x+115)**2+(z+46)**2<24)return {floor:-9,ceiling:-5};
 if(x>=-116&&x<=-114&&z>=-58&&z<=-47)return {floor:-9,ceiling:-6};
 if((x+115)**2+(z+58)**2<16)return {floor:-9,ceiling:-5};
 // Mountain mine: three depths; the wider chamber permits turning around.
 if(x>=130&&x<=161&&Math.abs(z+90)<=1){const floor=1-Math.min(13,Math.floor((x-130)/2));return {floor,ceiling:floor+3};}
 if(x>=156&&(x-160)**2+(z+90)**2<24)return {floor:-12,ceiling:-8};
 if(x>=146&&x<=148&&z>=-106&&z<=-91){const floor=-7+Math.min(7,Math.floor((-z-91)/2));return {floor,ceiling:floor+3};}
 if((x-147)**2+(z+106)**2<17)return {floor:0,ceiling:4};
 // The settlement cellar has a descending open stair corridor.
 if(x>=104&&x<=106&&z>=92&&z<=98){const floor=1-Math.min(5,z-92);return {floor,ceiling:floor+3};}
 if(x>=103&&x<=109&&z>=98&&z<=104)return {floor:-4,ceiling:-1};
 return null;
}
function generated(w:World,x:number,y:number,z:number,b:Block|null){if((w.get(x,y,z)||null)!==b)w.set(x,y,z,b,false);}
export function generateDiscoveryColumn(w:World,x:number,z:number){
 const p=terrainProfile(x,z),air=caveRange(x,z);
 for(let y=MIN_Y;y<=MAX_Y;y++){
  let b:Block|null=null;
  if(y<=p.top){b=y===p.top?p.surface:y>=p.top-2?"Erde":"Stein";
   const hash=Math.abs(x*73856093^y*19349663^z*83492791);
   if(y<p.top-3&&y>MIN_Y){if(hash%41===0)b="Kohleerz";else if(hash%53===0)b="Kupfererz";else if(y<-4&&hash%67===0)b="Eisenerz";else if(y<-9&&hash%79===0)b="Golderz";}
  }
  if(air){if(y===air.floor-1)b="Stein";if(y>=air.floor&&y<=air.ceiling)b=null;}
  if((p.bridge||p.jetty)&&y===0)b="Bretter";
  generated(w,x,y,z,b);
 }
}
function scopedWorld(w:World,cx:number,cz:number){return {set:(x:number,y:number,z:number,b:Block|null)=>{if(Math.floor(x/12)===cx&&Math.floor(z/12)===cz&&!Object.hasOwn(w.changes,`${x},${y},${z}`))generated(w,x,y,z,b);}} as World;}
function tree(w:World,x:number,z:number,h:number,dark:boolean){
 const base=terrainProfile(x,z).top;
 for(let y=1;y<=h;y++)w.set(x,base+y,z,dark?"Dunkelholz":"Holz",false);
 for(let y=h-1;y<=h+2;y++){const r=y===h+2?1:2;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(Math.abs(dx)+Math.abs(dz)<=r+1)w.set(x+dx,base+y,z+dz,"Laub",false);}
}
function building(w:World,x:number,z:number,width:number,depth:number,height:number,kind:"house"|"forge"|"warehouse"|"tower"){
 for(let dx=0;dx<width;dx++)for(let dz=0;dz<depth;dz++){
  w.set(x+dx,0,z+dz,"Kopfstein",false);
  for(let y=1;y<=height;y++)w.set(x+dx,y,z+dz,(dx===0||dz===0||dx===width-1||dz===depth-1)?(kind==="forge"?"Ziegel":kind==="tower"?"Kopfstein":"Bretter"):null,false);
  // Individual roof silhouettes read better than four identical boxes.
  const roof=kind==="tower"?height+1:height+1+Math.floor(Math.min(dx,width-1-dx)/2);
  w.set(x+dx,roof,z+dz,kind==="forge"?"Schiefer":"Dunkelholz",false);
 }
 w.set(x+2,1,z,"Tür",false);w.set(x+2,2,z,"Tür",false);
 for(const dz of [2,depth-3]){w.set(x,2,z+dz,"Glas",false);w.set(x+width-1,2,z+dz,"Glas",false);}
 w.set(x+1,2,z+depth-2,"Laterne",false);
 if(kind==="forge"){w.set(x+2,1,z+3,"Werkbank",false);w.set(x+4,1,z+3,"Ofen",false);for(let y=1;y<=height+5;y++)w.set(x+width-2,y,z+depth-2,"Ziegel",false);}
 if(kind==="warehouse"){for(const dx of [1,width-2])for(const dz of [2,depth-2])w.set(x+dx,1,z+dz,"Truhe",false);}
 if(kind==="house"){w.set(x+1,1,z+depth-2,"Bett",false);w.set(x+width-2,1,z+depth-2,"Tisch",false);w.set(x+1,1,z+2,"Truhe",false);}
 if(kind==="tower")for(let y=1;y<=height;y++)w.set(x+1,y,z+1,"Leiter",false);
}
/** Decorations write only the requested chunk, so order never changes the map. */
export function decorateDiscoveryChunk(world:World,cx:number,cz:number){
 const w=scopedWorld(world,cx,cz);
 for(let x=cx*12+2;x<cx*12+12;x+=4)for(let z=cz*12+2;z<cz*12+12;z+=4){
  if(legacyArea(x,z))continue;const p=terrainProfile(x,z),hash=Math.abs(x*31+z*73);
  if(p.lake<1.1||p.river<5||p.trail<3.5||p.village||caveRange(x,z)||p.top>9)continue;
  const dense=Math.hypot(x+100,z-30)<62;
  if(dense&&hash%4!==0||!dense&&hash%11===0)tree(w,x,z,4+hash%4,hash%3!==0);
  else if(hash%5===0){w.set(x,p.top+1,z,"Laub",false);w.set(x+1,p.top+1,z,"Laub",false);}
  else if(hash%13===0){w.set(x,p.top+1,z,"Moosstein",false);w.set(x+1,p.top+1,z,"Dunkelholz",false);}
 }
 for(const [x,z,width,depth,height,kind]of [[88,79,8,8,4,"house"],[98,83,9,9,4,"forge"],[112,88,9,9,5,"warehouse"],[114,102,6,6,12,"tower"]] as const)
  if(x+width>cx*12&&x<cx*12+12&&z+depth>cz*12&&z<cz*12+12)building(w,x,z,width,depth,height,kind);
 // Broken boundaries and a short path tie the silhouettes into a settlement.
 for(let x=91;x<=124;x++)if(x%7!==0)w.set(x,1,73,"Zaun",false);
 for(let z=74;z<=109;z++)if(z%6!==0)w.set(125,1,z,"Zaun",false);
 for(const entry of CAVE_ENTRANCES){const [ex,,ez]=entry.position,x=Math.floor(ex);
  for(let dz=-2;dz<=2;dz++)for(let y=1;y<=4;y++)if(Math.abs(dz)===2||y===4)w.set(x,y,ez+dz,"Stein",false);
  w.set(x-2,1,ez+2,"Fackel",false);
 }
 for(const [x,y,z,b]of [
  [138,-2,-88,"Kohleerz"],[140,-3,-88,"Kupfererz"],[146,-6,-88,"Eisenerz"],[159,-11,-94,"Golderz"],[159,-12,-90,"Schatztruhe"],
  [-104,-3,-44,"Kohleerz"],[-108,-5,-44,"Kupfererz"],[-115,-8,-50,"Eisenerz"],
  [103,-4,101,"Truhe"],[105,-4,103,"Regal"],[102,1,88,"Schatztruhe"],[-108,2,-110,"Truhe"],
 ] as const)w.set(x,y,z,b,false);
 // A few lanterns allow orientation inside; darker branches still need a torch.
 for(const [x,y,z]of [[137,-2,-89],[151,-9,-89],[-102,-2,-45],[105,-3,100]] as const)w.set(x,y,z,"Fackel",false);
}
