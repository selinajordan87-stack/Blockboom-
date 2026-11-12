import * as T from "three";
import type { AnglingEngine } from "./AnglingEngine";

/** One dynamic line and a small shared bobber group; no per-frame geometry allocation. */
export class FishingView {
  group = new T.Group();
  bobber = new T.Group();
  line: T.Line<T.BufferGeometry, T.LineBasicMaterial>;
  wake: T.Mesh<T.RingGeometry, T.MeshBasicMaterial>;
  private linePositions = new Float32Array(6);
  constructor(scene: T.Scene) {
    this.group.name = "Angel, Schnur und Schwimmer";
    const white = new T.Mesh(
      new T.CylinderGeometry(0.055, 0.07, 0.22, 8),
      new T.MeshLambertMaterial({ color: 0xf4ead0 }),
    );
    const red = new T.Mesh(
      new T.CylinderGeometry(0.05, 0.055, 0.2, 8),
      new T.MeshLambertMaterial({ color: 0xe65f4d }),
    );
    white.position.y = -0.07;
    red.position.y = 0.14;
    this.bobber.add(white, red);
    this.bobber.name = "sichtbarer Schwimmer";
    this.group.add(this.bobber);
    const lineGeometry = new T.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new T.BufferAttribute(this.linePositions, 3),
    );
    this.line = new T.Line(
      lineGeometry,
      new T.LineBasicMaterial({
        color: 0xe9ede2,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.line.frustumCulled = false;
    this.line.name = "Angelschnur";
    this.group.add(this.line);
    this.wake = new T.Mesh(
      new T.RingGeometry(0.12, 0.16, 18),
      new T.MeshBasicMaterial({
        color: 0xc7f4f1,
        transparent: true,
        opacity: 0.5,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    this.wake.rotation.x = -Math.PI / 2;
    this.wake.name = "Schwimmer-Wasserring";
    this.group.add(this.wake);
    scene.add(this.group);
    this.group.visible = false;
  }
  update(engine: AnglingEngine, rodTip: T.Vector3, time: number) {
    const visible = !["idle", "charging", "escaped", "landed"].includes(
      engine.state,
    );
    this.group.visible = visible;
    if (!visible) return;
    const bite = engine.state === "bite";
    const drill = engine.state === "drill";
    const wave =
      engine.state === "waiting"
        ? Math.sin(time * 0.003) * 0.025
        : drill
          ? Math.sin(time * 0.012) * 0.05
          : 0;
    this.bobber.position.set(
      engine.bobber.x,
      engine.bobber.y + wave,
      engine.bobber.z,
    );
    this.bobber.rotation.z = drill
      ? Math.sin(time * 0.018) * 0.35
      : Math.sin(time * 0.002) * 0.06;
    this.wake.visible = engine.state !== "flying";
    this.wake.position.set(
      engine.bobber.x,
      (engine.spot?.waterY || engine.bobber.y) + 0.015,
      engine.bobber.z,
    );
    const scale =
      1 + ((time * (bite ? 0.006 : drill ? 0.003 : 0.0018)) % 1) * 2;
    this.wake.scale.setScalar(scale);
    this.wake.material.opacity = (1 - (scale - 1) / 2) * (bite ? 0.8 : 0.45);
    this.linePositions[0] = rodTip.x;
    this.linePositions[1] = rodTip.y;
    this.linePositions[2] = rodTip.z;
    this.linePositions[3] = this.bobber.position.x;
    this.linePositions[4] = this.bobber.position.y;
    this.linePositions[5] = this.bobber.position.z;
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.material.color.set(
      engine.state === "drill" && engine.tension > 0.78
        ? 0xff7866
        : 0xe9ede2,
    );
    this.line.material.opacity = engine.state === "flying" ? 0.55 : 0.88;
  }
}
