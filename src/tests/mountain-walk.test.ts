import {it,expect} from 'vitest';
import {World} from '../world/World';
import {RegionStream} from '../living/Regions';
import {Player} from '../player/Player';
import {MOUNTAIN_PATH} from '../world/TerrainSculpt';
it('geht den Bergpfad mit normalem Gehen und Springen hinauf und wieder herunter',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true);stream.ensure(130,-90);
 const player=new Player(world);player.pos=[130,1.01,-90];let jumps=0;const reached=[];
 const route=[...MOUNTAIN_PATH.slice(1),...MOUNTAIN_PATH.slice(0,-1).reverse()];
 for(const [x,z]of route){let tick=0;
  for(;tick<6000&&Math.hypot(player.pos[0]-x,player.pos[2]-z)>.7;tick++){
   stream.ensure(player.pos[0],player.pos[2]);player.yaw=Math.atan2(-(x-player.pos[0]),-(z-player.pos[2]));
   const jump=player.grounded&&player.blocked([player.pos[0]-Math.sin(player.yaw)*.35,player.pos[1],player.pos[2]-Math.cos(player.yaw)*.35]);if(jump)jumps++;player.step(1/120,0,1,jump);
  }
  reached.push([...player.pos]);expect(Math.hypot(player.pos[0]-x,player.pos[2]-z),JSON.stringify({target:[x,z],position:player.pos,reached,jumps})).toBeLessThan(.8);
 }
 console.info(JSON.stringify({mountainWalk:{reached,jumps}}));expect(player.pos[1]).toBeLessThan(2);
},30000);

it('betritt die beiden Bergkammern, erreicht den Schatz und geht durch den Eingang zurück',()=>{
 const world=new World();world.terrainRevision=2;const stream=new RegionStream(world,true);stream.ensure(130,-90);const player=new Player(world);player.pos=[130,1.01,-90];
 const route=[[137,-90],[147,-90],[147,-106],[147,-90],[154,-90],[158,-90],[154,-90],[147,-90],[137,-90],[130,-90]];
 for(const[x,z]of route){for(let tick=0;tick<6000&&Math.hypot(player.pos[0]-x,player.pos[2]-z)>.7;tick++){
  stream.ensure(player.pos[0],player.pos[2]);player.yaw=Math.atan2(-(x-player.pos[0]),-(z-player.pos[2]));const jump=player.grounded&&player.blocked([player.pos[0]-Math.sin(player.yaw)*.35,player.pos[1],player.pos[2]-Math.cos(player.yaw)*.35]);player.step(1/120,0,1,jump);
 }expect(Math.hypot(player.pos[0]-x,player.pos[2]-z),JSON.stringify({target:[x,z],pos:player.pos})).toBeLessThan(.8);}
 expect(player.pos[1]).toBeGreaterThan(.9);stream.ensure(159,-90);expect(world.get(159,-12,-90)).toBe('Schatztruhe');
},30000);
