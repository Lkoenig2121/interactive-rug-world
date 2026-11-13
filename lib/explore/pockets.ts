import { BAGGAGE } from "./baggage";
import { CLAW } from "./clawMachine";
import { FURNACE_HALL } from "./incinerator";
import { SEWER_POCKET } from "./sewer";
import { DEEP_Y, inRect, type Pocket } from "./underground";

export const POCKETS: Pocket[] = [SEWER_POCKET, BAGGAGE, CLAW, FURNACE_HALL];

/** Bounds of each pocket's rooms, padded so wall edges still have a floor. */
const BOUNDS = POCKETS.map((p) => ({
  p,
  x0: p.x + Math.min(...p.rooms.map((r) => r.x0)) - 100,
  x1: p.x + Math.max(...p.rooms.map((r) => r.x1)) + 100,
  z0: p.z + Math.min(...p.rooms.map((r) => r.z0)) - 100,
  z1: p.z + Math.max(...p.rooms.map((r) => r.z1)) + 100,
}));

/** The pocket a world point is inside (in one of its rooms), if any. */
export function pocketAt(w: { x: number; y: number; z: number }): Pocket | null {
  if (w.y > DEEP_Y) return null;
  for (const p of POCKETS) if (p.rooms.some((r) => inRect(r, w.x - p.x, w.z - p.z))) return p;
  return null;
}

/** The pocket whose area (rooms plus a margin) is under a point, for drawing and floors. */
export function pocketNear(x: number, z: number, y: number, margin = 0): Pocket | null {
  if (y > DEEP_Y) return null;
  for (const b of BOUNDS) if (x >= b.x0 - margin && x <= b.x1 + margin && z >= b.z0 - margin && z <= b.z1 + margin) return b.p;
  return null;
}

/** Floor height down in a pocket for something at height `y`, or null when not down there. */
export const pocketFloor = (x: number, z: number, y: number) => pocketNear(x, z, y)?.y ?? null;
