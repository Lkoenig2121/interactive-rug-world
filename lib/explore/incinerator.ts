import { POCKET_Y, pocketWorld, townSpot, type Pocket } from "./underground";

/**
 * Under the landfill: a long sorting belt that carries everything east into the furnace. Run
 * against the belt, ride the scrap magnet up to the catwalk, and grab the star over the flames.
 */
export const FURNACE_HALL: Pocket = {
  id: "incinerator",
  name: "The incinerator",
  x: 20000,
  z: -10000,
  y: POCKET_Y,
  h: 900,
  rooms: [{ x0: -2600, x1: 2600, z0: -600, z1: 600 }],
};

/** Safe landing at the west end, the belt, and the fire pit at the east end. */
export const LANDING = { x0: -2600, x1: -2000 };
export const SORT_BELT = { x0: -2000, x1: 2000, z0: -600, z1: 600 };
export const BELT_PUSH = 230;
export const FIRE_PIT = { x0: 2000, x1: 2600, z0: -600, z1: 600 };

/** The magnet hangs over this spot on the belt and lifts you to the catwalk along the north wall. */
export const MAGNET_PAD = { x: 0, z: -300 };
export const CATWALK = { x0: -1600, x1: 2560, z0: -600, z1: -440, h: 380 };

export const FURNACE_ARRIVE = { x: -2300, z: 200 };
export const FURNACE_LADDER = { x: -2540, z: 0 };
export const FURNACE_STAR = { x: 2380, z: (CATWALK.z0 + CATWALK.z1) / 2, h: CATWALK.h + 30 };
export const FURNACE_FRIEND = { x: 1100, z: -520 };

/** The hatch beside the big furnace shed at the landfill (shed at local 3000, -4800). */
export const FURNACE_HATCH = townSpot("landfill", 3000 - 1000, -4800 + 1100 + 160);
export const FURNACE_EXIT = townSpot("landfill", 3000 - 1000, -4800 + 1100 + 360);

export const furnaceWorld = (x: number, z: number, h = 0) => pocketWorld(FURNACE_HALL, x, z, h);
