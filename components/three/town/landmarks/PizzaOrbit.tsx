"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { rocketRise } from "@/lib/explore/space";
import { runtime } from "@/lib/runtime";
import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { dressPizza, buildAlien } from "../filmSet";
import { buildProps, buildTableSet } from "../interiorProps";
import { buildCars, buildLamp, buildParking, buildShell, Built, LandmarkGroup, Roof, Sign } from "../parts";

const RED = "#d62828";
const YELLOW = "#ffc300";
const CREAM = "#f3ead8";
const TEAL = "#2ec4b6";

/** A retro rocket standing on its fins. */
function buildRocket(b: Builder, x: number, z: number, h: number) {
  const r = h * 0.09;
  b.use("gloss").cyl(x, h * 0.12, z, r, h * 0.55, CREAM, 20, r * 0.9);
  b.use("gloss").cyl(x, h * 0.67, z, r * 0.9, h * 0.13, CREAM, 20, r * 0.55);
  b.use("gloss").cone(x, h * 0.8, z, r * 0.55, h * 0.2, RED, 20);
  b.use("gloss").cyl(x, h * 0.05, z, r * 0.7, h * 0.08, "#6c757d", 16, r);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    b.use("gloss").cbox(x + Math.sin(a) * r * 1.3, h * 0.2, z + Math.cos(a) * r * 1.3, 10, h * 0.3, r * 1.4, RED, { ry: a, rx: 0.25 });
  }
  for (const y of [0.32, 0.48]) {
    b.use("glass").cyl(x, h * y, z + r * 0.75, r * 0.3, r * 0.4, "#9be7ff", 16, r * 0.3, { rx: Math.PI / 2 });
    b.use("metal").torus(x, h * y, z + r * 0.92, r * 0.3, r * 0.06, "#c0c7cf");
  }
  b.use("paint").box(x, h * 0.6, z, r * 2.05, h * 0.03, r * 2.05, YELLOW);
}

/** Lattice gantry beside the rocket. */
function buildGantry(b: Builder, x: number, z: number, h: number) {
  const w = 260;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("metal").cyl(x + sx * w, 0, z + sz * w, 16, h, "#d4572a", 8, 12);
  for (let y = 160; y < h; y += 220) {
    b.use("metal").box(x, y, z, w * 2 + 36, 12, w * 2 + 36, "#e8a05a");
    for (const s of [-1, 1]) {
      b.use("metal").cbox(x, y, z + s * w, 10, 230, w * 2, "#ff7a3d", { rx: 0.7 });
      b.use("metal").cbox(x + s * w, y, z, w * 2, 230, 10, "#ff7a3d", { rz: 0.7 });
    }
  }
  b.use("metal").box(x + w + 90, h - 30, z, 380, 20, 36, "#e8a05a");
}

function buildExterior(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "gloss", color: CREAM }, int: "#241a45", floor: { slot: "tile", color: "#f2e8d5" }, trim: RED, doorH: 300 });
  b.use("glass").box(0, 80, hd + 12, l.w - 80, 520, 8, "#9be7ff");
  b.use("gloss").box(0, 360, hd + 16, l.w + 20, 28, 6, RED);
  b.use("gloss").box(0, 400, hd + 16, l.w + 20, 16, 6, YELLOW);
  for (let x = -hw + 300; x < hw - 200; x += 420) {
    if (Math.abs(x) < 600) continue;
    b.use("glow").cyl(x, 180, hd + 18, 110, 4, x < 0 ? "#57ff8f" : "#4cc9f0", 24, 110, { rx: Math.PI / 2 });
    b.use("metal").torus(x, 180, hd + 22, 112, 12, "#c0c7cf");
  }
  b.use("gloss").box(-320, 0, hd + 180, 70, 540, 280, RED);
  b.use("gloss").box(320, 0, hd + 180, 70, 540, 280, RED);
  b.use("gloss").box(0, 480, hd + 180, 720, 70, 300, YELLOW);
  for (let x = -280; x <= 280; x += 70) b.use("glow").sphere(x, 540, hd + 332, 12, "#fff3b0", 1, 8);
  buildAlien(b, -520, 0, hd + 320, 2.4, 0);
  buildAlien(b, 520, 0, hd + 320, 2.4, 0);
  const rx = -hw - 900;
  const rz = hd + 200;
  b.use("concrete").cyl(rx, 0, rz, 380, 24, "#c5c0b6", 24);
  buildGantry(b, rx - 520, rz, 2400);
  b.use("metal").cyl(hw - 200, 0, hd + 3600, 50, 1800, "#9aa3ad", 12);
  b.use("metal").cyl(hw - 900, 0, hd + 3600, 50, 1800, "#9aa3ad", 12);
  b.use("gloss").sphere(hw - 550, 2200, hd + 3600, 480, "#ff7a3d", 1, 24);
  b.use("gloss").torus(hw - 550, 2200, hd + 3600, 720, 70, YELLOW, { rx: Math.PI / 2 - 0.4, rz: 0.3 });
  for (const [x, z] of [
    [-hw - 400, hd + 4200],
    [hw + 200, hd + 4200],
    [hw + 200, hd + 1600],
  ] as const) {
    b.use("metal").cyl(x, 0, z, 28, 900, "#3b4148", 10);
    b.use("metal").box(x, 900, z, 80, 40, 80, "#2b2f36");
  }
  b.use("asphalt").box(hw + 450, 0, 0, 700, 2, l.d + 1400, "#7d8086");
  for (let z = -hd; z < hd + 600; z += 500) b.use("paint").box(hw + 450, 2.2, z, 12, 0.5, 250, YELLOW);
  b.use("gloss").box(hw + 9, 120, -400, 6, 160, 300, RED);
  b.use("glow").box(hw + 13, 150, -400, 2, 100, 240, "#9be7ff");
  b.use("metal").cyl(hw + 900, 0, 600, 8, 200, "#3b4148", 8);
  b.use("gloss").box(hw + 900, 200, 600, 30, 160, 260, "#1b1b3a");
  b.use("glow").box(hw + 884, 220, 600, 2, 120, 220, "#ffd166");
  buildParking(b, -hw + 400, hd + 2600, 16, 280, 520);
  buildCars(b, -hw + 400, hd + 2600, 16, 280, Math.PI, 3);
  buildLamp(b, -hw + 200, hd + 3400, 0);
  buildLamp(b, hw - 800, hd + 3400, 0);
}

function buildSaucer(b: Builder) {
  b.use("gloss").cyl(0, 620, 0, 3400, 90, "#e4572e", 48, 2800);
  b.use("gloss").cyl(0, 700, 0, 2700, 50, "#ff6b3d", 40, 2200);
  b.use("gloss").dome(0, 740, 0, 2100, CREAM, 0.42);
  b.use("gloss").torus(0, 680, 0, 3000, 70, YELLOW, { rx: Math.PI / 2 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    b.use("glow").sphere(Math.sin(a) * 3100, 640, Math.cos(a) * 3100, 28, i % 2 ? YELLOW : "#fff3b0", 1, 8);
  }
}

function buildInterior(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildProps(b, INTERIOR_SOLIDS.pizza, 7);
  dressPizza(b, l);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) buildTableSet(b, -1050 + col * 700, -500 + row * 520, CREAM, col % 2 ? RED : TEAL);
  // Starry inner walls and hanging planets.
  for (let i = 0; i < 80; i++) {
    const t = (i * 97) % 1000;
    const y = 150 + ((i * 53) % 650);
    if (i % 2) b.use("glow").sphere(-hw + 14, y, -hd + (t / 1000) * l.d, 4, "#fff3b0", 1, 6);
    else b.use("glow").sphere(hw - 14, y, -hd + (t / 1000) * l.d, 4, "#fff3b0", 1, 6);
    b.use("glow").sphere(-hw + (t / 1000) * l.w, y, -hd + 14, 4, "#fff3b0", 1, 6);
  }
  const planets: [number, number, number, string][] = [
    [-1200, 700, 200, "#ff7a3d"],
    [0, 720, 260, "#4cc9f0"],
    [1200, 690, 180, "#9b5de5"],
    [-600, 760, -900, "#7ee36d"],
    [800, 740, -800, "#f15bb5"],
  ];
  for (const [x, y, z, c] of planets) {
    b.use("metal").cyl(x, y + 60, z, 1.5, l.h - y - 60, "#c0c7cf", 4);
    b.use("gloss").sphere(x, y, z, 60, c, 1, 16);
    b.use("gloss").torus(x, y, z, 95, 6, YELLOW, { rx: Math.PI / 2 - 0.4 });
  }
  // Space-themed sign over the counter, and aliens in the prize area.
  b.use("glow").box(0, 520, -hd + 30, 1800, 160, 6, "#1b1b3a");
  for (let i = 0; i < 6; i++) buildAlien(b, -2150 + i * 70, 125, 900, 0.9, 0);
  // Entrance rug and a rocket ride.
  b.use("paint").box(0, 1, hd - 300, 600, 1, 500, "#3a0ca3");
  buildRocket(b, -1900, -100, 380);
  // Token pedestal — Squeak's lost prize.
  b.use("gloss").cyl(-1400, 0, 400, 28, 8, "#c0c7cf", 16);
  b.use("gloss").cyl(-1400, 8, 400, 18, 18, RED, 16);
  b.use("glow").cyl(-1400, 26, 400, 16, 2, YELLOW, 16);
}

/** Claw that drops and lifts when the hotspot is used. */
function Claw() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t0 = runtime.town.triggers.claw;
    const age = t0 === undefined ? 99 : clock.elapsedTime - t0;
    const drop = age < 3 ? Math.sin((Math.min(age, 3) / 3) * Math.PI) : 0;
    g.position.set(1900 + Math.sin(clock.elapsedTime * 0.7) * 50 * (1 - drop), 195 - drop * 70, 900 + Math.cos(clock.elapsedTime * 0.5) * 50 * (1 - drop));
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[6, 6, 14, 10]} />
        <meshStandardMaterial color="#c0c7cf" metalness={0.6} roughness={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI * 2) / 3) * 7, -12, Math.cos((i * Math.PI * 2) / 3) * 7]} rotation={[Math.cos((i * Math.PI * 2) / 3) * 0.5, 0, -Math.sin((i * Math.PI * 2) / 3) * 0.5]}>
          <boxGeometry args={[2, 18, 2]} />
          <meshStandardMaterial color="#c0c7cf" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Arcade screens flash when played. */
function ArcadeGlow() {
  const west = useRef<THREE.MeshBasicMaterial>(null);
  const east = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    for (const [id, m] of [
      ["arcade-w", west.current],
      ["arcade-e", east.current],
    ] as const) {
      if (!m) continue;
      const t0 = runtime.town.triggers[id];
      const age = t0 === undefined ? 99 : clock.elapsedTime - t0;
      m.opacity = age < 4 ? 0.35 + 0.35 * Math.abs(Math.sin(age * 9)) : 0;
    }
  });
  return (
    <>
      <mesh position={[-2270, 110, -650]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1300, 200]} />
        <meshBasicMaterial ref={west} color="#57ff8f" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[2270, 110, -650]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1300, 200]} />
        <meshBasicMaterial ref={east} color="#f72585" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
  );
}

/** The big rocket out front: lifts off on a column of fire when you launch to space. */
function LaunchRocket({ l }: { l: Landmark }) {
  const ref = useRef<THREE.Group>(null);
  const fire = useRef<THREE.Group>(null);
  const rx = -l.w / 2 - 900;
  const rz = l.d / 2 + 200;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const at = runtime.explore.launchAt;
    const age = at === null ? -1 : clock.elapsedTime - at;
    const shake = age > 3 && age < 6 ? Math.sin(clock.elapsedTime * 60) * 6 : 0;
    g.position.set(rx + shake, age < 0 ? 0 : rocketRise(age), rz);
    if (fire.current) {
      fire.current.visible = age > 3;
      fire.current.scale.set(1, 0.8 + Math.sin(clock.elapsedTime * 30) * 0.2 + Math.max(0, age - 5) * 0.3, 1);
    }
  });
  return (
    <group ref={ref} position={[rx, 0, rz]}>
      <Built deps={["launch-rocket"]} build={(b) => buildRocket(b, 0, 0, 3200)} />
      <group ref={fire} visible={false}>
        <mesh position={[0, -500, 0]} rotation-x={Math.PI}>
          <coneGeometry args={[220, 1400, 16, 1, true]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.8} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, -200, 0]} rotation-x={Math.PI}>
          <coneGeometry args={[150, 800, 16, 1, true]} />
          <meshBasicMaterial color="#fff3b0" transparent opacity={0.9} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Sweeping cones of light over the parking lot. */
function Searchlights({ l }: { l: Landmark }) {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const hd = l.d / 2;
  const hw = l.w / 2;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (a.current) {
      a.current.rotation.y = Math.sin(t * 0.35) * 0.7;
      a.current.rotation.x = 0.55 + Math.sin(t * 0.22) * 0.12;
    }
    if (b.current) {
      b.current.rotation.y = Math.PI + Math.cos(t * 0.28) * 0.7;
      b.current.rotation.x = 0.5 + Math.cos(t * 0.18) * 0.12;
    }
  });
  const cone = (
    <mesh position={[0, 900, 0]} rotation-x={Math.PI}>
      <coneGeometry args={[420, 2800, 16, 1, true]} />
      <meshBasicMaterial color="#fff6d0" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
  return (
    <>
      <group ref={a} position={[-hw - 400, 0, hd + 4200]}>
        {cone}
      </group>
      <group ref={b} position={[hw + 200, 0, hd + 4200]}>
        {cone}
      </group>
    </>
  );
}

export function PizzaOrbit({ l }: { l: Landmark }) {
  const hd = l.d / 2;
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildExterior(b, l)} />
      <Built deps={[l.id]} build={(b) => buildInterior(b, l)} castShadow={false} />
      <Claw />
      <ArcadeGlow />
      <Searchlights l={l} />
      <LaunchRocket l={l} />
      <Sign text="LAUNCH PAD · PRESS E" position={[-l.w / 2 - 900, 140, hd + 200 + 400]} size={[700, 110]} bg="#1b1b3a" fg="#ffc300" glow doubleSided />
      <Roof l={l}>
        <Built deps={[l.id]} build={buildSaucer} />
      </Roof>
      <Sign text="PIZZA PLANET" position={[0, 560, hd + 340]} size={[900, 160]} bg="transparent" fg="#3ddc84" glow />
      <Sign text="PIZZA PLANET" position={[l.w / 2 - 550, 1450, hd + 3600]} size={[1400, 280]} bg="#1b1b3a" fg="#3ddc84" border={YELLOW} glow doubleSided />
      <Sign text="DRIVE-THRU" position={[l.w / 2 + 450, 500, l.d / 2 + 500]} size={[500, 110]} bg={TEAL} fg="#ffffff" glow doubleSided />
      <Sign text="ARCADE · PIZZA · PRIZES" position={[0, 600, -hd + 34]} size={[1700, 140]} bg="#1b1b3a" fg="#57ff8f" glow />
      <Sign text="THE CLAW" position={[1900, 300, 900]} size={[420, 70]} bg="#1b1b3a" fg="#ffc300" glow doubleSided />
    </LandmarkGroup>
  );
}
