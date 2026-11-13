"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BELT_PUSH,
  CATWALK,
  FIRE_PIT,
  FURNACE_ARRIVE,
  FURNACE_HALL,
  FURNACE_HATCH,
  FURNACE_LADDER,
  LANDING,
  MAGNET_PAD,
  SORT_BELT,
} from "@/lib/explore/incinerator";
import { pocketAt } from "@/lib/explore/pockets";
import { inRect, pocketLocal } from "@/lib/explore/underground";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";
import { buildLadder, PocketGroup } from "./pocketParts";

const P = FURNACE_HALL;
const H = P.h;
const X = 2600;
const Z = 600;
const JUNK = ["#6b6f76", "#7d6b55", "#4b5563", "#8a7a5a", "#2f6b8a", "#8a3b2f", "#e9c46a", "#3f4a3f"];
const SLATS = 40;
const ITEMS = 18;
const BELT_LEN = SORT_BELT.x1 - SORT_BELT.x0;

function buildHall(b: Builder) {
  b.at(P.x, P.y, P.z, 0, () => {
    // Shell: sooty brick walls, a dark ceiling with cage lamps, and solid walls round the outside.
    b.use("concrete").box(0, -10, 0, X * 2 + 80, 10, Z * 2 + 80, "#4a4640");
    b.use("concrete").box(0, H, 0, X * 2 + 80, 24, Z * 2 + 80, "#24211e");
    for (const s of [-1, 1]) {
      b.use("brick").box(0, 0, s * (Z + 20), X * 2 + 80, H, 40, "#5b4a3a");
      b.use("brick").box(s * (X + 20), 0, 0, 40, H, Z * 2 + 80, "#5b4a3a");
      b.solid(0, s * (Z + 20), X * 2 + 80, 40, -10, H + 20);
      b.solid(s * (X + 20), 0, 40, Z * 2 + 80, -10, H + 20);
    }
    for (let x = -X + 400; x < X; x += 800) b.use("glow").box(x, H - 30, 0, 50, 14, 50, "#ffd9a0");

    // Landing at the west end: diamond plate and a hazard edge where the belt starts.
    b.use("metal").box((LANDING.x0 + LANDING.x1) / 2, 0, 0, LANDING.x1 - LANDING.x0, 2, Z * 2, "#7d838b");
    b.use("paint").box(LANDING.x1 - 10, 0, 0, 20, 2.5, Z * 2, "#ffd166");
    buildLadder(b, FURNACE_LADDER.x - 35, FURNACE_LADDER.z, Math.PI / 2, H);
    b.use("glow").cyl(FURNACE_LADDER.x - 20, H - 2, FURNACE_LADDER.z, 34, 2, "#fff6d6", 20);

    // The belt bed with rollers along each side (the slats and junk move separately).
    const bx = (SORT_BELT.x0 + SORT_BELT.x1) / 2;
    b.use("paint").box(bx, 0, 0, BELT_LEN, 1, Z * 2, "#1d1f22");
    for (const s of [-1, 1]) b.use("metal").rod(bx, 5, s * (Z - 12), 6, BELT_LEN, "#9aa3ad");
    b.use("glow").torus(MAGNET_PAD.x, 2.2, MAGNET_PAD.z, 50, 3, "#4cc9f0", { rx: Math.PI / 2 });

    // The fire pit and the furnace mouth in the east wall.
    const fx = (FIRE_PIT.x0 + FIRE_PIT.x1) / 2;
    b.use("paint").box(fx, -8, 0, FIRE_PIT.x1 - FIRE_PIT.x0, 4, Z * 2, "#1a0d05");
    b.use("glow").box(fx, -4, 0, FIRE_PIT.x1 - FIRE_PIT.x0 - 40, 3, Z * 2 - 40, "#ff5a1f");
    b.use("paint").box(FIRE_PIT.x0, 0, 0, 16, 6, Z * 2, "#e63946");
    b.use("metal").box(X - 6, 0, 0, 12, 520, 900, "#1d1d1f");
    b.use("glow").box(X - 14, 20, 0, 4, 440, 780, "#ff7b1c");
    b.use("glow").box(X - 18, 60, 0, 2, 300, 560, "#ffd166");

    // Catwalk along the north wall, railing on the open side and posts down to the floor.
    const C = CATWALK;
    const cx = (C.x0 + C.x1) / 2;
    const cz = (C.z0 + C.z1) / 2;
    b.use("metal").box(cx, C.h - 10, cz, C.x1 - C.x0, 10, C.z1 - C.z0, "#6b7280");
    for (let x = C.x0 + 10; x < C.x1; x += 30) b.use("metal").box(x, C.h, cz, 4, 0.5, C.z1 - C.z0, "#4b5563");
    b.solid(cx, cz, C.x1 - C.x0, C.z1 - C.z0, C.h - 10, C.h);
    b.use("metal").box(cx, C.h + 56, C.z1 - 3, C.x1 - C.x0, 4, 4, "#ffd166");
    b.use("metal").box(cx, C.h + 28, C.z1 - 3, C.x1 - C.x0, 3, 3, "#ffd166");
    for (let x = C.x0; x <= C.x1; x += 160) b.use("metal").box(x, C.h, C.z1 - 3, 4, 58, 4, "#ffd166");
    b.solid(cx, C.z1 - 3, C.x1 - C.x0, 6, C.h, C.h + 60);
    b.use("metal").box(C.x0 - 3, C.h, cz, 6, 58, C.z1 - C.z0, "#ffd166");
    for (let x = C.x0 + 200; x < C.x1; x += 800) b.use("metal").box(x, 0, C.z0 + 14, 14, C.h - 10, 14, "#4b5563");
    buildLadder(b, C.x0 - 10, cz, -Math.PI / 2, C.h);

    // Magnet gantry: a beam across the hall over the pad.
    b.use("metal").box(MAGNET_PAD.x, H - 60, 0, 60, 40, Z * 2, "#e0a526");
  });
}

/** A grate in the landfill dirt beside the furnace shed. */
function buildHatch(b: Builder) {
  const { x, y, z } = FURNACE_HATCH;
  b.use("metal").box(x, y + 1, z, 110, 3, 110, "#3b3f45");
  for (let i = -4; i <= 4; i++) b.use("metal").box(x + i * 11, y + 4, z, 4, 1, 96, "#1d1d1f");
  b.use("glow").box(x, y + 1.5, z, 90, 1, 90, "#ff7b1c");
}

/** Belt slats and junk travelling east, flames licking up from the pit, and the magnet bobbing. */
function Machinery() {
  const slats = useRef<THREE.InstancedMesh>(null);
  const junk = useRef<THREE.InstancedMesh>(null);
  const flames = useRef<THREE.Group>(null);
  const magnet = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => Array.from({ length: ITEMS }, (_, i) => new THREE.Color(JUNK[i % JUNK.length])), []);
  useFrame(() => {
    const now = runtime.town.clock;
    const s = slats.current;
    if (s) {
      for (let i = 0; i < SLATS; i++) {
        tmp.position.set(P.x + SORT_BELT.x0 + ((i * (BELT_LEN / SLATS) + now * BELT_PUSH) % BELT_LEN), P.y + 1.2, P.z);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(8, 0.6, Z * 2 - 40);
        tmp.updateMatrix();
        s.setMatrixAt(i, tmp.matrix);
      }
      s.instanceMatrix.needsUpdate = true;
    }
    const j = junk.current;
    if (j) {
      for (let i = 0; i < ITEMS; i++) {
        const along = (i * (BELT_LEN / ITEMS) + now * BELT_PUSH) % BELT_LEN;
        tmp.position.set(P.x + SORT_BELT.x0 + along, P.y + 14, P.z + (((i * 211) % 900) - 450));
        tmp.rotation.set(0, i * 1.3, 0);
        tmp.scale.set(30 + (i % 3) * 18, 26 + (i % 4) * 8, 30 + (i % 5) * 10);
        tmp.updateMatrix();
        j.setMatrixAt(i, tmp.matrix);
        j.setColorAt(i, colors[i]);
      }
      j.instanceMatrix.needsUpdate = true;
      if (j.instanceColor) j.instanceColor.needsUpdate = true;
    }
    flames.current?.children.forEach((f, i) => {
      f.scale.y = 0.7 + 0.5 * Math.abs(Math.sin(now * (3 + (i % 3)) + i));
    });
    magnet.current?.position.set(P.x + MAGNET_PAD.x, P.y + 190 + Math.sin(now * 1.2) * 10, P.z + MAGNET_PAD.z);
  });

  const fx = (FIRE_PIT.x0 + FIRE_PIT.x1) / 2;
  return (
    <>
      <instancedMesh ref={slats} args={[undefined, undefined, SLATS]} frustumCulled={false} raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a3d42" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={junk} args={[undefined, undefined, ITEMS]} frustumCulled={false} castShadow raycast={() => null}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <group ref={flames}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} position={[P.x + fx + ((i * 97) % 440) - 220, P.y + 40, P.z + ((i * 173) % 1000) - 500]} raycast={() => null}>
            <coneGeometry args={[40 + (i % 3) * 15, 160 + (i % 4) * 40, 8, 1, true]} />
            <meshBasicMaterial color={i % 2 ? "#ffb347" : "#ff6b1f"} transparent opacity={0.75} toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={magnet}>
        <mesh position={[0, 360, 0]}>
          <cylinderGeometry args={[2, 2, 640, 6]} />
          <meshStandardMaterial color="#1d1d1f" />
        </mesh>
        <mesh>
          <torusGeometry args={[34, 12, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#d62828" roughness={0.4} metalness={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 34, -8, 0]}>
            <boxGeometry args={[24, 16, 24]} />
            <meshStandardMaterial color="#c0c7cf" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/** Under the landfill: the sorting belt carries you east; reach the flames and you're thrown back to the landing. */
export function Incinerator() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = runtime.toy;
    if (pocketAt(t)?.id !== "incinerator" || t.mount === "fly" || t.mount === "ride") return;
    const p = pocketLocal(P, t);
    const low = t.y - P.y < 12;
    if (low && inRect(FIRE_PIT, p.x, p.z)) {
      Object.assign(t, { x: P.x + FURNACE_ARRIVE.x, y: P.y, z: P.z + FURNACE_ARRIVE.z, vy: 0, speed: 0 });
      runtime.town.snapCamera = true;
      useStore.getState().showToast("Too hot! You scramble back to the landing. Run against the belt!");
      return;
    }
    if (low && inRect(SORT_BELT, p.x, p.z)) t.x += BELT_PUSH * dt;
  });

  return (
    <group>
      <Built deps={["furnace-hatch"]} build={buildHatch} solid={false} />
      <PocketGroup id="incinerator">
        <Built deps={["furnace-hall"]} build={buildHall} />
        <Machinery />
        <Sign text="↑ LANDFILL" position={[P.x - X + 2, P.y + 200, P.z + FURNACE_LADDER.z + 120]} size={[180, 36]} rotationY={Math.PI / 2} bg="#2b2f36" fg="#e0a526" />
        <Sign text="DANGER · INCINERATOR" position={[P.x + FIRE_PIT.x0 - 200, P.y + 620, P.z + Z - 2]} size={[520, 60]} rotationY={Math.PI} bg="#d62828" fg="#ffffff" />
      </PocketGroup>
    </group>
  );
}
