import * as T from "three";
import type { Tool } from "../inventory/Equipment";

type Action = "idle" | "strike" | "mine" | "build" | "cast";

const material = (color: number) =>
  new T.MeshLambertMaterial({ color, depthTest: false, depthWrite: false });

/** Camera-space arm and low-poly tool set. It never participates in world collision. */
export class HeldTools {
  root = new T.Group();
  models = new Map<Tool, T.Group>();
  action: Action = "idle";
  private actionLeft = 0;
  private actionLength = 0.36;
  private handMaterial = material(0xd8a77d);
  private handleMaterial = material(0x8a5c35);
  constructor(camera: T.Camera) {
    this.root.name = "first-person arm";
    this.root.position.set(0.44, -0.48, -0.82);
    this.root.rotation.set(-0.08, -0.08, -0.12);
    camera.add(this.root);
    this.makeArm();
    for (const tool of [
      "Bauwerkzeug",
      "Spitzhacke",
      "Axt",
      "Schaufel",
      "Schwert",
      "Angel",
      "Holzknüppel",
    ] as const)
      this.models.set(tool, this.makeTool(tool));
    this.equip("Bauwerkzeug", false);
  }
  private box(
    group: T.Group,
    size: [number, number, number],
    position: [number, number, number],
    color: number | T.Material,
    rotation: [number, number, number] = [0, 0, 0],
  ) {
    const mesh = new T.Mesh(
      new T.BoxGeometry(...size),
      typeof color === "number" ? material(color) : color,
    );
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.renderOrder = 100;
    group.add(mesh);
    return mesh;
  }
  private makeArm() {
    const arm = new T.Group();
    arm.name = "right hand";
    this.box(arm, [0.24, 0.46, 0.24], [0, -0.12, 0.12], 0x315f53);
    this.box(arm, [0.22, 0.24, 0.22], [0, 0.23, -0.01], this.handMaterial);
    arm.rotation.x = -0.3;
    this.root.add(arm);
  }
  private makeTool(tool: Tool) {
    const group = new T.Group();
    group.name = `Werkzeug ${tool}`;
    group.position.set(0.01, 0.3, -0.08);
    if (tool === "Bauwerkzeug") {
      this.box(group, [0.28, 0.28, 0.28], [0, 0.2, -0.02], 0x5dc0b3);
      this.box(group, [0.17, 0.03, 0.17], [0, 0.36, -0.02], 0xe5d38e);
    } else if (tool === "Angel") {
      this.box(group, [0.055, 1.15, 0.055], [0, 0.68, -0.02], this.handleMaterial, [-0.28, 0, -0.08]);
      this.box(group, [0.1, 0.1, 0.06], [0.04, 0.43, 0], 0xd4aa55);
    } else if (tool === "Schwert") {
      this.box(group, [0.07, 0.82, 0.035], [0, 0.67, -0.04], 0xbacbd0);
      this.box(group, [0.34, 0.07, 0.08], [0, 0.27, 0], 0xc99a4e);
      this.box(group, [0.08, 0.34, 0.08], [0, 0.08, 0], this.handleMaterial);
    } else {
      this.box(group, [0.075, 0.78, 0.075], [0, 0.43, 0], this.handleMaterial, [0, 0, -0.06]);
      if (tool === "Spitzhacke") {
        this.box(group, [0.62, 0.1, 0.11], [0, 0.8, 0], 0x9cabb0);
        this.box(group, [0.1, 0.2, 0.11], [-0.27, 0.72, 0], 0x9cabb0, [0, 0, -0.45]);
      }
      if (tool === "Axt") {
        this.box(group, [0.34, 0.3, 0.08], [0.12, 0.72, 0], 0xaab9b9, [0, 0, -0.18]);
      }
      if (tool === "Schaufel") {
        this.box(group, [0.29, 0.34, 0.08], [0, 0.78, 0], 0x899ca1, [0, 0, Math.PI / 4]);
      }
      if (tool === "Holzknüppel") {
        this.box(group, [0.16, 0.46, 0.16], [0, 0.71, 0], 0x785033);
      }
    }
    this.root.add(group);
    return group;
  }
  equip(tool: Tool, goldenHandle: boolean) {
    for (const [name, group] of this.models) group.visible = name === tool;
    this.handleMaterial.color.set(goldenHandle ? 0xd7a44d : 0x8a5c35);
  }
  play(action: Exclude<Action, "idle">) {
    this.action = action;
    this.actionLength = action === "cast" ? 0.55 : 0.36;
    this.actionLeft = this.actionLength;
  }
  update(dt: number, moving: boolean, elapsed: number) {
    this.actionLeft = Math.max(0, this.actionLeft - dt);
    if (!this.actionLeft) this.action = "idle";
    const progress = 1 - this.actionLeft / this.actionLength;
    const strike = this.action === "idle" ? 0 : Math.sin(progress * Math.PI);
    const walk = moving ? Math.sin(elapsed * 8) * 0.018 : 0;
    this.root.position.set(0.44, -0.48 + Math.abs(walk), -0.82 + walk);
    this.root.rotation.x = -0.08 - strike * (this.action === "cast" ? 0.65 : 0.3);
    this.root.rotation.y = -0.08 - strike * 0.18;
    this.root.rotation.z = -0.12 - strike * (this.action === "build" ? 0.22 : 0.62);
  }
  set visible(value: boolean) {
    this.root.visible = value;
  }
}
