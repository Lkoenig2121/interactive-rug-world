import { arc, dedupe, normalize, polylineLength, quadBezier } from "./geometry";
import type { RoadEdge, RoadKind, RoadNode, Vec2 } from "./types";

/** Rug dimensions in world units (1 unit = 1 cm of rug = 1 m of toy town). */
export const RUG = { width: 300, depth: 200, border: 6, thickness: 1.2 } as const;
export const FLOOR_Y = -RUG.thickness;

export const ROAD_WIDTH = 10;
export const SIDEWALK_WIDTH = 2.4;
export const ROAD_CLEARANCE = ROAD_WIDTH / 2 + SIDEWALK_WIDTH;

export const ROAD_Y = 0.3;
export const SIDEWALK_Y = 0.28;

export const ROUNDABOUT = { x: 0, z: 0, radius: 16, island: 10.6 } as const;

const RING_X = 128;
const RING_Z = 78;
const R = ROUNDABOUT.radius;

export const roadNodes: RoadNode[] = [
  // Ring road
  { id: "T1", x: -70, z: -RING_Z },
  { id: "T2", x: 0, z: -RING_Z },
  { id: "T3", x: 70, z: -RING_Z },
  { id: "B1", x: -70, z: RING_Z },
  { id: "B2", x: 0, z: RING_Z },
  { id: "B3", x: 70, z: RING_Z },
  { id: "L1", x: -RING_X, z: -40 },
  { id: "L2", x: -RING_X, z: 0 },
  { id: "L3", x: -RING_X, z: 40 },
  { id: "R1", x: RING_X, z: -40 },
  { id: "R2", x: RING_X, z: 0 },
  { id: "R3", x: RING_X, z: 40 },
  // Inner grid
  { id: "Q1", x: -70, z: -40 },
  { id: "Q2", x: 70, z: -40 },
  { id: "Q3", x: -70, z: 40 },
  { id: "Q4", x: 70, z: 40 },
  { id: "M1", x: -70, z: 0 },
  { id: "M2", x: 70, z: 0 },
  { id: "V1", x: 0, z: -45 },
  { id: "V2", x: 0, z: 45 },
  // Roundabout entries
  { id: "RN", x: 0, z: -R, roundabout: true },
  { id: "RE", x: R, z: 0, roundabout: true },
  { id: "RS", x: 0, z: R, roundabout: true },
  { id: "RW", x: -R, z: 0, roundabout: true },
];

export const nodeById: Record<string, RoadNode> = Object.fromEntries(roadNodes.map((n) => [n.id, n]));

const P = (id: string): Vec2 => ({ x: nodeById[id].x, z: nodeById[id].z });

function corner(a: string, c: Vec2, b: string, r = 18): Vec2[] {
  const A = P(a);
  const B = P(b);
  const da = normalize({ x: A.x - c.x, z: A.z - c.z });
  const db = normalize({ x: B.x - c.x, z: B.z - c.z });
  const p1 = { x: c.x + da.x * r, z: c.z + da.z * r };
  const p2 = { x: c.x + db.x * r, z: c.z + db.z * r };
  return [A, ...quadBezier(p1, c, p2, 12), B];
}

type EdgeSpec = [id: string, a: string, b: string, name: string, kind: RoadKind, points?: Vec2[]];

const specs: EdgeSpec[] = [
  // Ring road
  ["north-1", "T1", "T2", "North Road", "ring"],
  ["north-2", "T2", "T3", "North Road", "ring"],
  ["south-1", "B1", "B2", "South Road", "ring"],
  ["south-2", "B2", "B3", "South Road", "ring"],
  ["west-1", "L1", "L2", "West Road", "ring"],
  ["west-2", "L2", "L3", "West Road", "ring"],
  ["east-1", "R1", "R2", "East Road", "ring"],
  ["east-2", "R2", "R3", "East Road", "ring"],
  ["corner-nw", "T1", "L1", "North Road", "ring", corner("T1", { x: -RING_X, z: -RING_Z }, "L1")],
  ["corner-ne", "T3", "R1", "North Road", "ring", corner("T3", { x: RING_X, z: -RING_Z }, "R1")],
  ["corner-se", "B3", "R3", "South Road", "ring", corner("B3", { x: RING_X, z: RING_Z }, "R3")],
  ["corner-sw", "B1", "L3", "South Road", "ring", corner("B1", { x: -RING_X, z: RING_Z }, "L3")],
  // Main Street (east-west through the roundabout)
  ["main-1", "L2", "M1", "Main Street", "avenue"],
  ["main-2", "M1", "RW", "Main Street", "avenue"],
  ["main-3", "RE", "M2", "Main Street", "avenue"],
  ["main-4", "M2", "R2", "Main Street", "avenue"],
  // Central Avenue (north-south through the roundabout)
  ["central-1", "T2", "V1", "Central Avenue", "avenue"],
  ["central-2", "V1", "RN", "Central Avenue", "avenue"],
  ["central-3", "RS", "V2", "Central Avenue", "avenue"],
  ["central-4", "V2", "B2", "Central Avenue", "avenue"],
  // Maple Lane (x = -70)
  ["maple-1", "T1", "Q1", "Maple Lane", "street"],
  ["maple-2", "Q1", "M1", "Maple Lane", "street"],
  ["maple-3", "M1", "Q3", "Maple Lane", "street"],
  ["maple-4", "Q3", "B1", "Maple Lane", "street"],
  // Oak Lane (x = 70)
  ["oak-1", "T3", "Q2", "Oak Lane", "street"],
  ["oak-2", "Q2", "M2", "Oak Lane", "street"],
  ["oak-3", "M2", "Q4", "Oak Lane", "street"],
  ["oak-4", "Q4", "B3", "Oak Lane", "street"],
  // Cross streets
  ["pine", "L1", "Q1", "Pine Street", "street"],
  ["birch", "L3", "Q3", "Birch Street", "street"],
  ["cedar", "Q2", "R1", "Cedar Street", "street"],
  ["elm", "Q4", "R3", "Elm Street", "street"],
  // Curved roads
  ["willow", "Q3", "V2", "Willow Crescent", "street", quadBezier(P("Q3"), { x: -35, z: 64 }, P("V2"), 20)],
  ["lakeside", "V1", "Q2", "Lakeside Drive", "street", quadBezier(P("V1"), { x: 35, z: -64 }, P("Q2"), 20)],
  // Roundabout ring, split between the four entries
  ["round-se", "RE", "RS", "Roundabout", "roundabout", arc(0, 0, R, 0, Math.PI / 2, 10)],
  ["round-sw", "RS", "RW", "Roundabout", "roundabout", arc(0, 0, R, Math.PI / 2, Math.PI, 10)],
  ["round-nw", "RW", "RN", "Roundabout", "roundabout", arc(0, 0, R, Math.PI, Math.PI * 1.5, 10)],
  ["round-ne", "RN", "RE", "Roundabout", "roundabout", arc(0, 0, R, Math.PI * 1.5, Math.PI * 2, 10)],
];

export const roadEdges: RoadEdge[] = specs.map(([id, a, b, name, kind, points]) => {
  const pts = dedupe(points ?? [P(a), P(b)]);
  pts[0] = P(a);
  pts[pts.length - 1] = P(b);
  return { id, a, b, name, kind, points: pts, length: polylineLength(pts) };
});

export const edgeById: Record<string, RoadEdge> = Object.fromEntries(roadEdges.map((e) => [e.id, e]));

export const nodeDegree: Record<string, number> = {};
for (const e of roadEdges) {
  nodeDegree[e.a] = (nodeDegree[e.a] ?? 0) + 1;
  nodeDegree[e.b] = (nodeDegree[e.b] ?? 0) + 1;
}

export const ROAD_NAMES = Array.from(new Set(roadEdges.map((e) => e.name)));
