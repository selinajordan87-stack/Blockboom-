export const FISH = [
  {
    name: "Rotauge",
    description: "Silberner Schwarmfisch mit rötlicher Iris und roten Flossen.",
    habitat: "Ruhige Seen, langsam fließende Bereiche und pflanzenreiche Ufer",
    food: "Kleintiere, Insektenlarven und Pflanzenteile",
    features: "seitlich flacher Körper, silberne Flanken, rote Augen und Flossen",
    color: 0xb9cbd0,
    accent: 0xd86c55,
    min: 18,
    max: 38,
    simulatedMin: 18,
    speed: 0.34,
    depth: 0.42,
    stout: 0.9,
    behavior: "school",
    baits: ["Wurm", "Mais"],
    spots: ["small", "forest", "river"],
    closed: [],
  },
  {
    name: "Flussbarsch",
    description: "Gestreifter Räuber mit zwei Rückenflossen und orangefarbenen Bauchflossen.",
    habitat: "Seen und Flüsse mit Strukturen, Kanten oder Wasserpflanzen",
    food: "Insektenlarven, Krebstiere und kleinere Fische",
    features: "dunkle Querbänder, stachelige erste Rückenflosse, rötliche Flossen",
    color: 0x7fa754,
    accent: 0xe37b45,
    min: 22,
    max: 48,
    simulatedMin: 25,
    speed: 0.42,
    depth: 0.58,
    stout: 1,
    behavior: "hunter",
    baits: ["Wurm", "Kunstköder"],
    spots: ["small", "forest", "river", "secret"],
    closed: [],
  },
  {
    name: "Hecht",
    description: "Langgestreckter Lauerjäger mit breitem Maul und weit hinten sitzender Rückenflosse.",
    habitat: "Pflanzenreiche Ufer, Schilfkanten und Deckung in Seen oder Flüssen",
    food: "Vor allem Fische, gelegentlich andere kleine Wassertiere",
    features: "langer Körper, heller Fleckenmix, schnabelförmiges Maul",
    color: 0x597653,
    accent: 0xb9c77b,
    min: 52,
    max: 98,
    simulatedMin: 55,
    speed: 0.28,
    depth: 0.66,
    stout: 0.62,
    behavior: "predator",
    baits: ["Kunstköder"],
    spots: ["forest", "river", "secret"],
    closed: ["Frühling"],
  },
  {
    name: "Karpfen",
    description: "Kräftiger Friedfisch mit großen Schuppen und Barteln am Maul.",
    habitat: "Warme, ruhige und nährstoffreiche Seen mit weichem Grund",
    food: "Bodentiere, Muscheln, Larven, Samen und Pflanzenteile",
    features: "hoher kräftiger Körper, lange Rückenflosse, zwei Bartelpaare",
    color: 0xb89445,
    accent: 0xd1b66d,
    min: 38,
    max: 82,
    simulatedMin: 40,
    speed: 0.24,
    depth: 1.15,
    stout: 1.5,
    behavior: "bottom",
    baits: ["Mais", "Wurm"],
    spots: ["small", "forest", "secret"],
    closed: [],
  },
  {
    name: "Forelle",
    description: "Stromlinienförmiger Fisch mit Punkten, angepasst an kühles sauerstoffreiches Wasser.",
    habitat: "Kühle Bäche, Flüsse und klare Seen mit viel Sauerstoff",
    food: "Wasserinsekten, Anflugnahrung und kleine Fische",
    features: "Punktmuster, Fettflosse, kräftige Schwanzflosse",
    color: 0xa9a081,
    accent: 0xd76d61,
    min: 26,
    max: 56,
    simulatedMin: 28,
    speed: 0.55,
    depth: 0.52,
    stout: 0.86,
    behavior: "current",
    baits: ["Wurm", "Kunstköder"],
    spots: ["river", "forest"],
    closed: ["Winter"],
  },
  {
    name: "Zander",
    description: "Schlanker Raubfisch mit großen Augen und zwei deutlich getrennten Rückenflossen.",
    habitat: "Trübere Seen und langsamere Flüsse mit festem oder sandigem Grund",
    food: "Kleine Fische und größere wirbellose Wassertiere",
    features: "große lichtempfindliche Augen, dunkle Bänder, Fangzähne",
    color: 0x87928a,
    accent: 0x4e665c,
    min: 42,
    max: 78,
    simulatedMin: 45,
    speed: 0.36,
    depth: 1.05,
    stout: 0.72,
    behavior: "predator",
    baits: ["Kunstköder"],
    spots: ["forest", "river"],
    closed: ["Frühling"],
  },
  {
    name: "Schleie",
    description: "Olivgrüner Grundfisch mit kleinen Schuppen, abgerundeten Flossen und roten Augen.",
    habitat: "Warme, pflanzenreiche Stillgewässer mit weichem Boden",
    food: "Schnecken, Würmer, Larven und andere Bodentiere",
    features: "olivgrüne Färbung, sehr kleine Schuppen, kurze Barteln",
    color: 0x71854a,
    accent: 0xb26a53,
    min: 28,
    max: 58,
    simulatedMin: 30,
    speed: 0.2,
    depth: 1.18,
    stout: 1.18,
    behavior: "bottom",
    baits: ["Wurm", "Mais"],
    spots: ["forest", "secret"],
    closed: [],
  },
  {
    name: "Brasse",
    description: "Hochrückiger Schwarmfisch, der mit vorstülpbarem Maul Nahrung am Grund sucht.",
    habitat: "Ruhige Flussabschnitte und größere, nährstoffreiche Seen",
    food: "Larven, Würmer, kleine Muscheln und organisches Material",
    features: "sehr hoher seitlich flacher Körper, lange Afterflosse",
    color: 0xa7a78d,
    accent: 0x777a70,
    min: 30,
    max: 64,
    simulatedMin: 32,
    speed: 0.27,
    depth: 1,
    stout: 1.42,
    behavior: "school",
    baits: ["Wurm", "Mais"],
    spots: ["small", "river", "secret"],
    closed: [],
  },
] as const;

export type FishName = (typeof FISH)[number]["name"];
export const fishInfo = (name: FishName) =>
  FISH.find((fish) => fish.name === name)!;

export class Inventory {
  fish: Record<string, number> = Object.fromEntries(
    FISH.map((fish) => [fish.name, 0]),
  );
  add(fish: FishName) {
    this.fish[fish] = (this.fish[fish] || 0) + 1;
  }
  get total() {
    return Object.values(this.fish).reduce((sum, count) => sum + count, 0);
  }
}

/** Legacy timing model retained for old isolated logic tests and save compatibility. */
export class Fishing {
  state: "idle" | "waiting" | "bite" = "idle";
  deadline = 0;
  cast(now: number, rng = Math.random) {
    if (this.state !== "idle") return;
    this.state = "waiting";
    this.deadline = now + 2200 + rng() * 2800;
  }
  tick(now: number) {
    if (this.state === "waiting" && now >= this.deadline) {
      this.state = "bite";
      this.deadline = now + 2800;
    } else if (this.state === "bite" && now > this.deadline) {
      this.state = "idle";
      return "miss";
    }
  }
  reel(now: number, rng = Math.random): FishName | null {
    if (this.state !== "bite" || now > this.deadline) return null;
    this.state = "idle";
    const roll = rng();
    return roll < 0.45 ? "Rotauge" : roll < 0.85 ? "Flussbarsch" : "Hecht";
  }
  cancel() {
    this.state = "idle";
  }
}
