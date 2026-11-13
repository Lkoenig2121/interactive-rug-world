import { EXT_Y } from "../house/layout";
import { HOUSE_H, NEIGHBOR_HOUSES, neighborLayout, ROOF_RISE } from "../house/neighbors";

/**
 * Rooftop highway: the row of houses across the street from Andy's, linked ridge to ridge by
 * telephone wires and yardstick bridges. Drainpipes lead up; a clothesline zipline leads down.
 */
export const RIDGE_Y = EXT_Y + HOUSE_H + ROOF_RISE;

export const ROOF_ROW = NEIGHBOR_HOUSES.filter((h) => h.facing === -1 && h.zFront < 6000 && h.x > -10000 && h.x < 9000)
  .sort((a, b) => a.x - b.x)
  .map((h) => {
    const { cz, bodyX } = neighborLayout(h);
    return { spec: h, x0: bodyX - h.w / 2, x1: bodyX + h.w / 2, cz, bodyX };
  });

/** Bridges between neighboring ridges: thin wires and wider yardsticks, alternating. */
export const ROOF_BRIDGES = ROOF_ROW.slice(0, -1).map((a, i) => {
  const b = ROOF_ROW[i + 1];
  return { kind: i % 2 === 0 ? ("wire" as const) : ("ruler" as const), ax: a.x1 - 20, az: a.cz, bx: b.x0 + 20, bz: b.cz, width: i % 2 === 0 ? 16 : 30 };
});

/** Houses with a drainpipe up to the ridge (first, middle and last). */
export const PIPE_HOUSES = [0, Math.floor(ROOF_ROW.length / 2), ROOF_ROW.length - 1];

/** Front corner of a house where its drainpipe runs (away from the garage). */
export function drainpipe(i: number) {
  const r = ROOF_ROW[i];
  const side = -r.spec.garageSide;
  return { x: r.bodyX + side * (r.spec.w / 2 - 30), z: r.spec.zFront - 14, side };
}

const mid = (i: number, lift = 0) => {
  const b = ROOF_BRIDGES[Math.min(i, ROOF_BRIDGES.length - 1)];
  return { x: (b.ax + b.bx) / 2, y: RIDGE_Y + lift, z: (b.az + b.bz) / 2 };
};

/** Stars hanging over the middle of two crossings, and the stuck parachute soldier's ridge. */
export const ROOF_STARS = [
  { id: "roof-tightrope", label: "Tightrope over the street", ...mid(2, 30) },
  { id: "roof-yardstick", label: "Yardstick bridge", ...mid(ROOF_BRIDGES.length - 1, 30) },
];
export const ROOF_FRIEND = (() => {
  const r = ROOF_ROW[Math.max(0, ROOF_ROW.length - 2)];
  return { x: r.bodyX, y: RIDGE_Y, z: r.cz };
})();

/** Clothesline zipline from the last ridge down to the sidewalk. */
export const ZIPLINE = (() => {
  const r = ROOF_ROW[ROOF_ROW.length - 1];
  const top = { x: r.x1 - 60, y: RIDGE_Y, z: r.cz };
  const bottom = { x: r.x1 + 700, y: EXT_Y, z: r.spec.zFront - 700 };
  return { top, bottom };
})();
