import { World, LIMIT, type Cell } from "../world/World";
import { collides } from "../nightfall/Defense";
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
    return collides(this.world,p);
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
      else if (this.grounded) {
        p[1]+=.51;
        if(!this.blocked(p))this.pos=p;
      }
    }
    if (jump && this.grounded) {
      this.vy = 7;
      this.grounded = false;
    }
    this.vy -= 20 * dt;
    const onLadder = [-.3,0,.3].some(dx=>[-.3,0,.3].some(dz=>this.world.get(Math.floor(this.pos[0]+dx),Math.floor(this.pos[1]),Math.floor(this.pos[2]+dz))==="Leiter"));
    if(onLadder)this.vy=jump||forward>0?3:Math.max(-2,this.vy);
    const p = [...this.pos] as Cell;
    p[1] += this.vy * dt;
    if (!this.blocked(p)) {
      this.pos = p;
      this.grounded = false;
    } else {
      if (this.vy < 0) {
        this.grounded = true;
        let low=p[1],high=this.pos[1];
        for(let i=0;i<14;i++) {
          const middle=(low+high)/2;
          if(this.blocked([this.pos[0],middle,this.pos[2]]))low=middle;else high=middle;
        }
        this.pos[1]=high+.00001;
      }
      this.vy = 0;
    }
    if (this.pos[1] < -8) this.safeSpawn();
  }
}
