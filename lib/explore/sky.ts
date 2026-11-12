import { EXT_Y } from "../house/layout";

/** Sky dome: a collector's display case floating high above Andy's neighborhood. */
export const DOME = { x: 0, z: 17000, y: EXT_Y + 16000, r: 2600 };

/** Stars needed before the jetpack can climb high enough to reach the dome. */
export const STARS_FOR_SKY = 8;
/** Stars that unlock the rocket to space, as an alternative to finishing the rescue. */
export const STARS_FOR_SPACE = 16;

export const BASE_CEILING = EXT_Y + 5200;
export const SKY_CEILING = DOME.y + 2600;

export const flightCeiling = (stars: number) => (stars >= STARS_FOR_SKY ? SKY_CEILING : BASE_CEILING);

/** Glowing column from the street up to the dome floor: refuels and lifts fliers. */
export const UPDRAFT = { x: DOME.x, z: DOME.z, r: 320 };

export interface Ring {
  x: number;
  y: number;
  z: number;
  /** Facing yaw (the ring's hole points along this direction). */
  yaw: number;
}

/** Spiral ring course inside the dome. */
export const RINGS: Ring[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 * 1.5;
  return {
    x: DOME.x + Math.sin(a) * 1700,
    y: DOME.y + 260 + i * 130,
    z: DOME.z + Math.cos(a) * 1700,
    yaw: a + Math.PI / 2,
  };
});
export const RING_RADIUS = 120;

/** Spiral staircase around the central pillar, each step a small walkable square. */
export const TOWER_STEPS = Array.from({ length: 36 }, (_, i) => {
  const a = i * 0.42;
  return { x: DOME.x + Math.sin(a) * 340, z: DOME.z + Math.cos(a) * 340, y: DOME.y + 40 + i * 38 };
});
export const TOWER_STEP_SIZE = 190;
export const TOWER_TOP = TOWER_STEPS[TOWER_STEPS.length - 1];

/** Pedestal ring along the edge of the dome floor for the trophy display. */
export const DISPLAY_RADIUS = 2200;
