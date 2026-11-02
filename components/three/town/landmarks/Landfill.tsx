"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { runtime } from "@/lib/runtime";
import type { Landmark } from "@/lib/town/config";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../builder";
import { buildFence, Built, LandmarkGroup, Sign } from "../parts";

const DIRT = "#5e5442";
const JUNK = ["#6b6f76", "#7d6b55", "#4b5563", "#8a7a5a", "#5b4a3a", "#3f4a3f", "#9a8c74", "#2f6b8a", "#8a3b2f"];

/** Local positions of the moving machinery (also used by the hotspots). */
const CRANE = { x: -1500, z: 3500 };
const CONVEYOR = { x: 3500, z: 2500, len: 4200 };
const FURNACE = { x: 3000, z: -4800 };

export function buildGarbageTruck(b: Builder, color = "#3f7a34") {
  b.use("gloss").box(0, 60, -150, 260, 300, 700, color);
  b.use("gloss").box(0, 60, 380, 250, 240, 260, color);
  b.use("glass").box(0, 200, 511, 220, 80, 2, "#26323d");
  b.use("metal").box(0, 40, 0, 220, 40, 1100, "#2b2f36");
  b.use("metal").box(0, 120, -520, 240, 220, 60, "#5c6773");
  for (const z of [-350, -150, 380]) for (const s of [-1, 1]) b.use("paint").rod(s * 125, 50, z, 50, 30, "#1d1d1f", 0, 12);
}

function buildYard(b: Builder, l: Landmark) {
  const r = seededRandom(2010);
  const hw = l.w / 2;
  const hd = l.d / 2;
  b.use("dirt").box(0, 0, 0, l.w, 1.5, l.d, DIRT);
  // Perimeter fence with a gate where Landfill Road arrives.
  const gateX = -4500;
  buildFence(b, -hw, hd, gateX - 500, hd, "#7d838b", 240, 30);
  buildFence(b, gateX + 500, hd, hw, hd, "#7d838b", 240, 30);
  buildFence(b, -hw, -hd, hw, -hd, "#7d838b", 240, 30);
  buildFence(b, -hw, -hd, -hw, hd, "#7d838b", 240, 30);
  buildFence(b, hw, -hd, hw, hd, "#7d838b", 240, 30);
  for (const s of [-1, 1]) b.use("metal").box(gateX + s * 520, 0, hd, 40, 320, 40, "#c0392b");
  b.use("metal").box(gateX, 300, hd, 1080, 40, 20, "#c0392b");

  // Mountains of trash: rounded mounds with junk scattered over them.
  const mounds: [number, number, number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const x = -hw + 800 + r() * (l.w - 1600);
    const z = -hd + 800 + r() * (l.d - 1600);
    if (Math.hypot(x - CRANE.x, z - CRANE.z) < 1300 || Math.abs(x - CONVEYOR.x) < 700 || Math.hypot(x - FURNACE.x, z - FURNACE.z) < 2500 || Math.abs(x - gateX) < 900) continue;
    const rad = 700 + r() * 1300;
    const h = 300 + r() * 900;
    mounds.push([x, z, rad, h]);
    b.use("paint").sphere(x, 0, z, rad, JUNK[i % JUNK.length], h / rad, 14);
  }
  for (const [x, z, rad, h] of mounds) {
    for (let k = 0; k < 22; k++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad * 0.85;
      const y = h * Math.sqrt(Math.max(0, 1 - (d / rad) ** 2));
      const c = JUNK[Math.floor(r() * JUNK.length)];
      const kind = k % 4;
      if (kind === 0) b.use("paint").box(x + Math.cos(a) * d, y - 10, z + Math.sin(a) * d, 40 + r() * 80, 30 + r() * 50, 40 + r() * 80, c, { ry: r() * 3, rx: r() - 0.5 });
      else if (kind === 1) b.use("paint").sphere(x + Math.cos(a) * d, y, z + Math.sin(a) * d, 25 + r() * 35, ["#1d1d1f", "#2b2f36", "#3f3b38"][k % 3], 0.8, 8);
      else if (kind === 2) b.use("paint").torus(x + Math.cos(a) * d, y + 5, z + Math.sin(a) * d, 40, 15, "#1d1d1f", { rx: r() * 3 });
      else b.use("metal").cyl(x + Math.cos(a) * d, y - 20, z + Math.sin(a) * d, 25, 70, ["#7d838b", "#8a3b2f", "#2f6b8a"][k % 3], 10, 25, { rx: r() * 3, rz: r() * 3 });
    }
  }

  // Incinerator: big dark shed, glowing furnace mouth and two smokestacks.
  b.at(FURNACE.x, 0, FURNACE.z, 0, () => {
    b.use("siding").box(0, 0, 0, 3200, 1600, 2200, "#3b3f45");
    b.use("metal").gable(0, 1600, 0, 3300, 400, 2300, "#2b2f36", Math.PI / 2);
    b.use("metal").box(0, 0, 1105, 1200, 700, 20, "#1d1d1f");
    b.use("glow").box(0, 40, 1110, 1000, 520, 4, "#ff7b1c");
    b.use("glow").box(0, 40, 1112, 700, 300, 2, "#ffd166");
    for (const x of [-900, 900]) {
      b.use("brick").cyl(x, 1600, -400, 180, 2400, "#5b4a3a", 16, 140);
      b.use("metal").torus(x, 3980, -400, 145, 18, "#2b2f36", { rx: Math.PI / 2 });
    }
    b.use("metal").box(0, 1000, 1150, 1600, 40, 300, "#5c6773");
  });

  // Crane base: tracks, cab and mast (the boom and claw animate separately).
  b.at(CRANE.x, 0, CRANE.z, 0, () => {
    for (const s of [-1, 1]) b.use("metal").box(s * 300, 0, 0, 160, 120, 900, "#2b2f36");
    b.use("gloss").box(0, 120, 0, 600, 260, 600, "#e0a526");
    b.use("glass").box(0, 260, 302, 400, 110, 3, "#26323d");
    for (const [dx, dz] of [
      [-120, -120],
      [120, -120],
      [-120, 120],
      [120, 120],
    ])
      b.use("metal").box(dx, 380, dz, 24, 2600, 24, "#e0a526");
    for (let y = 600; y < 2900; y += 400) b.use("metal").box(0, y, 0, 270, 16, 270, "#e0a526");
  });

  // Conveyor frame up to the sorting shed, plus the shed itself.
  b.at(CONVEYOR.x, 0, CONVEYOR.z, 0, () => {
    const rise = 900;
    const ang = Math.atan2(rise, CONVEYOR.len);
    b.use("metal").cbox(0, rise / 2 + 80, 0, 260, 30, Math.hypot(rise, CONVEYOR.len), "#4b5563", { rx: ang });
    for (let i = 0; i <= 6; i++) {
      const z = -CONVEYOR.len / 2 + (i * CONVEYOR.len) / 6;
      const y = (rise * (CONVEYOR.len / 2 - z)) / CONVEYOR.len;
      for (const s of [-1, 1]) b.use("metal").box(s * 130, 0, z, 16, y + 80, 16, "#5c6773");
    }
    b.use("siding").box(0, 0, -CONVEYOR.len / 2 - 900, 1800, 1300, 1600, "#6b7280");
    b.use("metal").gable(0, 1300, -CONVEYOR.len / 2 - 900, 1900, 300, 1700, "#4b5563");
  });

  // Trucks, a bulldozer, an office trailer and floodlights.
  for (const [x, z, ry, c] of [
    [gateX + 1600, hd - 1200, 0.3, "#3f7a34"],
    [gateX + 2700, hd - 1500, -0.2, "#e0a526"],
    [-hw + 1500, -2000, 1.4, "#3f7a34"],
  ] as const)
    b.at(x, 0, z, ry, () => buildGarbageTruck(b, c));
  b.at(500, 0, 5200, 0.9, () => {
    b.use("gloss").box(0, 60, 0, 260, 200, 380, "#e0a526");
    b.use("glass").box(0, 260, -40, 200, 120, 200, "#26323d");
    b.use("metal").box(0, 0, 300, 420, 160, 40, "#5c6773", { rx: -0.3 });
    for (const s of [-1, 1]) b.use("metal").box(s * 150, 0, 0, 80, 90, 460, "#1d1d1f");
  });
  b.use("siding").box(gateX - 1600, 0, hd - 900, 1000, 300, 400, "#c8c2b4");
  b.use("glass").box(gateX - 1600, 120, hd - 699, 600, 100, 2, "#3b4a5a");
  for (const [x, z] of [
    [-hw + 300, hd - 300],
    [hw - 300, hd - 300],
    [-hw + 300, -hd + 300],
    [hw - 300, -hd + 300],
  ]) {
    b.use("metal").cyl(x, 0, z, 20, 1400, "#5c6773", 8);
    b.use("glow").box(x, 1400, z, 200, 60, 60, "#fff3b0");
  }
}

/** Swinging boom with a claw that drops when the crane is operated. */
function Crane() {
  const boom = useRef<THREE.Group>(null);
  const claw = useRef<THREE.Group>(null);
  const cable = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t0 = runtime.town.triggers.crane;
    const age = t0 === undefined ? 99 : clock.elapsedTime - t0;
    const active = age < 8;
    if (boom.current) boom.current.rotation.y = active ? Math.sin(age * 0.8) * 1.2 : Math.sin(clock.elapsedTime * 0.05) * 0.2;
    const drop = active ? Math.sin((age / 8) * Math.PI) : 0;
    const len = 500 + drop * 2200;
    if (claw.current) claw.current.position.y = 2950 - len;
    if (cable.current) {
      cable.current.scale.y = len;
      cable.current.position.y = 2950 - len / 2;
    }
    if (claw.current) for (const [i, c] of claw.current.children.entries()) if (i > 0) c.rotation.z = (i % 2 ? 1 : -1) * (0.3 + 0.4 * (1 - drop));
  });
  return (
    <group position={[CRANE.x, 0, CRANE.z]}>
      <group ref={boom}>
        <mesh position={[0, 2980, 1100]} castShadow>
          <boxGeometry args={[160, 120, 2600]} />
          <meshStandardMaterial color="#e0a526" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3000, -500]} castShadow>
          <boxGeometry args={[300, 260, 400]} />
          <meshStandardMaterial color="#5c6773" roughness={0.6} />
        </mesh>
        <group position={[0, 0, 2200]}>
          <mesh ref={cable}>
            <cylinderGeometry args={[4, 4, 1, 6]} />
            <meshStandardMaterial color="#1d1d1f" />
          </mesh>
          <group ref={claw}>
            <mesh>
              <cylinderGeometry args={[70, 90, 80, 12]} />
              <meshStandardMaterial color="#e0a526" roughness={0.5} metalness={0.3} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <group key={i} rotation-y={(i * Math.PI) / 2}>
                <mesh position={[60, -110, 0]}>
                  <boxGeometry args={[20, 180, 40]} />
                  <meshStandardMaterial color="#5c6773" metalness={0.5} roughness={0.4} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

/** Junk riding up the belt; it only moves once switched on. */
function Conveyor() {
  const items = useRef<THREE.InstancedMesh>(null);
  const offset = useRef(0);
  const colors = useMemo(() => Array.from({ length: 18 }, (_, i) => new THREE.Color(JUNK[i % JUNK.length])), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    const mesh = items.current;
    if (!mesh) return;
    const t0 = runtime.town.triggers.conveyor;
    if (t0 !== undefined && clock.elapsedTime - t0 < 20) offset.current = (offset.current + dt * 220) % CONVEYOR.len;
    const rise = 900;
    for (let i = 0; i < 18; i++) {
      const s = ((i / 18) * CONVEYOR.len + offset.current) % CONVEYOR.len;
      const z = CONVEYOR.len / 2 - s;
      const y = 80 + (rise * s) / CONVEYOR.len + 40;
      tmp.position.set(CONVEYOR.x + ((i * 37) % 120) - 60, y, CONVEYOR.z + z);
      tmp.rotation.set(0, i, 0);
      tmp.scale.set(50 + (i % 3) * 20, 40, 50 + (i % 4) * 15);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
      mesh.setColorAt(i, colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={items} args={[undefined, undefined, 18]} castShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

/** Slowly rising smoke puffs from the incinerator stacks. */
function Smoke() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.08 + i / g.children.length) % 1;
      c.position.y = 4000 + t * 2500;
      c.position.x = FURNACE.x + (i % 2 ? 900 : -900) + t * 600;
      c.scale.setScalar(150 + t * 500);
      ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.55 * (1 - t);
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[FURNACE.x, 4000, FURNACE.z - 400]} raycast={() => null}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#6b6f76" transparent opacity={0.5} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function Landfill({ l }: { l: Landmark }) {
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildYard(b, l)} castShadow={false} />
      <Crane />
      <Conveyor />
      <Smoke />
      <Sign text="TRI-COUNTY LANDFILL" position={[-4500, 400, l.d / 2 + 15]} size={[1000, 140]} bg="#2b2f36" fg="#e0a526" border="#e0a526" doubleSided />
      <pointLight position={[FURNACE.x, 300, FURNACE.z + 1500]} color="#ff7b1c" intensity={4} distance={4000} decay={1} />
    </LandmarkGroup>
  );
}
