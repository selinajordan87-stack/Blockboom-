import { it, expect } from "vitest";
import {
  CHALLENGES,
  LearningEngine,
  loadProfile,
  LEARNING_KEY,
} from "../learning/Engine";
import { defaultExpansion } from "../inventory/Equipment";
import { Missions } from "../missions/Missions";
it("enthält 40 eindeutige deutsche Aufgaben und Auswahl variiert mit langsamer Progression", () => {
  expect(CHALLENGES.length).toBeGreaterThanOrEqual(40);
  expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(40);
  const e = new LearningEngine();
  expect(e.profile.mode).toBe("Lern-Challenge");
  let last = "";
  for (let i = 0; i < 20; i++) {
    const c = e.select();
    expect(c.id).not.toBe(last);
    expect(c.hints.length).toBeGreaterThan(0);
    expect(c.speech.length).toBeGreaterThan(0);
    e.assess(c, c.solution);
    last = c.id;
  }
  expect(e.select().level).toBeLessThanOrEqual(3);
});
it("Fehler geben Hilfen ohne Strafe, Überspringen blockiert nicht und Fortschritt ist separat", () => {
  const e = new LearningEngine(),
    c = e.select();
  expect(e.assess(c, "falsch").correct).toBe(false);
  expect(e.assess(c, "falsch").offerHelp).toBe(true);
  expect(e.hint(c)).toBeTruthy();
  e.skip(c);
  expect(e.select().id).not.toBe(c.id);
  let key = "",
    raw = "";
  expect(
    e.save({
      setItem: (k, v) => {
        key = k;
        raw = v;
      },
    }),
  ).toBe(true);
  expect(key).toBe(LEARNING_KEY);
  expect(loadProfile({ getItem: () => raw }).results[c.id].attempts).toBe(2);
  expect(
    e.save({
      setItem: () => {
        throw Error();
      },
    }),
  ).toBe(false);
});
it("drei Missionen verlangen Material/Fang und alle Aufgaben, Belohnung exakt einmal", () => {
  const d = defaultExpansion(),
    m = new Missions(d);
  m.accept("wood");
  expect(m.answer("wood", "Holz")).toBe(false);
  d.materials.Holz = 3;
  m.wood();
  expect(m.answer("wood", "holz")).toBe(false);
  expect(m.answer("wood", "Holz")).toBe(true);
  expect(m.claim("wood")).toBe(true);
  expect(d.materials.Holz).toBe(0);
  expect(m.claim("wood")).toBe(false);
  m.accept("fish");
  m.caught("Hecht");
  expect(m.answer("fish", "Barsch")).toBe(false);
  m.caught("Flussbarsch");
  expect(m.answer("fish", "Barsch")).toBe(true);
  expect(m.claim("fish")).toBe(true);
  m.accept("treasure");
  expect(m.answer("treasure", "Glas")).toBe(true);
  expect(m.answer("treasure", "Holz")).toBe(true);
  expect(m.claim("treasure")).toBe(false);
  expect(m.answer("treasure", "Schatz")).toBe(true);
  expect(m.claim("treasure")).toBe(true);
  expect(d.tokens).toBe(45);
  expect(d.badges.length).toBe(3);
});
it("plant fehlerhafte Aufgaben mit Abstand und sichert ein unlesbares Lernprofil", () => {
  const e = new LearningEngine(),
    first = e.select();
  e.assess(first, "falsch");
  for (let i = 0; i < 3; i++) {
    const c = e.select();
    expect(c.id).not.toBe(first.id);
    e.assess(c, "falsch");
  }
  const backups: Record<string, string> = {};
  const p = loadProfile({
    getItem: () => "{kaputt",
    setItem: (k, v) => (backups[k] = v),
  });
  expect(p.mode).toBe("Lern-Challenge");
  expect(backups[LEARNING_KEY + ".backup"]).toBe("{kaputt");
});
it("Korrekturaufgaben unterscheiden den Fehler vom richtigen Wort", () => {
  const c = CHALLENGES.find((c) => c.kind === "correction")!;
  const e = new LearningEngine();
  expect(c.options).toEqual([]);
  expect(e.assess(c, "Hols").correct).toBe(false);
  expect(e.assess(c, "Holz").correct).toBe(true);
});
