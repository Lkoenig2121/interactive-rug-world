"use client";

import { useMemo } from "react";
import { EXT_Y } from "@/lib/house/layout";
import { DISTRICTS, ROAD_EDGES, ROAD_NODES, ROAD_WIDTH, type RoadEdge } from "@/lib/town/config";
import type { Builder } from "./builder";
import { buildLamp, Built, Sign } from "./parts";

const SIDEWALK = 240;
const ROAD_H: Record<RoadEdge["kind"], number> = { boulevard: 1.6, avenue: 1.8, street: 2, residential: 2.2, service: 1.4, dirt: 1.2 };

/** Widest road meeting at each node, used to trim sidewalks and place crosswalks. */
function nodeInfo() {
  const info: Record<string, { width: number; degree: number }> = {};
  for (const e of ROAD_EDGES) {
    for (const id of [e.a, e.b]) {
      const i = (info[id] ??= { width: 0, degree: 0 });
      i.width = Math.max(i.width, ROAD_WIDTH[e.kind]);
      i.degree++;
    }
  }
  return info;
}

function buildRoads(b: Builder) {
  const info = nodeInfo();
  for (const e of ROAD_EDGES) {
    if (e.draw === false) continue;
    const a = ROAD_NODES[e.a];
    const c = ROAD_NODES[e.b];
    const len = Math.hypot(c.x - a.x, c.z - a.z);
    const ry = Math.atan2(c.x - a.x, c.z - a.z);
    const w = ROAD_WIDTH[e.kind];
    const ia = info[e.a];
    const ic = info[e.b];
    const trimA = ia.degree > 1 ? ia.width / 2 : 0;
    const trimC = ic.degree > 1 ? ic.width / 2 : 0;
    const h = ROAD_H[e.kind];
    const dirt = e.kind === "dirt";

    b.at(a.x, 0, a.z, ry, () => {
      // Pavement, extended to fill the intersection squares.
      b.use(dirt ? "dirt" : "asphalt").box(0, 0, len / 2, w, h, len + (ia.degree > 1 ? w : 0) + (ic.degree > 1 ? w : 0), dirt ? "#b38b5d" : "#8b8e94");
      if (dirt) {
        for (let z = trimA + 600; z < len - trimC; z += 1700) b.use("planks").box(w / 2 + 120, 0, z, 10, 110, 1200, "#8a6a45");
        return;
      }
      const z0 = trimA + 260;
      const z1 = len - trimC - 260;
      // Lane markings
      if (e.kind === "avenue" || e.kind === "boulevard") {
        b.use("paint").box(-9, h, (z0 + z1) / 2, 10, 0.4, z1 - z0, "#f2c230").box(9, h, (z0 + z1) / 2, 10, 0.4, z1 - z0, "#f2c230");
        if (e.kind === "boulevard") {
          for (const s of [-1, 1]) for (let z = z0; z < z1 - 300; z += 900) b.use("paint").box(s * w / 4, h, z + 150, 10, 0.4, 300, "#f4f4f0");
        }
      } else {
        for (let z = z0; z < z1 - 300; z += 900) b.use("paint").box(0, h, z + 150, 10, 0.4, 300, e.kind === "service" ? "#f2c230" : "#f4f4f0");
      }
      // Edge lines
      for (const s of [-1, 1]) b.use("paint").box(s * (w / 2 - 25), h, (z0 + z1) / 2, 8, 0.4, z1 - z0, "#f4f4f0");
      // Crosswalks and stop lines where roads meet
      const zebra = (z: number) => {
        for (let x = -w / 2 + 60; x < w / 2 - 40; x += 90) b.use("paint").box(x + 25, h, z, 50, 0.4, 220, "#f4f4f0");
      };
      if (ia.degree > 2) {
        zebra(trimA + 140);
        b.use("paint").box(w / 4, h, trimA + 300, w / 2 - 20, 0.4, 30, "#f4f4f0");
      }
      if (ic.degree > 2) {
        zebra(len - trimC - 140);
        b.use("paint").box(-w / 4, h, len - trimC - 300, w / 2 - 20, 0.4, 30, "#f4f4f0");
      }
      // Sidewalks with a curb, trimmed at intersections
      const s0 = ia.degree > 1 ? trimA + SIDEWALK : 0;
      const s1 = ic.degree > 1 ? len - trimC - SIDEWALK : len;
      if (s1 > s0 && e.kind !== "service") {
        for (const s of [-1, 1]) {
          b.use("concrete").box(s * (w / 2 + SIDEWALK / 2), 0, (s0 + s1) / 2, SIDEWALK, 3.2, s1 - s0, "#dcd7cc");
          b.use("paint").box(s * (w / 2 + 6), 0, (s0 + s1) / 2, 12, 5, s1 - s0, "#cfcac0");
        }
        // Street lamps, alternating sides
        let side = 1;
        for (let z = s0 + 900; z < s1 - 300; z += 2600) {
          buildLamp(b, side * (w / 2 + SIDEWALK - 40), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, 720);
          side = -side;
        }
      }
    });
  }
}

/** Street-name signs at the start of each named road. */
function StreetSigns() {
  const signs = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; x: number; z: number; ry: number }[] = [];
    const info = nodeInfo();
    for (const e of ROAD_EDGES) {
      if (e.draw === false || e.kind === "dirt" || seen.has(e.name + e.a)) continue;
      seen.add(e.name + e.a);
      const a = ROAD_NODES[e.a];
      const c = ROAD_NODES[e.b];
      const len = Math.hypot(c.x - a.x, c.z - a.z);
      const dx = (c.x - a.x) / len;
      const dz = (c.z - a.z) / len;
      const w = ROAD_WIDTH[e.kind];
      const along = (info[e.a].degree > 1 ? info[e.a].width / 2 : 0) + 150;
      out.push({ name: e.name, x: a.x + dx * along + dz * (w / 2 + 120), z: a.z + dz * along - dx * (w / 2 + 120), ry: Math.atan2(dx, dz) + Math.PI / 2 });
    }
    return out;
  }, []);
  return (
    <group>
      <Built
        castShadow={false}
        build={(b) => {
          for (const s of signs) b.use("metal").cyl(s.x, 0, s.z, 6, 300, "#58626c", 8);
        }}
      />
      {signs.map((s, i) => (
        <group key={i} position={[s.x, 290, s.z]} rotation-y={s.ry}>
          <Sign text={s.name} position={[0, 0, 0]} size={[180, 32]} bg="#1f6f43" fg="#ffffff" border="#ffffff" radius={6} doubleSided />
        </group>
      ))}
    </group>
  );
}

function DistrictSigns() {
  return (
    <group>
      {DISTRICTS.filter((d) => d.id !== "andy").map((d) => {
        const a = d.areas[0];
        const x = (a.x0 + a.x1) / 2;
        const z = a.z1 - 400;
        return (
          <group key={d.id} position={[x, 280, z]}>
            <Sign text={d.name} position={[0, 0, 0]} size={[1100, 120]} bg="#0f172a" fg="#ffffff" glow doubleSided />
          </group>
        );
      })}
    </group>
  );
}

export function TownRoads() {
  return (
    <group position={[0, EXT_Y, 0]}>
      <Built build={buildRoads} castShadow={false} />
      <StreetSigns />
      <DistrictSigns />
    </group>
  );
}
