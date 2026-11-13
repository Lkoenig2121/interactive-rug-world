import { EXT_Y } from "../house/layout";
import { landmarkById, toWorld } from "../town/config";

/**
 * Storm drains: a tunnel network deep under the empty country south of Andy's street, reached by
 * manholes around town. Everything below is in sewer-local coordinates around `SEWER.x/z`.
 */
export const SEWER = { x: 8000, z: -10000, y: EXT_Y - 2000, h: 420 };

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/** A plus-shaped network: the central hub and four arms. */
export const SEWER_ROOMS: Rect[] = [
  { x0: -1000, x1: 1000, z0: -1000, z1: 1000 },
  { x0: -3600, x1: -1000, z0: -350, z1: 350 },
  { x0: 1000, x1: 3600, z0: -350, z1: 350 },
  { x0: -350, x1: 350, z0: -3000, z1: -1000 },
  { x0: -350, x1: 350, z0: 1000, z1: 3000 },
];

/** Outline of the tunnels (clockwise), for the walls. */
export const SEWER_OUTLINE: [number, number][] = [
  [-3600, -350],
  [-1000, -350],
  [-1000, -1000],
  [-350, -1000],
  [-350, -3000],
  [350, -3000],
  [350, -1000],
  [1000, -1000],
  [1000, -350],
  [3600, -350],
  [3600, 350],
  [1000, 350],
  [1000, 1000],
  [350, 1000],
  [350, 3000],
  [-350, 3000],
  [-350, 1000],
  [-1000, 1000],
  [-1000, 350],
  [-3600, 350],
];

/** The stream down the middle of the long tunnel: it carries you east unless you run against it. */
export const CHANNEL: Rect = { x0: -3600, x1: 3600, z0: -110, z1: 110 };
export const CURRENT = 200;

/** Pipe steps up to the high ledge in the hub (local x, z, top height). */
export const PIPE_STEPS = [40, 80, 120, 160, 200].map((h, i) => ({ x: -880, z: -200 - i * 90, h, size: 70 }));
export const HIGH_LEDGE = { x0: -950, x1: -350, z0: -1000, z1: -700, h: 240 };

export const sewerWorld = (x: number, z: number, h = 0) => ({ x: SEWER.x + x, y: SEWER.y + h, z: SEWER.z + z });

const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

/** True when a world point is down in the drains. */
export function inSewer(p: { x: number; y: number; z: number }) {
  if (p.y > EXT_Y - 300) return false;
  const x = p.x - SEWER.x;
  const z = p.z - SEWER.z;
  return SEWER_ROOMS.some((r) => inRect(r, x, z));
}

/** Floor height in the drains for something at height `y`, or null when not down there. */
export function sewerFloor(x: number, z: number, y: number): number | null {
  if (y > EXT_Y - 300) return null;
  const lx = x - SEWER.x;
  const lz = z - SEWER.z;
  return lx >= -3700 && lx <= 3700 && lz >= -3100 && lz <= 3100 ? SEWER.y : null;
}

export const inChannel = (p: { x: number; z: number }) => inRect(CHANNEL, p.x - SEWER.x, p.z - SEWER.z);

const town = (id: string, lx: number, lz: number) => {
  const l = landmarkById[id];
  return { ...toWorld(l, lx, lz), y: EXT_Y };
};

/** Manholes in town and the ladder each one leads to (local), with the facing on arrival down below. */
export const SEWER_EXITS = [
  { id: "andy", name: "Andy's street", town: { x: 4000, y: EXT_Y, z: 1650 }, ladder: { x: 0, z: -2900 }, arrive: { x: 0, z: -2740 }, yaw: Math.PI },
  { id: "landfill", name: "the landfill", town: town("landfill", 2000, 8400), ladder: { x: 0, z: 2900 }, arrive: { x: 0, z: 2740 }, yaw: 0 },
  { id: "pizza", name: "Pizza Planet", town: town("pizza", -1500, landmarkById.pizza.d / 2 + 900), ladder: { x: 3500, z: -260 }, arrive: { x: 3340, z: -260 }, yaw: Math.PI / 2 },
  { id: "toybarn", name: "Al's Toy Barn", town: town("toybarn", -3000, landmarkById.toybarn.d / 2 + 900), ladder: { x: 2300, z: 290 }, arrive: { x: 2300, z: 200 }, yaw: Math.PI / 2 },
  { id: "airport", name: "the airport", town: town("terminal", -3000, landmarkById.terminal.d / 2 + 1200), ladder: { x: -2300, z: -290 }, arrive: { x: -2300, z: -200 }, yaw: -Math.PI / 2 },
  { id: "daycare", name: "Sunnyside", town: town("daycare", 2500, landmarkById.daycare.d / 2 + 900), ladder: { x: -3500, z: 260 }, arrive: { x: -3340, z: 260 }, yaw: -Math.PI / 2 },
];
