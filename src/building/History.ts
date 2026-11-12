import {
  World,
  key,
  intersectsPlayer,
  type Cell,
  type Block,
} from "../world/World";
export class BuildHistory {
  private actions: {
    cell: Cell;
    before: Block | null;
    after: Block | null;
  }[] = [];
  constructor(private readonly limit = 20) {}
  record(cell: Cell, before: Block | null, after: Block | null) {
    this.actions.push({ cell: [...cell], before, after });
    if (this.actions.length > this.limit)
      this.actions.splice(0, this.actions.length - this.limit);
  }
  undo(world: World, player: Cell) {
    const a = this.actions.at(-1);
    if (!a) return null;
    if (
      (world.get(...a.cell) || null) !== a.after ||
      (a.before && intersectsPlayer(a.cell, player))
    )
      return null;
    world.set(...a.cell, a.before);
    this.actions.pop();
    return a;
  }
  get available() {
    return this.actions.length > 0;
  }
  get depth() {
    return this.actions.length;
  }
}
