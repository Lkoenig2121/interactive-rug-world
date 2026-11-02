"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";
import type { Rect, Side } from "@/lib/house/layout";

export interface WallOpening {
  /** Center along the wall in wall-local x. */
  u: number;
  w: number;
  /** Absolute y of the opening's bottom and top. */
  bottom: number;
  top: number;
}

/** Vertical rectangle in wall-local space with UVs in world units / `tile`. */
export function panelGeometry(u0: number, u1: number, y0: number, y1: number, tile: number) {
  const g = new THREE.PlaneGeometry(u1 - u0, y1 - y0);
  g.translate((u0 + u1) / 2, (y0 + y1) / 2, 0);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tile, pos.getY(i) / tile);
  return g;
}

/** Panels covering a wall of `length` from y0 to y1, leaving rectangular holes. */
export function wallPanels(length: number, y0: number, y1: number, openings: WallOpening[], tile: number) {
  const out: THREE.BufferGeometry[] = [];
  let cursor = -length / 2;
  for (const o of [...openings].sort((a, b) => a.u - b.u)) {
    const a = Math.max(-length / 2, o.u - o.w / 2);
    const b = Math.min(length / 2, o.u + o.w / 2);
    if (a > cursor) out.push(panelGeometry(cursor, a, y0, y1, tile));
    if (o.bottom > y0) out.push(panelGeometry(a, b, y0, o.bottom, tile));
    if (o.top < y1) out.push(panelGeometry(a, b, o.top, y1, tile));
    cursor = Math.max(cursor, b);
  }
  if (cursor < length / 2) out.push(panelGeometry(cursor, length / 2, y0, y1, tile));
  return out;
}

export function mergeGeometries(geos: THREE.BufferGeometry[]) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    positions.push(...(ng.attributes.position.array as Float32Array));
    normals.push(...(ng.attributes.normal.array as Float32Array));
    uvs.push(...(ng.attributes.uv.array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return out;
}

/**
 * Placement of a wall on one side of a rectangle.
 * `inward` walls face into the rectangle (rooms), otherwise they face out (facades).
 */
export function sideFrame(r: Rect, side: Side, inward: boolean, inset = 0) {
  const cx = (r.x0 + r.x1) / 2;
  const cz = (r.z0 + r.z1) / 2;
  const o = inward ? 0 : inset;
  switch (side) {
    case "n":
      return {
        position: [cx, 0, r.z0 - o] as [number, number, number],
        rotation: inward ? 0 : Math.PI,
        length: r.x1 - r.x0 + 2 * o,
        toU: (x: number) => (inward ? x - cx : cx - x),
      };
    case "s":
      return {
        position: [cx, 0, r.z1 + o] as [number, number, number],
        rotation: inward ? Math.PI : 0,
        length: r.x1 - r.x0 + 2 * o,
        toU: (x: number) => (inward ? cx - x : x - cx),
      };
    case "w":
      return {
        position: [r.x0 - o, 0, cz] as [number, number, number],
        rotation: inward ? Math.PI / 2 : -Math.PI / 2,
        length: r.z1 - r.z0 + 2 * o,
        toU: (z: number) => (inward ? cz - z : z - cz),
      };
    case "e":
      return {
        position: [r.x1 + o, 0, cz] as [number, number, number],
        rotation: inward ? -Math.PI / 2 : Math.PI / 2,
        length: r.z1 - r.z0 + 2 * o,
        toU: (z: number) => (inward ? z - cz : cz - z),
      };
  }
}

/** Horizontal quad with world-space UVs; faces up unless `down`. */
export function quadXZ(r: Rect, y: number, tile: number, down = false) {
  const { x0, x1, z0, z1 } = r;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(4).fill([0, down ? -1 : 1, 0]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([x0, z0, x1, z0, x1, z1, x0, z1].map((v) => v / tile), 2));
  g.setIndex(down ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  return g;
}

/** Rectangle minus an optional rectangular hole, as up to four rectangles. */
export function rectMinusHole(r: Rect, hole?: Rect): Rect[] {
  if (!hole) return [r];
  const out: Rect[] = [];
  if (hole.z0 > r.z0) out.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: hole.z0 });
  if (hole.z1 < r.z1) out.push({ x0: r.x0, x1: r.x1, z0: hole.z1, z1: r.z1 });
  if (hole.x0 > r.x0) out.push({ x0: r.x0, x1: hole.x0, z0: hole.z0, z1: hole.z1 });
  if (hole.x1 < r.x1) out.push({ x0: hole.x1, x1: r.x1, z0: hole.z0, z1: hole.z1 });
  return out;
}

/**
 * Gable roof with the ridge along local x. Returns two sloped faces (double sided) spanning
 * w × d with `rise`, eaves at y = 0, centered at the origin.
 */
export function gableSlopes(w: number, d: number, rise: number, tile = 0) {
  const hw = w / 2;
  const hd = d / 2;
  const slant = Math.hypot(hd, rise);
  const t = tile || 1;
  const pos = [
    // Front slope (+z)
    -hw, 0, hd, hw, 0, hd, hw, rise, 0, -hw, 0, hd, hw, rise, 0, -hw, rise, 0,
    // Back slope (-z)
    hw, 0, -hd, -hw, 0, -hd, -hw, rise, 0, hw, 0, -hd, -hw, rise, 0, hw, rise, 0,
  ];
  const uv = [
    -hw, 0, hw, 0, hw, slant, -hw, 0, hw, slant, -hw, slant,
    hw, 0, -hw, 0, -hw, slant, hw, 0, -hw, slant, hw, slant,
  ].map((v) => v / t);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** The two triangular gable ends (facing ±x) under `gableSlopes` of the same size, inset from the overhang. */
export function gableEnds(w: number, d: number, rise: number, tile = 0) {
  const hw = w / 2;
  const hd = d / 2;
  const t = tile || 1;
  const pos = [hw, 0, hd, hw, 0, -hd, hw, rise, 0, -hw, 0, -hd, -hw, 0, hd, -hw, rise, 0];
  const uv = [hd, 0, -hd, 0, 0, rise, -hd, 0, hd, 0, 0, rise].map((v) => v / t);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

type V3 = [number, number, number];

/** Box placed by its bottom-center. */
export function B({ p, s, c, r = 0, rough = 0.7, metal = 0, material }: { p: V3; s: V3; c?: string; r?: number; rough?: number; metal?: number; material?: THREE.Material }) {
  return (
    <mesh position={[p[0], p[1] + s[1] / 2, p[2]]} rotation-y={r} material={material ?? mat(c ?? "#ffffff", { roughness: rough, metalness: metal })}>
      <boxGeometry args={s} />
    </mesh>
  );
}

/** Cylinder placed by its bottom-center. */
export function C({ p, r, h, c, seg = 16, rough = 0.6, metal = 0 }: { p: V3; r: number | [number, number]; h: number; c: string; seg?: number; rough?: number; metal?: number }) {
  const [rt, rb] = typeof r === "number" ? [r, r] : r;
  return (
    <mesh position={[p[0], p[1] + h / 2, p[2]]} material={mat(c, { roughness: rough, metalness: metal })}>
      <cylinderGeometry args={[rt, rb, h, seg]} />
    </mesh>
  );
}

export function S({ p, r, c, scale = [1, 1, 1], rough = 0.6 }: { p: V3; r: number; c: string; scale?: V3; rough?: number }) {
  return (
    <mesh position={p} scale={scale} material={mat(c, { roughness: rough })}>
      <sphereGeometry args={[r, 20, 14]} />
    </mesh>
  );
}

/** Group of meshes sharing one material, built from geometries once. */
export function Geoms({ geometries, material }: { geometries: THREE.BufferGeometry[]; material: THREE.Material }) {
  const merged = useMemo(() => mergeGeometries(geometries), [geometries]);
  return <mesh geometry={merged} material={material} receiveShadow />;
}
