import {storageKey} from "../Preview";
import { readExpansion, type Expansion } from "../inventory/Equipment";
import { TYPES, type Block, type Cell, LIMIT, MIN_Y, MAX_Y } from "../world/World";
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
export const SAVE_KEY = storageKey("blockboom.save");
/** Old clients only know SAVE_KEY. Never place generation-2 worlds there. */
export const TERRAIN2_SAVE_KEY = storageKey("blockboom.save.terrain2");
export function readSaveRaw(storage:Pick<Storage,"getItem">){return storage.getItem(TERRAIN2_SAVE_KEY)??storage.getItem(SAVE_KEY);}
export function saveKey(save:Save){return save.extension?.terrainRevision===2?TERRAIN2_SAVE_KEY:SAVE_KEY;}
export class NewerSaveError extends Error {constructor(){super("Dieser Spielstand wurde mit einer neueren BLOCKBOOM-Version erstellt.");}}
export function assertSupportedSave(raw:string|null){
 if(!raw)return;let data:any;try{data=JSON.parse(raw);}catch{return;}
 if(typeof data?.version==="number"&&data.version>1||Number.isSafeInteger(data?.extension?.terrainRevision)&&data.extension.terrainRevision>2)throw new NewerSaveError();
}
export function decode(raw: string | null): Save | null {
  try {
    if (!raw) return null;
    assertSupportedSave(raw);
    const s = JSON.parse(raw);
    if (s.version !== 1) return null;
    const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
    if (
      !Array.isArray(s.position) ||
      s.position.length !== 3 ||
      !s.position.every(finite) ||
      Math.abs(s.position[0]) >= LIMIT ||
      Math.abs(s.position[2]) >= LIMIT ||
      s.position[1] < MIN_Y ||
      s.position[1] > 40 ||
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
        c[1] < MIN_Y ||
        c[1] > MAX_Y ||
        !(
          b === null || [...TYPES, "Laub", "Sand", "Boom", "Tür offen", "Tor offen", "Schatztruhe"].includes(b as string)
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
    s.pitch = Math.max(-1.56, Math.min(1.56, s.pitch));
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
    const raw=readSaveRaw(storage);assertSupportedSave(raw);return decode(raw);
  } catch(error) {
    if(error instanceof NewerSaveError)throw error;
    return null;
  }
}
export function persist(storage: Pick<Storage, "setItem"> & Partial<Pick<Storage,"getItem">>, save: Save) {
  try {
    if(storage.getItem){
      assertSupportedSave(readSaveRaw(storage as Pick<Storage,"getItem">));
      if(saveKey(save)===SAVE_KEY&&storage.getItem(TERRAIN2_SAVE_KEY)!==null)return false;
    }
    // Never replace a readable save with a world that the loader would reject.
    if(Object.keys(save.changes).length>50000)return false;
    const raw=JSON.stringify(save);assertSupportedSave(raw);
    storage.setItem(saveKey(save), raw);
    return true;
  } catch {
    return false;
  }
}
