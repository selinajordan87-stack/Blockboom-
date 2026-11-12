import {
  hookById,
  lineById,
  rigById,
  rodById,
  type AnglingLoadout,
  type AnglingSpot,
} from "./AnglingData";
import { fishInfo, type FishName } from "./Fishing";
import { Shoal, type FishActor } from "./Shoal";

export type AnglingState =
  | "idle"
  | "charging"
  | "flying"
  | "waiting"
  | "bite"
  | "drill"
  | "landed"
  | "escaped";

export type AnglingEvent =
  | "cast-landed"
  | "bite"
  | "bite-missed"
  | "line-broken"
  | "slack-escape"
  | "landed"
  | "no-fish";

export interface CastVector {
  x: number;
  y: number;
  z: number;
}

export class AnglingEngine {
  state: AnglingState = "idle";
  power = 0;
  tension = 0;
  progress = 0;
  resistance = 0;
  reeling = false;
  target: number | null = null;
  landedFish: FishActor | null = null;
  spot: AnglingSpot | null = null;
  loadout: AnglingLoadout | null = null;
  preferred: FishName | undefined;
  bobber: CastVector = { x: -11, y: 0.5, z: -3 };
  castStart: CastVector = { x: 0, y: 0, z: 0 };
  castEnd: CastVector = { x: 0, y: 0, z: 0 };
  castDistance = 0;
  private chargeStarted = 0;
  private flightStarted = 0;
  private flightDuration = 0;
  private biteReady = 0;
  private biteDeadline = 0;
  private overload = 0;
  private slack = 0;
  private drillTime = 0;

  constructor(
    public shoal: Shoal,
    private rng: () => number = Math.random,
  ) {}

  beginCharge(now: number) {
    if (this.state !== "idle") return false;
    this.state = "charging";
    this.chargeStarted = now;
    this.power = 0.08;
    this.landedFish = null;
    return true;
  }

  updateCharge(now: number) {
    if (this.state !== "charging") return this.power;
    const phase = ((now - this.chargeStarted) % 1800) / 1800;
    this.power = 0.08 + Math.sin(phase * Math.PI) * 0.92;
    return this.power;
  }

  releaseCast(
    now: number,
    spot: AnglingSpot,
    loadout: AnglingLoadout,
    origin: CastVector,
    direction: CastVector,
    preferred?: FishName,
  ) {
    if (this.state !== "charging") return false;
    this.updateCharge(now);
    const rod = rodById(loadout.rod);
    const desiredDistance =
      rod.minCast + (rod.maxCast - rod.minCast) * this.power;
    const horizontal = Math.hypot(direction.x, direction.z) || 1;
    let x = origin.x + (direction.x / horizontal) * desiredDistance;
    let z = origin.z + (direction.z / horizontal) * desiredDistance;
    const edge = Math.hypot(
      (x - spot.center.x) / (spot.radius.x * 0.82),
      (z - spot.center.z) / (spot.radius.z * 0.82),
    );
    if (edge > 1) {
      x = spot.center.x + (x - spot.center.x) / edge;
      z = spot.center.z + (z - spot.center.z) / edge;
    }
    this.castStart = { ...origin };
    this.castEnd = { x, y: spot.waterY + 0.1, z };
    this.bobber = { ...origin };
    this.castDistance = Math.hypot(x - origin.x, z - origin.z);
    this.spot = spot;
    this.loadout = { ...loadout };
    this.preferred = preferred;
    this.flightStarted = now;
    this.flightDuration = 430 + this.power * 520;
    this.state = "flying";
    this.target = null;
    this.shoal.stopAttracting();
    return true;
  }

  hook(now: number) {
    if (this.state !== "bite" || now > this.biteDeadline) return false;
    this.state = "drill";
    this.tension = 0.32;
    this.progress = 0;
    this.overload = 0;
    this.slack = 0;
    this.drillTime = 0;
    this.reeling = false;
    return true;
  }

  setReeling(active: boolean) {
    if (this.state === "drill") this.reeling = active;
  }

  tick(now: number, dt: number): AnglingEvent | null {
    if (this.state === "charging") {
      this.updateCharge(now);
      return null;
    }
    if (this.state === "flying") {
      const t = Math.min(1, (now - this.flightStarted) / this.flightDuration);
      this.bobber.x = lerp(this.castStart.x, this.castEnd.x, t);
      this.bobber.z = lerp(this.castStart.z, this.castEnd.z, t);
      this.bobber.y =
        lerp(this.castStart.y, this.castEnd.y, t) + Math.sin(t * Math.PI) * (1.4 + this.power);
      if (t >= 1) {
        this.state = "waiting";
        this.bobber = { ...this.castEnd };
        this.target = this.chooseTarget();
        if (this.target === null) {
          this.escape();
          return "no-fish";
        }
        const score = this.compatibility(
          this.shoal.actors.find((fish) => fish.id === this.target)!,
        );
        this.biteReady = now + 1600 + (1 - Math.min(1, score / 8)) * 5200;
        this.shoal.attract(this.target, this.bobber);
        return "cast-landed";
      }
      return null;
    }
    const target = this.shoal.actors.find(
      (fish) => fish.id === this.target && fish.alive,
    );
    if (["waiting", "bite", "drill"].includes(this.state) && !target) {
      this.escape();
      return "no-fish";
    }
    if (this.state === "waiting" && target) {
      if (this.spot?.current) {
        this.bobber.z += this.spot.current * dt * 0.22;
        const limit = this.spot.center.z + this.spot.radius.z * 0.7;
        if (this.bobber.z > limit)
          this.bobber.z = this.spot.center.z - this.spot.radius.z * 0.7;
      }
      this.shoal.attract(target.id, this.bobber);
      if (
        now >= this.biteReady &&
        Math.hypot(
          target.x - this.bobber.x,
          target.y - this.bobber.y,
          target.z - this.bobber.z,
        ) < 0.8
      ) {
        this.state = "bite";
        this.biteDeadline = now + 4200;
        this.bobber.y = (this.spot?.waterY || 0.4) - 0.18;
        return "bite";
      }
      return null;
    }
    if (this.state === "bite") {
      this.bobber.y =
        (this.spot?.waterY || 0.4) -
        0.17 -
        Math.abs(Math.sin(now * 0.018)) * 0.08;
      if (now > this.biteDeadline) {
        this.escape();
        return "bite-missed";
      }
      return null;
    }
    if (this.state === "drill" && target && this.loadout) {
      this.drillTime += dt;
      const info = fishInfo(target.species);
      const line = lineById(this.loadout.line);
      const rod = rodById(this.loadout.rod);
      const size = Math.min(1, target.length / info.max);
      this.resistance = Math.min(
        0.96,
        0.28 + size * 0.46 + (info.behavior === "predator" ? 0.12 : 0),
      );
      const pulse =
        0.42 +
        Math.abs(Math.sin(this.drillTime * (2.2 + info.speed * 2) + target.phase)) * 0.58;
      if (this.reeling) {
        this.tension +=
          (0.3 + this.resistance * pulse * 0.72 - line.damping * 0.18) * dt;
        this.progress +=
          rod.reelRate * (1.18 - this.resistance * 0.38) * dt;
        this.slack = Math.max(0, this.slack - dt * 2);
      } else {
        this.tension -= (0.34 + line.damping * 0.45) * dt;
        this.progress = Math.max(0, this.progress - this.resistance * 0.012 * dt);
      }
      this.tension = Math.max(0, Math.min(1.35, this.tension));
      if (this.tension > line.strength) this.overload += dt;
      else this.overload = Math.max(0, this.overload - dt * 1.8);
      if (this.tension < 0.045 && !this.reeling) this.slack += dt;
      else this.slack = Math.max(0, this.slack - dt);
      const run = 0.8 + this.resistance * 1.1;
      this.shoal.attract(target.id, {
        x: this.bobber.x + Math.sin(this.drillTime * 2.1 + target.phase) * run,
        y: (this.spot?.waterY || 0.4) - 0.3 - this.resistance * 0.35,
        z: this.bobber.z + Math.cos(this.drillTime * 1.7 + target.phase) * run,
      });
      if (this.overload > 0.32) {
        this.escape();
        return "line-broken";
      }
      if (this.slack > 2.8) {
        this.escape();
        return "slack-escape";
      }
      if (this.progress >= 1) {
        this.landedFish = this.shoal.catch(target.id);
        this.state = "landed";
        this.reeling = false;
        this.tension = 0;
        this.progress = 1;
        this.shoal.stopAttracting();
        return "landed";
      }
    }
    return null;
  }

  finishLanded(release = false) {
    const fish = this.landedFish;
    if (release && fish) this.shoal.release(fish);
    this.reset();
    return fish;
  }

  acknowledgeEscape() {
    if (this.state === "escaped") this.reset();
  }

  cancel() {
    if (this.state === "landed") return;
    this.reset();
  }

  private chooseTarget() {
    if (!this.spot || !this.loadout) return null;
    let candidates = this.shoal.actors.filter(
      (fish) =>
        fish.alive &&
        fish.spot === this.spot!.id &&
        (!this.preferred || fish.species === this.preferred),
    );
    if (!candidates.length && this.preferred)
      candidates = this.shoal.actors.filter(
        (fish) => fish.alive && fish.spot === this.spot!.id,
      );
    if (!candidates.length) return null;
    const weighted = candidates.map((fish) => ({
      fish,
      weight: Math.max(0.05, this.compatibility(fish)),
    }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.rng() * total;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.fish.id;
    }
    return weighted.at(-1)!.fish.id;
  }

  private compatibility(fish: FishActor) {
    if (!this.loadout) return 0;
    const info = fishInfo(fish.species);
    const hook = hookById(this.loadout.hook);
    const rig = rigById(this.loadout.rig);
    const rod = rodById(this.loadout.rod);
    const expectedHook = fish.length < 34 ? 1 : fish.length < 62 ? 2 : 3;
    let score = (info.baits as readonly string[]).includes(this.loadout.bait)
      ? 4.2
      : 0.45;
    score += Math.max(0.15, 1.8 - Math.abs(hook.size - expectedHook) * 0.8);
    score += Math.max(0.15, 1.6 - Math.abs(rig.depth - info.depth));
    score *= fish.length <= rod.maxLength ? 1 : 0.12;
    return score;
  }

  private escape() {
    this.state = "escaped";
    this.reeling = false;
    this.tension = 0;
    this.progress = 0;
    this.target = null;
    this.shoal.stopAttracting();
  }

  private reset() {
    this.state = "idle";
    this.power = 0;
    this.tension = 0;
    this.progress = 0;
    this.resistance = 0;
    this.reeling = false;
    this.target = null;
    this.landedFish = null;
    this.spot = null;
    this.loadout = null;
    this.preferred = undefined;
    this.overload = 0;
    this.slack = 0;
    this.shoal.stopAttracting();
  }
}

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
