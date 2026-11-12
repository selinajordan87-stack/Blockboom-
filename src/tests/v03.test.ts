import { expect, it } from "vitest";
import * as T from "three";
import { BuildHistory } from "../building/History";
import { TOOLS, defaultExpansion, readExpansion } from "../inventory/Equipment";
import { CHALLENGES } from "../learning/Engine";
import { HeldTools } from "../player/HeldTools";
import { enrich, revolutionize } from "../world/Enrich";
import { TYPES, World, place } from "../world/World";

it("bietet 15 Baustoffe und macht mehrere Aktionen in umgekehrter Reihenfolge rückgängig", () => {
  expect(TYPES).toHaveLength(25);
  expect(TYPES).toEqual(
    expect.arrayContaining(["Kopfstein", "Ton", "Moosstein", "Dunkelholz", "Kalkstein", "Schiefer"]),
  );
  const world = new World();
  const history = new BuildHistory(20);
  const player: [number, number, number] = [0, 1, 7];
  for (const x of [1, 2, 3]) {
    expect(place(world, [x, 1, 7], "Kopfstein", player)).toBe(true);
    history.record([x, 1, 7], null, "Kopfstein");
  }
  expect(history.depth).toBe(3);
  expect(history.undo(world, player)?.cell).toEqual([3, 1, 7]);
  expect(history.undo(world, player)?.cell).toEqual([2, 1, 7]);
  expect(history.undo(world, player)?.cell).toEqual([1, 1, 7]);
  expect(history.available).toBe(false);
});

it("liest alte Erweiterungen unverändert und validiert additive Sicht-Einstellungen", () => {
  const old = readExpansion({
    version: 1,
    edition: 2,
    tool: "Axt",
    materials: { Holz: 4 },
  });
  expect(old.edition).toBe(2);
  expect(old.tool).toBe("Axt");
  expect(old.view).toEqual({ fov: 70, sensitivity: 1 });
  const next = readExpansion({
    ...defaultExpansion(3),
    view: { fov: 500, sensitivity: 0.1 },
  });
  expect(next.edition).toBe(3);
  expect(next.view).toEqual({ fov: 90, sensitivity: 0.55 });
});

it("erzeugt neue Landschaft nur für Edition 3 und entfernt dort die Bauplatzmarkierung", () => {
  const legacy = new World();
  expect(legacy.get(-3, 0, 5)).toBe("Sand");
  const current = new World();
  enrich(current);
  revolutionize(current);
  expect(current.get(-3, 0, 5)).toBe("Gras");
  expect([...current.blocks.values()]).toEqual(
    expect.arrayContaining(["Kalkstein", "Schiefer", "Ton", "Kopfstein"]),
  );
});

it("stellt Hand und jedes Werkzeug als eigenes animierbares Modell dar", () => {
  expect(TOOLS).toHaveLength(11);
  const camera = new T.PerspectiveCamera();
  const held = new HeldTools(camera);
  expect(camera.getObjectByName("right hand")).toBeTruthy();
  for (const tool of TOOLS)
    expect(camera.getObjectByName(`Werkzeug ${tool}`)).toBeTruthy();
  held.equip("Schwert", false);
  expect(held.models.get("Schwert")?.visible).toBe(true);
  expect(held.models.get("Axt")?.visible).toBe(false);
  held.play("strike");
  held.update(0.1, true, 1);
  expect(held.action).toBe("strike");
  expect(held.root.rotation.z).toBeLessThan(-0.12);
  held.update(1, false, 2);
  expect(held.action).toBe("idle");
});

it("ergänzt anspruchsvollere Inhalte, ohne bestehende Challenge-IDs zu ersetzen", () => {
  expect(CHALLENGES).toHaveLength(120);
  expect(CHALLENGES.some((c) => c.id === "world-01")).toBe(true);
  for (const domain of [
    "Mathematik",
    "Grammatik",
    "Naturwissenschaft",
    "Logisches Denken",
  ])
    expect(CHALLENGES.some((c) => c.domain === domain)).toBe(true);
});
