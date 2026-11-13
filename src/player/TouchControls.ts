let lastPointerType = "mouse";
const pendingTouchClicks = new Set<number>();
const activeTaps=new Map<number,()=>void>();
let captureInstalled = false;
function installClickCapture() {
  if (captureInstalled || typeof document === "undefined") return;
  captureInstalled = true;
  const cancelTaps=(e:Event)=>{const id=(e as PointerEvent).pointerId;activeTaps.get(id)?.();};
  window.addEventListener("pointerup",cancelTaps);
  window.addEventListener("pointercancel",cancelTaps);
  window.addEventListener("touchend",e=>{if(!e.touches.length)for(const cancel of [...activeTaps.values()])cancel();},{passive:true});
  document.addEventListener(
    "pointerdown",
    () => pendingTouchClicks.clear(),
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (e.detail === 0) return;
      const id = (e as PointerEvent).pointerId;
      const matches =
        id > 0
          ? pendingTouchClicks.has(id)
          : pendingTouchClicks.size > 0 && lastPointerType !== "mouse";
      if (matches) {
        pendingTouchClicks.delete(id);
        if (!(id > 0)) pendingTouchClicks.clear();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
/** One owning pointer per surface. Other fingers cannot replace or release it. */
export class TouchControls {
  private owners = new Map<HTMLElement, number>();
  private disposers: (() => void)[] = [];
  constructor(
    private joystick: HTMLElement,
    private lookArea: HTMLElement,
    private enabled: () => boolean,
    private movement: (x: number, y: number) => void,
    private turn: (x: number, y: number) => void,
    private globalTarget:EventTarget|undefined=typeof window==="undefined"?undefined:window,
  ) {
    installClickCapture();
    for (const surface of [joystick, lookArea]) this.bind(surface);
    const end=(event:Event)=>{const id=(event as PointerEvent).pointerId;for(const [surface,owner]of this.owners)if(owner===id){pendingTouchClicks.add(id);this.release(surface);}};
    const empty=(event:Event)=>{if((event as TouchEvent).touches?.length===0)this.reset();};
    for(const name of ["pointerup","pointercancel"])this.globalTarget?.addEventListener(name,end);
    for(const name of ["touchend","touchcancel"])this.globalTarget?.addEventListener(name,empty);
    this.disposers.push(()=>{for(const name of ["pointerup","pointercancel"])this.globalTarget?.removeEventListener(name,end);for(const name of ["touchend","touchcancel"])this.globalTarget?.removeEventListener(name,empty);});
  }
  private bind(surface: HTMLElement) {
    let lx = 0,
      ly = 0;
    const stop = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };
    const down = (e: PointerEvent) => {
      stop(e);
      lastPointerType = e.pointerType;
      if (
        !this.enabled() ||
        e.pointerType === "mouse" ||
        this.owners.has(surface)
      )
        return;
      this.owners.set(surface, e.pointerId);
      lx = e.clientX;
      ly = e.clientY;
      try {
        surface.setPointerCapture(e.pointerId);
      } catch {
        /* Some cancelled Safari contacts no longer have capture. */
      }
      if (surface === this.joystick) this.move(e);
    };
    const move = (e: PointerEvent) => {
      stop(e);
      if (!this.enabled() || this.owners.get(surface) !== e.pointerId) return;
      if (surface === this.joystick) this.move(e);
      else {
        this.turn(
          Math.max(-90, Math.min(90, e.clientX - lx)),
          Math.max(-90, Math.min(90, e.clientY - ly)),
        );
        lx = e.clientX;
        ly = e.clientY;
      }
    };
    const end = (e: PointerEvent) => {
      stop(e);
      if (this.owners.get(surface) === e.pointerId) {
        pendingTouchClicks.add(e.pointerId);
        this.release(surface);
      }
    };
    // Legacy touchcancel is a surface-local fallback; Pointer Events do the normal work.
    const cancel = (e: TouchEvent) => {
      stop(e);
      if(!e.targetTouches?.length)this.release(surface);
    };
    const lost = (e: PointerEvent) => {
      if (e.target === surface) end(e);
    };
    const click = (e: MouseEvent) => stop(e);
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerup", end);
    surface.addEventListener("pointercancel", end);
    surface.addEventListener("lostpointercapture", lost);
    surface.addEventListener("touchcancel", cancel, { passive: false });
    surface.addEventListener("click", click);
    this.disposers.push(() => {
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", end);
      surface.removeEventListener("pointercancel", end);
      surface.removeEventListener("lostpointercapture", lost);
      surface.removeEventListener("touchcancel", cancel);
      surface.removeEventListener("click", click);
    });
  }
  private move(e: PointerEvent) {
    const r = this.joystick.getBoundingClientRect(),
      radius = r.width * 0.34;
    const x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    const distance = Math.hypot(x, y),
      amount = Math.min(1, distance / radius);
    const strength = amount < 0.08 ? 0 : (amount - 0.08) / 0.92;
    this.movement(
      distance ? (x / distance) * strength : 0,
      distance ? (-y / distance) * strength : 0,
    );
  }
  private release(surface: HTMLElement) {
    const id = this.owners.get(surface);
    this.owners.delete(surface);
    if (surface === this.joystick) this.movement(0, 0);
    if (id !== undefined) {
      try {
        if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
      } catch {}
    }
  }
  reset() {
    this.release(this.joystick);
    this.release(this.lookArea);
    for(const cancel of [...activeTaps.values()])cancel();
  }
  get state(){return {joystick:this.owners.get(this.joystick)??null,look:this.owners.get(this.lookArea)??null};}
  dispose() {
    this.reset();
    for (const off of this.disposers) off();
  }
}

/** Only a tap starting on this button can activate it. Dragging in cannot. */
export function bindTap(button: HTMLElement, action: () => void) {
  installClickCapture();
  let owner: number | null = null,
    x = 0,
    y = 0,
    handled = false;
  let moved=false;
  button.addEventListener("pointerdown", (e) => {
    lastPointerType = e.pointerType;
    if (e.pointerType === "mouse") {
      handled = false;
      return;
    }
    e.stopPropagation();
    if (owner !== null) return;
    owner = e.pointerId;
    moved=false;
    x = e.clientX;
    y = e.clientY;
    handled = false;
    activeTaps.set(owner,()=>{if(owner!==null){pendingTouchClicks.add(owner);activeTaps.delete(owner);}owner=null;handled=true;});
    try {
      button.setPointerCapture(e.pointerId);
    } catch {}
  });
  button.addEventListener("pointerup", (e) => {
    if (owner !== e.pointerId) return;
    e.stopPropagation();
    activeTaps.delete(e.pointerId);
    owner = null;
    handled = true;
    pendingTouchClicks.add(e.pointerId);
    // Some mobile touch sequences do not emit click at all. Complete a valid tap
    // here; document capture swallows any later compatibility click, even if a
    // newly opened dialog is now under the finger. No timing heuristic needed.
    if (!moved&&Math.hypot(e.clientX - x, e.clientY - y) < 14) action();
  });
  button.addEventListener("pointermove",e=>{if(owner===e.pointerId&&Math.hypot(e.clientX-x,e.clientY-y)>=14)moved=true;});
  const cancel = (e: PointerEvent) => {
    if (owner === e.pointerId) {
      activeTaps.delete(e.pointerId);
      owner = null;
      handled = true;
      pendingTouchClicks.add(e.pointerId);
    }
  };
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("lostpointercapture", (e) => {
    if (e.target === button && owner !== null) cancel(e);
  });
  button.addEventListener("click", (e) => {
    if (e.detail !== 0 && (handled || lastPointerType !== "mouse")) {
      e.preventDefault();
      return;
    }
    action();
  });
}
