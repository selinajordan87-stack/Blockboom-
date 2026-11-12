import * as T from "three";
import { FISH, fishInfo } from "./Fishing";
import { Shoal, type FishActor } from "./Shoal";

type Part = "body" | "head" | "tail" | "dorsal" | "fins" | "marking";

/** Eight anatomically distinct voxel species rendered in seven shared draw calls. */
export class FishView {
  group = new T.Group();
  showcase = new T.Group();
  private meshes = new Map<Part, T.InstancedMesh>();
  private eyes: T.InstancedMesh;
  private dummy = new T.Object3D();
  private hitPosition = new T.Vector3();
  private hitOffset = new T.Vector3();
  private showcaseMaterials: T.Material[] = [];
  private showcaseUntil = 0;
  private geometries = makeGeometries();
  private colors = new Map<string, T.Color>();

  constructor(
    public shoal: Shoal,
    scene: T.Scene,
    camera?: T.Camera,
  ) {
    this.group.name = "living voxel fish";
    scene.add(this.group);
    const count = shoal.actors.length;
    for (const part of [
      "body",
      "head",
      "tail",
      "dorsal",
      "fins",
      "marking",
    ] as const) {
      const mesh = new T.InstancedMesh(
        this.geometries[part],
        new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }),
        count,
      );
      mesh.name = `Fischteil ${part}`;
      mesh.userData.part = part;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.boundingSphere = new T.Sphere(new T.Vector3(0, 0, 0), 38);
      this.meshes.set(part, mesh);
      this.group.add(mesh);
    }
    this.eyes = new T.InstancedMesh(
      this.geometries.eye,
      new T.MeshBasicMaterial({ color: 0xf7e8c9 }),
      count * 2,
    );
    this.eyes.name = "Fischaugen";
    this.eyes.userData.part = "eyes";
    this.eyes.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.eyes.boundingSphere = new T.Sphere(new T.Vector3(0, 0, 0), 38);
    this.group.add(this.eyes);
    this.showcase.name = "3D-Fangansicht";
    this.showcase.visible = false;
    this.showcase.position.set(0, 0.78, -2.25);
    if (camera) camera.add(this.showcase);
    this.update(0);
  }

  update(time = this.shoal.time) {
    for (const [part, mesh] of this.meshes) {
      for (let index = 0; index < this.shoal.actors.length; index++) {
        const fish = this.shoal.actors[index];
        this.fishMatrix(this.dummy, fish, part, time);
        mesh.setMatrixAt(index, this.dummy.matrix);
        mesh.setColorAt(index, this.partColor(fish, part));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    for (let index = 0; index < this.shoal.actors.length; index++) {
      const fish = this.shoal.actors[index];
      for (let side = -1; side <= 1; side += 2) {
        this.eyeMatrix(this.dummy, fish, side);
        this.eyes.setMatrixAt(index * 2 + (side === -1 ? 0 : 1), this.dummy.matrix);
      }
    }
    this.eyes.instanceMatrix.needsUpdate = true;
    if (this.showcase.visible) {
      this.showcase.rotation.y = Math.sin(time * 0.7) * 0.28;
      this.showcase.rotation.x = Math.sin(time * 0.4) * 0.04;
      if (this.showcaseUntil && performance.now() > this.showcaseUntil)
        this.hideShowcase();
    }
  }

  hit(
    ray: T.Raycaster,
    range: number,
  ): { fish: FishActor; distance: number } | null {
    const hit = ray
      .intersectObjects([...this.meshes.values(), this.eyes], false)
      .find(
        (entry) =>
          entry.distance <= range &&
          entry.instanceId !== undefined &&
          this.shoal.actors[
            entry.object === this.eyes
              ? Math.floor(entry.instanceId / 2)
              : entry.instanceId
          ]?.alive,
      );
    if (!hit || hit.instanceId === undefined) {
      let closest: { fish: FishActor; distance: number } | null = null;
      for (const fish of this.shoal.actors) {
        if (!fish.alive) continue;
        this.hitPosition.set(fish.x, fish.y, fish.z);
        this.hitOffset.copy(this.hitPosition).sub(ray.ray.origin);
        const distance = this.hitOffset.dot(ray.ray.direction);
        if (distance < 0 || distance > range) continue;
        const radius = Math.max(0.19, fish.length / 135);
        if (
          ray.ray.distanceSqToPoint(this.hitPosition) <= radius * radius &&
          (!closest || distance < closest.distance)
        )
          closest = { fish, distance };
      }
      return closest;
    }
    const index =
      hit.object === this.eyes ? Math.floor(hit.instanceId / 2) : hit.instanceId;
    return { fish: this.shoal.actors[index], distance: hit.distance };
  }

  showShowcase(fish: Pick<FishActor, "species" | "length">, persistent = false) {
    this.clearShowcase();
    const info = fishInfo(fish.species);
    const actor: FishActor = {
      id: -1,
      species: fish.species,
      spot: "small",
      length: fish.length,
      weight: 0,
      x: 0,
      y: 0,
      z: 0,
      heading: Math.PI / 2,
      alive: true,
      respawn: 0,
      phase: 0,
    };
    for (const part of [
      "body",
      "head",
      "tail",
      "dorsal",
      "fins",
      "marking",
    ] as const) {
      const material = new T.MeshLambertMaterial({
        color: this.partColor(actor, part),
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new T.Mesh(this.geometries[part], material);
      this.showcaseMaterials.push(material);
      this.fishMatrix(mesh, actor, part, 0, true);
      mesh.renderOrder = 110;
      this.showcase.add(mesh);
    }
    // The showcase presents a clear side view; only the camera-facing eye is
    // drawn so the far eye cannot shine through the depth-independent model.
    for (const side of [-1]) {
      const material = new T.MeshBasicMaterial({
        color: 0xfff1cf,
        depthTest: false,
        depthWrite: false,
      });
      const eye = new T.Mesh(this.geometries.eye, material);
      this.showcaseMaterials.push(material);
      this.eyeMatrix(eye, actor, side, true);
      eye.renderOrder = 111;
      this.showcase.add(eye);
    }
    this.showcase.scale.setScalar(1.35 / Math.max(0.8, info.stout));
    this.showcase.visible = true;
    this.showcaseUntil = persistent ? 0 : performance.now() + 5200;
  }

  hideShowcase() {
    this.showcase.visible = false;
    this.showcaseUntil = 0;
  }

  private fishMatrix(
    object: T.Object3D,
    fish: FishActor,
    part: Part,
    time: number,
    local = false,
  ) {
    const info = fishInfo(fish.species);
    const length = fish.length / 62;
    const heading = fish.heading;
    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);
    const offset =
      part === "head"
        ? 0.43
        : part === "tail"
          ? -0.49
          : part === "dorsal"
            ? -0.03
            : part === "fins"
              ? 0.08
              : 0;
    object.position.set(
      (local ? 0 : fish.x) + forwardX * offset * length,
      (local ? 0 : fish.y) + (part === "dorsal" ? 0.16 : part === "fins" ? -0.07 : 0) * length,
      (local ? 0 : fish.z) + forwardZ * offset * length,
    );
    object.rotation.set(0, heading, 0);
    const bodyWidth = 0.34 * length * Math.min(1.35, info.stout);
    const bodyHeight = 0.25 * length * info.stout;
    if (part === "body")
      object.scale.set(bodyWidth, bodyHeight, 0.72 * length);
    if (part === "head") {
      const longHead = fish.species === "Hecht" || fish.species === "Zander";
      object.scale.set(
        bodyWidth * (longHead ? 0.85 : 0.96),
        bodyHeight * 0.85,
        length * (longHead ? 0.34 : 0.25),
      );
    }
    if (part === "tail") {
      object.scale.set(0.38 * length, 0.42 * length, 0.3 * length);
      object.rotation.y += Math.sin(time * 7 + fish.phase) * 0.38;
    }
    if (part === "dorsal") {
      object.scale.set(0.2 * length, 0.3 * length, 0.32 * length);
      if (fish.species === "Hecht") {
        object.position.x -= forwardX * 0.18 * length;
        object.position.z -= forwardZ * 0.18 * length;
      }
    }
    if (part === "fins")
      object.scale.set(0.63 * length, 0.04 * length, 0.2 * length);
    if (part === "marking") {
      const marked = ["Flussbarsch", "Zander", "Forelle", "Hecht"].includes(
        fish.species,
      );
      object.scale.set(
        marked ? bodyWidth * 1.03 : 0,
        marked ? bodyHeight * 1.02 : 0,
        marked ? 0.09 * length : 0,
      );
      object.position.x -= forwardX * 0.08 * length;
      object.position.z -= forwardZ * 0.08 * length;
    }
    if (!fish.alive && !local) object.scale.setScalar(0);
    object.updateMatrix();
  }

  private eyeMatrix(
    object: T.Object3D,
    fish: FishActor,
    side: number,
    local = false,
  ) {
    const info = fishInfo(fish.species);
    const length = fish.length / 62;
    const heading = fish.heading;
    const forwardX = Math.sin(heading),
      forwardZ = Math.cos(heading),
      rightX = Math.cos(heading),
      rightZ = -Math.sin(heading);
    object.position.set(local ? 0 : fish.x, local ? 0 : fish.y, local ? 0 : fish.z);
    object.position.x += forwardX * 0.53 * length;
    object.position.z += forwardZ * 0.53 * length;
    const sideOffset = side * 0.18 * length * Math.min(1.25, info.stout);
    object.position.x += rightX * sideOffset;
    object.position.z += rightZ * sideOffset;
    object.position.y += 0.07 * length * info.stout;
    object.rotation.set(0, heading, 0);
    object.scale.setScalar(0.055 * length);
    if (!fish.alive && !local) object.scale.setScalar(0);
    object.updateMatrix();
  }

  private partColor(fish: FishActor, part: Part) {
    const key = `${fish.species}:${part}`;
    const cached = this.colors.get(key);
    if (cached) return cached;
    const info = fishInfo(fish.species);
    let color: T.Color;
    if (part === "tail" || part === "fins") color = new T.Color(info.accent);
    else if (part === "dorsal")
      color = new T.Color(info.color).multiplyScalar(0.62);
    else if (part === "marking")
      color = new T.Color(
        fish.species === "Forelle"
          ? 0x654843
          : fish.species === "Hecht"
            ? 0xd0d48f
            : 0x31483b,
      );
    else if (part === "head")
      color = new T.Color(info.color).multiplyScalar(0.88);
    else color = new T.Color(info.color);
    this.colors.set(key, color);
    return color;
  }

  private clearShowcase() {
    this.showcase.clear();
    for (const material of this.showcaseMaterials) material.dispose();
    this.showcaseMaterials.length = 0;
  }
}

function makeGeometries() {
  const tail = new T.ConeGeometry(0.5, 0.8, 3);
  tail.rotateX(Math.PI / 2);
  const dorsal = new T.ConeGeometry(0.5, 0.8, 3);
  dorsal.rotateZ(Math.PI);
  return {
    body: new T.BoxGeometry(1, 1, 1),
    head: new T.BoxGeometry(1, 1, 1),
    tail,
    dorsal,
    fins: new T.BoxGeometry(1, 1, 1),
    marking: new T.BoxGeometry(1, 1, 1),
    eye: new T.SphereGeometry(1, 6, 4),
  };
}
