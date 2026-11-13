import { EXT_Y } from "../house/layout";
import { landmarkById, toWorld } from "../town/config";

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/**
 * A hidden area deep below the empty country south of town, reached by passages. Its rooms are in
 * local coordinates around `x/z`; `y` is its floor and `h` its ceiling height.
 */
export interface Pocket {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  h: number;
  rooms: Rect[];
}

/** Anything below this is in one of the pockets. */
export const DEEP_Y = EXT_Y - 300;
/** Floor of every pocket. */
export const POCKET_Y = EXT_Y - 2000;

export const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

export const pocketWorld = (p: Pocket, x: number, z: number, h = 0) => ({ x: p.x + x, y: p.y + h, z: p.z + z });

/** Local position of a world point in a pocket. */
export const pocketLocal = (p: Pocket, w: { x: number; z: number }) => ({ x: w.x - p.x, z: w.z - p.z });

/** A town spot on landmark `id` at local (lx, lz), at street level. */
export function townSpot(id: string, lx: number, lz: number) {
  const p = toWorld(landmarkById[id], lx, lz);
  return { x: p.x, y: EXT_Y, z: p.z };
}
