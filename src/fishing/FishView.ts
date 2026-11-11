import * as T from "three";
import { FISH } from "./Fishing";
import { Shoal, type FishActor } from "./Shoal";
export class FishView {
  group = new T.Group();
  private meshes: T.InstancedMesh[] = [];
  private dummy = new T.Object3D();
  constructor(
    public shoal: Shoal,
    scene: T.Scene,
  ) {
    scene.add(this.group);
    const geometry = new T.BoxGeometry(1, 1, 1);
    const colors = [0xc5d8de, 0x7eaa4f, 0x6c8864, 0xc9a24c, 0xd5adad];
    for (let i = 0; i < FISH.length; i++)
      for (let part = 0; part < 4; part++) {
        const mesh = new T.InstancedMesh(
          geometry,
          new T.MeshLambertMaterial({
            color:
              part === 0
                ? colors[i]
                : part === 1
                  ? 0xdc9955
                  : part === 2
                    ? 0x324c3a
                    : colors[i],
          }),
          3,
        );
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.frustumCulled = true;
        mesh.boundingSphere = new T.Sphere(new T.Vector3(-10, 0.14, -5), 7.5);
        mesh.userData = { species: i, part };
        this.meshes.push(mesh);
        this.group.add(mesh);
      }
    this.update();
  }
  update() {
    for (const mesh of this.meshes) {
      const { species, part } = mesh.userData;
      for (let j = 0; j < 3; j++) {
        const f = this.shoal.actors[species * 3 + j],
          d = this.dummy;
        const length = f.length / 90;
        d.position.set(f.x, f.y, f.z);
        d.rotation.set(0, f.heading, 0);
        d.scale.set(1, 1, 1);
        const offset =
          part === 1 ? -0.43 : part === 2 ? 0.02 : part === 3 ? 0.25 : 0;
        d.position.x += Math.sin(f.heading) * offset * length;
        d.position.z += Math.cos(f.heading) * offset * length;
        const stout = species === 3 ? 1.5 : species === 2 ? 0.65 : 1;
        d.scale.set(
          (part === 0 ? 0.28 : part === 1 ? 0.32 : 0.06) * length,
          (part === 0 ? 0.22 * stout : part === 2 ? 0.33 : 0.13) * length,
          (part === 0 ? 0.75 : 0.17) * length,
        );
        if (part === 1)
          d.rotation.y += Math.sin(this.shoal.time * 7 + f.phase) * 0.35;
        if (!f.alive) d.scale.setScalar(0);
        d.updateMatrix();
        mesh.setMatrixAt(j, d.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  hit(
    ray: T.Raycaster,
    range: number,
  ): { fish: FishActor; distance: number } | null {
    const hit = ray
      .intersectObjects(this.meshes, false)
      .find(
        (h) =>
          h.distance <= range &&
          h.instanceId !== undefined &&
          this.shoal.actors[
            (h.object.userData.species as number) * 3 + h.instanceId!
          ].alive,
      );
    if (!hit) return null;
    return {
      fish: this.shoal.actors[
        hit.object.userData.species * 3 + hit.instanceId!
      ],
      distance: hit.distance,
    };
  }
}
