import { addBlocks, blockWalls, roofHeight, type Block } from "../town/blocks";
import { TOWN_WALLS } from "../town/colliders";
import { SURFACES } from "../town/config";
import { RUG } from "../world/roads";
import {
  ANDY_ROOM,
  DOORWAYS,
  EAVE_Y,
  EXT_Y,
  GROUND_Y,
  HOUSE,
  HOUSE_ROOMS,
  inRect,
  levelY,
  SHELL,
  STAIR_VOID,
  STOREY,
  STREET,
  STREET_SPACING,
  STREETS,
  UPPER_Y,
  type Level,
  type Rect,
} from "./layout";

/**
 * Where a toy can stand and what blocks it, at house scale (1 unit = 1 cm).
 * Walls are 2D segments that only block between their bottom and top heights.
 */
export interface WallSegment {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  y0: number;
  y1: number;
}

/** Tallest ledge a toy can step up onto without jumping. */
export const STEP_HEIGHT = 45;
export const WORLD_LIMITS: Rect = { x0: -79000, x1: 79000, z0: -17000, z1: 76000 };

const GARAGE: Rect = { x0: -1904, x1: HOUSE.x0 - SHELL, z0: -150, z1: 600 };
const PORCH: Rect = { x0: -1010, x1: -590, z0: HOUSE.z1, z1: HOUSE.z1 + SHELL + 180 };
const PORCH_STEPS = [
  { r: { x0: -900, x1: -700, z0: PORCH.z1, z1: PORCH.z1 + 20 }, h: EXT_Y + 27 },
  { r: { x0: -900, x1: -700, z0: PORCH.z1 + 20, z1: PORCH.z1 + 35 }, h: EXT_Y + 13 },
];
const PATIO: Rect = { x0: -600, x1: 400, z0: -1080, z1: -720 - SHELL };
/** Crawl-in attic over the upstairs ceiling, reached through the vent in Andy's room. */
export const ATTIC: Rect = { x0: HOUSE.x0 + 80, x1: HOUSE.x1 - 80, z0: HOUSE.z0 + 120, z1: HOUSE.z1 - 120 };
const PATIO_STEP: Rect = { x0: -10, x1: 250, z0: -795, z1: HOUSE.z0 - SHELL };

/** Splits the line from `lo` to `hi` around the given gaps (center and width). */
function spans(lo: number, hi: number, gaps: { c: number; w: number }[]) {
  const out: [number, number][] = [];
  let cursor = lo;
  for (const g of [...gaps].sort((a, b) => a.c - b.c)) {
    const a = g.c - g.w / 2;
    if (a > cursor) out.push([cursor, a]);
    cursor = Math.max(cursor, g.c + g.w / 2);
  }
  if (cursor < hi) out.push([cursor, hi]);
  return out;
}

function roomWalls(r: Rect, level: Level): WallSegment[] {
  const y = levelY(level);
  const y0 = level === 0 ? EXT_Y - 20 : y - 20;
  const y1 = y + STOREY;
  const out: WallSegment[] = [];
  // Only doorways between rooms are open; the outside doors stay shut and are opened with E (see explore/routes).
  const doorGaps = (axis: "x" | "z", at: number) =>
    DOORWAYS.filter((d) => d.level === level && d.axis === axis && Math.abs(d.at - at) < 2).map((d) => ({ c: d.c, w: d.w }));
  for (const z of [r.z0, r.z1]) {
    for (const [a, b] of spans(r.x0, r.x1, doorGaps("z", z))) out.push({ ax: a, az: z, bx: b, bz: z, y0, y1 });
  }
  for (const x of [r.x0, r.x1]) {
    for (const [a, b] of spans(r.z0, r.z1, doorGaps("x", x))) out.push({ ax: x, az: a, bx: x, bz: b, y0, y1 });
  }
  return out;
}

function boxWalls(r: Rect, y0: number, y1: number): WallSegment[] {
  return [
    { ax: r.x0, az: r.z0, bx: r.x1, bz: r.z0, y0, y1 },
    { ax: r.x0, az: r.z1, bx: r.x1, bz: r.z1, y0, y1 },
    { ax: r.x0, az: r.z0, bx: r.x0, bz: r.z1, y0, y1 },
    { ax: r.x1, az: r.z0, bx: r.x1, bz: r.z1, y0, y1 },
  ];
}

export const WALLS: WallSegment[] = [
  ...HOUSE_ROOMS.flatMap((r) => roomWalls(r, r.level)),
  ...roomWalls(ANDY_ROOM, 1),
  ...boxWalls(GARAGE, EXT_Y - 20, GROUND_Y + 270),
  // Railing around the stair opening upstairs; the top of the stairs stays open.
  { ax: STAIR_VOID.x0, az: STAIR_VOID.z1, bx: STAIR_VOID.x1, bz: STAIR_VOID.z1, y0: UPPER_Y - 20, y1: UPPER_Y + 92 },
  { ax: STAIR_VOID.x0, az: STAIR_VOID.z0, bx: STAIR_VOID.x0, bz: STAIR_VOID.z1, y0: UPPER_Y - 20, y1: UPPER_Y + 92 },
  // Low enough that you can walk across the roof above it.
  ...boxWalls(ATTIC, EAVE_Y - 5, EAVE_Y + 50),
  ...TOWN_WALLS,
  ...blockWalls(),
];

/** Buckets walls into a coarse grid so the toy only tests the ones nearby. */
const CELL = 2000;
const grid = new Map<string, WallSegment[]>();

function wallCells(w: WallSegment) {
  const keys: string[] = [];
  const cx0 = Math.floor((Math.min(w.ax, w.bx) - 50) / CELL);
  const cx1 = Math.floor((Math.max(w.ax, w.bx) + 50) / CELL);
  const cz0 = Math.floor((Math.min(w.az, w.bz) - 50) / CELL);
  const cz1 = Math.floor((Math.max(w.az, w.bz) + 50) / CELL);
  for (let i = cx0; i <= cx1; i++) for (let j = cz0; j <= cz1; j++) keys.push(`${i},${j}`);
  return keys;
}

function insertWall(w: WallSegment) {
  for (const key of wallCells(w)) {
    const list = grid.get(key);
    if (list) list.push(w);
    else grid.set(key, [w]);
  }
}
WALLS.forEach(insertWall);

/** Makes blocks found while building the town (parked cars, poles) solid and standable; returns an undo. */
export function registerSolids(blocks: Block[]) {
  const removeBlocks = addBlocks(blocks);
  const walls = blockWalls(blocks);
  walls.forEach(insertWall);
  return () => {
    removeBlocks();
    const gone = new Set(walls);
    for (const key of new Set(walls.flatMap(wallCells))) {
      const list = grid.get(key);
      if (list) grid.set(key, list.filter((w) => !gone.has(w)));
    }
  };
}
const NO_WALLS: WallSegment[] = [];
export const wallsNear = (x: number, z: number) => grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? NO_WALLS;

const RUG_RECT: Rect = { x0: -RUG.width / 2, x1: RUG.width / 2, z0: -RUG.depth / 2, z1: RUG.depth / 2 };

export const onRug = (p: { x: number; z: number }) => inRect(p, RUG_RECT);

/** Height of the floor under a point, for something currently standing at height `y`. */
export function groundHeight(x: number, z: number, y: number) {
  const p = { x, z };
  const roof = roofHeight(x, z, y);
  if (roof !== null) return Math.max(roof, surfaceHeight(p, y) ?? -Infinity);
  if (inRect(p, STAIR_VOID)) {
    const t = Math.min(1, Math.max(0, (x - STAIR_VOID.x0) / (STAIR_VOID.x1 - STAIR_VOID.x0)));
    return GROUND_Y + t * (UPPER_Y - GROUND_Y);
  }
  if (inRect(p, HOUSE)) {
    if (y > EAVE_Y - 60 && inRect(p, ATTIC)) return EAVE_Y;
    if (y > (GROUND_Y + UPPER_Y) / 2) return onRug(p) ? 0 : UPPER_Y;
    return GROUND_Y;
  }
  if (inRect(p, PORCH)) return GROUND_Y;
  for (const s of PORCH_STEPS) if (inRect(p, s.r)) return s.h;
  if (inRect(p, PATIO_STEP)) return EXT_Y + 35;
  if (inRect(p, PATIO)) return EXT_Y + 25;
  const surface = surfaceHeight(p, y);
  if (surface !== null) return surface;
  if (Math.abs(x) > RES_STREET_HALF) return EXT_Y;
  return EXT_Y + streetHeight(z);
}

/** Highest town surface (lofts, ramps, the sky dome floor and its stairs) you can stand on at a point, or null. */
function surfaceHeight(p: { x: number; z: number }, y: number): number | null {
  let best: number | null = null;
  for (const s of SURFACES) {
    if (!inRect(p, s.rect)) continue;
    if (s.round && Math.hypot(p.x - s.round.x, p.z - s.round.z) > s.round.r) continue;
    let h: number;
    if (s.ramp) {
      const v = s.ramp.axis === "x" ? p.x : p.z;
      const t = Math.min(1, Math.max(0, (v - s.ramp.from) / (s.ramp.to - s.ramp.from)));
      h = s.ramp.y0 + t * (s.y - s.ramp.y0);
    } else if (y > s.y - STEP_HEIGHT - 20) h = s.y;
    else continue;
    if (best === null || h > best) best = h;
  }
  return best;
}

const RES_STREET_HALF = 18900;

const HALF_STREET = (STREET.z1 - STREET.z0) / 2;
const STREET_CENTER0 = (STREET.z0 + STREET.z1) / 2;

/** Asphalt, curb and sidewalk sit slightly above the lawn. */
function streetHeight(z: number) {
  const n = Math.round((z - STREET_CENTER0) / STREET_SPACING);
  if (n < 0 || n >= STREETS) return 0;
  const d = Math.abs(z - (STREET_CENTER0 + n * STREET_SPACING));
  if (d < HALF_STREET) return 3;
  if (d < HALF_STREET + 16) return 12;
  if (d < HALF_STREET + 16 + STREET.sidewalk) return 6;
  return 0;
}

/** Pushes a circle at height `y` out of every wall it overlaps. */
export function resolveWalls(p: { x: number; z: number }, radius: number, y: number) {
  for (let pass = 0; pass < 2; pass++) {
    for (const w of wallsNear(p.x, p.z)) {
      if (y < w.y0 || y >= w.y1 - 10) continue;
      const dx = w.bx - w.ax;
      const dz = w.bz - w.az;
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.min(1, Math.max(0, ((p.x - w.ax) * dx + (p.z - w.az) * dz) / len2));
      const cx = w.ax + dx * t;
      const cz = w.az + dz * t;
      const ox = p.x - cx;
      const oz = p.z - cz;
      const d = Math.hypot(ox, oz);
      if (d >= radius) continue;
      if (d < 1e-4) {
        // Exactly on the line: push out along the wall's normal.
        const l = Math.sqrt(len2);
        p.x += (-dz / l) * radius;
        p.z += (dx / l) * radius;
      } else {
        p.x = cx + (ox / d) * radius;
        p.z = cz + (oz / d) * radius;
      }
    }
  }
  p.x = Math.min(WORLD_LIMITS.x1, Math.max(WORLD_LIMITS.x0, p.x));
  p.z = Math.min(WORLD_LIMITS.z1, Math.max(WORLD_LIMITS.z0, p.z));
}
