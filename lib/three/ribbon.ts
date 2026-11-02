import * as THREE from "three";
import type { Vec2 } from "../world/types";

interface RibbonOptions {
  /** World-space UV scale (units per texture repeat). If omitted, UVs run along the ribbon. */
  worldUV?: number;
  /** Units per V repeat when UVs run along the ribbon. */
  vScale?: number;
}

/** Flat strip of `width` following a polyline, facing +y. */
export function ribbonGeometry(pts: Vec2[], width: number, y: number, opts: RibbonOptions = {}): THREE.BufferGeometry {
  const n = pts.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const half = width / 2;
  let along = 0;

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    let nx = -tz;
    let nz = tx;

    // Miter so the strip keeps its width at corners.
    let miter = 1;
    if (i > 0 && i < n - 1) {
      const sx = p.x - prev.x;
      const sz = p.z - prev.z;
      const sl = Math.hypot(sx, sz) || 1;
      const segN = { x: -sz / sl, z: sx / sl };
      const dot = nx * segN.x + nz * segN.z;
      miter = Math.min(2.2, 1 / Math.max(0.2, dot));
    }
    nx *= half * miter;
    nz *= half * miter;

    if (i > 0) along += Math.hypot(p.x - prev.x, p.z - prev.z);

    const L = { x: p.x + nx, z: p.z + nz };
    const R = { x: p.x - nx, z: p.z - nz };
    positions.push(L.x, y, L.z, R.x, y, R.z);
    normals.push(0, 1, 0, 0, 1, 0);
    if (opts.worldUV) {
      uvs.push(L.x / opts.worldUV, L.z / opts.worldUV, R.x / opts.worldUV, R.z / opts.worldUV);
    } else {
      const v = along / (opts.vScale ?? width);
      uvs.push(0, v, 1, v);
    }
    if (i < n - 1) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}
