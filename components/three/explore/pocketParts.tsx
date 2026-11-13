"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type * as THREE from "three";
import { pocketNear } from "@/lib/explore/pockets";
import { DEEP_Y } from "@/lib/explore/underground";
import { runtime } from "@/lib/runtime";
import type { Builder } from "../town/builder";

/** Children are drawn only while the toy is down in (or right next to) pocket `id`. */
export function PocketGroup({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = runtime.toy;
    if (ref.current) ref.current.visible = pocketNear(t.x, t.z, t.y, 600)?.id === id;
  });
  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}

/** A warm lamp that follows the toy underground. Always mounted (dimmed above ground) so shaders don't recompile on the way down. */
export function PocketLamp() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    const t = runtime.toy;
    const down = t.y < DEEP_Y;
    l.intensity = down ? 9000 : 0;
    if (down) l.position.set(t.x, t.y + 90, t.z);
  });
  return <pointLight ref={ref} intensity={0} distance={1500} decay={2} color="#ffe2b0" />;
}

/** A metal ladder against a wall, `h` tall, facing local +z. */
export function buildLadder(b: Builder, x: number, z: number, ry: number, h: number) {
  b.at(x, 0, z, ry, () => {
    for (const s of [-1, 1]) b.use("metal").box(s * 20, 0, 0, 5, h, 5, "#6b7280");
    for (let y = 22; y < h; y += 28) b.use("metal").box(0, y, 0, 40, 3, 4, "#9aa3ad");
  });
}
