/** Browser zoom is distinct from the 3D camera. Keep the game's logical pixel
 * size stable when an iOS browser ignores user-scalable=no. */
export function gameViewport(view: {width:number;height:number;scale:number;offsetLeft:number;offsetTop:number}) {
 const scale=Number.isFinite(view.scale)&&view.scale>0?view.scale:1;
 return {width:Math.max(1,view.width*scale),height:Math.max(1,view.height*scale),inverseScale:1/scale,left:view.offsetLeft,top:view.offsetTop};
}

/** Pointer Events own game input; native pinch/gesture handling must not take
 * ownership of a second finger. Menus retain scrolling and text selection. */
export function installGameGestureGuard(target:Document,playing:()=>boolean){
 const stop=(event:Event)=>{if(playing()&&event.cancelable)event.preventDefault();};
 const multiple=(event:TouchEvent)=>{if(event.touches.length>1)stop(event);};
 for(const name of ['gesturestart','gesturechange','gestureend'])target.addEventListener(name,stop,{capture:true,passive:false});
 for(const name of ['touchstart','touchmove'] as const)target.addEventListener(name,multiple,{capture:true,passive:false});
 return ()=>{
  for(const name of ['gesturestart','gesturechange','gestureend'])target.removeEventListener(name,stop,{capture:true});
  for(const name of ['touchstart','touchmove'] as const)target.removeEventListener(name,multiple,{capture:true});
 };
}
