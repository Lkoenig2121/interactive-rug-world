"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { runtime } from "@/lib/runtime";
import type { Landmark } from "@/lib/town/config";
import type { Builder } from "../builder";
import { dressDino } from "../filmSet";
import { buildCar, buildFlatRoof, buildLamp, buildShell, Built, LandmarkGroup, Roof, Sign } from "../parts";

const BLUE = "#1f5fbf";
const WHITE = "#f7f5ef";
const DINO = "#3aa655";

/** Friendly long-necked dinosaur facing +x, standing at (x, y, z). */
export function buildDino(b: Builder, x: number, y: number, z: number, s: number, color = DINO) {
  b.at(x, y, z, 0, () => {
    b.use("gloss").sphere(0, 110 * s, 0, 90 * s, color, 0.65, 18);
    for (let i = 0; i < 6; i++) b.use("gloss").sphere((70 + i * 22) * s, (140 + i * 26) * s, 0, (32 - i * 2.5) * s, color, 1, 12);
    b.use("gloss").sphere(215 * s, 300 * s, 0, 30 * s, color, 0.8, 14);
    b.use("paint").sphere(232 * s, 312 * s, 16 * s, 6 * s, "#ffffff", 1, 8).sphere(235 * s, 312 * s, 20 * s, 3 * s, "#111111", 1, 6);
    b.use("paint").sphere(232 * s, 312 * s, -16 * s, 6 * s, "#ffffff", 1, 8).sphere(235 * s, 312 * s, -20 * s, 3 * s, "#111111", 1, 6);
    for (let i = 0; i < 6; i++) b.use("gloss").sphere((-80 - i * 25) * s, (100 - i * 12) * s, 0, (34 - i * 5) * s, color, 1, 10);
    for (const [lx, lz] of [
      [45, 35],
      [45, -35],
      [-45, 35],
      [-45, -35],
    ])
      b.use("gloss").cyl(lx * s, 0, lz * s, 18 * s, 80 * s, color, 12);
  });
}

function buildPump(b: Builder, x: number, z: number) {
  b.use("gloss").box(x, 20, z, 60, 150, 45, WHITE);
  b.use("gloss").box(x, 170, z, 64, 30, 50, BLUE);
  b.use("glow").box(x, 120, z + 23, 40, 26, 1, "#d9f99d");
  b.use("gloss").sphere(x, 215, z, 22, DINO, 1, 12);
  b.use("paint").rod(x + 34, 90, z, 4, 40, "#1d1d1f", Math.PI / 2, 6);
  b.use("gloss").box(x + 34, 70, z, 10, 40, 14, "#c0392b");
}

function buildStation(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "gloss", color: WHITE }, int: "#eef2f6", floor: { slot: "concrete", color: "#c9c5bc" }, trim: BLUE, doorH: 240 });
  b.use("gloss").box(0, l.h - 80, hd + 9, l.w + 20, 50, 6, BLUE);
  // Service bay door (left) and office windows (right).
  b.use("glass").box(-380, 0, hd + 9, 620, 330, 3, "#bfe3f7");
  for (let y = 50; y < 330; y += 55) b.use("metal").box(-380, y, hd + 11, 620, 6, 2, "#9aa3ad");
  b.use("glass").box(80, 90, hd + 9, 240, 170, 3, "#bfe3f7");
  b.use("glass").box(560, 90, hd + 9, 240, 170, 3, "#bfe3f7");
  // Inside: lift posts, tool wall, tyres and a counter in the office.
  b.use("metal").box(-650, 0, 0, 30, 300, 30, "#e63946").box(-50, 0, 0, 30, 300, 30, "#e63946");
  b.use("paint").box(-380, 0, -hd + 30, 700, 260, 30, "#5c6773");
  for (let i = 0; i < 12; i++) b.use("metal").box(-680 + i * 55, 100 + (i % 3) * 40, -hd + 47, 12, 40, 4, "#c0c7cf");
  for (let i = 0; i < 4; i++) b.use("paint").cyl(-700, i * 26, 350, 50, 24, "#1d1d1f", 16, 50);
  b.use("gloss").box(450, 0, -200, 400, 100, 90, BLUE);
  b.use("paint").box(450, 100, -200, 410, 6, 100, WHITE);
  b.use("glass").cyl(450, 106, -200, 22, 36, "#dbeafe", 14, 18);
  b.use("gloss").box(450, 0, -hd + 60, 400, 180, 60, "#f2c14e");
  dressDino(b, l);
  // Canopy over two pump islands.
  const cz = hd + 900;
  for (const x of [-700, 700]) b.use("metal").box(x, 0, cz, 40, 480, 40, WHITE);
  b.use("gloss").box(0, 480, cz, 1900, 60, 1000, WHITE);
  b.use("gloss").box(0, 480, cz + 500, 1900, 60, 6, BLUE).box(0, 480, cz - 500, 1900, 60, 6, BLUE);
  for (const x of [-600, 0, 600]) b.use("glow").box(x, 478, cz, 300, 2, 120, "#fff8e1");
  for (const x of [-400, 400]) {
    b.use("concrete").box(x, 0, cz, 200, 20, 600, "#d5d0c4");
    buildPump(b, x, cz - 150);
    buildPump(b, x, cz + 150);
  }
  b.at(-700, 0, cz + 50, 0, () => buildCar(b, "#e9c46a"));
  // Apron, tall sign pole with the dinosaur on top, and a tyre stack.
  b.use("concrete").box(0, 0, hd + 900, l.w + 1400, 2, 1800, "#cfcac0");
  b.use("metal").cyl(hw + 400, 0, cz + 500, 22, 1100, "#9aa3ad", 10);
  b.use("gloss").box(hw + 400, 1100, cz + 500, 500, 220, 40, WHITE);
  buildDino(b, hw + 300, 1320, cz + 500, 1.3);
  b.use("gloss").box(hw + 400, 700, cz + 500, 260, 260, 30, BLUE);
  b.use("glow").box(hw + 400, 720, cz + 516, 220, 220, 2, "#f2c14e");
  for (let i = 0; i < 5; i++) b.use("paint").cyl(-hw - 150, i * 26, hd + 200, 50, 24, "#1d1d1f", 16, 50);
  buildLamp(b, -hw - 200, cz + 800, Math.PI / 2);
}

/** Car on the lift that rises when the lift hotspot is used. */
function Lift() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t0 = runtime.town.triggers.lift;
    const age = t0 === undefined ? 99 : clock.elapsedTime - t0;
    const up = age < 2 ? age / 2 : age < 8 ? 1 : age < 10 ? 1 - (age - 8) / 2 : 0;
    g.position.y = up * 150;
  });
  return (
    <group ref={ref} position={[-350, 0, 0]}>
      <mesh position={[0, 12, 0]} castShadow>
        <boxGeometry args={[560, 8, 260]} />
        <meshStandardMaterial color="#e63946" roughness={0.5} />
      </mesh>
      <group position={[0, 16, 0]} rotation-y={Math.PI / 2}>
        <Built build={(b) => buildCar(b, "#2e86c1")} />
      </group>
    </group>
  );
}

export function DinoGas({ l }: { l: Landmark }) {
  const hd = l.d / 2;
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildStation(b, l)} />
      <Lift />
      <Roof l={l}>
        <Built deps={[l.id]} build={(b) => buildFlatRoof(b, l, l.h, "#8b8378", 30, BLUE)} />
      </Roof>
      <Sign text="DINOCO" position={[l.w / 2 + 400, 1210, hd + 900 + 500 + 21]} size={[460, 180]} bg={WHITE} fg={BLUE} border={DINO} />
      <Sign text="DINOCO" position={[0, 510, hd + 900 + 504]} size={[900, 50]} bg={BLUE} fg="#ffffff" glow />
      <Sign text="SERVICE" position={[-380, 360, hd + 12]} size={[360, 50]} bg={BLUE} fg="#ffffff" />
      <Sign text="$1.29" position={[l.w / 2 + 400, 830, hd + 900 + 500 + 17]} size={[220, 90]} bg="#1b1b3a" fg="#f2c14e" glow />
    </LandmarkGroup>
  );
}
