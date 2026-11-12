import * as T from "three";
import { World } from "../world/World";
import { SPOTS, type AnglingSpot } from "./AnglingData";

/** Adds v0.4 water basins to the deterministic base map. Saved deltas are applied afterwards. */
export function enrichFishingWorld(world: World) {
  for (const spot of SPOTS.slice(1)) {
    const minX = Math.floor(spot.center.x - spot.radius.x - 1);
    const maxX = Math.ceil(spot.center.x + spot.radius.x + 1);
    const minZ = Math.floor(spot.center.z - spot.radius.z - 1);
    const maxZ = Math.ceil(spot.center.z + spot.radius.z + 1);
    for (let x = minX; x <= maxX; x++)
      for (let z = minZ; z <= maxZ; z++) {
        const distance = Math.hypot(
          (x + 0.5 - spot.center.x) / spot.radius.x,
          (z + 0.5 - spot.center.z) / spot.radius.z,
        );
        if (distance > 1.08) continue;
        if (distance > 0.88) {
          world.set(x, 0, z, spot.id === "forest" ? "Ton" : "Sand", false);
          continue;
        }
        for (let y = -1; y <= 12; y++) world.set(x, y, z, null, false);
        world.set(
          x,
          -2,
          z,
          spot.id === "river" ? "Schiefer" : spot.id === "forest" ? "Ton" : "Sand",
          false,
        );
      }
  }
}

export class FishingWaters {
  group = new T.Group();
  private surfaces: T.Mesh<T.CircleGeometry, T.MeshPhongMaterial>[] = [];
  private current: T.LineSegments;
  constructor(scene: T.Scene) {
    this.group.name = "Fishing Adventure waters";
    scene.add(this.group);
    const geometry = new T.CircleGeometry(1, 48);
    for (const spot of SPOTS.slice(1)) {
      const surface = new T.Mesh(
        geometry,
        new T.MeshPhongMaterial({
          color: spot.id === "river" ? 0x4c9dac : 0x3f93a4,
          emissive: 0x082630,
          specular: 0xb8eff5,
          shininess: 75,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(spot.center.x, spot.waterY, spot.center.z);
      surface.scale.set(spot.radius.x, spot.radius.z, 1);
      surface.userData.spot = spot.id;
      surface.renderOrder = 2;
      this.surfaces.push(surface);
      this.group.add(surface);
    }
    this.group.add(this.makeReeds(), this.makeLogs());
    this.current = this.makeCurrent();
    this.group.add(this.current);
  }
  private makeReeds() {
    const reeds = new T.InstancedMesh(
      new T.CylinderGeometry(0.025, 0.035, 1, 5),
      new T.MeshLambertMaterial({ color: 0x718d3e }),
      42,
    );
    const dummy = new T.Object3D();
    let index = 0;
    for (const spot of SPOTS)
      for (let i = 0; i < (spot.id === "river" ? 8 : 11); i++) {
        const angle = i * 2.399 + SPOTS.indexOf(spot) * 0.7;
        dummy.position.set(
          spot.center.x + Math.cos(angle) * spot.radius.x * 0.94,
          spot.waterY + 0.45,
          spot.center.z + Math.sin(angle) * spot.radius.z * 0.94,
        );
        dummy.scale.set(1, 0.7 + (i % 4) * 0.16, 1);
        dummy.rotation.y = angle;
        dummy.updateMatrix();
        reeds.setMatrixAt(index++, dummy.matrix);
      }
    reeds.count = index;
    reeds.instanceMatrix.needsUpdate = true;
    reeds.name = "Schilf";
    return reeds;
  }
  private makeLogs() {
    const logs = new T.InstancedMesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshLambertMaterial({ color: 0x654732 }),
      4,
    );
    const dummy = new T.Object3D();
    for (let index = 0; index < 4; index++) {
      const spot = SPOTS[index];
      dummy.position.set(
        spot.center.x + spot.radius.x * 0.55,
        spot.waterY + 0.04,
        spot.center.z - spot.radius.z * 0.25,
      );
      dummy.scale.set(1.5, 0.16, 0.22);
      dummy.rotation.y = 0.25 + index * 0.55;
      dummy.updateMatrix();
      logs.setMatrixAt(index, dummy.matrix);
    }
    logs.instanceMatrix.needsUpdate = true;
    logs.name = "Totholz";
    return logs;
  }
  private makeCurrent() {
    const spot = SPOTS.find((entry) => entry.id === "river")!;
    const positions: number[] = [];
    for (let row = -4; row <= 4; row += 2)
      for (let lane = -1; lane <= 1; lane++) {
        positions.push(
          spot.center.x + lane * 0.55,
          spot.waterY + 0.025,
          spot.center.z + row - 0.6,
          spot.center.x + lane * 0.55,
          spot.waterY + 0.025,
          spot.center.z + row + 0.6,
        );
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    const lines = new T.LineSegments(
      geometry,
      new T.LineBasicMaterial({
        color: 0xb9eef0,
        transparent: true,
        opacity: 0.45,
      }),
    );
    lines.name = "sichtbare Strömung";
    return lines;
  }
  update(time: number) {
    for (let index = 0; index < this.surfaces.length; index++) {
      const surface = this.surfaces[index];
      surface.position.y =
        SPOTS[index + 1].waterY + Math.sin(time * 0.0012 + index) * 0.018;
      surface.rotation.z = Math.sin(time * 0.00016 + index) * 0.01;
    }
    this.current.position.z = ((time * 0.00035) % 1.2) - 0.6;
  }
}

export function nearAnglingSpot(
  x: number,
  y: number,
  z: number,
): AnglingSpot | null {
  return (
    SPOTS.find(
      (spot) =>
        Math.hypot(x - spot.shore.x, z - spot.shore.z) < 4.4 &&
        Math.abs(y - 1) < 4,
    ) || null
  );
}

export function discoverySpot(x: number, z: number) {
  return (
    SPOTS.find(
      (spot) => Math.hypot(x - spot.shore.x, z - spot.shore.z) < 5.5,
    ) || null
  );
}
