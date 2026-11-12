import type { Block } from "../world/World";
export type Difficulty = "Friedlich" | "Normal" | "Herausfordernd";
export interface NightState {
  version: 1;
  mode: "Kreativ" | "Survival";
  difficulty: Difficulty;
  time: number;
  dayLength: number;
  night: number;
  waveNight: number;
  health: number;
  hunger: number;
  defeated: number;
  survived: number;
  buildingDamage: boolean;
  refuge: boolean;
  supplies: Record<string, number>;
  crafted: string[];
  chest: Partial<Record<Block, number>>;
  damage: Record<string, number>;
  writing: { timed: boolean; dictation: boolean; wins: number; attempts: number; hints: number; speedSamples: number[]; history: boolean[] };
}
export const freshNight = (mode: NightState["mode"] = "Kreativ"): NightState => ({
  version: 1, mode, difficulty: "Normal", time: 0.3, dayLength: 1200,
  night: 0, waveNight: -1, health: 100, hunger: 100, defeated: 0, survived: 0,
  buildingDamage: false, refuge: false, supplies: { Beeren: 3, Fischgericht: 0, Kohle: 0, Schnur: 0 },
  crafted: [], chest: {}, damage: {},
  writing: { timed: false, dictation: false, wins: 0, attempts: 0, hints: 0, speedSamples: [], history: [] },
});
export function readNight(raw: unknown): NightState {
  const state = freshNight();
  if (!raw || typeof raw !== "object") return state;
  const r = raw as Partial<NightState>;
  if (r.version !== 1) return state;
  const finite = (v: unknown, lo: number, hi: number, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
  if (r.mode === "Survival") state.mode = r.mode;
  if (["Friedlich", "Normal", "Herausfordernd"].includes(r.difficulty || "")) state.difficulty = r.difficulty!;
  state.time = finite(r.time, 0, 0.999999, .3);
  state.dayLength = finite(r.dayLength, 120, 3600, 1200);
  for (const name of ["night", "defeated", "survived"] as const) state[name] = Math.floor(finite(r[name], 0, 1e6, 0));
  state.waveNight = Math.floor(finite(r.waveNight, -1, 1e6, -1));
  state.health = finite(r.health, 0, 100, 100);
  state.hunger = finite(r.hunger, 0, 100, 100);
  state.buildingDamage = r.buildingDamage === true;
  state.refuge = r.refuge === true;
  for (const [key, value] of Object.entries(r.supplies || {}))
    if (["Beeren", "Fischgericht", "Kohle", "Schnur", "Rutenstück", "Pfeile", "Rüstung"].includes(key)) state.supplies[key] = Math.floor(finite(value, 0, 1e6, 0));
  state.crafted = Array.isArray(r.crafted) ? [...new Set(r.crafted.filter((id) => typeof id === "string" && id.length < 40))].slice(0, 50) : [];
  for (const [key, value] of Object.entries(r.chest || {})) state.chest[key as Block] = Math.floor(finite(value, 0, 1e6, 0));
  for (const [key, value] of Object.entries(r.damage || {}))
    if (/^-?\d+,-?\d+,-?\d+$/.test(key) && Object.keys(state.damage).length < 100) state.damage[key] = finite(value, 0, 100, 0);
  const w = r.writing;
  if (w) {
    state.writing.timed = w.timed === true;
    state.writing.dictation = w.dictation === true;
    for (const key of ["wins", "attempts", "hints"] as const) state.writing[key] = Math.floor(finite(w[key], 0, 1e6, 0));
    state.writing.speedSamples = Array.isArray(w.speedSamples) ? w.speedSamples.filter((v) => Number.isFinite(v) && v > 0 && v < 1000).slice(-20) : [];
    state.writing.history = Array.isArray(w.history) ? w.history.filter((v) => typeof v === "boolean").slice(-30) : [];
  }
  return state;
}
export class Vitals {
  invulnerable = 0;
  constructor(public state: NightState) {}
  tick(dt: number) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.state.mode === "Kreativ" || this.state.health <= 0) return;
    this.state.hunger = Math.max(0, this.state.hunger - dt * .035);
    if (this.state.hunger > 60) this.state.health = Math.min(100, this.state.health + dt * .55);
    // Hunger never kills or blocks free exploration.
  }
  hit(damage: number) {
    if (this.state.mode === "Kreativ" || this.invulnerable > 0 || this.state.health <= 0) return false;
    this.state.health = Math.max(0, this.state.health - damage * ((this.state.supplies.Rüstung || 0) ? .7 : 1));
    this.invulnerable = 1.2;
    return true;
  }
  eat(food: "Beeren" | "Fischgericht") {
    if ((this.state.supplies[food] || 0) < 1) return false;
    this.state.supplies[food]--;
    this.state.hunger = Math.min(100, this.state.hunger + (food === "Beeren" ? 18 : 45));
    this.state.health = Math.min(100, this.state.health + (food === "Beeren" ? 5 : 18));
    return true;
  }
  respawn() { this.state.health = 100; this.state.hunger = Math.max(60, this.state.hunger); this.invulnerable = 12; }
}
