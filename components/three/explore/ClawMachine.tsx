"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { CLAW, CLAW_MOUND, CLAW_PAD, CLAW_RAIL, CLAW_STEPS, PRIZE_CHUTE } from "@/lib/explore/clawMachine";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { landmarkById, toWorld } from "@/lib/town/config";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../town/builder";
import { buildAlien } from "../town/filmSet";
import { Built, Sign } from "../town/parts";
import { PocketGroup } from "./pocketParts";

const H = CLAW.h;
const HALF = 600;
const BACK = 950;
const GREENS = ["#7ee36d", "#6fd65e", "#8ff07c", "#5cc94c"];
const PLUSH = ["#f15bb5", "#4cc9f0", "#ffd166", "#9b5de5", "#ff7a3d"];

function buildMachine(b: Builder) {
  const r = seededRandom(1995);
  b.at(CLAW.x, CLAW.y, CLAW.z, 0, () => {
    // The arcade beyond the glass: dark walls dotted with blurry lights, and a dark floor.
    b.use("paint").box(0, -12, 0, BACK * 2, 10, BACK * 2, "#14112a");
    b.use("paint").box(0, H + 60, 0, BACK * 2, 20, BACK * 2, "#0d0b1c");
    for (const s of [-1, 1]) {
      b.use("paint").box(0, -10, s * BACK, BACK * 2, H + 80, 20, "#1b1b3a");
      b.use("paint").box(s * BACK, -10, 0, 20, H + 80, BACK * 2, "#1b1b3a");
    }
    for (let i = 0; i < 70; i++) {
      const side = i % 4;
      const t = (r() - 0.5) * BACK * 1.8;
      const y = 40 + r() * (H - 40);
      const c = ["#57ff8f", "#4cc9f0", "#f72585", "#ffd166"][i % 4];
      const rad = 10 + r() * 22;
      if (side === 0) b.use("glow").sphere(t, y, -BACK + 12, rad, c, 1, 8);
      else if (side === 1) b.use("glow").sphere(t, y, BACK - 12, rad, c, 1, 8);
      else if (side === 2) b.use("glow").sphere(-BACK + 12, y, t, rad, c, 1, 8);
      else b.use("glow").sphere(BACK - 12, y, t, rad, c, 1, 8);
    }

    // Floor of the prize bed and a carpet of half-buried squeaky aliens.
    b.use("paint").box(0, -8, 0, HALF * 2, 8, HALF * 2, "#3a0ca3");
    for (let i = 0; i < 260; i++) {
      const x = (r() - 0.5) * (HALF * 2 - 40);
      const z = (r() - 0.5) * (HALF * 2 - 40);
      if (x > PRIZE_CHUTE.x0 - 20 && z > PRIZE_CHUTE.z0 - 20) continue;
      b.use("gloss").sphere(x, -3, z, 11 + r() * 3, GREENS[i % 4], 0.75, 10);
      if (i % 3 === 0) b.use("paint").sphere(x, 4, z + 9, 2.2, "#111111", 1, 6);
    }
    // A few whole aliens standing about, looking up at the claw.
    for (const [x, z, ry] of [
      [420, -200, -1.2],
      [470, 0, -1.6],
      [-520, 160, 1.4],
      [-480, 380, 1.1],
      [160, 520, 3],
      [-120, 540, 3.2],
      [300, -540, 0.2],
    ])
      buildAlien(b, x, 0, z, 0.55, ry);

    // Glass on all four sides, with a red frame at the corners and along the top.
    for (const s of [-1, 1]) {
      b.use("glass").box(0, 0, s * HALF, HALF * 2, H, 6, "#e6f7ff");
      b.use("glass").box(s * HALF, 0, 0, 6, H, HALF * 2, "#e6f7ff");
      b.solid(0, s * (HALF + 10), HALF * 2 + 40, 20, -10, H + 20);
      b.solid(s * (HALF + 10), 0, 20, HALF * 2 + 40, -10, H + 20);
      for (const t of [-1, 1]) b.use("gloss").box(s * HALF, 0, t * HALF, 24, H, 24, "#e63946");
      b.use("gloss").box(0, H - 30, s * HALF, HALF * 2, 30, 24, "#ffd166");
      b.use("gloss").box(s * HALF, H - 30, 0, 24, 30, HALF * 2, "#ffd166");
    }
    b.use("gloss").box(0, H, 0, HALF * 2 + 24, 20, HALF * 2 + 24, "#e63946");
    b.use("glow").box(0, H - 4, 0, HALF * 1.6, 4, HALF * 1.6, "#cfeaff");

    // Plush steps up to the mound in the back corner.
    for (const s of CLAW_STEPS) {
      b.use("paint").cyl(s.x, 0, s.z, s.r, s.h, PLUSH[Math.floor(r() * PLUSH.length)], 18);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + r();
        b.use("paint").sphere(s.x + Math.cos(a) * s.r, s.h * 0.5, s.z + Math.sin(a) * s.r, 14, PLUSH[(k + 1) % PLUSH.length], 1, 8);
      }
      b.solid(s.x, s.z, s.r * 1.5, s.r * 1.5, 0, s.h);
    }
    const M = CLAW_MOUND;
    const mx = (M.x0 + M.x1) / 2;
    const mz = (M.z0 + M.z1) / 2;
    b.use("paint").box(mx, 0, mz, M.x1 - M.x0, M.h, M.z1 - M.z0, "#ff8fab");
    for (let k = 0; k < 18; k++) {
      const edge = k % 2 ? M.x1 : M.z1;
      const t = M.x0 + 20 + ((k * 37) % (M.x1 - M.x0 - 40));
      const x = k % 2 ? edge : t;
      const z = k % 2 ? M.z0 + 20 + ((k * 53) % (M.z1 - M.z0 - 40)) : edge;
      b.use("paint").sphere(x, 20 + ((k * 29) % (M.h - 30)), z, 22, PLUSH[k % PLUSH.length], 0.9, 10);
    }
    b.solid(mx, mz, M.x1 - M.x0, M.z1 - M.z0, 0, M.h);
    b.use("glow").torus(CLAW_PAD.x, M.h + 1, CLAW_PAD.z, 40, 3, "#ffd166", { rx: Math.PI / 2 });

    // The gantry rail the claw runs along (walkable), and its cross bar.
    const R = CLAW_RAIL;
    b.use("metal").box((R.x0 + R.x1) / 2, R.h - 16, (R.z0 + R.z1) / 2, R.x1 - R.x0, 16, R.z1 - R.z0, "#c0c7cf");
    for (const z of [R.z0, R.z1]) b.use("gloss").box((R.x0 + R.x1) / 2, R.h, z, R.x1 - R.x0, 6, 6, "#ffd166");
    b.solid((R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2, R.x1 - R.x0, R.z1 - R.z0, R.h - 16, R.h);
    for (const x of [R.x0 + 10, R.x1 - 10]) b.use("metal").box(x, R.h, (R.z0 + R.z1) / 2, 20, H - R.h - 30, R.z1 - R.z0, "#9aa3ad");

    // Prize chute in the front corner, with a low clear guard on its inner sides.
    const P = PRIZE_CHUTE;
    b.use("paint").box((P.x0 + P.x1) / 2, -6, (P.z0 + P.z1) / 2, P.x1 - P.x0, 7, P.z1 - P.z0, "#05050a");
    b.use("glass").box((P.x0 + P.x1) / 2, 0, P.z0, P.x1 - P.x0, 28, 3, "#e6f7ff");
    b.use("glass").box(P.x0, 0, (P.z0 + P.z1) / 2, 3, 28, P.z1 - P.z0, "#e6f7ff");
  });
}

/** A prize flap on the front of the real machine at Pizza Planet. */
function buildFlap(b: Builder) {
  const l = landmarkById.pizza;
  const m = toWorld(l, 1900, 900);
  b.at(m.x, EXT_Y, m.z, l.rot, () => {
    b.use("paint").box(50, 18, 121, 64, 56, 2, "#1d1d1f");
    b.use("gloss").box(50, 74, 121.5, 70, 6, 2, "#ffd166");
  });
}

/** The claw: waits over the pad on the mound, swaying, with its prongs half open. */
function Claw() {
  const ref = useRef<THREE.Group>(null);
  const cable = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const y = CLAW_MOUND.h + 150 + Math.sin(t * 0.8) * 12;
    ref.current?.position.set(CLAW.x + CLAW_PAD.x + Math.sin(t * 0.5) * 10, CLAW.y + y, CLAW.z + CLAW_PAD.z);
    if (cable.current) {
      const len = CLAW_RAIL.h - y;
      cable.current.scale.y = len;
      cable.current.position.y = len / 2;
    }
  });
  return (
    <group ref={ref}>
      <mesh ref={cable}>
        <cylinderGeometry args={[1.5, 1.5, 1, 6]} />
        <meshStandardMaterial color="#1d1d1f" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[14, 18, 22, 14]} />
        <meshStandardMaterial color="#c0c7cf" metalness={0.7} roughness={0.25} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation-y={(i * Math.PI * 2) / 3}>
          <mesh position={[0, -26, 16]} rotation-x={0.45}>
            <boxGeometry args={[4, 44, 4]} />
            <meshStandardMaterial color="#c0c7cf" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, -48, 22]} rotation-x={-0.6}>
            <boxGeometry args={[4, 18, 4]} />
            <meshStandardMaterial color="#c0c7cf" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Inside the Pizza Planet claw machine. */
export function ClawMachine() {
  return (
    <group>
      <Built deps={["claw-flap"]} build={buildFlap} solid={false} />
      <PocketGroup id="claw">
        <Built deps={["claw-machine"]} build={buildMachine} />
        <Claw />
        <Sign text="PRIZE ↓" position={[CLAW.x + (PRIZE_CHUTE.x0 + PRIZE_CHUTE.x1) / 2, CLAW.y + 90, CLAW.z + PRIZE_CHUTE.z0 - 2]} size={[120, 34]} rotationY={Math.PI} bg="#1b1b3a" fg="#ffd166" glow />
        <Sign text="THE CLAW" position={[CLAW.x, CLAW.y + 300, CLAW.z - BACK + 14]} size={[520, 110]} bg="#1b1b3a" fg="#57ff8f" glow />
      </PocketGroup>
    </group>
  );
}
