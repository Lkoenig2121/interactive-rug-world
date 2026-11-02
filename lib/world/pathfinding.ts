import { buildingById, doorPoint } from "./buildings";
import { cardinal, dedupe, dist, normalize, polylineLength, projectOnPolyline, slicePolyline } from "./geometry";
import { edgeById, nodeById, roadEdges } from "./roads";
import type { Maneuver, ManeuverType, RoadEdge, Route, Vec2 } from "./types";

interface Adjacent {
  edge: RoadEdge;
  to: string;
}

const adjacency: Record<string, Adjacent[]> = {};
for (const e of roadEdges) {
  (adjacency[e.a] ??= []).push({ edge: e, to: e.b });
  (adjacency[e.b] ??= []).push({ edge: e, to: e.a });
}

export interface NetworkProjection {
  edge: RoadEdge;
  point: Vec2;
  /** Arc length along the edge from node a. */
  s: number;
  dist: number;
  /** Direction of the edge (a → b) at the projected point. */
  dir: Vec2;
}

export function projectToNetwork(p: Vec2): NetworkProjection {
  let best: NetworkProjection | null = null;
  for (const e of roadEdges) {
    const pr = projectOnPolyline(e.points, p);
    if (!best || pr.dist < best.dist) {
      const a = e.points[pr.seg];
      const b = e.points[pr.seg + 1] ?? a;
      best = { edge: e, point: pr.point, s: pr.s, dist: pr.dist, dir: normalize({ x: b.x - a.x, z: b.z - a.z }) };
    }
  }
  return best!;
}

/** Edge polyline oriented to start at `from`. */
function oriented(edge: RoadEdge, from: string): Vec2[] {
  return from === edge.a ? edge.points : [...edge.points].reverse();
}

interface Step {
  edge: RoadEdge;
  from: string;
  to: string;
}

/**
 * A* over the road graph between two arbitrary positions. Both endpoints are
 * snapped onto the nearest road segment, then the search runs between the
 * end nodes of those segments.
 */
function searchGraph(start: NetworkProjection, goal: NetworkProjection): Step[] | null {
  const GOAL = "__goal__";
  const g = new Map<string, number>();
  const came = new Map<string, Step | null>();
  const h = (id: string) => (id === GOAL ? 0 : dist(nodeById[id], goal.point));
  const open: { id: string; f: number }[] = [];

  const push = (id: string, cost: number, step: Step | null) => {
    if (cost >= (g.get(id) ?? Infinity)) return;
    g.set(id, cost);
    came.set(id, step);
    open.push({ id, f: cost + h(id) });
  };

  push(start.edge.a, start.s, null);
  push(start.edge.b, start.edge.length - start.s, null);

  const closed = new Set<string>();
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const { id } = open.shift()!;
    if (closed.has(id)) continue;
    closed.add(id);
    if (id === GOAL) break;
    const cost = g.get(id)!;

    if (id === goal.edge.a) push(GOAL, cost + goal.s, { edge: goal.edge, from: id, to: GOAL });
    if (id === goal.edge.b) push(GOAL, cost + goal.edge.length - goal.s, { edge: goal.edge, from: id, to: GOAL });

    for (const adj of adjacency[id] ?? []) {
      push(adj.to, cost + adj.edge.length, { edge: adj.edge, from: id, to: adj.to });
    }
  }
  if (!came.has(GOAL)) return null;

  const steps: Step[] = [];
  let cur: string = GOAL;
  while (true) {
    const step = came.get(cur);
    if (!step) break;
    steps.unshift(step);
    cur = step.from;
  }
  return steps;
}

function classifyTurn(inDir: Vec2, outDir: Vec2): ManeuverType {
  const cross = inDir.x * outDir.z - inDir.z * outDir.x;
  const dot = inDir.x * outDir.x + inDir.z * outDir.z;
  const deg = (Math.atan2(cross, dot) * 180) / Math.PI;
  const a = Math.abs(deg);
  if (a < 22) return "straight";
  if (a > 150) return "uturn";
  const right = deg > 0;
  if (a < 55) return right ? "slight-right" : "slight-left";
  return right ? "right" : "left";
}

function lastDir(pts: Vec2[]): Vec2 {
  const n = pts.length;
  for (let i = n - 1; i > 0; i--) {
    if (dist(pts[i], pts[i - 1]) > 0.5) return normalize({ x: pts[i].x - pts[i - 1].x, z: pts[i].z - pts[i - 1].z });
  }
  return { x: 0, z: -1 };
}

function firstDir(pts: Vec2[]): Vec2 {
  for (let i = 1; i < pts.length; i++) {
    if (dist(pts[i], pts[0]) > 0.5) return normalize({ x: pts[i].x - pts[0].x, z: pts[i].z - pts[0].z });
  }
  return { x: 0, z: -1 };
}

const TURN_TEXT: Record<ManeuverType, string> = {
  depart: "Head",
  straight: "Continue onto",
  "slight-left": "Bear left onto",
  "slight-right": "Bear right onto",
  left: "Turn left onto",
  right: "Turn right onto",
  uturn: "Make a U-turn onto",
  roundabout: "At the roundabout, take the exit onto",
  arrive: "Arrive at",
};

export function findRoute(from: Vec2, destinationId: string): Route | null {
  const building = buildingById[destinationId];
  if (!building) return null;
  const target = doorPoint(building);
  const start = projectToNetwork(from);
  const goal = projectToNetwork(target);

  // Ordered list of [polyline, edge] sections along the road network.
  const sections: { pts: Vec2[]; edge: RoadEdge }[] = [];
  if (start.edge.id === goal.edge.id) {
    sections.push({ pts: slicePolyline(start.edge.points, start.s, goal.s), edge: start.edge });
  } else {
    const steps = searchGraph(start, goal);
    if (!steps) return null;
    const firstNode = steps[0].from;
    const sToFirst = firstNode === start.edge.a ? 0 : start.edge.length;
    sections.push({ pts: slicePolyline(start.edge.points, start.s, sToFirst), edge: start.edge });
    for (const st of steps) {
      if (st.to === "__goal__") {
        const sFrom = st.from === goal.edge.a ? 0 : goal.edge.length;
        sections.push({ pts: slicePolyline(goal.edge.points, sFrom, goal.s), edge: goal.edge });
      } else {
        sections.push({ pts: oriented(st.edge, st.from), edge: st.edge });
      }
    }
  }

  const points: Vec2[] = [from];
  const maneuvers: Maneuver[] = [];
  let s = 0;
  const pushPoints = (pts: Vec2[]) => {
    for (const p of pts) {
      const last = points[points.length - 1];
      const d = dist(last, p);
      if (d < 0.05) continue;
      s += d;
      points.push(p);
    }
  };

  const firstSection = sections.find((sec) => polylineLength(sec.pts) > 0.5) ?? sections[0];
  maneuvers.push({
    s: 0,
    type: "depart",
    text: `Head ${cardinal(firstDir(firstSection.pts))} on ${firstSection.edge.name}`,
    point: from,
  });

  let prev: { pts: Vec2[]; edge: RoadEdge } | null = null;
  for (const sec of sections) {
    if (polylineLength(sec.pts) < 0.3) continue;
    if (prev) {
      const junction = sec.pts[0];
      pushPoints([junction]);
      const enteringRoundabout = sec.edge.kind === "roundabout" && prev.edge.kind !== "roundabout";
      const leavingRoundabout = prev.edge.kind === "roundabout" && sec.edge.kind !== "roundabout";
      if (enteringRoundabout) {
        const exit = sections.slice(sections.indexOf(sec)).find((x) => x.edge.kind !== "roundabout");
        maneuvers.push({
          s,
          type: "roundabout",
          text: `${TURN_TEXT.roundabout} ${exit?.edge.name ?? "your destination"}`,
          point: junction,
        });
      } else if (!leavingRoundabout && sec.edge.kind !== "roundabout") {
        const type = classifyTurn(lastDir(prev.pts), firstDir(sec.pts));
        if (type !== "straight" || sec.edge.name !== prev.edge.name) {
          maneuvers.push({ s, type, text: `${TURN_TEXT[type]} ${sec.edge.name}`, point: junction });
        }
      }
    }
    pushPoints(sec.pts);
    prev = sec;
  }
  pushPoints([target]);
  maneuvers.push({ s, type: "arrive", text: `${TURN_TEXT.arrive} ${building.name}`, point: target });

  return {
    destinationId,
    points: dedupe(points),
    length: s,
    maneuvers,
    edgeIds: sections.map((sec) => sec.edge.id),
  };
}

export { edgeById };
