import { POCKET_Y, pocketWorld, townSpot, type Pocket } from "./underground";

/**
 * Inside the claw machine at Pizza Planet: a glass box full of squeaky aliens. Climb the plush
 * mound, catch a ride on the claw up to the gantry rail, and leave through the prize chute.
 */
export const CLAW: Pocket = {
  id: "claw",
  name: "Inside the Claw",
  x: -14000,
  z: -10000,
  y: POCKET_Y,
  h: 560,
  rooms: [{ x0: -600, x1: 600, z0: -600, z1: 600 }],
};

/** Plush steps (local x, z, top height) up to the mound in the back corner. */
export const CLAW_STEPS = [
  { x: 100, z: -80, h: 30, r: 70 },
  { x: -20, z: -200, h: 60, r: 70 },
  { x: -160, z: -300, h: 90, r: 70 },
];
export const CLAW_MOUND = { x0: -560, x1: -260, z0: -560, z1: -260, h: 120 };

/** Where the claw waits over the mound, and the gantry rail it lifts you to. */
export const CLAW_PAD = { x: -410, z: -410 };
export const CLAW_RAIL = { x0: -560, x1: 560, z0: -460, z1: -360, h: 440 };

/** The prize chute in the front corner, back out to the restaurant. */
export const PRIZE_CHUTE = { x0: 330, x1: 560, z0: 330, z1: 560 };

export const CLAW_ARRIVE = { x: 0, z: 300 };
export const CLAW_STAR = { x: 480, z: (CLAW_RAIL.z0 + CLAW_RAIL.z1) / 2, h: CLAW_RAIL.h + 30 };
export const CLAW_FRIEND = { x: -330, z: -500 };

/** In front of the real machine at Pizza Planet (local 1900, 900). */
export const CLAW_FLAP = townSpot("pizza", 1900, 900 + 175);
export const CLAW_EXIT = townSpot("pizza", 1900 - 260, 900 + 260);

export const clawWorld = (x: number, z: number, h = 0) => pocketWorld(CLAW, x, z, h);
