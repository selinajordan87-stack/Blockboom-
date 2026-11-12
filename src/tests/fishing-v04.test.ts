import { describe, expect, it } from "vitest";
import * as T from "three";
import { AnglingEngine, type AnglingEvent } from "../fishing/AnglingEngine";
import {
  SPOTS,
  defaultAngling,
  simulatedRule,
  updateAchievements,
  updateUnlocks,
} from "../fishing/AnglingData";
import { FISH } from "../fishing/Fishing";
import { FishView } from "../fishing/FishView";
import { FishingView } from "../fishing/FishingView";
import { FishingWaters, enrichFishingWorld } from "../fishing/FishingWorld";
import { Shoal } from "../fishing/Shoal";
import { readExpansion } from "../inventory/Equipment";
import { CHALLENGES } from "../learning/Engine";
import { World } from "../world/World";

function cast(engine: AnglingEngine, now = 0) {
  const angling = defaultAngling();
  expect(engine.beginCharge(now)).toBe(true);
  engine.updateCharge(now + 900);
  expect(
    engine.releaseCast(
      now + 900,
      SPOTS[0],
      angling.loadout,
      { x: -11, y: 2.3, z: 2 },
      { x: 0, y: -0.1, z: -1 },
    ),
  ).toBe(true);
  expect(engine.power).toBeGreaterThan(0.9);
  expect(engine.state).toBe("flying");
}

function advanceToBite(engine: AnglingEngine, shoal: Shoal) {
  let now = 900;
  let event: AnglingEvent | null = null;
  for (let index = 0; index < 900 && event !== "bite"; index++) {
    now += 16;
    shoal.update(0.016);
    event = engine.tick(now, 0.016);
  }
  expect(event).toBe("bite");
  expect(engine.target).not.toBeNull();
  return now;
}

describe("Fishing Adventure v0.4", () => {
  it("durchläuft sichtbaren Auswurf, Annäherung, Biss und steuerbaren Drill", () => {
    const shoal = new Shoal();
    const engine = new AnglingEngine(shoal, () => 0);
    cast(engine);
    expect(engine.bobber.y).toBeGreaterThan(SPOTS[0].waterY);
    const biteAt = advanceToBite(engine, shoal);
    expect(engine.hook(biteAt)).toBe(true);
    let now = biteAt;
    let event: AnglingEvent | null = null;
    for (let index = 0; index < 2600 && event !== "landed"; index++) {
      const reel = engine.tension < 0.63;
      engine.setReeling(reel);
      now += 16;
      shoal.update(0.016);
      event = engine.tick(now, 0.016);
      expect(engine.tension).toBeLessThan(1.05);
    }
    expect(event).toBe("landed");
    expect(engine.landedFish?.alive).toBe(false);
    const landed = engine.finishLanded(true);
    expect(landed).not.toBeNull();
    expect(engine.state).toBe("idle");
    expect(shoal.actors.find((fish) => fish.id === landed!.id)?.alive).toBe(true);
  });

  it("lässt einen Fisch bei Überlastung oder dauerhaft loser Schnur entkommen", () => {
    const overloadedShoal = new Shoal();
    const overloaded = new AnglingEngine(overloadedShoal, () => 0);
    cast(overloaded);
    let now = advanceToBite(overloaded, overloadedShoal);
    overloaded.hook(now);
    overloaded.setReeling(true);
    let result: AnglingEvent | null = null;
    for (let index = 0; index < 800 && !result; index++) {
      now += 16;
      overloadedShoal.update(0.016);
      result = overloaded.tick(now, 0.016);
    }
    expect(result).toBe("line-broken");

    const slackShoal = new Shoal();
    const slack = new AnglingEngine(slackShoal, () => 0);
    cast(slack);
    now = advanceToBite(slack, slackShoal);
    slack.hook(now);
    result = null;
    for (let index = 0; index < 800 && !result; index++) {
      now += 16;
      slackShoal.update(0.016);
      result = slack.tick(now, 0.016);
    }
    expect(result).toBe("slack-escape");
  });

  it("rendert acht unterscheidbare Arten mit begrenzten gemeinsamen Draw-Objekten", () => {
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera();
    scene.add(camera);
    const shoal = new Shoal();
    const fish = new FishView(shoal, scene, camera);
    new FishingWaters(scene);
    new FishingView(scene);
    expect(FISH).toHaveLength(8);
    expect(new Set(shoal.actors.map((actor) => actor.species)).size).toBe(8);
    expect(fish.group.children).toHaveLength(7);
    expect(
      fish.group.children.every((child) => child instanceof T.InstancedMesh),
    ).toBe(true);
    fish.showShowcase(shoal.actors[0], true);
    expect(fish.showcase.visible).toBe(true);
    expect(fish.showcase.children.length).toBe(8);
  });

  it("wendet simulierte Regeln transparent an und schaltet Ausrüstung durchs Spielen frei", () => {
    const protectedFish = simulatedRule("Hecht", 40, "Frühling");
    expect(protectedFish.allowed).toBe(false);
    expect(protectedFish.reasons).toHaveLength(2);
    expect(protectedFish.disclaimer).toContain("Bundesland");
    const progress = defaultAngling();
    expect(updateUnlocks(progress, 1)).toContain("Mais");
    expect(updateUnlocks(progress, 3)).toContain("Spinnrute");
    progress.spots = SPOTS.map((spot) => spot.id);
    const earned = updateAchievements(progress, [
      { species: "Hecht" },
      { species: "Rotauge" },
      { species: "Flussbarsch" },
      { species: "Karpfen" },
      { species: "Forelle" },
    ]);
    expect(earned).toContain("Fünf unterschiedliche Arten");
    expect(earned).toContain("Alle Angelplätze entdeckt");
  });

  it("migriert Erweiterungen additiv und lässt gespeicherte Weltzellen neue Gewässer überstimmen", () => {
    const old = readExpansion({
      version: 1,
      edition: 2,
      catches: [
        { species: "Flussbarsch", length: 31, method: "Angel" },
      ],
      view: { fov: 72, sensitivity: 1 },
    });
    expect(old.catches).toHaveLength(1);
    expect(old.angling.loadout.rod).toBe("Stipprute");
    expect(old.angling.spots).toEqual(["small"]);
    const world = new World();
    enrichFishingWorld(world);
    world.apply({ "-18,0,12": "Glas" });
    expect(world.get(-18, 0, 12)).toBe("Glas");
  });

  it("liefert 60 neue eindeutige Angelaufgaben mit getrennten Niveaus", () => {
    const fishing = CHALLENGES.filter((challenge) =>
      challenge.id.startsWith("fish-"),
    );
    expect(fishing).toHaveLength(60);
    expect(new Set(fishing.map((challenge) => challenge.id)).size).toBe(60);
    expect(fishing.every((challenge) => challenge.knowledge && challenge.writing)).toBe(true);
    for (const challenge of fishing.filter((entry) => entry.options.length))
      expect(challenge.options).toContain(challenge.solution);
  });
});
