import type { Vec2 } from "../world/types";
import { doorInside, doorOutside, insideLandmark, LANDMARKS, ROAD_EDGES, ROAD_NODES, ROAD_WIDTH, type Landmark, type RoadEdge } from "./config";

/**
 * Turn-by-turn routes over the town's road network (A* on the intersection graph).
 * Routes start and end with short walks between the roads and the actual start and destination.
 */

interface Projection {
  edge: number;
  point: Vec2;
  /** Distance along the edge from its `a` end. */
  along: number;
  dist: number;
}

const len = (a: Vec2, b: Vec2) => Math.hypot(b.x - a.x, b.z - a.z);

export function projectToRoads(p: Vec2): Projection {
  let best: Projection = { edge: 0, point: ROAD_NODES[ROAD_EDGES[0].a], along: 0, dist: Infinity };
  ROAD_EDGES.forEach((e, i) => {
    const a = ROAD_NODES[e.a];
    const b = ROAD_NODES[e.b];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
    const q = { x: a.x + dx * t, z: a.z + dz * t };
    const d = len(p, q);
    if (d < best.dist) best = { edge: i, point: q, along: t * Math.sqrt(l2), dist: d };
  });
  return best;
}

const adjacency = (() => {
  const adj: Record<string, { to: string; edge: number; cost: number }[]> = {};
  ROAD_EDGES.forEach((e, i) => {
    const c = len(ROAD_NODES[e.a], ROAD_NODES[e.b]);
    (adj[e.a] ??= []).push({ to: e.b, edge: i, cost: c });
    (adj[e.b] ??= []).push({ to: e.a, edge: i, cost: c });
  });
  return adj;
})();

export interface TownRoute {
  /** Road-following polyline from start to destination. */
  points: Vec2[];
  length: number;
  /** Street names in travel order, without repeats. */
  streets: string[];
}

/** Shortest route along the roads between two points anywhere in town. */
export function findTownRoute(from: Vec2, to: Vec2): TownRoute {
  const s = projectToRoads(from);
  const g = projectToRoads(to);
  const pos = (id: string) => (id === "S" ? s.point : id === "G" ? g.point : ROAD_NODES[id]);

  const neighbors = (id: string) => {
    const out: { to: string; edge: number; cost: number }[] = [];
    if (id === "S" || id === "G") {
      const pr = id === "S" ? s : g;
      const e = ROAD_EDGES[pr.edge];
      const total = len(ROAD_NODES[e.a], ROAD_NODES[e.b]);
      out.push({ to: e.a, edge: pr.edge, cost: pr.along }, { to: e.b, edge: pr.edge, cost: total - pr.along });
      if (id === "S" && s.edge === g.edge) out.push({ to: "G", edge: s.edge, cost: Math.abs(s.along - g.along) });
      return out;
    }
    out.push(...(adjacency[id] ?? []));
    for (const [pr, self] of [
      [g, "G"],
      [s, "S"],
    ] as const) {
      const e = ROAD_EDGES[pr.edge];
      if (e.a === id) out.push({ to: self, edge: pr.edge, cost: pr.along });
      if (e.b === id) out.push({ to: self, edge: pr.edge, cost: len(ROAD_NODES[e.a], ROAD_NODES[e.b]) - pr.along });
    }
    return out;
  };

  // A* with straight-line distance as the heuristic.
  const gScore: Record<string, number> = { S: 0 };
  const came: Record<string, { from: string; edge: number }> = {};
  const open = new Set(["S"]);
  const h = (id: string) => len(pos(id), g.point);
  while (open.size) {
    let cur = "";
    let bestF = Infinity;
    for (const id of open) {
      const f = gScore[id] + h(id);
      if (f < bestF) {
        bestF = f;
        cur = id;
      }
    }
    if (cur === "G") break;
    open.delete(cur);
    for (const n of neighbors(cur)) {
      const tentative = gScore[cur] + n.cost;
      if (tentative < (gScore[n.to] ?? Infinity)) {
        gScore[n.to] = tentative;
        came[n.to] = { from: cur, edge: n.edge };
        open.add(n.to);
      }
    }
  }

  const chain: string[] = ["G"];
  const edgesUsed: number[] = [];
  while (chain[0] !== "S" && came[chain[0]]) {
    edgesUsed.unshift(came[chain[0]].edge);
    chain.unshift(came[chain[0]].from);
  }
  const points = [from, ...chain.map(pos), to].filter((p, i, arr) => i === 0 || len(p, arr[i - 1]) > 1);
  const streets: string[] = [];
  for (const e of edgesUsed) {
    const name = ROAD_EDGES[e].name;
    if (streets.at(-1) !== name) streets.push(name);
  }
  return { points, length: points.slice(1).reduce((sum, p, i) => sum + len(points[i], p), 0), streets };
}

/** Where a route to a landmark ends: outside its front door, or at its center for parks and yards. */
export function arrivalPoint(l: Landmark): Vec2 {
  if (l.id === "andy") return { x: -800, z: 950 };
  if (l.id === "sid") return { x: 2150, z: 950 };
  if (l.id === "western") return { x: -58000, z: 17590 };
  if (l.id === "landfill") return { x: 67500, z: -1500 };
  if (l.door) return doorOutside(l, 280);
  return { x: l.x, z: l.z };
}

export const DESTINATIONS = LANDMARKS.filter((l) => l.destination);

/** The enterable building a point is inside, if any. */
export function landmarkContaining(p: Vec2): Landmark | null {
  for (const l of LANDMARKS) if (l.enterable && insideLandmark(l, p, -5)) return l;
  return null;
}

/** Route from anywhere (even inside a building) to a destination's arrival point. */
export function planTownRoute(from: Vec2, dest: Landmark): TownRoute {
  const goal = arrivalPoint(dest);
  const inside = landmarkContaining(from);
  if (inside && inside.id === dest.id) return { points: [from], length: 0, streets: [] };
  if (!inside) return findTownRoute(from, goal);
  const exit = doorOutside(inside, 300);
  const lead = [from, doorInside(inside, 150), exit];
  const rest = findTownRoute(exit, goal);
  const points = [...lead, ...rest.points.slice(1)];
  return { points, length: points.slice(1).reduce((sum, p, i) => sum + len(points[i], p), 0), streets: rest.streets };
}

/** Distance from a point to a polyline, plus the index of the segment it is nearest to. */
export function nearestOnRoute(points: Vec2[], p: Vec2) {
  let best = { dist: Infinity, index: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    const d = Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
    if (d < best.dist) best = { dist: d, index: i };
  }
  return best;
}

/** Length of the route from the toy's nearest segment onward. */
export function remainingLength(points: Vec2[], p: Vec2, index: number) {
  let total = len(p, points[Math.min(index + 1, points.length - 1)]);
  for (let i = index + 1; i < points.length - 1; i++) total += len(points[i], points[i + 1]);
  return total;
}

/** Street the toy is heading along on a route, from the segment index. */
export function streetForSegment(points: Vec2[], index: number): string | null {
  const a = points[index];
  const b = points[index + 1];
  if (!a || !b) return null;
  const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const pr = projectToRoads(mid);
  return pr.dist < 50 ? ROAD_EDGES[pr.edge].name : null;
}

/** Shifts a route sideways (positive = right of travel), keeping corners mitred. */
export function offsetRoute(points: Vec2[], offset: number): Vec2[] {
  if (points.length < 2 || offset === 0) return points;
  return points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return p;
    const a = points[i - 1];
    const b = points[i + 1];
    const d1 = { x: p.x - a.x, z: p.z - a.z };
    const d2 = { x: b.x - p.x, z: b.z - p.z };
    const l1 = Math.hypot(d1.x, d1.z) || 1;
    const l2 = Math.hypot(d2.x, d2.z) || 1;
    const n1 = { x: -d1.z / l1, z: d1.x / l1 };
    const n2 = { x: -d2.z / l2, z: d2.x / l2 };
    const nx = n1.x + n2.x;
    const nz = n1.z + n2.z;
    const nl = Math.hypot(nx, nz) || 1;
    const miter = Math.min(2, 1 / Math.max(0.3, (nx / nl) * n1.x + (nz / nl) * n1.z));
    return { x: p.x + (nx / nl) * offset * miter, z: p.z + (nz / nl) * offset * miter };
  });
}

export const roadWidth = (e: RoadEdge) => ROAD_WIDTH[e.kind];
