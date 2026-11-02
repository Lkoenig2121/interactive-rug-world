import type { Rect, Vec2 } from "./types";

export const v2 = (x: number, z: number): Vec2 => ({ x, z });

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function normalize(v: Vec2): Vec2 {
  const l = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / l, z: v.z / l };
}

/** Forward direction for a yaw (0 = -z). */
export function yawToDir(yaw: number): Vec2 {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

export function dirToYaw(d: Vec2): number {
  return Math.atan2(-d.x, -d.z);
}

/** Right-hand vector for a yaw. */
export function yawToRight(yaw: number): Vec2 {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function polylineLength(pts: Vec2[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

export function cumulative(pts: Vec2[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + dist(pts[i - 1], pts[i]));
  return out;
}

export function quadBezier(a: Vec2, c: Vec2, b: Vec2, n = 16): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      z: u * u * a.z + 2 * u * t * c.z + t * t * b.z,
    });
  }
  return out;
}

export function arc(cx: number, cz: number, r: number, a0: number, a1: number, n = 12): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: cx + r * Math.cos(a), z: cz + r * Math.sin(a) });
  }
  return out;
}

export interface PolyProjection {
  point: Vec2;
  /** Arc-length along the polyline. */
  s: number;
  dist: number;
  seg: number;
}

export function projectOnPolyline(pts: Vec2[], p: Vec2): PolyProjection {
  let best: PolyProjection = { point: pts[0], s: 0, dist: Infinity, seg: 0 };
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    const len = Math.sqrt(len2);
    let t = len2 > 0 ? ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2 : 0;
    t = clamp(t, 0, 1);
    const q = { x: a.x + dx * t, z: a.z + dz * t };
    const d = dist(p, q);
    if (d < best.dist) best = { point: q, s: acc + len * t, dist: d, seg: i - 1 };
    acc += len;
  }
  return best;
}

export function pointAtDistance(pts: Vec2[], s: number): { point: Vec2; dir: Vec2 } {
  if (pts.length < 2) return { point: pts[0], dir: { x: 0, z: -1 } };
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = dist(a, b);
    if (acc + len >= s || i === pts.length - 1) {
      const t = len > 0 ? clamp((s - acc) / len, 0, 1) : 0;
      return {
        point: { x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t) },
        dir: normalize({ x: b.x - a.x, z: b.z - a.z }),
      };
    }
    acc += len;
  }
  return { point: pts[pts.length - 1], dir: { x: 0, z: -1 } };
}

/** Sub-polyline between two arc-lengths; reversed if s0 > s1. */
export function slicePolyline(pts: Vec2[], s0: number, s1: number): Vec2[] {
  if (s0 > s1) return slicePolyline(pts, s1, s0).reverse();
  const cum = cumulative(pts);
  const out: Vec2[] = [pointAtDistance(pts, s0).point];
  for (let i = 0; i < pts.length; i++) {
    if (cum[i] > s0 + 1e-6 && cum[i] < s1 - 1e-6) out.push(pts[i]);
  }
  out.push(pointAtDistance(pts, s1).point);
  return out;
}

/** Remove consecutive duplicate points. */
export function dedupe(pts: Vec2[], eps = 0.05): Vec2[] {
  const out: Vec2[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || dist(last, p) > eps) out.push(p);
  }
  return out;
}

export function pointInRect(p: Vec2, r: Rect, margin = 0): boolean {
  return (
    p.x >= r.minX - margin &&
    p.x <= r.maxX + margin &&
    p.z >= r.minZ - margin &&
    p.z <= r.maxZ + margin
  );
}

export function rectFromCenter(x: number, z: number, w: number, d: number): Rect {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

/** Deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cardinal(d: Vec2): string {
  const a = Math.atan2(d.x, -d.z);
  const names = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const i = Math.round(a / (Math.PI / 4));
  return names[(i + 8) % 8];
}
