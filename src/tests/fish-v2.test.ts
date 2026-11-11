import { it, expect } from "vitest";
import { Shoal, LivingFishing } from "../fishing/Shoal";
it("hält fünf echte bewegte Arten im Wasser und fängt genau ein bestimmtes Tier", () => {
  const s = new Shoal();
  expect(new Set(s.actors.map((f) => f.species)).size).toBe(5);
  const x = s.actors[0].x;
  for (let i = 0; i < 300; i++) s.update(0.016);
  expect(s.actors[0].x).not.toBe(x);
  expect(
    s.actors.every(
      (f) => Math.hypot((f.x + 10) / 5.3, (f.z + 5) / 4.9) <= 1.001,
    ),
  ).toBe(true);
  expect(s.catch(0)?.species).toBe("Rotauge");
  expect(s.catch(0)).toBeNull();
  s.update(21);
  expect(s.actors[0].alive).toBe(true);
});
it("ein sichtbarer Fisch schwimmt zum Schwimmer, erst dann ist ein Fang möglich", () => {
  const s = new Shoal(),
    f = new LivingFishing(s);
  expect(f.cast(0, "Flussbarsch")).toBe(true);
  expect(f.reel(100)).toBeNull();
  for (let n = 0; n < 5000; n += 16) {
    s.update(0.016);
    f.tick(n);
    if (f.state === "bite") {
      const id = f.target;
      expect(f.reel(n)?.species).toBe("Flussbarsch");
      expect(s.actors.find((a) => a.id === id)?.alive).toBe(false);
      return;
    }
  }
  throw Error("Kein tatsächlicher Biss");
});
