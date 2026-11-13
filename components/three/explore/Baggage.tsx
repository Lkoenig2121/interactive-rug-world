"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BAGGAGE,
  BAGGAGE_CHUTE,
  BAGGAGE_LADDER,
  BAGGAGE_MAP,
  BAGGAGE_START,
  BAGGAGE_WALL_H,
  BELT_DIR,
  BELT_SPEED,
  CELL,
  cellAt,
  cellCenter,
  CHUTE,
} from "@/lib/explore/baggage";
import { pocketAt } from "@/lib/explore/pockets";
import { pocketLocal } from "@/lib/explore/underground";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";
import { buildLadder, PocketGroup } from "./pocketParts";

const H = BAGGAGE.h;
const SIZE = BAGGAGE_MAP.length * CELL;
const BAGS = ["#e63946", "#2a9d8f", "#264653", "#e9c46a", "#f4a261", "#6d597a", "#1d3557", "#ffb703", "#8ecae6", "#b5838d"];

const BELTS = BAGGAGE_MAP.flatMap((row, r) => [...row].flatMap((ch, c) => (BELT_DIR[ch] ? [{ ...cellCenter(c, r), dir: BELT_DIR[ch] }] : [])));

function buildHall(b: Builder) {
  const r = seededRandom(747);
  b.at(BAGGAGE.x, BAGGAGE.y, BAGGAGE.z, 0, () => {
    // Floor, ceiling and the outer walls up to it.
    b.use("concrete").box(0, -10, 0, SIZE + 80, 10, SIZE + 80, "#8a8d84");
    b.use("concrete").box(0, H, 0, SIZE + 80, 24, SIZE + 80, "#3f444b");
    for (const s of [-1, 1]) {
      b.use("concrete").box(0, 0, s * (SIZE / 2 + 20), SIZE + 80, H, 40, "#5c6370");
      b.use("concrete").box(s * (SIZE / 2 + 20), 0, 0, 40, H, SIZE + 80, "#5c6370");
    }
    // Strip lights in rows across the ceiling.
    for (let z = -SIZE / 2 + 300; z < SIZE / 2; z += 600) b.use("glow").box(0, H - 8, z, SIZE - 200, 6, 30, "#e8f1ff");

    // Maze walls: conveyor housings with hazard tape and suitcases piled on top, merged per row.
    BAGGAGE_MAP.forEach((row, ri) => {
      let c = 0;
      while (c < row.length) {
        if (row[c] !== "#") {
          c++;
          continue;
        }
        let end = c;
        while (row[end + 1] === "#") end++;
        const a = cellCenter(c, ri);
        const cx = (a.x + cellCenter(end, ri).x) / 2;
        const len = (end - c + 1) * CELL;
        b.use("metal").box(cx, 0, a.z, len, 96, CELL, "#5c6773");
        b.use("paint").box(cx, 96, a.z, len + 1, 8, CELL + 1, "#ffd166");
        for (let k = c; k <= end; k++) {
          const p = cellCenter(k, ri);
          for (let y = 104, n = 0; n < 1 + Math.floor(r() * 2); n++, y += 13) {
            b.use("gloss").box(p.x + (r() - 0.5) * 40, y, p.z + (r() - 0.5) * 40, 90 + r() * 60, 13, 60 + r() * 50, BAGS[Math.floor(r() * BAGS.length)]);
          }
        }
        b.solid(cx, a.z, len, CELL, 0, BAGGAGE_WALL_H);
        c = end + 1;
      }
    });

    // Belts: dark rubber with rollers along the sides and glowing arrows showing which way they run.
    for (const belt of BELTS) {
      b.at(belt.x, 0, belt.z, Math.atan2(-belt.dir.z, belt.dir.x), () => {
        b.use("paint").box(0, 0, 0, CELL, 2, CELL - 30, "#23272e");
        for (const s of [-1, 1]) b.use("metal").rod(0, 4, s * (CELL / 2 - 10), 4, CELL, "#9aa3ad");
        for (const ax of [-60, 10, 80]) for (const s of [-1, 1]) b.use("glow").cbox(ax, 2.4, s * 12, 34, 0.6, 6, "#ffb703", { ry: s * 0.7 });
      });
    }

    // Open chutes: dark holes ringed with hazard stripes.
    BAGGAGE_MAP.forEach((row, ri) =>
      [...row].forEach((ch, ci) => {
        if (ch !== "o") return;
        const p = cellCenter(ci, ri);
        b.use("paint").box(p.x, 0, p.z, CHUTE + 16, 1.5, CHUTE + 16, "#ffd166");
        b.use("paint").box(p.x, 0, p.z, CHUTE, 2, CHUTE, "#0b0c0f");
      }),
    );

    // Ladder up through a hatch in the north wall of the start cell, and a luggage cart by the start.
    buildLadder(b, BAGGAGE_LADDER.x, BAGGAGE_LADDER.z - CELL / 2 + 25, 0, H);
    b.use("glow").cyl(BAGGAGE_LADDER.x, H - 2, BAGGAGE_LADDER.z - CELL / 2 + 40, 34, 2, "#fff6d6", 20);
    b.use("metal").box(BAGGAGE_START.x + 20, 12, BAGGAGE_START.z + 60, 120, 6, 60, "#9aa3ad");
    for (const s of [-1, 1]) b.use("paint").cyl(BAGGAGE_START.x + 20 + s * 45, 0, BAGGAGE_START.z + 60, 8, 12, "#1d1d1f", 10);
  });
}

/** The chute flap on the terminal floor beside the carousel. */
function buildChute(b: Builder) {
  const { x, y, z } = BAGGAGE_CHUTE;
  b.use("paint").box(x, y + 1, z, 96, 1.4, 96, "#ffd166");
  b.use("paint").box(x, y + 1, z, 74, 1.8, 74, "#1d1d1f");
  for (let i = -3; i <= 3; i++) b.use("paint").box(x + i * 10, y + 1, z, 7, 2.4, 70, "#3b3f45");
}

/** Suitcases riding every belt cell, looping as they reach the next one. */
function Suitcases() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => BELTS.map((_, i) => new THREE.Color(BAGS[(i * 7) % BAGS.length])), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const now = runtime.town.clock;
    BELTS.forEach((belt, i) => {
      const s = ((now * BELT_SPEED + i * 53) % CELL) - CELL / 2;
      tmp.position.set(BAGGAGE.x + belt.x + belt.dir.x * s, BAGGAGE.y + 14, BAGGAGE.z + belt.z + belt.dir.z * s);
      tmp.rotation.set(0, Math.atan2(belt.dir.x, belt.dir.z), 0);
      tmp.scale.set(36, 24, 52);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, colors[i]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BELTS.length]} frustumCulled={false} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

/** Baggage handling under the airport: belts carry you along and open chutes drop you back at the start. */
export function Baggage() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = runtime.toy;
    if (pocketAt(t)?.id !== "baggage" || t.mount === "fly" || t.mount === "ride" || t.y - BAGGAGE.y > 8) return;
    const p = pocketLocal(BAGGAGE, t);
    const cell = cellAt(p.x, p.z);
    if (cell.ch === "o") {
      const c = cellCenter(cell.c, cell.r);
      if (Math.abs(p.x - c.x) < CHUTE / 2 && Math.abs(p.z - c.z) < CHUTE / 2) {
        Object.assign(t, { x: BAGGAGE.x + BAGGAGE_START.x, y: BAGGAGE.y, z: BAGGAGE.z + BAGGAGE_START.z, vy: 0, speed: 0 });
        runtime.town.snapCamera = true;
        useStore.getState().showToast("Whoosh! Down the chute and back to the start of the line.");
      }
      return;
    }
    const dir = BELT_DIR[cell.ch];
    if (!dir) return;
    const step = BELT_SPEED * dt;
    // Stop short of walls rather than pushing into them.
    if (cellAt(p.x + dir.x * (step + 12), p.z + dir.z * (step + 12)).ch === "#") return;
    t.x += dir.x * step;
    t.z += dir.z * step;
  });

  return (
    <group>
      <Built deps={["baggage-chute"]} build={buildChute} solid={false} />
      <PocketGroup id="baggage">
        <Built deps={["baggage-hall"]} build={buildHall} />
        <Suitcases />
        <Sign
          text="↑ TERMINAL"
          position={[BAGGAGE.x + BAGGAGE_LADDER.x + 120, BAGGAGE.y + 60, BAGGAGE.z + BAGGAGE_LADDER.z - CELL / 2 + 2]}
          size={[160, 34]}
          bg="#1d3557"
          fg="#ffd166"
        />
      </PocketGroup>
    </group>
  );
}
