import * as THREE from "three";
import { brickTexture, concreteTexture, shingleTexture, stripeTexture } from "./textures";

type MapName = "brick" | "shingle" | "concrete";

export interface MatOptions {
  roughness?: number;
  metalness?: number;
  map?: MapName;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  toneMapped?: boolean;
}

const cache = new Map<string, THREE.Material>();

function mapFor(name: MapName): THREE.Texture {
  switch (name) {
    case "brick": {
      const t = brickTexture().clone();
      t.repeat.set(0.35, 0.35);
      t.needsUpdate = true;
      return t;
    }
    case "shingle":
      return shingleTexture();
    case "concrete":
      return concreteTexture();
  }
}

/** Shared MeshStandardMaterial keyed by its parameters. */
export function mat(color: string, opts: MatOptions = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${JSON.stringify(opts)}`;
  const hit = cache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.75,
    metalness: opts.metalness ?? 0,
    map: opts.map ? mapFor(opts.map) : null,
    emissive: new THREE.Color(opts.emissive ?? "#000000"),
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
  if (opts.toneMapped === false) m.toneMapped = false;
  cache.set(key, m);
  return m;
}

export function stripedMat(a: string, b: string): THREE.MeshStandardMaterial {
  const key = `stripe|${a}|${b}`;
  const hit = cache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({ map: stripeTexture(a, b), roughness: 0.85, side: THREE.DoubleSide });
  cache.set(key, m);
  return m;
}

export const COLORS = {
  glass: "#8fb6d6",
  frame: "#f7f4ee",
  trim: "#ffffff",
  darkTrim: "#3f3f46",
  stone: "#e9e2d3",
  roofDark: "#4b5563",
  wood: "#8b5a3c",
};

export const glassMat = () => mat(COLORS.glass, { roughness: 0.08, metalness: 0.4, emissive: "#3b5c78", emissiveIntensity: 0.25 });
