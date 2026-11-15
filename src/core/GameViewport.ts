/** Browser zoom is distinct from the 3D camera. Keep the game's logical pixel
 * size stable when an iOS browser ignores user-scalable=no. */
export function gameViewport(view: {width:number;height:number;scale:number;offsetLeft:number;offsetTop:number}, layout?:{width:number;height:number;keyboard:boolean}) {
 const scale=Number.isFinite(view.scale)&&view.scale>0?view.scale:1;
 const zoomed=Math.abs(scale-1)>.01;
 // At normal zoom the layout viewport is authoritative. iOS can retain a
 // smaller visual rectangle and nonzero pan offsets after toolbar transitions.
 // A focused input is the exception: respect the keyboard's visible rectangle.
 return {
  width:Math.max(1,view.width*scale,layout?.width||0),
  height:Math.max(1,view.height*scale,layout?.keyboard?0:layout?.height||0),
  inverseScale:1/scale,
  left:zoomed||layout?.keyboard?view.offsetLeft:0,
  top:zoomed||layout?.keyboard?view.offsetTop:0,
 };
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
