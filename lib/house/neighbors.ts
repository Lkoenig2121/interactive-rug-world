import { seededRandom } from "../world/geometry";
import { LOT, STREET, STREET_SPACING, STREETS } from "./layout";

export const LOTS_EACH_SIDE = 6;
export const STREET_CENTER0 = (STREET.z0 + STREET.z1) / 2;
export const FRONT_SETBACK = STREET_CENTER0 - 520;

export const HOUSE_H = 720;
export const ROOF_RISE = 360;
export const GARAGE = { w: 650, h: 300, d: 700, rise: 170 };

const SIDING_COLORS = ["#efe2c4", "#e9dcc0", "#ddd2bd", "#f2ead8", "#d9cbb0", "#e6dfd1", "#cfc6b3", "#efe6cf", "#d8d2c4"];
const ROOF_COLORS = ["#4a4642", "#3f3b38", "#55504a", "#463f3a", "#5b544c"];
const DOOR_COLORS = ["#8c2f2f", "#1f3a5f", "#2f4b3a", "#4b3621", "#f8f6f0"];

export interface HouseSpec {
  x: number;
  zFront: number;
  facing: 1 | -1;
  w: number;
  d: number;
  garageSide: 1 | -1;
  siding: string;
  roof: string;
  door: string;
  chimney: boolean;
  crossGable: boolean;
  pool: boolean;
  seed: number;
}

/** Every neighbor house in the subdivision (Andy's lot and Sid's are skipped). */
export const NEIGHBOR_HOUSES: HouseSpec[] = (() => {
  const rand = seededRandom(2006);
  const out: HouseSpec[] = [];
  for (let n = 0; n < STREETS; n++) {
    const zs = STREET_CENTER0 + n * STREET_SPACING;
    for (const facing of [1, -1] as const) {
      const zFront = facing === 1 ? zs - FRONT_SETBACK : zs + FRONT_SETBACK - 20;
      for (let k = -LOTS_EACH_SIDE; k <= LOTS_EACH_SIDE; k++) {
        // Andy's lot, and Sid's next door (drawn by the town).
        if (n === 0 && facing === 1 && (k === 0 || k === 1)) continue;
        out.push({
          x: LOT.centerX + k * LOT.width + (rand() - 0.5) * 120,
          zFront,
          facing,
          w: 1450 + rand() * 300,
          d: 1150 + rand() * 150,
          garageSide: rand() > 0.5 ? 1 : -1,
          siding: SIDING_COLORS[Math.floor(rand() * SIDING_COLORS.length)],
          roof: ROOF_COLORS[Math.floor(rand() * ROOF_COLORS.length)],
          door: DOOR_COLORS[Math.floor(rand() * DOOR_COLORS.length)],
          chimney: rand() > 0.45,
          crossGable: rand() > 0.4,
          pool: rand() > 0.55,
          seed: Math.floor(rand() * 1e6),
        });
      }
    }
  }
  return out;
})();

/** Footprint centers of a neighbor house body and its garage (houses face ±z, so these are axis-aligned). */
export function neighborLayout(h: HouseSpec) {
  const cos = h.facing === 1 ? 1 : -1;
  const cz = h.zFront - (h.facing * h.d) / 2;
  const bodyX = h.x - h.garageSide * (GARAGE.w / 2);
  const gx = h.garageSide * (h.w / 2 + GARAGE.w / 2);
  const gz = h.d / 2 - GARAGE.d / 2 + 60;
  return { cz, bodyX, garage: { x: bodyX + gx * cos, z: cz + gz * cos } };
}
