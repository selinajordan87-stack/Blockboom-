export const FISH = [
  {
    name: "Rotauge",
    description: "Silberne Schuppen, rote Augen: Es lebt gern im Schwarm.",
  },
  {
    name: "Flussbarsch",
    description:
      "Dunkle Streifen und stachelige Rückenflossen. Ein flinker Jäger.",
  },
  {
    name: "Hecht",
    description:
      "Ein Meister im Lauern. Zwischen Wasserpflanzen wartet er auf Beute.",
  },
] as const;
export type FishName = (typeof FISH)[number]["name"];
export class Inventory {
  fish: Record<FishName, number> = { Rotauge: 0, Flussbarsch: 0, Hecht: 0 };
  add(f: FishName) {
    this.fish[f]++;
  }
  get total() {
    return Object.values(this.fish).reduce((a, b) => a + b, 0);
  }
}
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
    const r = rng();
    return r < 0.45 ? "Rotauge" : r < 0.85 ? "Flussbarsch" : "Hecht";
  }
  cancel() {
    this.state = "idle";
  }
}
