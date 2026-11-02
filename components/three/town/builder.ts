import * as THREE from "three";
import { asphaltTexture, brickTexture, concreteTexture, fenceTexture, grassTexture, shingleTexture, sidingTexture, tileTexture, woodFloorTexture } from "@/lib/three/textures";

/**
 * Builds a landmark out of many simple shapes and merges them into one mesh per material,
 * so a detailed building costs a handful of draw calls. Colors are stored per vertex and
 * texture coordinates are projected in building space, so textures tile at a constant size.
 */

export type Slot =
  | "paint"
  | "double"
  | "gloss"
  | "metal"
  | "glass"
  | "glow"
  | "brick"
  | "siding"
  | "concrete"
  | "asphalt"
  | "wood"
  | "planks"
  | "shingle"
  | "grass"
  | "tile"
  | "dirt";

/** Centimetres covered by one repeat of each slot's texture. */
const UV_SCALE: Partial<Record<Slot, number>> = {
  brick: 140,
  siding: 160,
  concrete: 320,
  asphalt: 700,
  wood: 420,
  planks: 260,
  shingle: 60,
  grass: 700,
  tile: 240,
  dirt: 900,
};

export interface Rot {
  rx?: number;
  ry?: number;
  rz?: number;
}

const unit = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = unit.get(key);
  if (!g) {
    const made = make();
    g = made.index ? made.toNonIndexed() : made;
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    unit.set(key, g);
  }
  return g;
}

/** Triangular prism, ridge along z, spanning -0.5..0.5 on every axis. */
function prismGeometry(skew = 0) {
  const g = new THREE.BufferGeometry();
  const ax = -0.5;
  const bx = 0.5;
  const tx = skew;
  const y0 = -0.5;
  const y1 = 0.5;
  const f = 0.5;
  const b = -0.5;
  // prettier-ignore
  const p = [
    ax, y0, f, bx, y0, f, tx, y1, f,
    bx, y0, b, ax, y0, b, tx, y1, b,
    ax, y0, b, ax, y0, f, tx, y1, f, ax, y0, b, tx, y1, f, tx, y1, b,
    bx, y0, f, bx, y0, b, tx, y1, b, bx, y0, f, tx, y1, b, tx, y1, f,
    ax, y0, b, bx, y0, b, bx, y0, f, ax, y0, b, bx, y0, f, ax, y0, f,
  ];
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

const _m = new THREE.Matrix4();
const _n = new THREE.Matrix3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Color();

interface Chunk {
  pos: Float32Array;
  nor: Float32Array;
  col: Float32Array;
}

export class Builder {
  private chunks = new Map<Slot, Chunk[]>();
  private slot: Slot = "paint";
  /** Offset and yaw applied to everything added, for building sub-assemblies in place. */
  private frame = { x: 0, y: 0, z: 0, ry: 0 };

  use(slot: Slot) {
    this.slot = slot;
    return this;
  }

  /** Runs `fn` with positions relative to (x, y, z) rotated by `ry`. */
  at(x: number, y: number, z: number, ry: number, fn: () => void) {
    const prev = { ...this.frame };
    const c = Math.cos(prev.ry);
    const s = Math.sin(prev.ry);
    this.frame = { x: prev.x + x * c + z * s, y: prev.y + y, z: prev.z - x * s + z * c, ry: prev.ry + ry };
    const prevSlot = this.slot;
    fn();
    this.slot = prevSlot;
    this.frame = prev;
    return this;
  }

  private add(geo: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, rot?: Rot) {
    const f = this.frame;
    const c = Math.cos(f.ry);
    const s = Math.sin(f.ry);
    _p.set(f.x + x * c + z * s, f.y + y, f.z - x * s + z * c);
    _e.set(rot?.rx ?? 0, (rot?.ry ?? 0) + f.ry, rot?.rz ?? 0, "YXZ");
    _q.setFromEuler(_e);
    _s.set(sx, sy, sz);
    _m.compose(_p, _q, _s);
    _n.getNormalMatrix(_m);
    const src = geo.getAttribute("position");
    const srcN = geo.getAttribute("normal");
    const n = src.count;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) {
      _v.fromBufferAttribute(src, i).applyMatrix4(_m);
      pos[i * 3] = _v.x;
      pos[i * 3 + 1] = _v.y;
      pos[i * 3 + 2] = _v.z;
      _v.fromBufferAttribute(srcN, i).applyMatrix3(_n).normalize();
      nor[i * 3] = _v.x;
      nor[i * 3 + 1] = _v.y;
      nor[i * 3 + 2] = _v.z;
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    const list = this.chunks.get(this.slot);
    if (list) list.push({ pos, nor, col });
    else this.chunks.set(this.slot, [{ pos, nor, col }]);
    return this;
  }

  /** Box with its bottom at `y`. */
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, rot?: Rot) {
    return this.add(
      cached("box", () => new THREE.BoxGeometry(1, 1, 1)),
      x,
      y + h / 2,
      z,
      w,
      h,
      d,
      color,
      rot,
    );
  }

  /** Box centered at (x, y, z), handy for tilted parts. */
  cbox(x: number, y: number, z: number, w: number, h: number, d: number, color: string, rot?: Rot) {
    return this.add(cached("box", () => new THREE.BoxGeometry(1, 1, 1)), x, y, z, w, h, d, color, rot);
  }

  /** Upright cylinder with its bottom at `y` (centered there when rotated); `rTop` makes a frustum. */
  cyl(x: number, y: number, z: number, r: number, h: number, color: string, seg = 16, rTop = r, rot?: Rot) {
    const ratio = Math.round((rTop / r) * 100) / 100;
    const g = cached(`cyl-${seg}-${ratio}`, () => new THREE.CylinderGeometry(ratio, 1, 1, seg));
    if (rot) return this.add(g, x, y, z, r, h, r, color, rot);
    return this.add(g, x, y + h / 2, z, r, h, r, color);
  }

  /** Cylinder lying along local x, centered at (x, y, z). */
  rod(x: number, y: number, z: number, r: number, len: number, color: string, ry = 0, seg = 10) {
    return this.add(cached(`cyl-${seg}-1`, () => new THREE.CylinderGeometry(1, 1, 1, seg)), x, y, z, r, len, r, color, { ry, rz: Math.PI / 2 });
  }

  cone(x: number, y: number, z: number, r: number, h: number, color: string, seg = 16) {
    return this.add(cached(`cone-${seg}`, () => new THREE.ConeGeometry(1, 1, seg)), x, y + h / 2, z, r, h, r, color);
  }

  sphere(x: number, y: number, z: number, r: number, color: string, sy = 1, seg = 14) {
    return this.add(cached(`sphere-${seg}`, () => new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7)))), x, y, z, r, r * sy, r, color);
  }

  /** Half sphere (dome) with its flat side at `y`. */
  dome(x: number, y: number, z: number, r: number, color: string, sy = 1) {
    return this.add(cached("dome", () => new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), x, y, z, r, r * sy, r, color);
  }

  torus(x: number, y: number, z: number, radius: number, tube: number, color: string, rot?: Rot) {
    const ratio = Math.round((tube / radius) * 100) / 100;
    return this.add(cached(`torus-${ratio}`, () => new THREE.TorusGeometry(1, ratio, 8, 28)), x, y, z, radius, radius, radius, color, rot);
  }

  /**
   * Part of a tube lying along local x, centered at (x, y, z). Angles run from +z (0) over the top (pi/2)
   * to -z (pi), so (0, pi) is the upper half and (pi, pi) the lower half.
   */
  arc(x: number, y: number, z: number, r: number, len: number, color: string, start: number, length: number, seg = 24) {
    const key = `arc-${seg}-${start.toFixed(3)}-${length.toFixed(3)}`;
    // Cylinder theta is measured from +z toward +x; after rotating the axis onto x, +x becomes +y.
    return this.add(cached(key, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, true, start, length)), x, y, z, r, len, r, color, { rz: Math.PI / 2 });
  }

  /** Gable roof: ridge along local z, bottom at `y`. */
  gable(x: number, y: number, z: number, w: number, h: number, d: number, color: string, ry = 0) {
    return this.add(cached("prism", () => prismGeometry()), x, y + h / 2, z, w, h, d, color, { ry });
  }

  /** Shed (lean-to) wedge: high side at -x. */
  wedge(x: number, y: number, z: number, w: number, h: number, d: number, color: string, ry = 0) {
    return this.add(cached("wedge", () => prismGeometry(-0.5)), x, y + h / 2, z, w, h, d, color, { ry });
  }

  /** Flat disc/slab with its bottom at `y` (a cylinder squashed flat). */
  disc(x: number, y: number, z: number, r: number, h: number, color: string, seg = 28) {
    return this.cyl(x, y, z, r, h, color, seg);
  }

  /** Merges everything added so far into one geometry per slot. */
  build() {
    const out: { slot: Slot; geometry: THREE.BufferGeometry }[] = [];
    for (const [slot, list] of this.chunks) {
      let total = 0;
      for (const c of list) total += c.pos.length;
      const pos = new Float32Array(total);
      const nor = new Float32Array(total);
      const col = new Float32Array(total);
      let o = 0;
      for (const c of list) {
        pos.set(c.pos, o);
        nor.set(c.nor, o);
        col.set(c.col, o);
        o += c.pos.length;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const scale = UV_SCALE[slot];
      if (scale) g.setAttribute("uv", new THREE.BufferAttribute(projectUVs(pos, nor, scale), 2));
      g.computeBoundingSphere();
      out.push({ slot, geometry: g });
    }
    this.chunks.clear();
    return out;
  }
}

/** Box-projected texture coordinates: each face takes the two axes it spans. */
function projectUVs(pos: Float32Array, nor: Float32Array, scale: number) {
  const n = pos.length / 3;
  const uv = new Float32Array(n * 2);
  // Use the face normal of each triangle so the projection is consistent across it.
  for (let t = 0; t < n; t += 3) {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let k = 0; k < 3; k++) {
      nx += Math.abs(nor[(t + k) * 3]);
      ny += Math.abs(nor[(t + k) * 3 + 1]);
      nz += Math.abs(nor[(t + k) * 3 + 2]);
    }
    for (let k = 0; k < 3; k++) {
      const i = t + k;
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      let u: number;
      let v: number;
      if (ny >= nx && ny >= nz) {
        u = x;
        v = z;
      } else if (nx >= nz) {
        u = z;
        v = y;
      } else {
        u = x;
        v = y;
      }
      uv[i * 2] = u / scale;
      uv[i * 2 + 1] = v / scale;
    }
  }
  return uv;
}

const materials = new Map<Slot, THREE.Material>();

/** Shared material for a slot; colors come from the vertices. */
export function slotMaterial(slot: Slot): THREE.Material {
  const hit = materials.get(slot);
  if (hit) return hit;
  let m: THREE.Material;
  const std = (opts: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, ...opts });
  switch (slot) {
    case "gloss":
      m = std({ roughness: 0.35 });
      break;
    case "double":
      m = std({ roughness: 0.45, side: THREE.DoubleSide });
      break;
    case "metal":
      m = std({ roughness: 0.35, metalness: 0.65 });
      break;
    case "glass":
      m = std({ roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.42, depthWrite: false });
      break;
    case "glow":
      m = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      break;
    case "brick":
      m = std({ map: brickTexture(), roughness: 0.92 });
      break;
    case "siding":
      m = std({ map: sidingTexture() });
      break;
    case "concrete":
      m = std({ map: concreteTexture(), roughness: 0.92 });
      break;
    case "asphalt":
      m = std({ map: asphaltTexture(), roughness: 0.95 });
      break;
    case "wood":
      m = std({ map: woodFloorTexture(), roughness: 0.7 });
      break;
    case "planks":
      m = std({ map: fenceTexture(), roughness: 0.9 });
      break;
    case "shingle":
      m = std({ map: shingleTexture(), roughness: 0.9 });
      break;
    case "grass":
      m = std({ map: grassTexture(), roughness: 1 });
      break;
    case "tile":
      m = std({ map: tileTexture("#f4f1ea", "rgba(120,110,100,0.35)", "town-tile"), roughness: 0.5 });
      break;
    case "dirt":
      m = std({ map: concreteTexture(), roughness: 1 });
      break;
    default:
      m = std({ roughness: 0.7 });
  }
  materials.set(slot, m);
  return m;
}
