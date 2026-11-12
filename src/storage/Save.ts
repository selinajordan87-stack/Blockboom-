import { readExpansion, type Expansion } from "../inventory/Equipment";
import { TYPES, type Block, type Cell, LIMIT } from "../world/World";
import { emptyProgress, type LearningProgress } from "../learning/Learning";
import { FISH } from "../fishing/Fishing";
export interface Save {
  version: 1;
  extension?: Expansion;
  position: Cell;
  yaw: number;
  pitch: number;
  changes: Record<string, Block | null>;
  fish: Record<string, number>;
  progress: LearningProgress;
  missionActive: boolean;
  settings: { sound: boolean; quality: number };
}
export const SAVE_KEY = "blockboom.save";
export function decode(raw: string | null): Save | null {
  try {
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.version !== 1) return null;
    const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
    if (
      !Array.isArray(s.position) ||
      s.position.length !== 3 ||
      !s.position.every(finite) ||
      Math.abs(s.position[0]) >= LIMIT ||
      Math.abs(s.position[2]) >= LIMIT ||
      s.position[1] < -2 ||
      s.position[1] > 30 ||
      !finite(s.yaw) ||
      !finite(s.pitch)
    )
      return null;
    if (
      !s.changes ||
      typeof s.changes !== "object" ||
      Array.isArray(s.changes) ||
      Object.keys(s.changes).length > 50000
    )
      return null;
    for (const [k, b] of Object.entries(s.changes)) {
      const c = k.split(",").map(Number);
      if (
        c.length !== 3 ||
        !c.every(Number.isInteger) ||
        Math.abs(c[0]) >= LIMIT ||
        Math.abs(c[2]) >= LIMIT ||
        c[1] < -3 ||
        c[1] > 14 ||
        !(
          b === null || [...TYPES, "Laub", "Sand", "Boom"].includes(b as string)
        )
      )
        return null;
    }
    if (
      !s.fish ||
      !["Rotauge", "Flussbarsch", "Hecht"].every(
        (f) => Number.isSafeInteger(s.fish[f]) && s.fish[f] >= 0,
      )
    )
      return null;
    for (const f of FISH.map((fish) => fish.name).filter(
      (name) => !["Rotauge", "Flussbarsch", "Hecht"].includes(name),
    ))
      if (
        s.fish[f] !== undefined &&
        (!Number.isSafeInteger(s.fish[f]) || s.fish[f] < 0)
      )
        return null;
    s.fish = Object.fromEntries(
      Object.entries(s.fish).filter(([name]) =>
        FISH.some((fish) => fish.name === name),
      ),
    );
    if (s.extension !== undefined) s.extension = readExpansion(s.extension);
    const p = s.progress;
    if (
      !p ||
      !Array.isArray(p.completedMissions) ||
      !p.completedMissions.every((x: unknown) => typeof x === "string") ||
      !["repetitions", "successfulAnswers", "voluntaryHints"].every(
        (k) => Number.isSafeInteger(p[k]) && p[k] >= 0,
      )
    )
      s.progress = emptyProgress();
    s.missionActive = !!s.missionActive;
    s.pitch = Math.max(-1.45, Math.min(1.45, s.pitch));
    s.settings = {
      sound: s.settings?.sound === true,
      quality: [1, 1.5].includes(s.settings?.quality)
        ? s.settings.quality
        : 1.5,
    };
    return s;
  } catch {
    return null;
  }
}
export function load(storage: Pick<Storage, "getItem">) {
  try {
    return decode(storage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}
export function persist(storage: Pick<Storage, "setItem">, save: Save) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
