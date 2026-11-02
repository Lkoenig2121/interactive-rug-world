import { buildings, footprint } from "./buildings";
import { rectFromCenter } from "./geometry";
import { ponds } from "./features";
import { ROUNDABOUT } from "./roads";
import { RUG_INNER, streetLights, trees } from "./scenery";
import type { Rect, Vec2 } from "./types";

export interface CircleCollider {
  x: number;
  z: number;
  r: number;
}

export interface ColliderSet {
  boxes: Rect[];
  circles: CircleCollider[];
  bounds: Rect;
}

function buildingBoxes(): Rect[] {
  const out: Rect[] = [];
  for (const b of buildings) {
    if (b.type === "gas") {
      // Drive-through canopy: only the kiosk at the back and the pump islands are solid.
      const back = { x: b.x, z: b.z + 6 };
      out.push(rectFromCenter(back.x, back.z, 10, 5));
      out.push(rectFromCenter(b.x - 4.5, b.z - 2, 1.2, 3.4));
      out.push(rectFromCenter(b.x + 4.5, b.z - 2, 1.2, 3.4));
      continue;
    }
    out.push(footprint(b));
  }
  return out;
}

const pondCircles: CircleCollider[] = ponds.map((p) => ({ x: p.x, z: p.z, r: Math.min(p.rx, p.rz) * 0.92 }));

export const worldColliders: ColliderSet = {
  boxes: buildingBoxes(),
  circles: [
    ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.55 * t.scale })),
    ...streetLights.map((l) => ({ x: l.x, z: l.z, r: 0.25 })),
    ...pondCircles,
    { x: ROUNDABOUT.x, z: ROUNDABOUT.z, r: ROUNDABOUT.island },
  ],
  bounds: {
    minX: -RUG_INNER.halfX - 3,
    maxX: RUG_INNER.halfX + 3,
    minZ: -RUG_INNER.halfZ - 3,
    maxZ: RUG_INNER.halfZ + 3,
  },
};

/**
 * Push a circle of radius r out of all colliders. Mutates `p`.
 * Returns the collision normal of the deepest hit, or null.
 */
export function resolveCircle(p: Vec2, r: number, set: ColliderSet): Vec2 | null {
  let hit: Vec2 | null = null;
  let deepest = 0;
  for (let iter = 0; iter < 2; iter++) {
    for (const b of set.boxes) {
      if (p.x < b.minX - r || p.x > b.maxX + r || p.z < b.minZ - r || p.z > b.maxZ + r) continue;
      const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
      const dx = p.x - cx;
      const dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        if (d < r) {
          const n = { x: dx / d, z: dz / d };
          p.x += n.x * (r - d);
          p.z += n.z * (r - d);
          if (r - d > deepest) {
            deepest = r - d;
            hit = n;
          }
        }
      } else {
        // Center inside the box: exit through the nearest side.
        const opts = [
          { d: p.x - b.minX, n: { x: -1, z: 0 } },
          { d: b.maxX - p.x, n: { x: 1, z: 0 } },
          { d: p.z - b.minZ, n: { x: 0, z: -1 } },
          { d: b.maxZ - p.z, n: { x: 0, z: 1 } },
        ].sort((a, b2) => a.d - b2.d);
        const o = opts[0];
        p.x += o.n.x * (o.d + r);
        p.z += o.n.z * (o.d + r);
        hit = o.n;
        deepest = Infinity;
      }
    }
    for (const c of set.circles) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const min = r + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 1e-4;
      const n = { x: dx / d, z: dz / d };
      p.x += n.x * (min - d);
      p.z += n.z * (min - d);
      if (min - d > deepest) {
        deepest = min - d;
        hit = n;
      }
    }
  }
  const bd = set.bounds;
  if (p.x < bd.minX + r) {
    p.x = bd.minX + r;
    hit = hit ?? { x: 1, z: 0 };
  }
  if (p.x > bd.maxX - r) {
    p.x = bd.maxX - r;
    hit = hit ?? { x: -1, z: 0 };
  }
  if (p.z < bd.minZ + r) {
    p.z = bd.minZ + r;
    hit = hit ?? { x: 0, z: 1 };
  }
  if (p.z > bd.maxZ - r) {
    p.z = bd.maxZ - r;
    hit = hit ?? { x: 0, z: -1 };
  }
  return hit;
}

export function pointInsideAnyBox(p: Vec2, set: ColliderSet, margin = 0): boolean {
  return set.boxes.some(
    (b) => p.x > b.minX - margin && p.x < b.maxX + margin && p.z > b.minZ - margin && p.z < b.maxZ + margin,
  );
}
