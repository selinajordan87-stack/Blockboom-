import { describe, it, expect, vi } from "vitest";
import { TouchControls, bindTap } from "../player/TouchControls";
import { installLifecycle } from "../core/Lifecycle";
class Surface extends EventTarget {
  captures = new Set<number>();
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 };
  }
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
}
function event(
  el: EventTarget,
  type: string,
  id = 1,
  x = 50,
  y = 50,
  extra = {},
) {
  el.dispatchEvent(
    Object.assign(new Event(type, { cancelable: true }), {
      pointerId: id,
      pointerType: "touch",
      clientX: x,
      clientY: y,
      ...extra,
    }),
  );
}
function setup() {
  const joy = new Surface(),
    look = new Surface(),
    move = vi.fn(),
    turn = vi.fn();
  let enabled = true;
  const input = new TouchControls(
    joy as unknown as HTMLElement,
    look as unknown as HTMLElement,
    () => enabled,
    move,
    turn,
  );
  return { joy, look, move, turn, input, disable: () => (enabled = false) };
}
describe("Touchbesitz", () => {
  it("löst einen außerhalb beendeten Kontakt auch bei abgewiesenem Pointer Capture",()=>{
    const joy=new Surface(),look=new Surface(),win=new EventTarget(),move=vi.fn();joy.setPointerCapture=()=>{throw Error("Safari capture unavailable");};
    const input=new TouchControls(joy as unknown as HTMLElement,look as unknown as HTMLElement,()=>true,move,()=>{},win);
    event(joy,"pointerdown",1,50,16);expect(move).toHaveBeenLastCalledWith(0,1);event(win,"pointerup",1);expect(move).toHaveBeenLastCalledWith(0,0);event(joy,"pointerdown",2,84,50);expect(move).toHaveBeenLastCalledWith(1,-0);input.dispose();
  });
  it("aktiviert einen Menübutton nach Wegziehen und Zurückziehen nicht",()=>{const el=new Surface(),action=vi.fn();bindTap(el as unknown as HTMLElement,action);event(el,"pointerdown",1,50,50);event(el,"pointermove",1,90,50);event(el,"pointerup",1,50,50);expect(action).not.toHaveBeenCalled();});
  it("löst bei Hintergrund-Reset auch einen Button mit verlorenem Touch-Ende",()=>{const s=setup(),el=new Surface(),action=vi.fn();bindTap(el as unknown as HTMLElement,action);event(el,"pointerdown",1);s.input.reset();event(el,"pointerdown",2);event(el,"pointerup",2);expect(action).toHaveBeenCalledTimes(1);s.input.dispose();});
  it("verarbeitet beide Daumen gleichzeitig und lässt sie unabhängig los", () => {
    const s = setup();
    event(s.joy, "pointerdown", 1, 50, 16);
    event(s.look, "pointerdown", 2);
    event(s.look, "pointermove", 2, 70, 52);
    expect(s.move).toHaveBeenLastCalledWith(0, 1);
    expect(s.turn).toHaveBeenLastCalledWith(20, 2);
    event(s.look, "pointerup", 2);
    expect(s.move).toHaveBeenLastCalledWith(0, 1);
    event(s.joy, "pointerup", 1);
    expect(s.move).toHaveBeenLastCalledWith(0, 0);
  });
  it("ignoriert zusätzliche Finger und falsches Loslassen", () => {
    const s = setup();
    event(s.joy, "pointerdown", 1, 50, 16);
    event(s.joy, "pointerdown", 3, 10, 50);
    event(s.joy, "pointerup", 3);
    expect(s.move).toHaveBeenLastCalledWith(0, 1);
    event(s.joy, "pointermove", 1, 84, 50);
    expect(s.move).toHaveBeenLastCalledWith(1, -0);
  });
  for (const kind of ["pointercancel", "lostpointercapture"])
    it(`${kind} stoppt nur den zugehörigen Kontakt`, () => {
      const s = setup();
      event(s.joy, "pointerdown", 1, 50, 16);
      event(s.look, "pointerdown", 2);
      event(s.look, kind, 2);
      expect(s.move).toHaveBeenLastCalledWith(0, 1);
      event(s.joy, kind, 1);
      expect(s.move).toHaveBeenLastCalledWith(0, 0);
    });
  it("behandelt touchcancel sowie Reset und deaktivierte Eingaben", () => {
    const s = setup();
    event(s.joy, "pointerdown", 1, 50, 16);
    event(s.joy, "touchcancel", 1, 0, 0, { touches: [] });
    expect(s.move).toHaveBeenLastCalledWith(0, 0);
    event(s.joy, "pointerdown", 4, 50, 16);
    s.input.reset();
    expect(s.joy.captures.size).toBe(0);
    s.disable();
    event(s.joy, "pointerdown", 5, 50, 16);
    expect(s.move).toHaveBeenLastCalledWith(0, 0);
  });
  it("klemmt große Kamerasprünge und entfernt Listener beim Aufräumen", () => {
    const s = setup();
    event(s.look, "pointerdown", 2);
    event(s.look, "pointermove", 2, 500, 500);
    expect(s.turn).toHaveBeenLastCalledWith(90, 90);
    s.input.dispose();
    s.turn.mockClear();
    event(s.look, "pointerdown", 3);
    event(s.look, "pointermove", 3, 60);
    expect(s.turn).not.toHaveBeenCalled();
  });
  it("aktiviert Buttons weder beim Hineinziehen noch doppelt durch Kompatibilitätsklicks", () => {
    const el = new Surface(),
      action = vi.fn();
    bindTap(el as unknown as HTMLElement, action);
    event(el, "pointerup", 1);
    expect(action).not.toHaveBeenCalled();
    event(el, "pointerdown", 2);
    event(el, "pointerup", 2, 51, 51);
    expect(action).toHaveBeenCalledTimes(1);
    event(el, "click", 2, 51, 51, { detail: 1 });
    expect(action).toHaveBeenCalledTimes(1);
    event(el, "pointerdown", 3);
    event(el, "pointerup", 3, 80, 50);
    expect(action).toHaveBeenCalledTimes(1);
    event(el, "click", 0, 0, 0, { detail: 0 });
    expect(action).toHaveBeenCalledTimes(2);
    event(el, "pointerdown", 4, 50, 50, { pointerType: "mouse" });
    event(el, "click", 4, 50, 50, { detail: 1, pointerType: "mouse" });
    expect(action).toHaveBeenCalledTimes(3);
  });
});
describe("Sichtbarkeit statt pauschaler Fokus-Pause", () => {
  it("trennt sichtbares Blur, Hintergrund und Seitenwechsel und registriert nur einmal", () => {
    const win = new EventTarget(),
      doc = Object.assign(new EventTarget(), { hidden: false }),
      actions = {
        blur: vi.fn(),
        resetInput: vi.fn(),
        hide: vi.fn(),
        leave: vi.fn(),
      };
    const dispose = installLifecycle(
      win as Window,
      doc as unknown as Document,
      actions,
    );
    for (let i = 0; i < 20; i++) win.dispatchEvent(new Event("blur"));
    expect(actions.blur).toHaveBeenCalledTimes(20);
    expect(actions.hide).not.toHaveBeenCalled();
    expect(actions.resetInput).not.toHaveBeenCalled();
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(actions.hide).toHaveBeenCalledTimes(1);
    expect(actions.resetInput).toHaveBeenCalledTimes(1);
    win.dispatchEvent(new Event("pagehide"));
    expect(actions.leave).toHaveBeenCalledTimes(1);
    dispose();
    win.dispatchEvent(new Event("blur"));
    expect(actions.blur).toHaveBeenCalledTimes(20);
  });
});
