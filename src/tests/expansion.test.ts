import { it, expect } from "vitest";
import { World, place, remove } from "../world/World";
import { BuildHistory } from "../building/History";
import { readExpansion } from "../inventory/Equipment";
import { decode } from "../storage/Save";
it("baut an unterschiedlichen Orten, stapelt und macht die letzte Aktion sicher rückgängig", () => {
  for (const x of [-19, 0, 20]) {
    const w = new World(),
      h = new BuildHistory(),
      p: [number, number, number] = [x, 1, 8];
    expect(place(w, [x + 1, 1, 8], "Ziegel", p)).toBe(true);
    h.record([x + 1, 1, 8], null, "Ziegel");
    expect(h.undo(w, p)).not.toBeNull();
    expect(w.get(x + 1, 1, 8)).toBeUndefined();
    expect(place(w, [x + 1, 1, 8], "Sand", p)).toBe(true);
    expect(place(w, [x + 1, 2, 8], "Laub", p)).toBe(true);
    expect(remove(w, [x + 1, 2, 8], p)).toBe(true);
  }
});
it("Undo verschiebt keine Figur in einen wiederhergestellten Block", () => {
  const w = new World(),
    h = new BuildHistory();
  w.set(0, 1, 8, null);
  h.record([0, 1, 8], "Holz", null);
  expect(h.undo(w, [0, 1, 8])).toBeNull();
});
it("erweitert alte Saves additiv, behält Versionsprüfung und verwirft defekte Erweiterungswerte", () => {
  const legacy = {
    version: 1,
    position: [0, 1, 17],
    yaw: 0,
    pitch: 0,
    changes: { "1,1,7": "Glas" },
    fish: { Rotauge: 1, Flussbarsch: 2, Hecht: 0 },
    progress: {
      completedMissions: [],
      repetitions: 0,
      successfulAnswers: 0,
      voluntaryHints: 0,
    },
    settings: { sound: false, quality: 1 },
    missionActive: false,
  };
  expect(decode(JSON.stringify(legacy))?.changes).toEqual(legacy.changes);
  const extra = readExpansion({
    version: 1,
    tool: "unbekannt",
    materials: { Holz: -2, Stein: 5 },
  });
  expect(extra.tool).toBe("Bauwerkzeug");
  expect(extra.materials).toEqual({ Stein: 5 });
  expect(
    decode(JSON.stringify({ ...legacy, extension: extra }))?.extension,
  ).toEqual(extra);
});
it("sichert Fischrekorde unabhängig von begrenzten Fangprotokollen", () => {
  const e = readExpansion({
    version: 1,
    best: { Hecht: 95, Forelle: -1 },
    catches: [],
    materials: {},
    missions: {},
  });
  expect(e.best.Hecht).toBe(95);
  expect(e.best.Forelle).toBeUndefined();
});
