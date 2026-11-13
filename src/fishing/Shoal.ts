import { FISH, fishInfo, type FishName } from "./Fishing";
import { spotById, type SpotId, type AnglingSpot } from "./AnglingData";

export const FISH_PER_SPECIES = 3;
export const MAX_FISH_ACTORS=32;
// Large lakes need visible fish near a reachable shore, rather than a small
// school hidden at the distant centre (which also contains an island).
const swimCenter=(spot:AnglingSpot)=>spot.id==="great"?{x:spot.shore.x,z:spot.shore.z-11.5}:spot.center;

export interface FishActor {
  id: number;
  species: FishName;
  spot: SpotId;
  length: number;
  weight: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  alive: boolean;
  respawn: number;
  phase: number;
}

export class Shoal {
  actors: FishActor[] = FISH.flatMap((fish, speciesIndex) =>
    Array.from({ length: FISH_PER_SPECIES }, (_, index) => {
      const spot = spotById(fish.spots[index % fish.spots.length] as SpotId);
      const length = Math.round(
        fish.min + (fish.max - fish.min) * (0.24 + index * 0.25),
      );
      return {
        id: speciesIndex * FISH_PER_SPECIES + index,
        species: fish.name,
        spot: spot.id,
        length,
        weight: estimateWeight(fish.name, length),
        x: spot.center.x + Math.cos(speciesIndex * 1.2 + index) * (1.2 + index * 0.5),
        y: spot.waterY - Math.min(spot.depth - 0.2, fish.depth + index * 0.08),
        z: spot.center.z + Math.sin(speciesIndex * 1.2 + index) * (1.1 + index * 0.55),
        heading: 0,
        alive: true,
        respawn: 0,
        phase: speciesIndex * 0.8 + index * 0.73,
      };
    }),
  ).slice(0,MAX_FISH_ACTORS);
  target: number | null = null;
  lure = { x: -11, y: 0.05, z: -3 };
  /** Compatibility alias used by v0.2 diagnostics and tests. */
  bobber = this.lure;
  time = 0;

  constructor(){
    const spot=spotById("great"),center=swimCenter(spot);
    const species:FishName[]=["Rotauge","Flussbarsch","Hecht","Karpfen","Brasse"];
    const capacity=Math.min(species.length,MAX_FISH_ACTORS-this.actors.length);
    for(let i=0;i<capacity;i++){
      const fish=fishInfo(species[i]),length=Math.round(fish.min+(fish.max-fish.min)*(.24+i*.035));
      this.actors.push({id:this.actors.length,species:fish.name,spot:spot.id,length,weight:estimateWeight(fish.name,length),x:center.x+Math.cos(i*1.9)*1.8,y:spot.waterY-Math.min(spot.depth-.2,fish.depth),z:center.z+Math.sin(i*1.9)*1.4,heading:0,alive:true,respawn:0,phase:i*.73});
    }
  }

  update(dt: number) {
    this.time += dt;
    for (const fish of this.actors) {
      if (!fish.alive) {
        if (this.time >= fish.respawn) fish.alive = true;
        else continue;
      }
      const info = fishInfo(fish.species);
      const spot = spotById(fish.spot);
      const center=swimCenter(spot);
      let tx: number;
      let ty: number;
      let tz: number;
      if (this.target === fish.id) {
        tx = this.lure.x;
        ty = this.lure.y;
        tz = this.lure.z;
      } else {
        const angle = this.time * info.speed + fish.phase;
        const radius = 1.15 + (fish.id % FISH_PER_SPECIES) * 0.62;
        tx = center.x + Math.cos(angle) * radius;
        tz =
          center.z +
          Math.sin(angle) * radius * (spot.id === "river" ? 2.6 : 0.82) +
          (spot.id === "river" ? Math.sin(this.time * 0.2 + fish.phase) : 0);
        ty = spot.waterY - Math.min(spot.depth - 0.18, info.depth);
        if (info.behavior === "school") {
          tx += Math.cos(this.time * 0.3 + Math.floor(fish.id / 3)) * 0.35;
          tz += Math.sin(this.time * 0.3 + Math.floor(fish.id / 3)) * 0.35;
        }
        if (
          info.behavior === "predator" &&
          Math.sin(this.time * 0.7 + fish.phase) > 0.72
        ) {
          const prey = this.actors
            .filter(
              (candidate) =>
                candidate.alive &&
                candidate.spot === fish.spot &&
                candidate.length < fish.length * 0.62,
            )
            .sort(
              (a, b) =>
                Math.hypot(a.x - fish.x, a.z - fish.z) -
                Math.hypot(b.x - fish.x, b.z - fish.z),
            )[0];
          if (prey) {
            tx = prey.x;
            ty = prey.y;
            tz = prey.z;
          }
        }
      }
      const dx = tx - fish.x;
      const dy = ty - fish.y;
      const dz = tz - fish.z;
      const distance = Math.hypot(dx, dy, dz);
      const lureSpeed = this.target === fish.id ? 1.4 + info.speed * 2 : 0.75 + info.speed;
      const step = Math.min(distance, dt * lureSpeed);
      if (distance > 0.025) {
        fish.x += (dx / distance) * step;
        fish.y += (dy / distance) * step;
        fish.z += (dz / distance) * step;
        fish.heading = Math.atan2(dx, dz);
      }
      fish.y += Math.sin(this.time * 2.2 + fish.phase) * 0.002;
      const edge = Math.hypot(
        (fish.x - spot.center.x) / (spot.radius.x * 0.8),
        (fish.z - spot.center.z) / (spot.radius.z * 0.8),
      );
      if (edge > 1) {
        fish.x = spot.center.x + (fish.x - spot.center.x) / edge;
        fish.z = spot.center.z + (fish.z - spot.center.z) / edge;
      }
    }
  }

  attract(id: number, position: { x: number; y: number; z: number }) {
    this.target = id;
    Object.assign(this.lure, position);
  }

  stopAttracting() {
    this.target = null;
  }

  catch(id: number) {
    const fish = this.actors.find((candidate) => candidate.id === id && candidate.alive);
    if (!fish) return null;
    fish.alive = false;
    fish.respawn = this.time + 35;
    if (this.target === id) this.target = null;
    return { ...fish };
  }

  release(caught: FishActor) {
    const fish = this.actors.find((candidate) => candidate.id === caught.id);
    if (!fish) return;
    const spot = spotById(fish.spot);
    const center=swimCenter(spot);
    fish.alive = true;
    fish.respawn = 0;
    fish.x = center.x;
    fish.z = center.z;
    fish.y = spot.waterY - fishInfo(fish.species).depth;
  }
}

export function estimateWeight(species: FishName, length: number) {
  const info = fishInfo(species);
  const factor = 0.0065 * info.stout;
  return Math.max(40, Math.round(factor * length ** 3));
}

/** v0.2 interaction retained while v0.4 uses AnglingEngine. */
export class LivingFishing {
  state: "idle" | "waiting" | "bite" = "idle";
  deadline = 0;
  target: number | null = null;
  constructor(public shoal: Shoal) {}
  cast(now: number, preferred?: FishName) {
    if (this.state !== "idle") return false;
    const available = this.shoal.actors.filter(
      (fish) =>
        fish.alive &&
        fish.spot === "small" &&
        (!preferred || fish.species === preferred),
    );
    const fish = available.sort(
      (a, b) =>
        Math.hypot(a.x + 11, a.z + 3) - Math.hypot(b.x + 11, b.z + 3),
    )[0];
    if (!fish) return false;
    this.target = fish.id;
    this.shoal.attract(fish.id, { x: -11, y: 0.05, z: -3 });
    this.state = "waiting";
    this.deadline = now + 2500;
    return true;
  }
  tick(now: number) {
    const fish = this.shoal.actors.find(
      (candidate) => candidate.id === this.target && candidate.alive,
    );
    if (this.state !== "idle" && !fish) {
      this.cancel();
      return "miss";
    }
    if (
      this.state === "waiting" &&
      now >= this.deadline &&
      fish &&
      Math.hypot(fish.x + 11, fish.z + 3) < 0.7
    ) {
      this.state = "bite";
      this.deadline = now + 3500;
    } else if (this.state === "bite" && now > this.deadline) {
      this.cancel();
      return "miss";
    }
  }
  reel(now: number) {
    if (this.state !== "bite" || now > this.deadline || this.target === null)
      return null;
    const fish = this.shoal.catch(this.target);
    this.cancel();
    return fish;
  }
  cancel() {
    this.state = "idle";
    this.target = null;
    this.shoal.stopAttracting();
  }
}
