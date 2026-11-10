import { World, LIMIT, type Cell } from "../world/World";
export class Player {
  pos: Cell = [0, 1.02, 17];
  yaw = 0;
  pitch = -0.12;
  vy = 0;
  grounded = false;
  constructor(public world: World) {}
  blocked(p: Cell) {
    if (Math.abs(p[0]) > LIMIT - 0.35 || Math.abs(p[2]) > LIMIT - 0.35)
      return true;
    for (let x = Math.floor(p[0] - 0.28); x <= Math.floor(p[0] + 0.28); x++)
      for (
        let y = Math.floor(p[1] + 0.000001);
        y <= Math.floor(p[1] + 1.74);
        y++
      )
        for (let z = Math.floor(p[2] - 0.28); z <= Math.floor(p[2] + 0.28); z++)
          if (this.world.get(x, y, z)) return true;
    return false;
  }
  safeSpawn() {
    if (this.blocked(this.pos) || this.pos[1] < -2) {
      this.pos = [0, 16, 17];
      this.vy = 0;
    }
  }
  step(dt: number, side: number, forward: number, jump: boolean) {
    const length = Math.max(1, Math.hypot(side, forward));
    side /= length;
    forward /= length;
    const dx =
      (Math.cos(this.yaw) * side - Math.sin(this.yaw) * forward) * 4.5 * dt;
    const dz =
      (-Math.sin(this.yaw) * side - Math.cos(this.yaw) * forward) * 4.5 * dt;
    for (const [axis, d] of [
      [0, dx],
      [2, dz],
    ] as const) {
      const p = [...this.pos] as Cell;
      p[axis] += d;
      if (!this.blocked(p)) this.pos = p;
    }
    if (jump && this.grounded) {
      this.vy = 7;
      this.grounded = false;
    }
    this.vy -= 20 * dt;
    const p = [...this.pos] as Cell;
    p[1] += this.vy * dt;
    if (!this.blocked(p)) {
      this.pos = p;
      this.grounded = false;
    } else {
      if (this.vy < 0) {
        this.grounded = true;
        this.pos[1] = Math.floor(this.pos[1] + 0.001) + 0.00001;
      }
      this.vy = 0;
    }
    if (this.pos[1] < -8) this.safeSpawn();
  }
}
