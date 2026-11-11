import contents from "./challenges.json";
export type Mode = "Entspannt" | "Abenteuer" | "Lern-Challenge";
export interface Challenge {
  id: string;
  domain: string;
  kind: string;
  level: number;
  target: string;
  solution: string;
  variants: string[];
  prompt: string;
  options: string[];
  hints: string[];
  syllables: string;
  speech: string;
  reward: number;
}
export const CHALLENGES: Challenge[] = contents;
export interface Result {
  attempts: number;
  history: boolean[];
  due: number;
  hints: number;
}
export interface Profile {
  version: 1;
  mode: Mode;
  clock: number;
  recent: string[];
  results: Record<string, Result>;
}
export const LEARNING_KEY = "blockboom.learning.v1";
export const freshProfile = (): Profile => ({
  version: 1,
  mode: "Lern-Challenge",
  clock: 0,
  recent: [],
  results: {},
});
export function loadProfile(
  storage: Pick<Storage, "getItem"> & Partial<Pick<Storage, "setItem">>,
): Profile {
  let raw: string | null = null;
  try {
    raw = storage.getItem(LEARNING_KEY);
    if (!raw) return freshProfile();
    const r = JSON.parse(raw);
    if (
      r.version !== 1 ||
      !["Entspannt", "Abenteuer", "Lern-Challenge"].includes(r.mode) ||
      !Number.isSafeInteger(r.clock) ||
      r.clock < 0 ||
      !r.results ||
      typeof r.results !== "object" ||
      !Array.isArray(r.recent)
    )
      throw Error("Format");
    const p = freshProfile();
    p.mode = r.mode;
    p.clock = r.clock;
    p.recent = r.recent
      .filter((id: unknown) => typeof id === "string")
      .slice(-3);
    for (const c of CHALLENGES) {
      const x = r.results[c.id];
      if (
        x &&
        Number.isSafeInteger(x.attempts) &&
        x.attempts >= 0 &&
        Number.isSafeInteger(x.due) &&
        Array.isArray(x.history) &&
        x.history.every((n: unknown) => typeof n === "boolean") &&
        Number.isSafeInteger(x.hints) &&
        x.hints >= 0
      )
        p.results[c.id] = {
          attempts: x.attempts,
          due: x.due,
          history: x.history.slice(-20),
          hints: x.hints,
        };
    }
    return p;
  } catch {
    try {
      if (raw) storage.setItem?.(LEARNING_KEY + ".backup", raw);
    } catch {}
    return freshProfile();
  }
}
export class LearningEngine {
  constructor(
    public profile = freshProfile(),
    public content: Challenge[] = CHALLENGES,
  ) {}
  select() {
    const successes = Object.values(this.profile.results).reduce(
      (n, r) => n + r.history.filter(Boolean).length,
      0,
    );
    const level = Math.min(3, 1 + Math.floor(successes / 8));
    const pool = this.content.filter(
      (c) => c.level <= level && !this.profile.recent.includes(c.id),
    );
    const sorted = (pool.length ? pool : this.content)
      .slice()
      .sort(
        (a, b) =>
          (this.profile.results[a.id]?.due || 0) -
            (this.profile.results[b.id]?.due || 0) || a.id.localeCompare(b.id),
      );
    const c = sorted[0];
    this.profile.recent = [...this.profile.recent, c.id].slice(-3);
    return c;
  }
  assess(c: Challenge, answer: string) {
    const normalized = answer.trim().normalize("NFC").replace(/\s+/g, " ");
    const correct = [c.solution, ...c.variants].includes(normalized);
    const p = this.profile,
      r = p.results[c.id] || { attempts: 0, history: [], due: 0, hints: 0 };
    p.clock++;
    r.attempts++;
    r.history = [...r.history, correct].slice(-20);
    r.due = p.clock + (correct ? 6 + r.history.filter(Boolean).length * 2 : 3);
    p.results[c.id] = r;
    return {
      correct,
      feedback: correct
        ? "Geschafft! Gut gelesen und überlegt."
        : normalized.toLocaleLowerCase("de") ===
            c.solution.toLocaleLowerCase("de")
          ? `Fast! Achte auf die Großschreibung: ${c.solution}.`
          : "Noch nicht ganz. Nutze einen Hinweis oder versuche es in Ruhe noch einmal.",
      offerHelp:
        !correct &&
        r.history.length >= 2 &&
        r.history.slice(-2).every((v) => !v),
    };
  }
  hint(c: Challenge) {
    const r = this.profile.results[c.id] || {
      attempts: 0,
      history: [],
      due: 0,
      hints: 0,
    };
    r.hints++;
    this.profile.results[c.id] = r;
    return c.hints[Math.min(r.hints - 1, c.hints.length - 1)];
  }
  skip(c: Challenge) {
    this.profile.clock++;
    const r = this.profile.results[c.id] || {
      attempts: 0,
      history: [],
      due: 0,
      hints: 0,
    };
    r.due = this.profile.clock + 4;
    this.profile.results[c.id] = r;
  }
  save(storage: Pick<Storage, "setItem">) {
    try {
      storage.setItem(LEARNING_KEY, JSON.stringify(this.profile));
      return true;
    } catch {
      return false;
    }
  }
  get interval() {
    return this.profile.mode === "Lern-Challenge"
      ? 90
      : this.profile.mode === "Abenteuer"
        ? 180
        : 300;
  }
}
