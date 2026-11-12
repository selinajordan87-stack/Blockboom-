import { TYPES, type Block } from "../world/World";
import { FISH, type FishName } from "../fishing/Fishing";
import {
  BAITS,
  SPOTS,
  defaultAngling,
  readAngling,
  type AnglingProgress,
  type BaitId,
  type SpotId,
} from "../fishing/AnglingData";
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
  weight?: number;
  method: "Angel" | "Holzknüppel";
  bait?: BaitId;
  spot?: SpotId;
  disposition?: "released" | "kept";
}
export interface MissionState {
  accepted: boolean;
  step: number;
  completed: boolean;
}
export interface Expansion {
  version: 1;
  edition: 1 | 2 | 3 | 4;
  tool: Tool;
  materials: Partial<Record<Block, number>>;
  catches: CatchRecord[];
  best: Record<string, number>;
  tokens: number;
  badges: string[];
  missions: Record<string, MissionState>;
  view: { fov: number; sensitivity: number };
  angling: AnglingProgress;
}
export const defaultExpansion = (edition: 1 | 2 | 3 | 4 = 1): Expansion => ({
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
  angling: defaultAngling(),
});
export function readExpansion(raw: unknown): Expansion {
  const d = defaultExpansion();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<Expansion>;
  if (r.version !== 1) return d;
  d.edition =
    r.edition === 4 ? 4 : r.edition === 3 ? 3 : r.edition === 2 ? 2 : 1;
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
          FISH.some((fish) => fish.name === c.species) &&
          Number.isFinite(c.length) &&
          c.length > 0 &&
          c.length < 300 &&
          ["Angel", "Holzknüppel"].includes(c.method),
      )
      .map((c) => ({
        species: c.species,
        length: c.length,
        method: c.method,
        ...(typeof c.weight === "number" &&
        Number.isFinite(c.weight) &&
        c.weight > 0 &&
        c.weight < 100_000
          ? { weight: c.weight }
          : {}),
        ...(BAITS.some((bait) => bait.id === c.bait) ? { bait: c.bait } : {}),
        ...(SPOTS.some((spot) => spot.id === c.spot) ? { spot: c.spot } : {}),
        ...(c.disposition === "released" || c.disposition === "kept"
          ? { disposition: c.disposition }
          : {}),
      }))
      .slice(-500) as CatchRecord[];
  for (const { name: species } of FISH) {
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
  d.angling = readAngling(r.angling);
  return d;
}
