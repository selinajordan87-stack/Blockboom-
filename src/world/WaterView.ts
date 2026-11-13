import * as T from "three";

/** Two inexpensive layers create depth and movement without a custom shader. */
export class WaterView {
  group = new T.Group();
  surface: T.Mesh<T.CircleGeometry, T.MeshPhongMaterial>;
  private depth: T.Mesh<T.CircleGeometry, T.MeshLambertMaterial>;
  private baseY = 0.38;
  constructor(scene: T.Scene, edition: 1 | 2 | 3 | 4) {
    const geometry = new T.CircleGeometry(1, 64);
    this.surface = new T.Mesh(
      geometry,
      new T.MeshPhongMaterial({
        color: 0x43a9bb,
        emissive: 0x082b38,
        specular: 0xc8f7ff,
        shininess: 95,
        transparent: true,
        opacity: 0.5,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    this.depth = new T.Mesh(
      geometry.clone(),
      new T.MeshLambertMaterial({
        color: 0x256a82,
        transparent: true,
        opacity: 0.2,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    const wide = edition >= 2;
    this.group.position.set(wide ? -11 : -9.8, 0, wide ? -6 : -4.9);
    // These children already lie in XZ. Scaling world Y distorted the water
    // into a two-block ribbon floating above the lake instead of filling it.
    this.group.scale.set(wide ? 8.3 : 6.4, 1, wide ? 7.4 : 6.15);
    this.surface.rotation.x = this.depth.rotation.x = -Math.PI / 2;
    this.surface.position.y = this.baseY;
    this.depth.position.y = this.baseY - 0.08;
    this.surface.renderOrder = 2;
    this.depth.renderOrder = 1;
    this.group.add(this.depth, this.surface);
    scene.add(this.group);
  }
  update(time: number) {
    const wave = Math.sin(time * 0.001) * 0.022;
    this.surface.position.y = this.baseY + wave;
    this.surface.rotation.z = Math.sin(time * 0.00013) * 0.012;
    this.depth.position.y = this.baseY - 0.08 - wave * 0.35;
    this.surface.material.opacity = 0.48 + Math.sin(time * 0.0007) * 0.025;
  }
  get level() {
    return this.surface.position.y;
  }
}
