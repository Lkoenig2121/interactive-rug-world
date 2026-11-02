import { EXT_Y } from "../house/layout";
import type { WallSegment } from "../house/walkable";
import { LANDMARKS, PLANE_FLOOR, toWorld, type Landmark } from "./config";
import { INTERIOR_SOLIDS, PARTITIONS } from "./interiors";

/** Floor height inside a landmark (the jet's cabin is raised). */
export const landmarkFloor = (l: Landmark) => (l.kind === "plane" ? PLANE_FLOOR : EXT_Y);

function segment(l: Landmark, ax: number, az: number, bx: number, bz: number, y0: number, y1: number): WallSegment {
  const a = toWorld(l, ax, az);
  const b = toWorld(l, bx, bz);
  return { ax: a.x, az: a.z, bx: b.x, bz: b.z, y0, y1 };
}

/** Splits a wall from `lo` to `hi` around an optional door. */
function withDoor(lo: number, hi: number, door?: { offset: number; width: number }): [number, number][] {
  if (!door) return [[lo, hi]];
  return [
    [lo, door.offset - door.width / 2],
    [door.offset + door.width / 2, hi],
  ];
}

function landmarkWalls(l: Landmark): WallSegment[] {
  if (!l.solid) return [];
  const y0 = EXT_Y - 20;
  const y1 = EXT_Y + Math.max(l.h, 300);
  const hw = l.w / 2;
  const hd = l.d / 2;
  const out: WallSegment[] = [];
  for (const [a, b] of withDoor(-hw, hw, l.door)) out.push(segment(l, a, hd, b, hd, y0, y1));
  for (const [a, b] of withDoor(-hw, hw, l.backDoor)) out.push(segment(l, a, -hd, b, -hd, y0, y1));
  out.push(segment(l, -hw, -hd, -hw, hd, y0, y1), segment(l, hw, -hd, hw, hd, y0, y1));

  const floor = landmarkFloor(l);
  const solids = INTERIOR_SOLIDS[l.id] ?? INTERIOR_SOLIDS[l.kind] ?? [];
  for (const s of solids) {
    const x0 = s.x - s.w / 2;
    const x1 = s.x + s.w / 2;
    const z0 = s.z - s.d / 2;
    const z1 = s.z + s.d / 2;
    const top = floor + s.h;
    out.push(
      segment(l, x0, z0, x1, z0, floor - 20, top),
      segment(l, x0, z1, x1, z1, floor - 20, top),
      segment(l, x0, z0, x0, z1, floor - 20, top),
      segment(l, x1, z0, x1, z1, floor - 20, top),
    );
  }
  for (const p of PARTITIONS[l.id] ?? []) out.push(segment(l, p.ax, p.az, p.bx, p.bz, floor - 20, floor + l.h));
  return out;
}

export const TOWN_WALLS: WallSegment[] = LANDMARKS.flatMap(landmarkWalls);
