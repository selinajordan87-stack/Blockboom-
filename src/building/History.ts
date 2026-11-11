import {World,key,intersectsPlayer,type Cell,type Block} from '../world/World';
export class BuildHistory {
 private last:{cell:Cell;before:Block|null;after:Block|null}|null=null;
 record(cell:Cell,before:Block|null,after:Block|null){this.last={cell:[...cell],before,after};}
 undo(world:World,player:Cell){const a=this.last;if(!a)return null;if((world.get(...a.cell)||null)!==a.after || (a.before&&intersectsPlayer(a.cell,player)))return null;world.set(...a.cell,a.before);this.last=null;return a;}
 get available(){return this.last!==null;}
}
