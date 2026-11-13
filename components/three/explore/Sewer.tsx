"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CHANNEL, CURRENT, HIGH_LEDGE, inChannel, inSewer, PIPE_STEPS, SEWER, SEWER_EXITS, SEWER_OUTLINE, SEWER_ROOMS } from "@/lib/explore/sewer";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";

const H = SEWER.h;
const WALL_T = 40;
const BRICK = "#7d6a58";
const MOSS = "#55704a";

/** Where each exit's ladder leans: against the nearest wall, with the sign facing back into the tunnel. */
function ladderSpot(l: { x: number; z: number }) {
  if (Math.abs(l.x) >= 3400) return { x: Math.sign(l.x) * (3600 - 25), z: l.z, ry: Math.PI / 2, face: Math.sign(l.x) > 0 ? -Math.PI / 2 : Math.PI / 2 };
  const edge = Math.abs(l.z) >= 2800 ? 3000 : 350;
  return { x: l.x, z: Math.sign(l.z) * (edge - 25), ry: 0, face: Math.sign(l.z) > 0 ? Math.PI : 0 };
}

function ladder(b: Builder, x: number, z: number, ry: number) {
  b.at(x, 0, z, ry, () => {
    for (const s of [-1, 1]) b.use("metal").box(s * 20, 0, 0, 5, H, 5, "#6b7280");
    for (let y = 22; y < H; y += 28) b.use("metal").box(0, y, 0, 40, 3, 4, "#9aa3ad");
  });
}

function buildTunnels(b: Builder) {
  b.at(SEWER.x, SEWER.y, SEWER.z, 0, () => {
    // Floors, ceilings and a damp stripe along the bottom of every wall.
    for (const r of SEWER_ROOMS) {
      const cx = (r.x0 + r.x1) / 2;
      const cz = (r.z0 + r.z1) / 2;
      b.use("concrete").box(cx, -10, cz, r.x1 - r.x0 + 2 * WALL_T, 10, r.z1 - r.z0 + 2 * WALL_T, "#6f7368");
      b.use("concrete").box(cx, H, cz, r.x1 - r.x0 + 2 * WALL_T, 24, r.z1 - r.z0 + 2 * WALL_T, "#4b4e47");
    }
    // Brick walls around the outline (solid, so the toy and the camera stay inside).
    SEWER_OUTLINE.forEach(([ax, az], i) => {
      const [bx, bz] = SEWER_OUTLINE[(i + 1) % SEWER_OUTLINE.length];
      const cx = (ax + bx) / 2;
      const cz = (az + bz) / 2;
      const alongX = az === bz;
      const len = Math.abs(alongX ? bx - ax : bz - az) + WALL_T;
      const w = alongX ? len : WALL_T;
      const d = alongX ? WALL_T : len;
      b.use("brick").box(cx, 0, cz, w, H, d, BRICK);
      b.use("paint").box(cx, 0, cz, w + (alongX ? 0 : 2), 26, d + (alongX ? 2 : 0), MOSS);
      b.solid(cx, cz, w, d, 0, H + 20);
      // A lamp every few metres.
      for (let s = 300; s < len - 200; s += 700) {
        const px = alongX ? Math.min(ax, bx) + s : cx;
        const pz = alongX ? cz : Math.min(az, bz) + s;
        b.use("glow").box(px, H - 40, pz, alongX ? 60 : WALL_T + 8, 16, alongX ? WALL_T + 8 : 60, "#ffe7a3");
      }
    });
    // Big pipes along the long tunnel walls, above head height.
    for (const z of [-330, 330]) {
      b.use("metal").rod(-2300, 300, z, 18, 2600, "#8d6e4f");
      b.use("metal").rod(2300, 300, z, 18, 2600, "#8d6e4f");
    }
    for (const x of [-330, 330]) {
      b.use("metal").rod(x, 300, -2000, 18, 2000, "#8d6e4f", Math.PI / 2);
      b.use("metal").rod(x, 300, 2000, 18, 2000, "#8d6e4f", Math.PI / 2);
    }

    // The stream: murky water with stone curbs.
    const { x0, x1, z0, z1 } = CHANNEL;
    b.use("glass").box((x0 + x1) / 2, 0.5, 0, x1 - x0, 7, z1 - z0, "#2f6f63");
    b.use("paint").box((x0 + x1) / 2, 0, 0, x1 - x0, 0.6, z1 - z0, "#24433c");
    for (const z of [z0 - 8, z1 + 8]) b.use("concrete").box((x0 + x1) / 2, 0, z, x1 - x0, 5, 16, "#8a8d84");

    // Waterfall pouring out of a big pipe at the west end of the stream.
    b.use("metal").cyl(x0 + 10, 150, 0, 60, 30, "#5c4a3a", 18, 60, { rz: Math.PI / 2 });
    b.use("glass").box(x0 + 30, 0, 0, 24, 160, 110, "#9ad1d4");
    b.use("glass").box(x0 + 70, 0, 0, 60, 10, 180, "#cfeff0");

    // Pipe steps up to the high ledge in the hub, and the ledge itself.
    for (const s of PIPE_STEPS) {
      b.use("metal").cyl(s.x, 0, s.z, s.size / 2, s.h, "#6b7f8e", 18);
      b.use("metal").cyl(s.x, s.h - 4, s.z, s.size / 2 + 4, 4, "#8a9aa6", 18);
      b.solid(s.x, s.z, s.size, s.size, 0, s.h);
    }
    const L = HIGH_LEDGE;
    b.use("concrete").box((L.x0 + L.x1) / 2, 0, (L.z0 + L.z1) / 2, L.x1 - L.x0, L.h, L.z1 - L.z0, "#7b7f74");
    b.use("metal").box((L.x0 + L.x1) / 2, L.h, L.z1 - 4, L.x1 - L.x0, 30, 4, "#9aa3ad");
    b.solid((L.x0 + L.x1) / 2, (L.z0 + L.z1) / 2, L.x1 - L.x0, L.z1 - L.z0, 0, L.h);

    // Ladders up to the manholes.
    for (const e of SEWER_EXITS) {
      const s = ladderSpot(e.ladder);
      ladder(b, s.x, s.z, s.ry);
      b.use("glow").cyl(s.x, H - 2, s.z, 34, 2, "#fff6d6", 20);
    }

    // Junk washed down the drains: bottle caps, a lost sneaker, crates and a soggy cardboard boat.
    const junk: [number, number, string][] = [
      [-2800, 250, "#e63946"],
      [-1600, -270, "#ffd166"],
      [1500, 260, "#3a86ff"],
      [2900, -280, "#2a9d8f"],
      [200, 2200, "#f77f00"],
      [-250, -2300, "#9b5de5"],
    ];
    for (const [x, z, c] of junk) b.use("gloss").cyl(x, 0, z, 16, 6, c, 14);
    b.use("paint").box(-200, 0, 1600, 70, 40, 140, "#f1faee");
    b.use("paint").box(-200, 40, 1560, 70, 20, 60, "#e63946");
    for (const [x, z] of [
      [700, 800],
      [-700, 750],
      [800, -700],
    ])
      b.use("planks").box(x, 0, z, 120, 90, 120, "#8a6a45");
    b.use("paint").cbox(2600, 4, 150, 90, 10, 50, "#c8a165", { ry: 0.5 });
  });
}

/** Manhole covers in the streets above. */
function buildCovers(b: Builder) {
  for (const e of SEWER_EXITS) {
    const { x, y, z } = e.town;
    b.use("metal").cyl(x, y, z, 40, 4, "#3b3f45", 24);
    for (let i = -2; i <= 2; i++) b.use("metal").box(x + i * 13, y + 4, z, 4, 1, 60 - Math.abs(i) * 12, "#23262a");
    b.use("metal").torus(x, y + 4, z, 36, 2.5, "#55595f", { rx: Math.PI / 2 });
  }
}

const FOAM = 28;

/** Storm drains: drawn only while you're down there; the stream carries you and a lamp follows you. */
export function Sewer() {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const foam = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: FOAM }, (_, i) => ({ off: (i / FOAM) * (CHANNEL.x1 - CHANNEL.x0), z: ((i * 37) % 180) - 90, s: 4 + (i % 3) * 2 })), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = runtime.toy;
    const down = t.y < EXT_Y - 300;
    if (group.current) group.current.visible = down;
    if (!down) return;
    if (light.current) light.current.position.set(t.x, t.y + 90, t.z);
    if (inSewer(t) && inChannel(t) && t.mount !== "fly" && t.mount !== "ride" && t.y - SEWER.y < 8) {
      t.x = Math.min(t.x + CURRENT * dt, SEWER.x + CHANNEL.x1 - 40);
    }
    const len = CHANNEL.x1 - CHANNEL.x0;
    const now = runtime.town.clock;
    foam.current?.children.forEach((m, i) => {
      const s = seeds[i];
      m.position.set(SEWER.x + CHANNEL.x0 + ((s.off + now * CURRENT) % len), SEWER.y + 4.5, SEWER.z + s.z);
    });
  });

  return (
    <group>
      <Built deps={["sewer-covers"]} build={buildCovers} solid={false} />
      <group ref={group} visible={false}>
        <Built deps={["sewer-tunnels"]} build={buildTunnels} />
        <pointLight ref={light} intensity={9000} distance={1500} decay={2} color="#ffe2b0" />
        <group ref={foam}>
          {seeds.map((s, i) => (
            <mesh key={i} scale={[s.s * 2, 1, s.s]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#e8f4ef" roughness={0.6} />
            </mesh>
          ))}
        </group>
        {SEWER_EXITS.map((e) => {
          const s = ladderSpot(e.ladder);
          // Beside the ladder, just off the wall.
          const side = s.ry ? { x: 0, z: s.z > 0 ? -140 : 140 } : { x: 140, z: 0 };
          return (
            <Sign
              key={e.id}
              text={`↑ ${e.name}`}
              position={[SEWER.x + s.x + side.x + Math.sin(s.face) * 6, SEWER.y + 230, SEWER.z + s.z + side.z + Math.cos(s.face) * 6]}
              size={[190, 34]}
              rotationY={s.face}
              bg="#1d3557"
              fg="#ffd166"
            />
          );
        })}
      </group>
    </group>
  );
}
