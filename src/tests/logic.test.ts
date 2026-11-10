import { describe, it, expect } from "vitest";
import { World, place, remove, type Cell } from "../world/World";
import { Player } from "../player/Player";
import { Fishing, Inventory } from "../fishing/Fishing";
import { ReadingEngine, mission } from "../learning/Learning";
import { decode, load, persist, type Save } from "../storage/Save";
import { explode } from "../boom/Boom";
const player: Cell = [0, 1, 7];
describe("Bauen", () => {
  it("setzt und entfernt einen erreichbaren Block", () => {
    const w = new World();
    expect(place(w, [1, 1, 7], "Glas", player)).toBe(true);
    expect(w.get(1, 1, 7)).toBe("Glas");
    expect(remove(w, [1, 1, 7], player)).toBe(true);
    expect(w.get(1, 1, 7)).toBeUndefined();
  });
  it("schützt Figur, Reichweite, Weltgrenzen und Grundgestein", () => {
    const w = new World();
    expect(place(w, [0, 1, 7], "Stein", player)).toBe(false);
    expect(place(w, [15, 1, 7], "Stein", player)).toBe(false);
    expect(place(w, [24, 1, 7], "Stein", [23, 1, 7])).toBe(false);
    expect(place(w, [1, 15, 7], "Stein", player)).toBe(false);
    expect(remove(w, [0, -3, 7], player)).toBe(false);
    expect(remove(w, [20, 0, 7], player)).toBe(false);
  });
  it("verweigert belegte Zellen", () => {
    const w = new World();
    expect(place(w, [1, 1, 7], "Holz", player)).toBe(true);
    expect(place(w, [1, 1, 7], "Gras", player)).toBe(false);
  });
});
describe("Bewegung", () => {
  it("landet stabil, springt und kollidiert mit Wänden", () => {
    const w = new World(),
      p = new Player(w);
    p.pos = [0, 4, 7];
    for (let i = 0; i < 360; i++) p.step(1 / 120, 0, 0, false);
    expect(p.pos[1]).toBeGreaterThanOrEqual(1);
    expect(p.pos[1]).toBeLessThan(1.02);
    expect(p.grounded).toBe(true);
    for (let i = 0; i < 30; i++) {
      p.step(1 / 120, 0, 0, false);
      expect(p.grounded).toBe(true);
    }
    p.step(1 / 120, 0, 0, true);
    expect(p.vy).toBeGreaterThan(0);
    for (let i = 0; i < 240; i++) p.step(1 / 120, 0, 0, false);
    w.set(1, 1, 7, "Stein");
    w.set(1, 2, 7, "Stein");
    for (let i = 0; i < 120; i++) p.step(1 / 120, 1, 0, false);
    expect(p.pos[0]).toBeLessThan(0.73);
  });
  it("holt eine Figur aus einem belegten Ladepunkt", () => {
    const p = new Player(new World());
    p.pos = [0, 0, 7];
    p.safeSpawn();
    expect(p.blocked(p.pos)).toBe(false);
  });
});
describe("Angeln und Inventar", () => {
  it("erlaubt einen Fang nur während des Bisses", () => {
    const f = new Fishing();
    f.cast(0, () => 0);
    expect(f.reel(100)).toBeNull();
    f.tick(2200);
    expect(f.state).toBe("bite");
    expect(f.reel(2300, () => 0.6)).toBe("Flussbarsch");
    expect(f.reel(2301)).toBeNull();
  });
  it("hat drei Arten und lässt verpasste Bisse wiederholen", () => {
    for (const [r, name] of [
      [0.1, "Rotauge"],
      [0.6, "Flussbarsch"],
      [0.95, "Hecht"],
    ] as const) {
      const f = new Fishing();
      f.cast(0, () => 0);
      f.tick(2200);
      expect(f.reel(2300, () => r)).toBe(name);
    }
    const f = new Fishing();
    f.cast(0, () => 0);
    f.tick(2200);
    expect(f.tick(5001)).toBe("miss");
    f.cast(6000);
    expect(f.state).toBe("waiting");
    const i = new Inventory();
    i.add("Hecht");
    i.add("Hecht");
    expect(i.total).toBe(2);
  });
});
describe("Lesemission", () => {
  it("bleibt freiwillig und schließt nur einen angenommenen Barschauftrag ab", () => {
    const r = new ReadingEngine();
    expect(r.catch("Flussbarsch")).toBe(false);
    r.accept();
    r.hint();
    expect(r.catch("Rotauge")).toBe(false);
    expect(r.catch("Flussbarsch")).toBe(true);
    expect(r.progress.completedMissions).toEqual([mission.id]);
    expect(r.progress.voluntaryHints).toBe(1);
    expect(r.progress.successfulAnswers).toBe(1);
    r.accept();
    expect(r.active).toBe(false);
  });
});
const example = (): Save => ({
  version: 1,
  position: [0, 1.01, 7],
  yaw: 0,
  pitch: 0,
  changes: { "1,1,7": "Glas" },
  fish: { Rotauge: 1, Flussbarsch: 2, Hecht: 0 },
  progress: new ReadingEngine().progress,
  missionActive: true,
  settings: { sound: false, quality: 1 },
});
describe("Speicherstände", () => {
  it("lädt Position, Weltänderungen, Fische und Auftrag verlustfrei", () => {
    let raw = "";
    const storage = {
      setItem: (_k: string, v: string) => {
        raw = v;
      },
      getItem: () => raw,
    };
    expect(persist(storage, example())).toBe(true);
    expect(load(storage)).toEqual(example());
    const w = new World();
    w.apply(load(storage)!.changes);
    expect(w.get(1, 1, 7)).toBe("Glas");
  });
  it("weist beschädigte, unbekannte und veraltete Versionen zurück", () => {
    expect(decode("{")).toBeNull();
    expect(decode(null)).toBeNull();
    expect(decode(JSON.stringify({ ...example(), version: 0 }))).toBeNull();
    expect(decode(JSON.stringify({ ...example(), version: 2 }))).toBeNull();
    expect(
      decode(JSON.stringify({ ...example(), position: [999, 1, 1] })),
    ).toBeNull();
    expect(
      decode(JSON.stringify({ ...example(), changes: { foo: "Stein" } })),
    ).toBeNull();
    expect(
      decode(JSON.stringify({ ...example(), fish: { Hecht: -1 } })),
    ).toBeNull();
  });
  it("behandelt blockierten Speicher", () => {
    expect(
      persist(
        {
          setItem: () => {
            throw Error();
          },
        },
        example(),
      ),
    ).toBe(false);
    expect(
      load({
        getItem: () => {
          throw Error();
        },
      }),
    ).toBeNull();
  });
});
describe("BOOM", () => {
  it("zerstört nur den Aufbau und stellt ihn wieder her", () => {
    const w = new World();
    const count = w.blocks.size;
    const removed = explode(w);
    expect(removed.length).toBe(48);
    expect(w.get(12, 1, 9)).toBeUndefined();
    expect(w.get(12, 0, 9)).toBe("Stein");
    expect(explode(w)).toEqual([]);
    w.resetBoom();
    expect(w.blocks.size).toBe(count);
    expect(w.get(12, 1, 9)).toBe("Boom");
  });
});
