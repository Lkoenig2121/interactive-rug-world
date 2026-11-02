import { dirToYaw } from "../world/geometry";
import {
  ANDY_ROOM,
  APERTURES,
  DOORWAYS,
  EXT_Y,
  GROUND_Y,
  HOUSE,
  HOUSE_ROOMS,
  inRect,
  levelY,
  STAIR_VOID,
  UPPER_Y,
  type Level,
  type Rect,
} from "./layout";

export interface HousePlace extends Rect {
  id: string;
  name: string;
  level: Level;
}

export const ANDY_PLACE: HousePlace = { id: "andy", name: "Andy's room", level: 1, ...ANDY_ROOM };
const PLACES: HousePlace[] = [ANDY_PLACE, ...HOUSE_ROOMS];
const MID_Y = (GROUND_Y + UPPER_Y) / 2;

export const housePlaceAt = (p: { x: number; z: number }, level?: Level) =>
  PLACES.find((r) => (level === undefined || r.level === level) && inRect(p, r)) ?? null;

export const housePlaceAtPoint = (p: { x: number; y?: number; z: number }) =>
  housePlaceAt(p, p.y === undefined ? undefined : p.y > MID_Y ? 1 : 0);

export const placeById = (id: string) => PLACES.find((r) => r.id === id) ?? null;

/** Floor height to orbit around at a point inside the house, or null if the point is outdoors. */
export function houseFloorAt(p: { x: number; z: number; y?: number }) {
  if (!inRect(p, HOUSE, 80)) return null;
  const place = p.y !== undefined ? housePlaceAtPoint(p) : housePlaceAt(p);
  if (place) return place.level === 0 ? GROUND_Y : UPPER_Y;
  return p.y !== undefined && p.y <= MID_Y ? GROUND_Y : UPPER_Y;
}

/** Map-view zoom cap while looking around inside, so the camera cannot pop out through the roof. */
export const INDOOR_ZOOM = 460;
/** Third-person toy camera cap while walking indoors. */
export const TOY_INDOOR_ZOOM = 170;
/** Standing eye height in the house, above the floor. */
export const EXPLORE_EYE = 158;

/** A camera-friendly point in the room, kept off any stair opening. */
export function placeCenter(r: HousePlace) {
  let x = (r.x0 + r.x1) / 2;
  let z = (r.z0 + r.z1) / 2;
  const hole = HOUSE_ROOMS.find((q) => q.id === r.id)?.floorHole;
  if (hole && inRect({ x, z }, hole, 16)) {
    if (r.z1 - hole.z1 > 40) z = hole.z1 + (r.z1 - hole.z1) / 2;
    else if (hole.z0 - r.z0 > 40) z = r.z0 + (hole.z0 - r.z0) / 2;
    if (inRect({ x, z }, hole, 16)) {
      if (r.x1 - hole.x1 > 40) x = hole.x1 + (r.x1 - hole.x1) / 2;
      else if (hole.x0 - r.x0 > 40) x = r.x0 + (hole.x0 - r.x0) / 2;
    }
  }
  return { x, y: r.level === 0 ? GROUND_Y : UPPER_Y, z };
}

/** Standing viewpoint inside `room`: head height, looking straight across the space. */
export function explorePose(room: HousePlace) {
  const t = placeCenter(room);
  const eyeY = t.y + EXPLORE_EYE;
  const inset = 48;
  const x0 = room.x0 + inset;
  const x1 = room.x1 - inset;
  const z0 = room.z0 + inset;
  const z1 = room.z1 - inset;
  const w = Math.max(24, x1 - x0);
  const d = Math.max(24, z1 - z0);
  const back = Math.min(120, Math.max(w, d) * 0.22);
  let posX = t.x;
  let posZ = t.z;
  if (w >= d) posX = Math.min(x1, Math.max(x0, t.x + back));
  else posZ = Math.min(z1, Math.max(z0, t.z + back));
  return { target: { x: t.x, y: eyeY, z: t.z }, pos: { x: posX, y: eyeY, z: posZ } };
}

/** Furthest the explore camera may sit from its target while locked in this room. */
export function roomZoomCap(room: HousePlace) {
  const span = Math.min(room.x1 - room.x0, room.z1 - room.z0);
  return Math.max(140, Math.min(INDOOR_ZOOM, span * 0.7));
}

/** Keep a pan target inside one room so explore view cannot drift through doorways. */
export function clampIntoPlace(p: { x: number; z: number }, r: HousePlace, inset = 36) {
  const x0 = r.x0 + inset;
  const x1 = r.x1 - inset;
  const z0 = r.z0 + inset;
  const z1 = r.z1 - inset;
  if (x1 <= x0 || z1 <= z0) {
    p.x = (r.x0 + r.x1) / 2;
    p.z = (r.z0 + r.z1) / 2;
    return;
  }
  p.x = Math.min(x1, Math.max(x0, p.x));
  p.z = Math.min(z1, Math.max(z0, p.z));
}

export interface Portal {
  id: string;
  /** "To the kitchen", shown on the arrow. */
  label: string;
  x: number;
  y: number;
  z: number;
  /** Face this way to look through the doorway. */
  yaw: number;
  to: { x: number; y: number; z: number; yaw: number };
  toName: string;
  toId?: string;
  /** True for yard / street exits that should leave the house view. */
  outside?: boolean;
}

const IN = 55;
const LAND = 90;

function portal(id: string, from: { x: number; y: number; z: number }, toward: { x: number; z: number }, dest: HousePlace | { name: string; x: number; y: number; z: number }): Portal {
  const yaw = dirToYaw({ x: toward.x - from.x, z: toward.z - from.z });
  const isPlace = "id" in dest;
  return {
    id,
    label: `To ${dest.name}`,
    x: from.x,
    y: from.y,
    z: from.z,
    yaw,
    to: isPlace
      ? { x: toward.x, y: dest.level === 0 ? GROUND_Y : UPPER_Y, z: toward.z, yaw }
      : { x: dest.x, y: dest.y, z: dest.z, yaw },
    toName: dest.name,
    toId: isPlace ? dest.id : undefined,
    outside: !isPlace,
  };
}

function pairForDoor(i: number, axis: "x" | "z", at: number, c: number, level: Level): Portal[] {
  const y = levelY(level);
  const a = axis === "z" ? { x: c, z: at - IN } : { x: at - IN, z: c };
  const b = axis === "z" ? { x: c, z: at + IN } : { x: at + IN, z: c };
  const aLand = axis === "z" ? { x: c, z: at - LAND } : { x: at - LAND, z: c };
  const bLand = axis === "z" ? { x: c, z: at + LAND } : { x: at + LAND, z: c };
  const ra = housePlaceAt(a, level);
  const rb = housePlaceAt(b, level);
  if (!ra || !rb || ra.id === rb.id) return [];
  return [portal(`d${i}a`, { ...a, y }, bLand, rb), portal(`d${i}b`, { ...b, y }, aLand, ra)];
}

function outsideSpot(side: "n" | "s" | "e" | "w", c: number, out: number) {
  if (side === "s") return { x: c, z: HOUSE.z1 + out };
  if (side === "n") return { x: c, z: HOUSE.z0 - out };
  if (side === "e") return { x: HOUSE.x1 + out, z: c };
  return { x: HOUSE.x0 - out, z: c };
}

function insideSpot(side: "n" | "s" | "e" | "w", c: number, inset: number) {
  if (side === "s") return { x: c, z: HOUSE.z1 - inset };
  if (side === "n") return { x: c, z: HOUSE.z0 + inset };
  if (side === "e") return { x: HOUSE.x1 - inset, z: c };
  return { x: HOUSE.x0 + inset, z: c };
}

/** Doorway arrows inside the house: interior doors, the front door, the back slider, and the stairs. */
export const PORTALS: Portal[] = [
  ...DOORWAYS.flatMap((d, i) => pairForDoor(i, d.axis, d.at, d.c, d.level)),
  ...APERTURES.filter((a) => a.kind === "door" || a.kind === "slider").flatMap((a, i) => {
    const y = levelY(a.level);
    const inside = insideSpot(a.side, a.c, IN);
    const inLand = insideSpot(a.side, a.c, LAND);
    const outside = outsideSpot(a.side, a.c, 80);
    const outLand = outsideSpot(a.side, a.c, 160);
    const room = housePlaceAt(inside, a.level);
    if (!room) return [];
    const yardName = a.kind === "slider" ? "the backyard" : "the front yard";
    return [
      portal(`out${i}i`, { ...inside, y }, outLand, { name: yardName, ...outLand, y: EXT_Y }),
      portal(`out${i}o`, { ...outside, y: EXT_Y }, inLand, room),
    ];
  }),
  portal("stairs-up", { x: STAIR_VOID.x0 - 40, y: GROUND_Y, z: (STAIR_VOID.z0 + STAIR_VOID.z1) / 2 }, { x: STAIR_VOID.x1 + 80, z: (STAIR_VOID.z0 + STAIR_VOID.z1) / 2 + 80 }, { ...placeById("hall")!, name: "upstairs" }),
  portal("stairs-down", { x: STAIR_VOID.x1 + 50, y: UPPER_Y, z: (STAIR_VOID.z0 + STAIR_VOID.z1) / 2 }, { x: STAIR_VOID.x0 + 120, z: (STAIR_VOID.z0 + STAIR_VOID.z1) / 2 - 120 }, { ...placeById("foyer")!, name: "downstairs" }),
];

export function nearestPortal(t: { x: number; y: number; z: number }, reach = 95) {
  let best: Portal | null = null;
  let dist = reach;
  for (const p of PORTALS) {
    if (Math.abs(t.y - p.y) > 80) continue;
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return best;
}
