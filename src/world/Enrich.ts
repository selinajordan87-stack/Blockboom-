import { World } from "./World";
/** Edition 2 only. Legacy saves retain the exact v1 base map. */
export function enrich(world: World) {
  for (let x = -21; x < -2; x++)
    for (let z = -15; z < 2; z++)
      if ((x + 11) ** 2 / 70 + (z + 6) ** 2 / 55 < 1) {
        for (let y = -2; y <= 0; y++)
          world.set(x, y, z, y === -2 ? "Sand" : null, false);
      }
  for (const [x, z] of [
    [-20, -18],
    [-14, 19],
    [-18, 18],
    [-21, 14],
    [9, -20],
    [12, -20],
    [20, -17],
  ]) {
    for (let y = 1; y <= 4; y++) world.set(x, y, z, "Holz", false);
    for (let y = 3; y <= 6; y++)
      for (let dx = -2; dx <= 2; dx++)
        for (let dz = -2; dz <= 2; dz++)
          if (Math.abs(dx) + Math.abs(dz) <= 6 - y)
            world.set(x + dx, y, z + dz, "Laub", false);
  }
  for (let x = 8; x <= 15; x++)
    for (let z = -22; z <= -16; z++)
      for (
        let y = 1;
        y <= Math.max(1, 3 - Math.floor(Math.hypot(x - 12, z + 19) / 2));
        y++
      )
        world.set(x, y, z, "Stein", false);
  // A small ruin and a lookout, kept away from all established interaction zones.
  for (let y = 1; y <= 3; y++)
    for (let z = 17; z <= 20; z++) world.set(-17, y, z, "Ziegel", false);
  for (let x = 8; x <= 11; x++) world.set(x, 3, -18, "Bretter", false);
}

/** New saves only: a denser, more varied map without touching established v1/v2 terrain. */
export function revolutionize(world: World) {
  // The former marked building square becomes ordinary meadow. Building is free everywhere.
  for (let x = -3; x <= 5; x++)
    for (let z = 5; z <= 13; z++)
      if (x === -3 || x === 5 || z === 5 || z === 13)
        world.set(x, 0, z, "Gras", false);

  // Layered ridges create recognizable biomes while leaving paths and mission points open.
  hill(world, 13, -12, 7, 4, "Stein");
  hill(world, -2, -20, 5, 3, "Kalkstein");
  hill(world, 18, 1, 4, 2, "Schiefer");

  for (const [x, z, h, dark] of [
    [-20, -19, 5, true],
    [-16, -17, 6, false],
    [-7, -18, 4, true],
    [3, -16, 5, false],
    [19, -8, 6, true],
    [20, 19, 5, false],
    [-20, 12, 4, true],
  ] as const)
    tree(world, x, z, h, dark);

  for (const [x, z, block] of [
    [5, -20, "Kopfstein"],
    [8, -9, "Moosstein"],
    [20, -3, "Schiefer"],
    [-21, 5, "Kalkstein"],
    [-5, 18, "Kopfstein"],
  ] as const)
    boulder(world, x, z, block);

  // A small clay bank beside the expanded lake makes the shoreline easier to read.
  for (let x = -20; x <= -17; x++)
    for (let z = -3; z <= 0; z++)
      if ((x + 18.5) ** 2 + (z + 1.5) ** 2 < 6)
        world.set(x, 0, z, "Ton", false);
}

function hill(
  world: World,
  cx: number,
  cz: number,
  radius: number,
  height: number,
  core: "Stein" | "Kalkstein" | "Schiefer",
) {
  for (let x = cx - radius; x <= cx + radius; x++)
    for (let z = cz - radius; z <= cz + radius; z++) {
      const distance = Math.hypot(x - cx, z - cz) / radius;
      const top = Math.max(0, Math.floor((1 - distance) * height));
      for (let y = 1; y <= top; y++)
        world.set(x, y, z, y === top ? (top > 2 ? core : "Gras") : "Erde", false);
    }
}

function surface(world: World, x: number, z: number) {
  for (let y = 12; y >= -2; y--) if (world.get(x, y, z)) return y + 1;
  return 1;
}

function tree(world: World, x: number, z: number, height: number, dark: boolean) {
  const base = surface(world, x, z);
  const wood = dark ? "Dunkelholz" : "Holz";
  for (let y = 0; y < height; y++) world.set(x, base + y, z, wood, false);
  for (let y = height - 2; y <= height + 1; y++) {
    const radius = y === height + 1 ? 1 : y === height - 2 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++)
      for (let dz = -radius; dz <= radius; dz++)
        if (Math.abs(dx) + Math.abs(dz) <= radius + 1)
          world.set(x + dx, base + y, z + dz, "Laub", false);
  }
}

function boulder(
  world: World,
  x: number,
  z: number,
  block: "Kopfstein" | "Moosstein" | "Kalkstein" | "Schiefer",
) {
  const y = surface(world, x, z);
  for (const [dx, dy, dz] of [
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ] as const)
    world.set(x + dx, y + dy, z + dz, block, false);
}
