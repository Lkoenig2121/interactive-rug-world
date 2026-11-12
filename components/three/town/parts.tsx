"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { EXT_Y } from "@/lib/house/layout";
import { registerSolids } from "@/lib/house/walkable";
import { labelTexture, type LabelOptions } from "@/lib/three/textures";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import type { Block } from "@/lib/town/blocks";
import { insideLandmark, type Landmark } from "@/lib/town/config";
import { Enterable, isEnterableBuilding } from "../house/HouseEnterTargets";
import { Builder, slotMaterial, type Slot } from "./builder";

/** Merged meshes produced by a builder function (rebuilt only when `deps` change). */
export function Built({
  build,
  deps = [],
  castShadow = true,
  receiveShadow = true,
  solid = true,
}: {
  build: (b: Builder) => void;
  deps?: unknown[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Register cars, poles and other solids for collision; off for things that move. */
  solid?: boolean;
}) {
  const key = JSON.stringify(deps);
  const root = useRef<THREE.Group>(null);
  const { parts, solids } = useMemo(() => {
    const b = new Builder();
    build(b);
    return { parts: b.build(), solids: b.solids };
    // `build` is a fresh closure every render; rebuild only when the caller's deps change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);
  useEffect(() => {
    const g = root.current;
    if (!solid || !g || !solids.length) return;
    g.updateWorldMatrix(true, false);
    const m = g.matrixWorld;
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(m);
    const yaw = Math.atan2(fwd.x, fwd.z);
    const v = new THREE.Vector3();
    const blocks: Block[] = solids.map((s) => {
      v.set(s.x, s.y, s.z).applyMatrix4(m);
      return { frame: { x: v.x, z: v.z, rot: s.ry + yaw }, hw: s.hw, hd: s.hd, round: s.round, wallBottom: v.y - 5, wallTop: v.y + s.h };
    });
    return registerSolids(blocks);
  }, [solids, solid]);
  return (
    <group ref={root}>
      {parts.map((p) => (
        <mesh
          key={p.slot}
          geometry={p.geometry}
          material={slotMaterial(p.slot)}
          castShadow={castShadow && p.slot !== "glass" && p.slot !== "glow"}
          receiveShadow={receiveShadow && p.slot !== "glow"}
        />
      ))}
    </group>
  );
}

/** Group placed at a landmark's footprint, in its local space (front faces +z, y = 0 at the lawn). */
export function LandmarkGroup({ l, children, y = EXT_Y }: { l: Landmark; children: ReactNode; y?: number }) {
  const content = isEnterableBuilding(l) ? <Enterable l={l}>{children}</Enterable> : children;
  return (
    <group position={[l.x, y, l.z]} rotation-y={l.rot}>
      {content}
    </group>
  );
}

/** True while the toy is inside this landmark's footprint. */
function toyInside(l: Landmark, margin = 30) {
  const mode = useStore.getState().mode;
  return mode === "toy" && insideLandmark(l, runtime.toy, margin) && runtime.toy.y < EXT_Y + l.h;
}

/** Roof and ceiling: lifted away while the toy is inside so you can see in (dollhouse style). */
export function Roof({ l, children }: { l: Landmark; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const camera = useRef(new THREE.Vector3());
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    camera.current.copy(state.camera.position);
    const camInside = insideLandmark(l, { x: camera.current.x, z: camera.current.z }, 0) && camera.current.y < EXT_Y + l.h;
    g.visible = !(toyInside(l) || camInside);
  });
  return <group ref={ref}>{children}</group>;
}

/** Only mounts its children while the toy or camera is near the landmark (for detailed interiors). */
export function NearOnly({ l, range = 6000, children }: { l: Landmark; range?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const p = useStore.getState().mode === "toy" ? runtime.toy : state.camera.position;
    const reach = range + Math.max(l.w, l.d) / 2;
    g.visible = Math.abs(p.x - l.x) < reach && Math.abs(p.z - l.z) < reach;
  });
  return <group ref={ref}>{children}</group>;
}

interface SignProps extends LabelOptions {
  text: string;
  position: [number, number, number];
  size: [number, number];
  rotationY?: number;
  /** Lit from within (neon, backlit boxes). */
  glow?: boolean;
  doubleSided?: boolean;
}

export function Sign({ text, position, size, rotationY = 0, glow = false, doubleSided = false, ...label }: SignProps) {
  const aspect = size[0] / size[1];
  const width = Math.min(1024, Math.round(Math.max(256, 160 * aspect) / 32) * 32);
  const tex = useMemo(() => labelTexture(text, { width, height: Math.max(64, Math.round(width / aspect)), ...label }), [text, width, aspect, label.bg, label.fg, label.border, label.font, label.radius]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh position={position} rotation-y={rotationY}>
      <planeGeometry args={size} />
      {glow ? (
        <meshBasicMaterial map={tex} transparent toneMapped={false} side={doubleSided ? THREE.DoubleSide : THREE.FrontSide} />
      ) : (
        <meshStandardMaterial map={tex} transparent roughness={0.6} side={doubleSided ? THREE.DoubleSide : THREE.FrontSide} />
      )}
    </mesh>
  );
}

export interface ShellStyle {
  h: number;
  ext: { slot: Slot; color: string };
  int: string;
  floor: { slot: Slot; color: string };
  doorH?: number;
  /** Band of windows along the sides and back. */
  windows?: { y: number; h: number; every: number; w: number };
  trim?: string;
}

const T = 14;

/** Four walls with door openings matching the colliders, a floor, and decorative windows. */
export function buildShell(b: Builder, l: Landmark, s: ShellStyle) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  const doorH = Math.min(s.doorH ?? 270, s.h - 40);
  b.use(s.floor.slot).box(0, 0, 0, l.w - 2, 1, l.d - 2, s.floor.color);

  const wall = (side: "front" | "back" | "left" | "right", a: number, c: number, y0: number, y1: number) => {
    const len = c - a;
    const mid = (a + c) / 2;
    const h = y1 - y0;
    if (len <= 0.5 || h <= 0) return;
    if (side === "front" || side === "back") {
      const sz = side === "front" ? 1 : -1;
      b.use(s.ext.slot).box(mid, y0, sz * (hd + T / 4), len, h, T / 2, s.ext.color);
      b.use("paint").box(mid, y0, sz * (hd - T / 4), len, h, T / 2, s.int);
    } else {
      const sx = side === "right" ? 1 : -1;
      b.use(s.ext.slot).box(sx * (hw + T / 4), y0, mid, T / 2, h, len, s.ext.color);
      b.use("paint").box(sx * (hw - T / 4), y0, mid, T / 2, h, len, s.int);
    }
  };
  const withGap = (side: "front" | "back", door?: { offset: number; width: number }) => {
    if (!door) return wall(side, -hw - T / 2, hw + T / 2, 0, s.h);
    const a = door.offset - door.width / 2;
    const c = door.offset + door.width / 2;
    wall(side, -hw - T / 2, a, 0, s.h);
    wall(side, c, hw + T / 2, 0, s.h);
    wall(side, a, c, doorH, s.h);
    const z = (side === "front" ? 1 : -1) * (hd + T / 2 + 1);
    b.use("paint").box(a - 8, 0, z, 16, doorH + 8, 4, s.trim ?? "#f3efe6");
    b.use("paint").box(c + 8, 0, z, 16, doorH + 8, 4, s.trim ?? "#f3efe6");
    b.use("paint").box(door.offset, doorH, z, door.width + 32, 16, 4, s.trim ?? "#f3efe6");
  };
  withGap("front", l.door);
  withGap("back", l.backDoor);
  wall("left", -hd, hd, 0, s.h);
  wall("right", -hd, hd, 0, s.h);
  if (s.trim) {
    b.use("paint").box(0, s.h - 24, hd + T / 2 + 2, l.w + T + 4, 24, 4, s.trim);
    b.use("paint").box(0, s.h - 24, -hd - T / 2 - 2, l.w + T + 4, 24, 4, s.trim);
    b.use("paint").box(hw + T / 2 + 2, s.h - 24, 0, 4, 24, l.d + T, s.trim);
    b.use("paint").box(-hw - T / 2 - 2, s.h - 24, 0, 4, 24, l.d + T, s.trim);
  }
  if (s.windows) {
    const { y, h, every, w } = s.windows;
    const along = (len: number, fn: (t: number) => void) => {
      const n = Math.floor((len - every * 0.5) / every);
      for (let i = 0; i < n; i++) fn(-len / 2 + every * (i + 0.5) + (len - n * every) / 2);
    };
    along(l.d, (t) => {
      for (const sx of [-1, 1]) {
        b.use("glass").box(sx * (hw + T / 2 + 1), y, t, 2, h, w, "#9cc8e6");
        b.use("glass").box(sx * (hw - T / 2 - 1), y, t, 2, h, w, "#cfe8f7");
        b.use("paint").box(sx * (hw + T / 2 + 2), y - 6, t, 4, 6, w + 12, s.trim ?? "#f3efe6");
      }
    });
    along(l.w, (t) => {
      const door = l.door;
      if (door && Math.abs(t - door.offset) < door.width / 2 + w / 2 + 20) return;
      b.use("glass").box(t, y, hd + T / 2 + 1, w, h, 2, "#9cc8e6");
      b.use("glass").box(t, y, hd - T / 2 - 1, w, h, 2, "#cfe8f7");
      b.use("paint").box(t, y - 6, hd + T / 2 + 2, w + 12, 6, 4, s.trim ?? "#f3efe6");
    });
  }
}

/** Flat roof with a parapet, plus a ceiling. */
export function buildFlatRoof(b: Builder, l: Landmark, h: number, color: string, parapet = 60, edge = "#d9d4c8") {
  b.use("paint").box(0, h - 4, 0, l.w + T, 4, l.d + T, "#f1efe9");
  b.use("concrete").box(0, h, 0, l.w + T, 16, l.d + T, color);
  if (parapet > 0) {
    const hw = l.w / 2 + T / 2;
    const hd = l.d / 2 + T / 2;
    b.use("paint").box(0, h + 16, hd - 6, l.w + T, parapet, 12, edge);
    b.use("paint").box(0, h + 16, -hd + 6, l.w + T, parapet, 12, edge);
    b.use("paint").box(hw - 6, h + 16, 0, 12, parapet, l.d + T, edge);
    b.use("paint").box(-hw + 6, h + 16, 0, 12, parapet, l.d + T, edge);
  }
}

/** Parked cars along a row, for lots. */
export function buildCars(b: Builder, x0: number, z: number, count: number, spacing: number, facing: number, seed = 1) {
  const colors = ["#c0392b", "#2c3e50", "#ecf0f1", "#2e86c1", "#f1c40f", "#7f8c8d", "#16a085", "#8e44ad"];
  for (let i = 0; i < count; i++) {
    if ((i * 7 + seed * 3) % 5 === 0) continue;
    const c = colors[(i * 3 + seed) % colors.length];
    b.at(x0 + i * spacing, 0, z, facing, () => buildCar(b, c));
  }
}

/** A sedan facing local +z, about 180 x 450 cm. */
export function buildCar(b: Builder, color: string) {
  b.solid(0, 0, 175, 450, 0, 100).solid(0, -30, 160, 240, 100, 155);
  b.use("gloss").box(0, 30, 0, 175, 70, 450, color);
  b.use("gloss").box(0, 100, -30, 160, 55, 240, color);
  b.use("glass").box(0, 102, -30, 164, 48, 230, "#26323d");
  b.use("paint").box(0, 70, 226, 150, 18, 2, "#d7dde3");
  for (const [x, z] of [
    [-82, 140],
    [82, 140],
    [-82, -150],
    [82, -150],
  ])
    b.use("paint").rod(x, 34, z, 33, 24, "#1d1d1f", 0, 12);
  b.use("glow").box(-60, 78, 226, 30, 12, 2, "#fff6d6").box(60, 78, 226, 30, 12, 2, "#fff6d6");
  b.use("glow").box(-60, 78, -226, 30, 12, 2, "#e0312b").box(60, 78, -226, 30, 12, 2, "#e0312b");
}

/** Painted parking bays: `count` stalls of width `w` and depth `d`, starting at x0. */
export function buildParking(b: Builder, x0: number, z: number, count: number, w = 280, d = 520) {
  b.use("asphalt").box(x0 - w / 2 + (count * w) / 2, 0, z, count * w + 200, 2, d + 700, "#7d8086");
  for (let i = 0; i <= count; i++) b.use("paint").box(x0 - w / 2 + i * w, 2.2, z, 8, 0.5, d, "#e9e6dc");
}

/** Lamp post with its head over local +z. */
export function buildLamp(b: Builder, x: number, z: number, ry = 0, h = 650) {
  b.at(x, 0, z, ry, () => {
    b.use("metal").cyl(0, 0, 0, 10, h, "#3b4148", 8, 7);
    b.use("metal").box(0, h - 12, 40, 14, 12, 90, "#3b4148");
    b.use("glow").box(0, h - 18, 75, 40, 6, 30, "#fff3c4");
  });
}

/** Tree: trunk plus a few overlapping crowns. */
export function buildTree(b: Builder, x: number, z: number, s = 1, color = "#3f7a34") {
  b.use("paint").cyl(x, 0, z, 18 * s, 380 * s, "#5b4330", 8, 13 * s);
  b.use("paint").sphere(x, 520 * s, z, 210 * s, color, 0.85, 10);
  b.use("paint").sphere(x + 110 * s, 440 * s, z + 60 * s, 150 * s, color, 0.85, 10);
  b.use("paint").sphere(x - 100 * s, 450 * s, z - 70 * s, 140 * s, color, 0.85, 10);
}

/** Picket/rail fence from (x0, z0) to (x1, z1) in local space. */
export function buildFence(b: Builder, x0: number, z0: number, x1: number, z1: number, color = "#f4f1ea", h = 110, gap = 14, broken: (i: number) => boolean = () => false) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ry = Math.atan2(x1 - x0, z1 - z0);
  const n = Math.floor(len / gap);
  b.at(x0, 0, z0, ry, () => {
    b.use("paint").box(0, h * 0.25, len / 2, 4, 8, len, color).box(0, h * 0.7, len / 2, 4, 8, len, color);
    for (let i = 0; i <= n; i++) {
      if (broken(i)) continue;
      b.use("paint").box(0, 0, i * gap, 3, h, 8, color);
    }
  });
}
