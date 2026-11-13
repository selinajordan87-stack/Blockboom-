import { FISH, fishInfo, type FishName } from "./Fishing";

export type SpotId = "small" | "forest" | "river" | "secret" | "great";
export type RodId = "Stipprute" | "Spinnrute" | "Raubfischrute";
export type RigId = "Posenmontage" | "Grundmontage";
export type LineId = "Mono 0,20" | "Geflecht 0,15" | "Stark 0,30";
export type HookId = "Haken klein" | "Haken mittel" | "Haken groß";
export type BaitId = "Wurm" | "Mais" | "Kunstköder";
export type Season = "Frühling" | "Sommer" | "Herbst" | "Winter";

export interface AnglingSpot {
  id: SpotId;
  name: string;
  description: string;
  center: { x: number; z: number };
  radius: { x: number; z: number };
  shore: { x: number; z: number };
  waterY: number;
  depth: number;
  current: number;
}

export const SPOTS: readonly AnglingSpot[] = [
  {
    id: "small",
    name: "Kleiner See",
    description: "Ruhiges, flaches Wasser am alten Seesteg. Gut für den Einstieg.",
    center: { x: -11, z: -6 },
    radius: { x: 8.1, z: 7.1 },
    shore: { x: -11, z: 2 },
    waterY: 0.4,
    depth: 1.5,
    current: 0,
  },
  {
    id: "forest",
    name: "Waldsee",
    description: "Schatten, Totholz und tieferes Wasser bieten großen Fischen Deckung.",
    center: { x: -18, z: 12 },
    radius: { x: 4.5, z: 3.6 },
    shore: { x: -13, z: 12 },
    waterY: 0.4,
    depth: 2,
    current: 0,
  },
  {
    id: "river",
    name: "Fluss",
    description: "Eine schmale Strömungsrinne mit kühlerem, bewegtem Wasser.",
    center: { x: 18, z: -10 },
    radius: { x: 2.5, z: 11 },
    shore: { x: 14.5, z: -8 },
    waterY: 0.4,
    depth: 1.7,
    current: 0.42,
  },
  {
    id: "secret",
    name: "Geheimteich",
    description: "Ein kleiner versteckter Teich hinter dem Felsenpfad.",
    center: { x: 4, z: -19 },
    radius: { x: 3.6, z: 3 },
    shore: { x: 4, z: -15.2 },
    waterY: 0.4,
    depth: 1.8,
    current: 0,
  },
  {
    id: "great",
    name: "Großer See",
    description: "Weites Wasser mit Schilfufer und einer kleinen Insel. Am nördlichen Ufer ziehen Friedfische und Barsche vorbei.",
    center: { x: -110, z: -110 },
    radius: { x: 40, z: 30 },
    shore: { x: -110, z: -78 },
    waterY: 0.35,
    depth: 3,
    current: 0,
  },
] as const;

export const RODS = [
  {
    id: "Stipprute" as const,
    description: "Einfach, fein und gut für Friedfische in Ufernähe.",
    minCast: 2.5,
    maxCast: 7,
    maxLength: 55,
    reelRate: 0.15,
  },
  {
    id: "Spinnrute" as const,
    description: "Leicht, vielseitig und für Kunstköder sowie mittlere Räuber geeignet.",
    minCast: 4,
    maxCast: 11,
    maxLength: 82,
    reelRate: 0.18,
  },
  {
    id: "Raubfischrute" as const,
    description: "Kräftige Rute für große Räuber, dafür weniger fein.",
    minCast: 4.5,
    maxCast: 13,
    maxLength: 120,
    reelRate: 0.14,
  },
] as const;

export const RIGS = [
  {
    id: "Posenmontage" as const,
    description: "Der Schwimmer zeigt den Biss sichtbar an; Köder im Mittelwasser.",
    depth: 0.48,
  },
  {
    id: "Grundmontage" as const,
    description: "Der Köder liegt tiefer und erreicht bodennah fressende Arten.",
    depth: 1.18,
  },
] as const;

export const LINES = [
  {
    id: "Mono 0,20" as const,
    description: "Dehnbare Einsteigerschnur; verzeiht kurze Belastungsspitzen.",
    strength: 0.82,
    damping: 0.2,
  },
  {
    id: "Geflecht 0,15" as const,
    description: "Direkter Kontakt und gute Tragkraft, aber wenig Dehnung.",
    strength: 1.02,
    damping: 0.08,
  },
  {
    id: "Stark 0,30" as const,
    description: "Robuste Schnur für große Fische; für feine Bisse weniger sensibel.",
    strength: 1.25,
    damping: 0.14,
  },
] as const;

export const HOOKS = [
  {
    id: "Haken klein" as const,
    description: "Für kleinere Köder und Friedfische.",
    size: 1,
  },
  {
    id: "Haken mittel" as const,
    description: "Vielseitige Größe für Barsch, Forelle und mittlere Friedfische.",
    size: 2,
  },
  {
    id: "Haken groß" as const,
    description: "Für kräftige Montagen und große Räuber.",
    size: 3,
  },
] as const;

export const BAITS = [
  {
    id: "Wurm" as const,
    description: "Vielseitiger Naturköder für viele Friedfische und Barsche.",
  },
  {
    id: "Mais" as const,
    description: "Pflanzlicher Köder, besonders interessant für Karpfenartige.",
  },
  {
    id: "Kunstköder" as const,
    description: "Wird aktiv geführt und spricht vor allem Raubfische an.",
  },
] as const;

export interface AnglingLoadout {
  rod: RodId;
  rig: RigId;
  line: LineId;
  hook: HookId;
  bait: BaitId;
}

export interface AnglingProgress {
  version: 1;
  loadout: AnglingLoadout;
  unlocked: string[];
  spots: SpotId[];
  achievements: string[];
  released: number;
  kept: number;
  inspected: FishName[];
  rulesEnabled: boolean;
  season: Season;
}

export const STARTER_GEAR = [
  "Stipprute",
  "Posenmontage",
  "Mono 0,20",
  "Haken klein",
  "Wurm",
] as const;

const allGear = [...RODS, ...RIGS, ...LINES, ...HOOKS, ...BAITS].map(
  (item) => item.id,
);

export const defaultAngling = (): AnglingProgress => ({
  version: 1,
  loadout: {
    rod: "Stipprute",
    rig: "Posenmontage",
    line: "Mono 0,20",
    hook: "Haken klein",
    bait: "Wurm",
  },
  unlocked: [...STARTER_GEAR],
  spots: ["small"],
  achievements: [],
  released: 0,
  kept: 0,
  inspected: [],
  rulesEnabled: true,
  season: "Sommer",
});

export function readAngling(raw: unknown): AnglingProgress {
  const progress = defaultAngling();
  if (!raw || typeof raw !== "object") return progress;
  const value = raw as Partial<AnglingProgress>;
  if (value.version !== 1) return progress;
  const unlocked = Array.isArray(value.unlocked)
    ? value.unlocked.filter(
        (id): id is string => typeof id === "string" && allGear.includes(id as never),
      )
    : [];
  progress.unlocked = [...new Set([...STARTER_GEAR, ...unlocked])];
  const loadout = value.loadout as Partial<AnglingLoadout> | undefined;
  const valid = <T extends string>(id: unknown, values: readonly { id: T }[]) =>
    typeof id === "string" && values.some((item) => item.id === id);
  if (valid(loadout?.rod, RODS) && progress.unlocked.includes(loadout!.rod!))
    progress.loadout.rod = loadout!.rod!;
  if (valid(loadout?.rig, RIGS) && progress.unlocked.includes(loadout!.rig!))
    progress.loadout.rig = loadout!.rig!;
  if (valid(loadout?.line, LINES) && progress.unlocked.includes(loadout!.line!))
    progress.loadout.line = loadout!.line!;
  if (valid(loadout?.hook, HOOKS) && progress.unlocked.includes(loadout!.hook!))
    progress.loadout.hook = loadout!.hook!;
  if (valid(loadout?.bait, BAITS) && progress.unlocked.includes(loadout!.bait!))
    progress.loadout.bait = loadout!.bait!;
  progress.spots = Array.isArray(value.spots)
    ? [...new Set(value.spots.filter((id): id is SpotId => SPOTS.some((spot) => spot.id === id)))]
    : ["small"];
  if (!progress.spots.includes("small")) progress.spots.unshift("small");
  progress.achievements = Array.isArray(value.achievements)
    ? [...new Set(value.achievements.filter((name): name is string => typeof name === "string" && name.length <= 60))].slice(0, 30)
    : [];
  const count = (number: unknown) =>
    Number.isSafeInteger(number) && Number(number) >= 0 && Number(number) <= 1e6
      ? Number(number)
      : 0;
  progress.released = count(value.released);
  progress.kept = count(value.kept);
  progress.inspected = Array.isArray(value.inspected)
    ? [...new Set(value.inspected.filter((name): name is FishName => FISH.some((fish) => fish.name === name)))]
    : [];
  progress.rulesEnabled = value.rulesEnabled !== false;
  if (["Frühling", "Sommer", "Herbst", "Winter"].includes(value.season || ""))
    progress.season = value.season!;
  return progress;
}

export function updateUnlocks(progress: AnglingProgress, landedCount: number) {
  const before = new Set(progress.unlocked);
  const add = (ids: string[]) => ids.forEach((id) => before.add(id));
  if (landedCount >= 1)
    add(["Mais", "Grundmontage", "Haken mittel"]);
  if (landedCount >= 3)
    add(["Spinnrute", "Kunstköder", "Geflecht 0,15"]);
  if (landedCount >= 7)
    add(["Raubfischrute", "Stark 0,30", "Haken groß"]);
  const gained = [...before].filter((id) => !progress.unlocked.includes(id));
  progress.unlocked = [...before];
  return gained;
}

export function updateAchievements(
  progress: AnglingProgress,
  catches: readonly { species: FishName }[],
) {
  const earned: string[] = [];
  const unique = new Set(catches.map((record) => record.species));
  const award = (name: string, when: boolean) => {
    if (when && !progress.achievements.includes(name)) {
      progress.achievements.push(name);
      earned.push(name);
    }
  };
  award("Erster Fisch", catches.length >= 1);
  award("Fünf unterschiedliche Arten", unique.size >= 5);
  award("Erster Hecht", unique.has("Hecht"));
  award("Zehn erfolgreiche Fänge", catches.length >= 10);
  award("Alle Angelplätze entdeckt", progress.spots.length === SPOTS.length);
  return earned;
}

export function simulatedRule(
  species: FishName,
  length: number,
  season: Season,
) {
  const fish = fishInfo(species);
  const reasons: string[] = [];
  if (length < fish.simulatedMin)
    reasons.push(`Simuliertes Mindestmaß: ${fish.simulatedMin} cm.`);
  if ((fish.closed as readonly string[]).includes(season))
    reasons.push(`Simulierte Schonzeit im ${season}.`);
  return {
    allowed: reasons.length === 0,
    reasons,
    disclaimer:
      "Nur Spielsimulation: Reale Regeln unterscheiden sich nach Bundesland, Gewässer, Erlaubnisschein und Zeitpunkt. BLOCKBOOM ersetzt keinen Fischereischein oder praktische Unterweisung.",
  };
}

export const spotById = (id: SpotId) => SPOTS.find((spot) => spot.id === id)!;
export const rodById = (id: RodId) => RODS.find((item) => item.id === id)!;
export const rigById = (id: RigId) => RIGS.find((item) => item.id === id)!;
export const lineById = (id: LineId) => LINES.find((item) => item.id === id)!;
export const hookById = (id: HookId) => HOOKS.find((item) => item.id === id)!;
