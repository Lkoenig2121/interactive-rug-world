import { buildings, footprint } from "./buildings";
import { parkingLots, parks, ponds } from "./features";
import { dist, pointAtDistance, pointInRect, projectOnPolyline, seededRandom } from "./geometry";
import { nodeById, nodeDegree, ROAD_CLEARANCE, roadEdges, ROUNDABOUT, RUG } from "./roads";
import type { Vec2 } from "./types";

export const RUG_INNER = {
  halfX: RUG.width / 2 - RUG.border,
  halfZ: RUG.depth / 2 - RUG.border,
};

export function distanceToRoads(p: Vec2): number {
  let best = Infinity;
  for (const e of roadEdges) {
    const d = projectOnPolyline(e.points, p).dist;
    if (d < best) best = d;
  }
  return best;
}

function inEllipse(p: Vec2, cx: number, cz: number, rx: number, rz: number, margin = 0): boolean {
  const dx = (p.x - cx) / (rx + margin);
  const dz = (p.z - cz) / (rz + margin);
  return dx * dx + dz * dz <= 1;
}

export function inPark(p: Vec2): boolean {
  return parks.some((k) => inEllipse(p, k.x, k.z, k.rx, k.rz));
}

export function inPond(p: Vec2, margin = 0): boolean {
  return ponds.some((k) => inEllipse(p, k.x, k.z, k.rx, k.rz, margin));
}

interface BlockOptions {
  buildingMargin?: number;
  ignoreRoads?: boolean;
}

/** True if a round object of radius r cannot be placed at p. */
export function isBlocked(p: Vec2, r: number, opts: BlockOptions = {}): boolean {
  const bm = opts.buildingMargin ?? 1.5;
  if (Math.abs(p.x) > RUG_INNER.halfX - r || Math.abs(p.z) > RUG_INNER.halfZ - r) return true;
  if (!opts.ignoreRoads && distanceToRoads(p) < ROAD_CLEARANCE + r) return true;
  if (Math.hypot(p.x - ROUNDABOUT.x, p.z - ROUNDABOUT.z) < ROUNDABOUT.radius + ROAD_CLEARANCE + r) return true;
  for (const b of buildings) if (pointInRect(p, footprint(b), r + bm)) return true;
  if (inPond(p, r + 1)) return true;
  for (const lot of parkingLots) if (pointInRect(p, lot.rect, r + 0.8)) return true;
  const playground = parks.find((k) => k.id === "playground")!;
  if (inEllipse(p, playground.x, playground.z, playground.rx, playground.rz, r)) return true;
  return false;
}

export type TreeKind = "round" | "pine" | "birch";

export interface Tree {
  x: number;
  z: number;
  scale: number;
  kind: TreeKind;
  color: string;
}

export interface Bush {
  x: number;
  z: number;
  scale: number;
  color: string;
}

const TREE_COLORS = ["#3f7d3a", "#4b8b3b", "#2f6b34", "#5a9a43", "#3d7444"];
const PINE_COLORS = ["#24553a", "#2c5f3f", "#1f4d36"];
const BUSH_COLORS = ["#3f7a3a", "#4f8f42", "#5b9a48", "#356f39"];

function generateTrees(): Tree[] {
  const rand = seededRandom(1337);
  const out: Tree[] = [];
  const step = 6.5;
  for (let x = -RUG_INNER.halfX + 3; x < RUG_INNER.halfX - 2; x += step) {
    for (let z = -RUG_INNER.halfZ + 3; z < RUG_INNER.halfZ - 2; z += step) {
      const p = { x: x + (rand() - 0.5) * 4, z: z + (rand() - 0.5) * 4 };
      const outer = Math.abs(p.x) > 135 || Math.abs(p.z) > 85;
      const density = inPark(p) ? 0.5 : outer ? 0.62 : 0.2;
      if (rand() > density) continue;
      const scale = 0.8 + rand() * 0.55;
      if (isBlocked(p, 1.6 * scale)) continue;
      if (out.some((t) => dist(t, p) < 4.2)) continue;
      const roll = rand();
      const kind: TreeKind = roll < 0.62 ? "round" : roll < 0.88 ? "pine" : "birch";
      const palette = kind === "pine" ? PINE_COLORS : TREE_COLORS;
      out.push({ ...p, scale, kind, color: palette[Math.floor(rand() * palette.length)] });
    }
  }
  return out;
}

function generateBushes(trees: Tree[]): Bush[] {
  const rand = seededRandom(4242);
  const out: Bush[] = [];
  const step = 4.5;
  for (let x = -RUG_INNER.halfX + 2; x < RUG_INNER.halfX - 1; x += step) {
    for (let z = -RUG_INNER.halfZ + 2; z < RUG_INNER.halfZ - 1; z += step) {
      const p = { x: x + (rand() - 0.5) * 3, z: z + (rand() - 0.5) * 3 };
      if (rand() > (inPark(p) ? 0.25 : 0.12)) continue;
      const scale = 0.6 + rand() * 0.6;
      if (isBlocked(p, 0.9 * scale, { buildingMargin: 0.4 })) continue;
      if (trees.some((t) => dist(t, p) < 2.6 * t.scale)) continue;
      out.push({ ...p, scale, color: BUSH_COLORS[Math.floor(rand() * BUSH_COLORS.length)] });
    }
  }
  return out;
}

export interface StreetLight {
  x: number;
  z: number;
  /** Rotation so that the arm points toward the road. */
  rot: number;
}

function generateStreetLights(): StreetLight[] {
  const out: StreetLight[] = [];
  for (const e of roadEdges) {
    if (e.kind === "roundabout") continue;
    let side = 1;
    for (let s = 12; s < e.length - 10; s += 26) {
      const { point, dir } = pointAtDistance(e.points, s);
      const n = { x: -dir.z * side, z: dir.x * side };
      const p = { x: point.x + n.x * 6.5, z: point.z + n.z * 6.5 };
      side = -side;
      if (isBlocked(p, 0.4, { ignoreRoads: true, buildingMargin: 0.6 })) continue;
      if (out.some((l) => dist(l, p) < 9)) continue;
      // Arm extends along local +x; rotate so it points back to the road (-n).
      out.push({ ...p, rot: Math.atan2(n.z, -n.x) });
    }
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const r = ROUNDABOUT.radius + 6.6;
    const p = { x: Math.cos(a) * r, z: Math.sin(a) * r };
    out.push({ ...p, rot: Math.atan2(p.z, -p.x) });
  }
  return out;
}

export interface RoadSign {
  kind: "stop" | "name";
  x: number;
  z: number;
  rot: number;
  names?: [string, string];
}

function generateSigns(): RoadSign[] {
  const out: RoadSign[] = [];
  for (const e of roadEdges) {
    if (e.kind !== "street") continue;
    for (const end of ["a", "b"] as const) {
      const nodeId = end === "a" ? e.a : e.b;
      if ((nodeDegree[nodeId] ?? 0) < 3) continue;
      const s = end === "a" ? 9 : e.length - 9;
      const { point, dir } = pointAtDistance(e.points, s);
      const approach = end === "a" ? { x: -dir.x, z: -dir.z } : dir;
      const right = { x: -approach.z, z: approach.x };
      const p = { x: point.x + right.x * 6.4, z: point.z + right.z * 6.4 };
      if (isBlocked(p, 0.3, { ignoreRoads: true, buildingMargin: 0.3 })) continue;
      // Sign face looks back at approaching traffic.
      out.push({ kind: "stop", ...p, rot: Math.atan2(-approach.x, -approach.z) });
    }
  }

  const namedCorners: [string, [string, string]][] = [
    ["M1", ["Main Street", "Maple Lane"]],
    ["M2", ["Main Street", "Oak Lane"]],
    ["V1", ["Central Avenue", "Lakeside Drive"]],
    ["V2", ["Central Avenue", "Willow Crescent"]],
    ["Q1", ["Pine Street", "Maple Lane"]],
    ["Q4", ["Elm Street", "Oak Lane"]],
  ];
  for (const [id, names] of namedCorners) {
    const n = nodeById[id];
    for (const [dx, dz] of [
      [7.2, 7.2],
      [-7.2, 7.2],
      [7.2, -7.2],
      [-7.2, -7.2],
    ]) {
      const p = { x: n.x + dx, z: n.z + dz };
      if (isBlocked(p, 0.3, { ignoreRoads: true, buildingMargin: 0.5 })) continue;
      if (out.some((o) => dist(o, p) < 2)) continue;
      out.push({ kind: "name", ...p, rot: 0, names });
      break;
    }
  }
  return out;
}

export const trees = generateTrees();
export const bushes = generateBushes(trees);
export const streetLights = generateStreetLights();
export const roadSigns = generateSigns();
