"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { runtime } from "@/lib/runtime";
import type { Landmark } from "@/lib/town/config";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../builder";
import { buildFence, buildLamp, buildTree, Built, LandmarkGroup, Sign } from "../parts";
import { buildTableSet } from "../interiorProps";
import { buildBench, buildRocketClimber, buildSandbox, buildSeesaw, buildSlide, buildSwings } from "./playKit";

function path(b: Builder, ax: number, az: number, bx: number, bz: number, w = 300) {
  const len = Math.hypot(bx - ax, bz - az);
  b.use("concrete").cbox((ax + bx) / 2, 1.5, (az + bz) / 2, w, 2, len + w, "#d8cfbd", { ry: Math.atan2(bx - ax, bz - az) });
}

function buildPark(b: Builder, l: Landmark) {
  const r = seededRandom(77);
  const hw = l.w / 2;
  const hd = l.d / 2;
  b.use("grass").box(0, 0, 0, l.w, 1, l.d, "#7cc36a");
  // Paths crossing the park and around the pond.
  path(b, -hw, 0, hw, 0);
  path(b, -2000, -hd, -2000, hd);
  path(b, -hw + 500, -hd + 500, -2000, 0);
  path(b, 3000, 0, hw - 400, hd - 400);
  // Duck pond with an island and ducks.
  const px = -5500;
  const pz = -1200;
  b.use("concrete").cyl(px, 0, pz, 1900, 6, "#b8a98a", 40);
  b.use("glass").cyl(px, 3, pz, 1820, 6, "#3d8fc4", 40);
  b.use("grass").cyl(px + 400, 0, pz - 300, 300, 30, "#6aa85a", 20);
  buildTree(b, px + 400, pz - 300, 0.8);
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const d = 600 + r() * 900;
    const dx = px + Math.cos(a) * d;
    const dz = pz + Math.sin(a) * d;
    b.use("gloss").sphere(dx, 12, dz, 14, i % 3 ? "#f8fafc" : "#6b8e23", 0.7, 10);
    b.use("gloss").sphere(dx + 10, 24, dz, 7, i % 3 ? "#f8fafc" : "#2f6b3a", 1, 8);
    b.use("gloss").cone(dx + 18, 23, dz, 3, 8, "#f4a261", 6);
  }
  // Bandstand
  b.at(3500, 0, -1500, 0, () => {
    b.use("wood").cyl(0, 0, 0, 700, 80, "#f4f1ea", 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      b.use("wood").cyl(Math.cos(a) * 620, 80, Math.sin(a) * 620, 20, 380, "#f4f1ea", 8);
    }
    b.use("shingle").cone(0, 460, 0, 780, 340, "#2f6b3a", 8);
    b.use("metal").sphere(0, 820, 0, 30, "#c9a227", 1, 10);
  });
  // Fountain at the crossing, flower beds, benches, picnic tables and lamps.
  b.use("concrete").cyl(-2000, 0, 0, 450, 60, "#d9d4c8", 32);
  b.use("glass").cyl(-2000, 50, 0, 420, 6, "#5fc6f0", 32);
  b.use("concrete").cyl(-2000, 0, 0, 60, 220, "#d9d4c8", 16);
  b.use("glass").cyl(-2000, 220, 0, 25, 100, "#bfe9ff", 12, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.use("dirt").cyl(-2000 + Math.cos(a) * 750, 0, Math.sin(a) * 750, 160, 8, "#6b4a2b", 16);
    for (let k = 0; k < 8; k++) b.use("gloss").sphere(-2000 + Math.cos(a) * 750 + (r() - 0.5) * 220, 18, Math.sin(a) * 750 + (r() - 0.5) * 220, 12, ["#ff6fb5", "#ffd166", "#ef476f", "#9b5de5"][k % 4], 0.8, 8);
  }
  for (let x = -hw + 800; x < hw - 400; x += 1600) {
    buildBench(b, x, -260, 0);
    buildBench(b, x + 800, 260, Math.PI);
    buildLamp(b, x + 400, -280, 0, 450);
  }
  for (let i = 0; i < 5; i++) buildTableSet(b, -7000 + i * 600, hd - 900, "#8a5a35", "#8a5a35", false);
  // Lots of trees, keeping the paths, pond and lawns open.
  for (let i = 0; i < 120; i++) {
    const x = -hw + 300 + r() * (l.w - 600);
    const z = -hd + 300 + r() * (l.d - 600);
    if (Math.abs(z) < 500 || Math.abs(x + 2000) < 500 || Math.hypot(x - px, z - pz) < 2200 || Math.hypot(x - 3500, z + 1500) < 1100) continue;
    if (x > 3900 && x < 7500 && z > -2600 && z < 400) continue;
    buildTree(b, x, z, 0.8 + r() * 0.7, ["#356b2b", "#3f7a34", "#4a7f2f", "#5a8a3a"][i % 4]);
  }
}

function buildPlayground(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  b.use("paint").box(0, 1.5, 0, l.w, 2, l.d, "#d9734e");
  buildFence(b, -hw, -hd, hw, -hd, "#457b9d", 90, 20);
  buildFence(b, -hw, hd, -200, hd, "#457b9d", 90, 20);
  buildFence(b, 200, hd, hw, hd, "#457b9d", 90, 20);
  buildFence(b, -hw, -hd, -hw, hd, "#457b9d", 90, 20);
  buildFence(b, hw, -hd, hw, hd, "#457b9d", 90, 20);
  buildRocketClimber(b, 0, -300, 800);
  buildSwings(b, -1000, 600, 4);
  buildSlide(b, 900, 500, Math.PI, 220, "#e63946");
  buildSlide(b, 1000, -700, 0, 160, "#2a9d8f");
  buildSandbox(b, -1100, -900, 500, 400);
  buildSeesaw(b, 300, 800, 0);
  buildBench(b, -hw + 200, 0, Math.PI / 2);
}

function buildConstruction(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  b.use("dirt").box(0, 0, 0, l.w, 1.5, l.d, "#9c7b55");
  // Hoarding around the site with a gate at the front.
  for (const [ax, az, bx, bz] of [
    [-hw, -hd, hw, -hd],
    [-hw, -hd, -hw, hd],
    [hw, -hd, hw, hd],
    [-hw, hd, -600, hd],
    [600, hd, hw, hd],
  ])
    buildFence(b, ax, az, bx, bz, "#e9e2c9", 220, 40);
  // Steel frame going up: concrete slab, columns, beams and a couple of finished floors.
  b.use("concrete").box(1000, 0, -800, 3600, 40, 2800, "#b8b2a6");
  for (let f = 0; f < 4; f++) {
    const y = 40 + f * 400;
    for (let x = -600; x <= 2600; x += 800) for (let z = -2100; z <= 500; z += 650) b.use("metal").box(x, y, z, 30, 400, 30, "#c0392b");
    b.use("metal").box(1000, y + 380, -2100, 3260, 24, 24, "#c0392b").box(1000, y + 380, 500, 3260, 24, 24, "#c0392b");
    for (let x = -600; x <= 2600; x += 800) b.use("metal").box(x, y + 380, -800, 24, 24, 2620, "#c0392b");
    if (f < 2) b.use("concrete").box(1000, y + 400, -800, 3260, 20, 2620, "#b8b2a6");
  }
  // Materials, cones, a cement mixer, an excavator and a site office.
  for (let i = 0; i < 6; i++) b.use("planks").box(-2400 + (i % 3) * 300, Math.floor(i / 3) * 40, -2200, 260, 40, 600, "#c8a165");
  for (let i = 0; i < 5; i++) b.use("metal").cyl(-2600, 30, -1200 + i * 90, 30, 900, "#7d838b", 10, 30, { rz: Math.PI / 2 });
  for (let i = 0; i < 12; i++) b.use("gloss").cone(-hw + 300 + i * 500, 0, hd - 300, 22, 60, "#f97316", 10);
  b.use("dirt").sphere(-2200, 0, 900, 900, "#8a6a45", 0.45, 14);
  b.at(-2400, 0, 2000, 0.6, () => {
    b.use("gloss").box(0, 60, 0, 260, 260, 500, "#f2c230");
    b.use("metal").cyl(0, 250, -350, 150, 600, "#d0d5db", 16, 120, { rx: Math.PI / 2 - 0.3 });
    for (const z of [-400, -150, 200]) for (const s of [-1, 1]) b.use("paint").rod(s * 125, 50, z, 50, 30, "#1d1d1f", 0, 12);
  });
  b.at(500, 0, 2100, -0.8, () => {
    for (const s of [-1, 1]) b.use("metal").box(s * 140, 0, 0, 90, 90, 500, "#2b2f36");
    b.use("gloss").box(0, 90, -40, 300, 200, 320, "#f2c230");
    b.use("glass").box(-80, 290, 0, 140, 150, 140, "#26323d");
    b.use("gloss").cbox(60, 420, 350, 50, 50, 700, "#f2c230", { rx: -0.5 });
    b.use("gloss").cbox(60, 420, 820, 50, 50, 500, "#f2c230", { rx: 0.9 });
    b.use("metal").box(60, 120, 980, 140, 100, 100, "#5c6773");
  });
  b.use("siding").box(hw - 900, 0, hd - 900, 1200, 300, 500, "#f2f0e8");
  b.use("glass").box(hw - 900, 130, hd - 649, 700, 100, 2, "#3b4a5a");
  b.use("gloss").box(hw - 1800, 0, hd - 700, 120, 230, 120, "#2a9d8f");
  // Tower crane mast and counterweight base (jib turns separately).
  b.at(-1500, 0, 1000, 0, () => {
    b.use("concrete").box(0, 0, 0, 500, 80, 500, "#b8b2a6");
    for (const [dx, dz] of [
      [-90, -90],
      [90, -90],
      [-90, 90],
      [90, 90],
    ])
      b.use("metal").box(dx, 80, dz, 20, 3600, 20, "#f2c230");
    for (let y = 300; y < 3680; y += 300) {
      b.use("metal").box(0, y, -90, 200, 12, 12, "#f2c230").box(0, y, 90, 200, 12, 12, "#f2c230");
      b.use("metal").box(-90, y, 0, 12, 12, 200, "#f2c230").box(90, y, 0, 12, 12, 200, "#f2c230");
    }
  });
}

/** Jib of the tower crane, which slews round when operated. */
function TowerJib() {
  const ref = useRef<THREE.Group>(null);
  const hook = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t0 = runtime.town.triggers.towercrane;
    const age = t0 === undefined ? 99 : clock.elapsedTime - t0;
    if (ref.current) ref.current.rotation.y = age < 10 ? Math.sin((age / 10) * Math.PI) * 2.4 : 0;
    if (hook.current) hook.current.position.y = age < 10 ? 3300 - Math.sin((age / 10) * Math.PI) * 2400 : 3300;
  });
  return (
    <group position={[-1500, 3680, 1000]}>
      <group ref={ref}>
        <mesh position={[0, 60, 1600]} castShadow>
          <boxGeometry args={[120, 120, 4200]} />
          <meshStandardMaterial color="#f2c230" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, -900]} castShadow>
          <boxGeometry args={[260, 200, 600]} />
          <meshStandardMaterial color="#7d838b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 120, 0]} castShadow>
          <boxGeometry args={[220, 240, 260]} />
          <meshStandardMaterial color="#e9e2c9" roughness={0.6} />
        </mesh>
        <group position={[0, -3680, 3200]}>
          <group ref={hook} position={[0, 3300, 0]}>
            <mesh position={[0, 200, 0]}>
              <cylinderGeometry args={[3, 3, 400, 6]} />
              <meshStandardMaterial color="#1d1d1f" />
            </mesh>
            <mesh>
              <boxGeometry args={[60, 60, 60]} />
              <meshStandardMaterial color="#e63946" />
            </mesh>
            <mesh position={[0, -120, 0]} castShadow>
              <boxGeometry args={[500, 30, 120]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function OpenAreas({ l }: { l: Landmark }) {
  if (l.kind === "park")
    return (
      <LandmarkGroup l={l}>
        <Built deps={[l.id]} build={(b) => buildPark(b, l)} castShadow={false} />
        <Sign text="CITY PARK" position={[-l.w / 2 + 600, 160, l.d / 2 - 60]} size={[500, 110]} bg="#2f6b3a" fg="#f4f1ea" border="#f4f1ea" doubleSided />
      </LandmarkGroup>
    );
  if (l.kind === "playground")
    return (
      <LandmarkGroup l={l}>
        <Built deps={[l.id]} build={(b) => buildPlayground(b, l)} />
        <Sign text="ROCKET PLAYGROUND" position={[0, 200, l.d / 2 + 6]} size={[700, 100]} bg="#e63946" fg="#ffffff" doubleSided />
      </LandmarkGroup>
    );
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildConstruction(b, l)} />
      <TowerJib />
      <Sign text="CONSTRUCTION SITE · HARD HATS" position={[0, 260, l.d / 2 + 26]} size={[1100, 120]} bg="#f2c230" fg="#1d1d1f" doubleSided />
    </LandmarkGroup>
  );
}
