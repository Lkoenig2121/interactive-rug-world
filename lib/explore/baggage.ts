import { POCKET_Y, pocketWorld, townSpot, type Pocket } from "./underground";

/**
 * Baggage handling: a maze of conveyor belts and luggage walls under the airport, reached by the
 * chute beside the carousel. Map rows run north to south (+z), columns west to east (+x).
 *
 *   #  wall of conveyor housings and stacked suitcases
 *   > < ^ v  belt cells that carry you along
 *   o  open chute: drops you back to the start
 *   X  ladder back up to the terminal, S  where you land
 *   F  a lost friend, E  the star
 */
export const BAGGAGE_MAP = [
  "###############",
  "#XS..>>>>>v...#",
  "#.#######.v.#.#",
  "#.#.....#.v##.#",
  "#.#.###.#.v...#",
  "#...#F#.#.###.#",
  "###.#.#.#...#.#",
  "#...#.#.###.#.#",
  "#.###.#...#.#.#",
  "#.#...###.#.#o#",
  "#.#.#####.#.#.#",
  "#.#.<<<<<<#.#.#",
  "#.#####.###.#.#",
  "#.......o..E#.#",
  "###############",
];

export const CELL = 200;
const N = BAGGAGE_MAP.length;
const HALF = (N * CELL) / 2;

export const BAGGAGE: Pocket = {
  id: "baggage",
  name: "Baggage handling",
  x: -6000,
  z: -10000,
  y: POCKET_Y,
  h: 500,
  rooms: [{ x0: -HALF, x1: HALF, z0: -HALF, z1: HALF }],
};

/** Walls are too tall to hop, so the maze has to be solved on foot. */
export const BAGGAGE_WALL_H = 130;
export const BELT_SPEED = 170;
/** Size of the open chute in the middle of an `o` cell (there's room to skirt round it). */
export const CHUTE = 110;

export const cellCenter = (c: number, r: number) => ({ x: (c - (N - 1) / 2) * CELL, z: (r - (N - 1) / 2) * CELL });

/** Map cell under a local point. */
export function cellAt(x: number, z: number) {
  const c = Math.floor((x + HALF) / CELL);
  const r = Math.floor((z + HALF) / CELL);
  return { c, r, ch: BAGGAGE_MAP[r]?.[c] ?? "#" };
}

function find(ch: string) {
  for (let r = 0; r < N; r++) {
    const c = BAGGAGE_MAP[r].indexOf(ch);
    if (c >= 0) return cellCenter(c, r);
  }
  throw new Error(`No ${ch} in the baggage map`);
}

export const BELT_DIR: Record<string, { x: number; z: number }> = { ">": { x: 1, z: 0 }, "<": { x: -1, z: 0 }, v: { x: 0, z: 1 }, "^": { x: 0, z: -1 } };

export const BAGGAGE_LADDER = find("X");
export const BAGGAGE_START = find("S");
export const BAGGAGE_STAR = find("E");
export const BAGGAGE_FRIEND = find("F");

/** The chute beside the carousel, and where you come back out. */
export const BAGGAGE_CHUTE = townSpot("terminal", 3550, 0);
export const BAGGAGE_EXIT = townSpot("terminal", 3550, 180);

export const baggageWorld = (x: number, z: number, h = 0) => pocketWorld(BAGGAGE, x, z, h);
