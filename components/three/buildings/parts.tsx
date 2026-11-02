"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { COLORS, glassMat, mat, stripedMat } from "@/lib/three/materials";
import { labelTexture, type LabelOptions } from "@/lib/three/textures";
import { InstancedParts, placement } from "../Instanced";

type V3 = [number, number, number];

export function Box({
  size,
  position,
  color = "#ffffff",
  material,
  rotation,
  cast = true,
}: {
  size: V3;
  position: V3;
  color?: string;
  material?: THREE.Material;
  rotation?: V3;
  cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material ?? mat(color)} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

export function Cyl({
  r,
  h,
  position,
  color = "#ffffff",
  material,
  segments = 16,
  rTop,
  rotation,
}: {
  r: number;
  h: number;
  position: V3;
  color?: string;
  material?: THREE.Material;
  segments?: number;
  rTop?: number;
  rotation?: V3;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material ?? mat(color)} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
    </mesh>
  );
}

const roofCache = new Map<string, THREE.BufferGeometry>();

/** Triangular prism; the ridge runs along local z unless ridge = "x". */
function gableGeometry(span: number, length: number, h: number): THREE.BufferGeometry {
  const key = `${span}|${length}|${h}`;
  const hit = roofCache.get(key);
  if (hit) return hit;
  const shape = new THREE.Shape();
  shape.moveTo(-span / 2, 0);
  shape.lineTo(span / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  g.translate(0, 0, -length / 2);
  roofCache.set(key, g);
  return g;
}

export function GableRoof({
  w,
  d,
  h,
  y,
  color,
  overhang = 0.6,
  ridge = "x",
  textured = true,
}: {
  w: number;
  d: number;
  h: number;
  y: number;
  color: string;
  overhang?: number;
  ridge?: "x" | "z";
  textured?: boolean;
}) {
  const span = (ridge === "x" ? d : w) + overhang * 2;
  const length = (ridge === "x" ? w : d) + overhang * 2;
  const geometry = gableGeometry(span, length, h);
  return (
    <mesh
      geometry={geometry}
      position={[0, y, 0]}
      rotation-y={ridge === "x" ? Math.PI / 2 : 0}
      material={mat(color, { roughness: 0.8, map: textured ? "shingle" : undefined })}
      castShadow
      receiveShadow
    />
  );
}

const pyramidGeometry = new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4);

export function HipRoof({ w, d, h, y, color, overhang = 0.5 }: { w: number; d: number; h: number; y: number; color: string; overhang?: number }) {
  return (
    <mesh
      geometry={pyramidGeometry}
      position={[0, y + h / 2, 0]}
      scale={[(w + overhang * 2) / Math.SQRT2, h, (d + overhang * 2) / Math.SQRT2]}
      material={mat(color, { roughness: 0.8, map: "shingle" })}
      castShadow
      receiveShadow
    />
  );
}

export function FlatRoof({ w, d, y, color = "#9ca3af", parapet = 0.6, trim = "#e5e7eb" }: { w: number; d: number; y: number; color?: string; parapet?: number; trim?: string }) {
  return (
    <group>
      <Box size={[w, 0.25, d]} position={[0, y + 0.12, 0]} color={color} />
      {parapet > 0 && (
        <>
          <Box size={[w + 0.3, parapet, 0.3]} position={[0, y + parapet / 2, d / 2]} color={trim} />
          <Box size={[w + 0.3, parapet, 0.3]} position={[0, y + parapet / 2, -d / 2]} color={trim} />
          <Box size={[0.3, parapet, d]} position={[w / 2, y + parapet / 2, 0]} color={trim} />
          <Box size={[0.3, parapet, d]} position={[-w / 2, y + parapet / 2, 0]} color={trim} />
        </>
      )}
    </group>
  );
}

export interface WindowItem {
  x: number;
  y: number;
  z: number;
  rot: number;
  w: number;
  h: number;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** All windows of one building in two instanced draw calls (frames + glass). */
export function Windows({ items, frameColor = COLORS.frame, sill = true }: { items: WindowItem[]; frameColor?: string; sill?: boolean }) {
  const { frames, glass, sills } = useMemo(() => {
    const frames = items.map((it) => placement(it.x, it.y, it.z, it.rot, [it.w + 0.28, it.h + 0.28, 0.14]));
    const glass = items.map((it) => placement(it.x, it.y, it.z, it.rot, [it.w, it.h, 0.1], [0, 0, 0.05]));
    const sills = sill ? items.map((it) => placement(it.x, it.y, it.z, it.rot, [it.w + 0.5, 0.12, 0.3], [0, -it.h / 2 - 0.12, 0.08])) : [];
    // Mullion cross
    const mullions = items.flatMap((it) => [
      placement(it.x, it.y, it.z, it.rot, [0.07, it.h, 0.04], [0, 0, 0.11]),
      placement(it.x, it.y, it.z, it.rot, [it.w, 0.07, 0.04], [0, 0, 0.11]),
    ]);
    return { frames: [...frames, ...mullions], glass, sills };
  }, [items, sill]);
  return (
    <group>
      <InstancedParts geometry={unitBox} material={mat(frameColor, { roughness: 0.5 })} matrices={frames} castShadow={false} />
      <InstancedParts geometry={unitBox} material={glassMat()} matrices={glass} castShadow={false} />
      {sills.length > 0 && <InstancedParts geometry={unitBox} material={mat(frameColor, { roughness: 0.5 })} matrices={sills} />}
    </group>
  );
}

interface FacadeOptions {
  w: number;
  d: number;
  floors: number;
  floorH: number;
  baseY?: number;
  winW?: number;
  winH?: number;
  spacing?: number;
  sides?: ("front" | "back" | "left" | "right")[];
  /** Skip front windows whose x falls in these ranges (doors, signs). */
  /** Ground-floor front range [from, to] kept free for the entrance. */
  skipFront?: [number, number];
  skipFloors?: number[];
}

/** Evenly distributed windows on the facades of a box-shaped building. */
export function facadeWindows(o: FacadeOptions): WindowItem[] {
  const { w, d, floors, floorH, baseY = 0, winW = 1.3, winH = 1.5, spacing = 3, sides = ["front", "back", "left", "right"] } = o;
  const out: WindowItem[] = [];
  for (const side of sides) {
    const len = side === "front" || side === "back" ? w : d;
    const n = Math.max(1, Math.floor((len - 1) / spacing));
    const step = len / n;
    for (let f = 0; f < floors; f++) {
      if (o.skipFloors?.includes(f)) continue;
      const y = baseY + f * floorH + floorH * 0.55;
      for (let i = 0; i < n; i++) {
        const t = -len / 2 + step * (i + 0.5);
        if (side === "front" && f === 0 && o.skipFront && t > o.skipFront[0] && t < o.skipFront[1]) continue;
        switch (side) {
          case "front":
            out.push({ x: t, y, z: d / 2, rot: 0, w: winW, h: winH });
            break;
          case "back":
            out.push({ x: -t, y, z: -d / 2, rot: Math.PI, w: winW, h: winH });
            break;
          case "right":
            out.push({ x: w / 2, y, z: -t, rot: Math.PI / 2, w: winW, h: winH });
            break;
          case "left":
            out.push({ x: -w / 2, y, z: t, rot: -Math.PI / 2, w: winW, h: winH });
            break;
        }
      }
    }
  }
  return out;
}

export function Door({ x, z, w = 1.3, h = 2.4, color = "#7c4a2d", rot = 0, glass = false, y = 0 }: { x: number; z: number; w?: number; h?: number; color?: string; rot?: number; glass?: boolean; y?: number }) {
  return (
    <group position={[x, y, z]} rotation-y={rot}>
      <Box size={[w + 0.36, h + 0.18, 0.16]} position={[0, h / 2 + 0.05, 0.02]} color={COLORS.frame} cast={false} />
      {glass ? (
        <mesh position={[0, h / 2, 0.12]} material={glassMat()}>
          <boxGeometry args={[w, h, 0.06]} />
        </mesh>
      ) : (
        <Box size={[w, h, 0.1]} position={[0, h / 2, 0.11]} color={color} cast={false} />
      )}
      <mesh position={[w * 0.32, h * 0.48, 0.2]} material={mat("#d4af37", { metalness: 0.8, roughness: 0.3 })}>
        <sphereGeometry args={[0.07, 8, 6]} />
      </mesh>
      <Box size={[w + 0.8, 0.12, 0.8]} position={[0, 0.06, 0.45]} color="#bdb5a6" cast={false} />
    </group>
  );
}

export function Sign({
  text,
  w,
  h,
  position,
  rot = 0,
  depth = 0.15,
  doubleSided = false,
  ...label
}: { text: string; w: number; h: number; position: V3; rot?: number; depth?: number; doubleSided?: boolean } & LabelOptions) {
  const tex = labelTexture(text, { width: 512, height: Math.round((512 * h) / w), ...label });
  return (
    <group position={position} rotation-y={rot}>
      <Box size={[w, h, depth]} position={[0, 0, 0]} color={label.bg && label.bg !== "transparent" ? label.bg : "#ffffff"} cast={false} />
      <mesh position={[0, 0, depth / 2 + 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} transparent roughness={0.6} />
      </mesh>
      {doubleSided && (
        <mesh position={[0, 0, -depth / 2 - 0.01]} rotation-y={Math.PI}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={tex} transparent roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

export function Awning({ w, y, z, depth = 1.6, a, b }: { w: number; y: number; z: number; depth?: number; a: string; b: string }) {
  const tilt = 0.45;
  return (
    <group position={[0, y, z]}>
      <mesh
        position={[0, -Math.sin(tilt) * depth * 0.5, (Math.cos(tilt) * depth) / 2]}
        rotation-x={Math.PI / 2 + tilt}
        material={stripedMat(a, b)}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[w, depth]} />
      </mesh>
      <mesh position={[0, -Math.sin(tilt) * depth - 0.2, Math.cos(tilt) * depth]} material={stripedMat(a, b)} castShadow>
        <planeGeometry args={[w, 0.4]} />
      </mesh>
    </group>
  );
}

export function FlagPole({ position, color = "#1d4ed8", h = 7 }: { position: V3; color?: string; h?: number }) {
  return (
    <group position={position}>
      <Cyl r={0.08} h={h} position={[0, h / 2, 0]} color="#d1d5db" segments={8} />
      <mesh position={[0, h - 0.1, 0]} material={mat("#facc15", { metalness: 0.7, roughness: 0.3 })}>
        <sphereGeometry args={[0.14, 10, 8]} />
      </mesh>
      <mesh position={[0.75, h - 0.65, 0]} material={mat(color, { side: THREE.DoubleSide })} castShadow>
        <planeGeometry args={[1.4, 0.9]} />
      </mesh>
    </group>
  );
}

export function Planter({ position, w = 2, d = 0.8 }: { position: V3; w?: number; d?: number }) {
  return (
    <group position={position}>
      <Box size={[w, 0.5, d]} position={[0, 0.25, 0]} color="#a8a29e" />
      <mesh position={[0, 0.7, 0]} scale={[w / 2, 0.45, d / 2]} material={mat("#4d8b3f", { roughness: 0.9 })} castShadow>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
