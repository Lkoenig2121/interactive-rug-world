import { FLOOR_Y } from "../world/roads";

/**
 * Andy's house, in the same units as the room (1 unit = 1 cm).
 * Andy's room is upstairs: x -450..450, z -260..520, floor at FLOOR_Y. The front of the house faces +z.
 */
export const STOREY = 330;
export const SLAB = 30;
export const UPPER_Y = FLOOR_Y;
export const GROUND_Y = FLOOR_Y - STOREY - SLAB;
/** Outside lawn level, a few steps below the ground floor. */
export const EXT_Y = GROUND_Y - 40;
/** Top of the upstairs walls, where the roof starts. */
export const EAVE_Y = UPPER_Y + STOREY + 25;

export const HOUSE = { x0: -1250, x1: 450, z0: -720, z1: 520 };
/** Thickness between the inside wall faces and the outside siding. */
export const SHELL = 4;

export type Side = "n" | "s" | "e" | "w";
export type Level = 0 | 1;

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export type WallStyle = "beige" | "pink" | "tile" | "green" | "lavender" | "warm" | "yellow";
export type FloorStyle = "wood" | "tile" | "carpet-pink" | "checker";

export interface HouseRoom extends Rect {
  id: string;
  name: string;
  level: Level;
  wall: WallStyle;
  floor: FloorStyle;
  floorHole?: Rect;
  ceilingHole?: Rect;
}

/** Stair void shared by the upstairs hall floor and the foyer ceiling. */
export const STAIR_VOID: Rect = { x0: -1150, x1: -700, z0: -455, z1: -345 };

export const HOUSE_ROOMS: HouseRoom[] = [
  // Upstairs (Andy's room is built separately in RoomScene)
  { id: "hall", name: "Upstairs hall", level: 1, x0: -1250, x1: 450, z0: -460, z1: -262, wall: "beige", floor: "wood", floorHole: STAIR_VOID },
  { id: "molly", name: "Sister's room", level: 1, x0: -150, x1: 450, z0: -720, z1: -462, wall: "pink", floor: "carpet-pink" },
  { id: "bath", name: "Bathroom", level: 1, x0: -450, x1: -152, z0: -720, z1: -462, wall: "tile", floor: "tile" },
  { id: "study", name: "Study", level: 1, x0: -1250, x1: -452, z0: -720, z1: -462, wall: "green", floor: "wood" },
  { id: "parents", name: "Parents' bedroom", level: 1, x0: -1250, x1: -452, z0: -260, z1: 520, wall: "lavender", floor: "wood" },
  // Ground floor
  { id: "living", name: "Living room", level: 0, x0: -450, x1: 450, z0: -100, z1: 520, wall: "warm", floor: "wood" },
  { id: "kitchen", name: "Kitchen", level: 0, x0: -450, x1: 450, z0: -720, z1: -102, wall: "yellow", floor: "checker" },
  { id: "foyer", name: "Foyer & family room", level: 0, x0: -1250, x1: -452, z0: -720, z1: 520, wall: "beige", floor: "wood", ceilingHole: STAIR_VOID },
];

export interface Aperture {
  side: Side;
  level: Level;
  /** Center along the wall: x for n/s walls, z for e/w walls. */
  c: number;
  w: number;
  /** Bottom and top relative to the level's floor. */
  bottom: number;
  top: number;
  kind: "window" | "door" | "slider";
}

const win = (side: Side, level: Level, c: number, w = 120, bottom = 95, top = 245): Aperture => ({ side, level, c, w, bottom, top, kind: "window" });

/** Openings in the outside walls of the house. */
export const APERTURES: Aperture[] = [
  // Andy's room
  win("e", 1, 230, 150, 95, 250),
  win("s", 1, -200),
  win("s", 1, 200),
  // Upstairs
  win("s", 1, -1000),
  win("s", 1, -700),
  win("w", 1, 130),
  win("n", 1, 150),
  win("e", 1, -590),
  win("n", 1, -300, 70, 140, 230),
  win("n", 1, -850),
  win("w", 1, -590),
  win("w", 1, -360, 90),
  // Ground floor
  win("s", 0, -220, 170, 80, 240),
  win("s", 0, 220, 170, 80, 240),
  win("e", 0, 400, 130, 80, 240),
  win("e", 0, -420, 150, 100, 220),
  win("n", 0, -250, 130, 105, 220),
  { side: "n", level: 0, c: 120, w: 230, bottom: 0, top: 220, kind: "slider" },
  { side: "s", level: 0, c: -800, w: 100, bottom: 0, top: 220, kind: "door" },
  win("s", 0, -1060, 90, 70, 230),
  win("s", 0, -540, 90, 70, 230),
  win("w", 0, -560),
  win("n", 0, -1000),
];

export interface Doorway {
  /** Wall line: "x" means a wall at x = at (running along z), "z" a wall at z = at. */
  axis: "x" | "z";
  at: number;
  c: number;
  w: number;
  h: number;
  level: Level;
}

/** Openings between rooms. Each one is cut through both rooms' walls. */
export const DOORWAYS: Doorway[] = [
  { axis: "z", at: -261, c: -205, w: 92, h: 212, level: 1 },
  { axis: "z", at: -261, c: -800, w: 92, h: 212, level: 1 },
  { axis: "z", at: -461, c: 150, w: 92, h: 212, level: 1 },
  { axis: "z", at: -461, c: -300, w: 82, h: 212, level: 1 },
  { axis: "z", at: -461, c: -600, w: 92, h: 212, level: 1 },
  { axis: "x", at: -451, c: 210, w: 220, h: 240, level: 0 },
  { axis: "x", at: -451, c: -420, w: 160, h: 230, level: 0 },
  { axis: "z", at: -101, c: 60, w: 340, h: 240, level: 0 },
];

export const levelY = (level: Level) => (level === 1 ? UPPER_Y : GROUND_Y);

export const LOT = { width: 2900, centerX: -750 };
export const STREET = { z0: 1590, z1: 2390, sidewalk: 150, frontYard: 1070 };
/** Parallel streets of the suburb, the first one in front of Andy's house. */
export const STREETS = 5;
export const STREET_SPACING = 7800;
export const BACK_FENCE_Z = -2400;
export const HEDGE = { z: -2700, depth: 300, height: 420 };

/** Spot just outside Andy's window, used for the fly-out camera move. */
export const ANDY_WINDOW = { x: HOUSE.x1, y: UPPER_Y + 172, z: 230 };

export const ANDY_ROOM: Rect = { x0: -450, x1: 450, z0: -260, z1: 520 };
/** Highest point of the main roof. */
export const ROOF_TOP_Y = EAVE_Y + 420;

type Point3 = { x: number; y: number; z: number };

export const inRect = (p: { x: number; z: number }, r: Rect, margin = 0) =>
  p.x >= r.x0 - margin && p.x <= r.x1 + margin && p.z >= r.z0 - margin && p.z <= r.z1 + margin;

/** True when a point is clear of the house walls and roof. */
export function isOutsideHouse(p: Point3, margin = SHELL + 2) {
  return !inRect(p, HOUSE, margin) || p.y > ROOF_TOP_Y + margin;
}
