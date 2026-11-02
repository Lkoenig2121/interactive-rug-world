import { groundHeight, resolveWalls, WALLS } from "../lib/house/walkable";
import { doorInside, doorOutside, insideLandmark, LANDMARKS, ROAD_EDGES, ROAD_NODES, ROAD_WIDTH, toLocal } from "../lib/town/config";
import { arrivalPoint, DESTINATIONS, findTownRoute } from "../lib/town/navigation";

const seg = (px: number, pz: number, a: { x: number; z: number }, b: { x: number; z: number }) => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - a.x - dx * t, pz - a.z - dz * t);
};

// Landmarks overlapping roads (sample the footprint).
for (const l of LANDMARKS) {
  if (!l.solid) continue;
  for (const e of ROAD_EDGES) {
    if (e.draw === false) continue;
    let hit = false;
    for (let i = 0; i <= 10 && !hit; i++)
      for (let k = 0; k <= 10 && !hit; k++) {
        const lx = -l.w / 2 + (i * l.w) / 10;
        const lz = -l.d / 2 + (k * l.d) / 10;
        const c = Math.cos(l.rot);
        const s = Math.sin(l.rot);
        const p = { x: l.x + lx * c + lz * s, z: l.z - lx * s + lz * c };
        if (seg(p.x, p.z, ROAD_NODES[e.a], ROAD_NODES[e.b]) < ROAD_WIDTH[e.kind] / 2 + 240) hit = true;
      }
    if (hit) console.log(`OVERLAP road: ${l.id} with ${e.name} (${e.a}-${e.b})`);
  }
}
// Landmarks overlapping each other.
for (const a of LANDMARKS)
  for (const b of LANDMARKS) {
    if (a.id >= b.id || !a.solid || !b.solid) continue;
    const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ lx: (sx * a.w) / 2, lz: (sz * a.d) / 2 })));
    const c = Math.cos(a.rot);
    const s = Math.sin(a.rot);
    if (corners.some(({ lx, lz }) => insideLandmark(b, { x: a.x + lx * c + lz * s, z: a.z - lx * s + lz * c })) || insideLandmark(a, b) || insideLandmark(b, a)) console.log(`OVERLAP: ${a.id} & ${b.id}`);
  }
// Door orientation: outside point should be outside, inside point inside.
for (const l of LANDMARKS) {
  if (!l.door) continue;
  const o = doorOutside(l, 200);
  const i = doorInside(l, 200);
  if (insideLandmark(l, o) || !insideLandmark(l, i)) console.log(`DOOR wrong: ${l.id}`);
  const lo = toLocal(l, o);
  if (Math.abs(lo.z - (l.d / 2 + 200)) > 1) console.log(`toLocal mismatch ${l.id}`, lo);
}
// Routes from Andy's to every destination.
const start = arrivalPoint(LANDMARKS[0]);
for (const d of DESTINATIONS) {
  const r = findTownRoute(start, arrivalPoint(d));
  console.log(`${d.name.padEnd(24)} ${r ? `${(r.length / 100).toFixed(0)} m, ${r.points.length} pts, via ${r.streets.join(" > ")}` : "NO ROUTE"}`);
}
// Walk straight through each front door from outside to inside.
for (const l of LANDMARKS) {
  if (!l.door || l.kind === "plane") continue;
  const o = doorOutside(l, 300);
  const i = doorInside(l, 300);
  const p = { ...o };
  let y = groundHeight(p.x, p.z, -401);
  for (let s = 0; s <= 100; s++) {
    const t = s / 100;
    const q = { x: o.x + (i.x - o.x) * t, z: o.z + (i.z - o.z) * t };
    p.x += (q.x - p.x);
    p.z += (q.z - p.z);
    resolveWalls(p, 7, y + 2);
    y = groundHeight(p.x, p.z, y);
  }
  const ok = Math.hypot(p.x - i.x, p.z - i.z) < 5;
  if (!ok) console.log(`BLOCKED door: ${l.id}`, p, i);
}
// Walking into a wall is blocked.
const pz = LANDMARKS.find((l) => l.id === "pizza")!;
const wallPt = { x: pz.x + 1500, z: pz.z - pz.d / 2 - 50 };
const p = { ...wallPt };
for (let s = 0; s < 40; s++) {
  p.z += 5;
  resolveWalls(p, 7, -400);
}
console.log("pizza back wall stop z offset", (p.z - (pz.z - pz.d / 2)).toFixed(1), "(should be about -7)");
console.log("walls:", WALLS.length);
