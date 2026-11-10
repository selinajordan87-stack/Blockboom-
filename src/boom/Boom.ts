import { World, type Cell } from "../world/World";
export function explode(world: World): Cell[] {
  const removed: Cell[] = [];
  for (let x = 12; x <= 16; x++)
    for (let z = 9; z <= 13; z++)
      for (let y = 1; y <= 4; y++)
        if (world.get(x, y, z)) {
          removed.push([x, y, z]);
          world.set(x, y, z, null);
        }
  return removed;
}
