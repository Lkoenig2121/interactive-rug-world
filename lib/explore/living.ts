import { EXT_Y, HOUSE, inRect, STREET, STREET_SPACING } from "../house/layout";
import { insideLandmark, landmarkById, LANDMARKS, ROAD_NODES } from "../town/config";
import type { Vec2 } from "../world/types";

// ---------------------------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------------------------

export interface Path {
  points: Vec2[];
  lengths: number[];
  total: number;
  closed: boolean;
}

function makePath(points: Vec2[], closed: boolean): Path {
  const pts = closed ? [...points, points[0]] : points;
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { points: pts, lengths, total: lengths[lengths.length - 1], closed };
}

/** Position and model yaw (+z forward) `d` cm along a path; closed paths wrap. */
export function pathPose(p: Path, d: number) {
  const dd = p.closed ? ((d % p.total) + p.total) % p.total : Math.max(0, Math.min(p.total, d));
  let i = 1;
  while (i < p.points.length - 1 && p.lengths[i] < dd) i++;
  const a = p.points[i - 1];
  const b = p.points[i];
  const seg = p.lengths[i] - p.lengths[i - 1] || 1;
  const t = (dd - p.lengths[i - 1]) / seg;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
}

/** Shifts a closed loop to the right-hand lane (mitered at the corners). */
function rightLane(points: Vec2[], offset: number): Vec2[] {
  const n = points.length;
  const normal = (a: Vec2, b: Vec2) => {
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: -(b.z - a.z) / l, z: (b.x - a.x) / l };
  };
  return points.map((p, i) => {
    const n1 = normal(points[(i - 1 + n) % n], p);
    const n2 = normal(p, points[(i + 1) % n]);
    const k = offset / (1 + n1.x * n2.x + n1.z * n2.z || 1);
    return { x: p.x + (n1.x + n2.x) * k, z: p.z + (n1.z + n2.z) * k };
  });
}

// ---------------------------------------------------------------------------------------------
// Traffic
// ---------------------------------------------------------------------------------------------

/** Closed loops over the town road graph, each driven by a few cars in the right-hand lane. */
const LOOPS: { nodes: string[]; cars: number; speed: number }[] = [
  { nodes: ["W0", "RW0", "RE0", "E0", "E1", "RE1", "RW1", "W1"], cars: 4, speed: 750 },
  { nodes: ["W2", "RW2", "RE2", "E2", "E3", "RE3", "RW3", "W3"], cars: 3, speed: 800 },
  { nodes: ["E0", "C0", "C2", "E2", "E1"], cars: 2, speed: 1000 },
  { nodes: ["W0", "W1", "W2", "V2", "V0"], cars: 2, speed: 1000 },
  { nodes: ["E4", "C4", "CS", "SE"], cars: 2, speed: 1100 },
  { nodes: ["W4", "RW4", "RE4", "E4", "SE", "SW"], cars: 2, speed: 1000 },
];

export const CAR_COLORS = ["#c0392b", "#2e86c1", "#f1c40f", "#16a085", "#ecf0f1", "#8e44ad", "#e67e22", "#2c3e50"];
/** Half extents of a traffic car body and the height of its roof. */
export const CAR_HALF = { w: 90, l: 228 };
export const CAR_ROOF = 157;

export const TRAFFIC_PATHS: Path[] = LOOPS.map((l) => makePath(rightLane(l.nodes.map((id) => ROAD_NODES[id]), 230), true));

export const TRAFFIC: { path: number; speed: number; start: number; color: string }[] = LOOPS.flatMap((l, li) =>
  Array.from({ length: l.cars }, (_, i) => ({
    path: li,
    speed: l.speed,
    start: (i / l.cars) * TRAFFIC_PATHS[li].total + li * 977,
    color: CAR_COLORS[(li * 3 + i) % CAR_COLORS.length],
  })),
);

/** Where traffic car `i` is at clock time `now`. */
export function carPose(i: number, now: number) {
  const c = TRAFFIC[i];
  return pathPose(TRAFFIC_PATHS[c.path], c.start + c.speed * now);
}

/** A world point in a car's frame: `along` toward its nose, `across` to its left. */
export function carLocal(car: { x: number; z: number; yaw: number }, p: Vec2) {
  const dx = p.x - car.x;
  const dz = p.z - car.z;
  const s = Math.sin(car.yaw);
  const c = Math.cos(car.yaw);
  return { along: dx * s + dz * c, across: dx * c - dz * s };
}

// ---------------------------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------------------------

export type WeatherKind = "clear" | "rain" | "wind" | "snow";

export const WEATHER_TOAST: Record<WeatherKind, string> = {
  clear: "The sky clears up.",
  rain: "Rain! Puddles are forming. Walk into one to sail across in a paper boat.",
  wind: "It's getting windy. Gusts will push your paper glider around.",
  snow: "Snow is falling. Watch your footprints!",
};

/** Puddles that fill up while it rains (center and radius at full size). */
export const PUDDLES: { x: number; z: number; r: number }[] = (() => {
  const zs = (STREET.z0 + STREET.z1) / 2;
  const walkN = zs - 491;
  const walkS = zs + 491;
  const park = landmarkById.park;
  return [
    { x: -150, z: 1050, r: 170 },
    { x: 350, z: 1300, r: 120 },
    { x: -2500, z: walkN, r: 140 },
    { x: 4000, z: walkN, r: 150 },
    { x: 1500, z: walkS, r: 140 },
    { x: -5000, z: walkS, r: 150 },
    { x: -1300, z: zs - 260, r: 190 },
    { x: 2600, z: zs + 240, r: 170 },
    { x: 2000, z: zs + STREET_SPACING - 491, r: 150 },
    { x: -3000, z: zs + STREET_SPACING + 491, r: 150 },
    { x: park.x - 1000, z: park.z, r: 260 },
    { x: park.x + 1500, z: park.z + 800, r: 240 },
    { x: park.x, z: park.z - 1200, r: 220 },
  ];
})();

export const PUDDLE_Y = EXT_Y + 7;

/** The puddle under a point, if the puddles are full enough to float a boat. */
export function puddleAt(p: Vec2, level: number) {
  if (level < 0.35) return null;
  const s = 0.3 + 0.7 * level;
  for (const q of PUDDLES) if (Math.hypot(p.x - q.x, p.z - q.z) < q.r * s - 6) return q;
  return null;
}

/** Where snow settles: Andy's subdivision. */
export const SNOW_AREA = { x0: -19700, x1: 19700, z0: -2800, z1: 37200 };
export const SNOW_Y = EXT_Y + 7;

/** Wind push (cm/s) right now, from the weather state. */
export function windPush(w: { wind: number; windAngle: number }, now: number) {
  const gust = Math.max(0, 0.35 + 0.65 * (Math.sin(now * 0.55) + 0.5 * Math.sin(now * 1.7)));
  const f = w.wind * gust * 260;
  return { x: Math.cos(w.windAngle) * f, z: Math.sin(w.windAngle) * f };
}

/** Under a roof: Andy's house or a town building, so rain and snow stay outside. */
export function underRoof(p: { x: number; y: number; z: number }) {
  if (inRect(p, HOUSE, 10) && p.y < EXT_Y + 1000) return true;
  for (const l of LANDMARKS) if (l.solid && l.h > 0 && p.y < EXT_Y + l.h && insideLandmark(l, p)) return true;
  return false;
}

// ---------------------------------------------------------------------------------------------
// Neighbors
// ---------------------------------------------------------------------------------------------

/** Hour of the day (0..24) for the toy-mode clock (dayTime 0 = noon). */
export const hourOf = (dayTime: number) => ((dayTime + 0.5) % 1) * 24;

export type NeighborId = "mail" | "walker" | "kids";

export const ELM_Z = (STREET.z0 + STREET.z1) / 2;
const WALK_N = ELM_Z - 491;
const WALK_S = ELM_Z + 491;

/** A loop down one Elm Street sidewalk and back up the other, crossing at both ends. */
const sidewalkLoop = (x0: number, x1: number) =>
  makePath(
    [
      { x: x0, z: WALK_N },
      { x: x1, z: WALK_N },
      { x: x1, z: WALK_S },
      { x: x0, z: WALK_S },
    ],
    true,
  );

/** Hours each neighbor is out, and the loop they go round (at `speed` cm/s) while they are. */
export const ROUTINES: Record<NeighborId, { from: number; to: number; path: Path; speed: number; name: string }> = {
  mail: { name: "the mail carrier", from: 8, to: 13, path: sidewalkLoop(-3000, 3000), speed: 140 },
  walker: { name: "the dog walker", from: 15, to: 20, path: sidewalkLoop(4000, -4000), speed: 120 },
  kids: { name: "the kids on bikes", from: 13, to: 18, path: sidewalkLoop(-8000, 8000), speed: 380 },
};

/** Where a neighbor is at `hour` (clock time `now` moves them round their loop), or null when they are home. */
export function neighborPose(id: NeighborId, hour: number, now: number) {
  const r = ROUTINES[id];
  if (hour < r.from || hour > r.to) return null;
  const dist = now * r.speed;
  return { ...pathPose(r.path, dist), dist };
}

/** Spot on the front lawns beside a sidewalk point (north side of Elm Street or south side). */
export function lawnBeside(p: Vec2): Vec2 {
  return { x: p.x, z: p.z < ELM_Z ? ELM_Z - 1000 : ELM_Z + 1000 };
}
