import {describe,it,expect} from 'vitest';
import {gameViewport,installGameGestureGuard} from '../core/GameViewport';

describe('browser zoom recovery',()=>{
 it('keeps HUD size and camera aspect at 100%, 160% and 200% browser zoom',()=>{
  for(const scale of [1,1.6,2]){
   const r=gameViewport({width:844/scale,height:390/scale,scale,offsetLeft:45,offsetTop:20});
   expect(r.width).toBeCloseTo(844);expect(r.height).toBeCloseTo(390);
   // Final display size includes CSS compensation AND browser magnification.
   expect(44*r.inverseScale*scale).toBeCloseTo(44);
   expect(r.width*r.inverseScale).toBeCloseTo(844/scale);
   expect(r.left).toBe(scale===1?0:45);expect(r.top).toBe(scale===1?0:20);
  }
 });
 it('follows rotation and keyboard height instead of imposing device-height',()=>{
  expect(gameViewport({width:390,height:300,scale:1,offsetLeft:0,offsetTop:50},{width:390,height:844,keyboard:true})).toMatchObject({width:390,height:300,top:50});
  expect(gameViewport({width:844,height:390,scale:1,offsetLeft:0,offsetTop:0})).toMatchObject({width:844,height:390});
 });
 it('fills layout bounds when Chrome reports a stale, shortened and panned visual viewport',()=>{
  expect(gameViewport({width:726,height:254,scale:1,offsetLeft:59,offsetTop:0},{width:844,height:331,keyboard:false})).toMatchObject({width:844,height:331,left:0,top:0});
 });
 it('prevents native pinch takeover during play but preserves single touches and menus',()=>{
  const target=new EventTarget();let playing=true;
  const dispose=installGameGestureGuard(target as Document,()=>playing);
  const touch=(count:number)=>{const e=new Event('touchmove',{cancelable:true});Object.defineProperty(e,'touches',{value:Array(count)});target.dispatchEvent(e);return e.defaultPrevented;};
  expect(touch(1)).toBe(false);expect(touch(2)).toBe(true);
  const gesture=new Event('gesturechange',{cancelable:true});target.dispatchEvent(gesture);expect(gesture.defaultPrevented).toBe(true);
  playing=false;expect(touch(2)).toBe(false);
  dispose();playing=true;expect(touch(2)).toBe(false);
 });
});
