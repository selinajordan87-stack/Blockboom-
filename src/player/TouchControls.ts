let lastPointerType = "mouse";
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
  ) {
    for (const surface of [joystick, lookArea]) this.bind(surface);
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
      if (this.owners.get(surface) === e.pointerId) this.release(surface);
    };
    // Legacy touchcancel is a surface-local fallback; Pointer Events do the normal work.
    const cancel = (e: TouchEvent) => {
      stop(e);
      this.release(surface);
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
  }
  dispose() {
    this.reset();
    for (const off of this.disposers) off();
  }
}

/** Only a tap starting on this button can activate it. Dragging in cannot. */
export function bindTap(button: HTMLElement, action: () => void) {
  let owner: number | null = null,
    x = 0,
    y = 0,
    lastTouch = -Infinity,
    eligible = false;
  button.addEventListener("pointerdown", (e) => {
    lastPointerType = e.pointerType;
    if (e.pointerType === "mouse") return;
    e.stopPropagation();
    if (owner !== null) return;
    owner = e.pointerId;
    x = e.clientX;
    y = e.clientY;
    eligible = false;
    try {
      button.setPointerCapture(e.pointerId);
    } catch {}
  });
  button.addEventListener("pointerup", (e) => {
    if (owner !== e.pointerId) return;
    e.stopPropagation();
    owner = null;
    lastTouch = performance.now();
    eligible = Math.hypot(e.clientX - x, e.clientY - y) < 14;
    // Activate on the native click, after the browser finishes this touch sequence.
    // Opening a panel on pointerup can retarget its later click into the new panel.
  });
  const cancel = (e: PointerEvent) => {
    if (owner === e.pointerId) {
      owner = null;
      eligible = false;
      lastTouch = performance.now();
    }
  };
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("lostpointercapture", (e) => {
    if (e.target === button && owner !== null) cancel(e);
  });
  button.addEventListener("click", (e) => {
    if (e.detail !== 0 && lastPointerType !== "mouse") {
      if (!eligible || performance.now() - lastTouch > 800) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      eligible = false;
    }
    action();
  });
}
