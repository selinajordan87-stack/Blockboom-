import { TYPES, type Block } from "../world/World";
import type { FishName } from "../fishing/Fishing";
export const TOOLS = [
  "Bauwerkzeug",
  "Spitzhacke",
  "Axt",
  "Schaufel",
  "Schwert",
  "Angel",
  "Holzknüppel",
] as const;
export type Tool = (typeof TOOLS)[number];
export interface CatchRecord {
  species: FishName;
  length: number;
  method: "Angel" | "Holzknüppel";
}
export interface MissionState {
  accepted: boolean;
  step: number;
  completed: boolean;
}
export interface Expansion {
  version: 1;
  edition: 1 | 2 | 3;
  tool: Tool;
  materials: Partial<Record<Block, number>>;
  catches: CatchRecord[];
  best: Record<string, number>;
  tokens: number;
  badges: string[];
  missions: Record<string, MissionState>;
  view: { fov: number; sensitivity: number };
}
export const defaultExpansion = (edition: 1 | 2 | 3 = 1): Expansion => ({
  version: 1,
  edition,
  tool: "Bauwerkzeug",
  materials: {},
  catches: [],
  best: {},
  tokens: 0,
  badges: [],
  missions: {},
  view: { fov: 70, sensitivity: 1 },
});
export function readExpansion(raw: unknown): Expansion {
  const d = defaultExpansion();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<Expansion>;
  if (r.version !== 1) return d;
  d.edition = r.edition === 3 ? 3 : r.edition === 2 ? 2 : 1;
  d.tool = TOOLS.includes(r.tool as Tool) ? r.tool! : "Bauwerkzeug";
  const count = (v: unknown): v is number =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 1e9;
  for (const t of TYPES)
    if (count(r.materials?.[t])) d.materials[t] = r.materials![t];
  if (Array.isArray(r.catches))
    d.catches = r.catches
      .filter(
        (c) =>
          c &&
          ["Rotauge", "Flussbarsch", "Hecht", "Karpfen", "Forelle"].includes(
            c.species,
          ) &&
          Number.isFinite(c.length) &&
          c.length > 0 &&
          c.length < 300 &&
          ["Angel", "Holzknüppel"].includes(c.method),
      )
      .slice(-100);
  for (const species of [
    "Rotauge",
    "Flussbarsch",
    "Hecht",
    "Karpfen",
    "Forelle",
  ]) {
    const best = r.best?.[species];
    if (
      typeof best === "number" &&
      Number.isFinite(best) &&
      best > 0 &&
      best < 300
    )
      d.best[species] = best;
  }
  d.tokens = count(r.tokens) ? r.tokens : 0;
  d.badges = Array.isArray(r.badges)
    ? r.badges
        .filter((b) => typeof b === "string" && b.length < 60)
        .slice(0, 30)
    : [];
  for (const id of ["wood", "fish", "treasure"]) {
    const m = r.missions?.[id];
    if (m && count(m.step) && m.step <= 5)
      d.missions[id] = {
        accepted: !!m.accepted,
        step: m.step,
        completed: !!m.completed,
      };
  }
  const fov = (r as Partial<Expansion>).view?.fov;
  const sensitivity = (r as Partial<Expansion>).view?.sensitivity;
  if (typeof fov === "number" && Number.isFinite(fov))
    d.view.fov = Math.max(55, Math.min(90, fov));
  if (typeof sensitivity === "number" && Number.isFinite(sensitivity))
    d.view.sensitivity = Math.max(0.55, Math.min(1.6, sensitivity));
  return d;
}
