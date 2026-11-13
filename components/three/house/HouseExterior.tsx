"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ANDY_ROOM,
  APERTURES,
  EAVE_Y,
  EXT_Y,
  GROUND_Y,
  HOUSE,
  inRect,
  isOutsideHouse,
  levelY,
  SHELL,
  STREET,
  UPPER_Y,
  type Aperture,
  type Rect,
  type Side,
} from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { onAndyRoof } from "@/lib/town/blocks";
import { landmarkById } from "@/lib/town/config";
import { Enterable } from "./HouseEnterTargets";
import { mat } from "@/lib/three/materials";
import { brickTexture, concreteTexture, garageDoorTexture, shingleTexture, sidingTexture } from "@/lib/three/textures";
import { seededRandom } from "@/lib/world/geometry";
import { B, C, Geoms, gableEnds, gableSlopes, S, sideFrame, wallPanels, type WallOpening } from "./kit";

const SIDING = "#efe2c4";
const TRIM = "#fbfaf6";
const ROOF = "#4a4642";
const SHUTTER = "#2f4b3a";

const ROOF_RISE = 380;
const OVERHANG = 50;
/** Depth of the front cross gable, measured back from the front wall. */
const CROSS_LEN = 440;

const cache = new Map<string, THREE.Material>();
function once(key: string, make: () => THREE.Material) {
  let m = cache.get(key);
  if (!m) cache.set(key, (m = make()));
  return m;
}
const sidingMat = () => once("siding", () => new THREE.MeshStandardMaterial({ map: sidingTexture(), color: SIDING, roughness: 0.85 }));
const roofMat = () =>
  once("roof", () => {
    const map = shingleTexture().clone();
    map.repeat.set(1, 1);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color: ROOF, roughness: 0.9, side: THREE.DoubleSide });
  });
const brickMat = () =>
  once("brick", () => {
    const map = brickTexture().clone();
    map.repeat.set(1, 1);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color: "#b0644a", roughness: 0.9 });
  });
const glassMat = () =>
  once("house-glass", () => new THREE.MeshPhysicalMaterial({ color: "#a9c7dc", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1 }));

const SHELL_RECT: Rect = HOUSE;

function apertureOpening(a: Aperture, toU: (v: number) => number): WallOpening {
  const y = levelY(a.level);
  return { u: toU(a.c), w: a.w, bottom: y + a.bottom, top: y + a.top };
}

/** Outward-facing siding walls of the main house with holes for every window and door. */
function Facades() {
  const walls = useMemo(
    () =>
      (["n", "s", "e", "w"] as Side[]).map((side) => {
        const f = sideFrame(SHELL_RECT, side, false, SHELL);
        const openings = APERTURES.filter((a) => a.side === side).map((a) => apertureOpening(a, f.toU));
        return { f, geos: wallPanels(f.length, GROUND_Y, EAVE_Y, openings, 200) };
      }),
    [],
  );
  return (
    <group>
      {walls.map(({ f, geos }, i) => (
        <group key={i} position={f.position} rotation-y={f.rotation}>
          <Geoms geometries={geos} material={sidingMat()} />
        </group>
      ))}
    </group>
  );
}

/** Exterior window/door dressing placed on the facade (local +z points outward). */
function ApertureTrim({ a }: { a: Aperture }) {
  const f = sideFrame(SHELL_RECT, a.side, false, SHELL);
  const y = levelY(a.level);
  const u = f.toU(a.c);
  const h = a.top - a.bottom;
  const b = y + a.bottom;
  return (
    <group position={f.position} rotation-y={f.rotation}>
      <group position={[u, 0, 0]}>
        {/* Casing */}
        {[-1, 1].map((s) => (
          <B key={s} p={[s * (a.w / 2 + 5), b, 2]} s={[10, h + 10, 4]} c={TRIM} rough={0.5} />
        ))}
        <B p={[0, b + h, 2]} s={[a.w + 24, 12, 5]} c={TRIM} rough={0.5} />
        {a.kind === "window" && <B p={[0, b - 6, 5]} s={[a.w + 26, 6, 12]} c={TRIM} rough={0.5} />}
        {a.kind !== "door" && (
          <>
            <mesh position={[0, b + h / 2, -1]} material={glassMat()}>
              <planeGeometry args={[a.w, h]} />
            </mesh>
            <B p={[0, b, 0]} s={[3, h, 3]} c={TRIM} />
            {a.kind === "window" && <B p={[0, b + h / 2 - 1.5, 0]} s={[a.w, 3, 3]} c={TRIM} />}
          </>
        )}
        {a.kind === "window" && a.w <= 150 &&
          [-1, 1].map((s) => <B key={s} p={[s * (a.w / 2 + 10 + a.w * 0.22), b, 3]} s={[a.w * 0.42, h, 3]} c={SHUTTER} rough={0.6} />)}
        {a.kind === "door" && (
          <group>
            <B p={[0, b, -2]} s={[a.w, h, 5]} c="#8c2f2f" rough={0.4} />
            {[0.25, 0.62].map((t) =>
              [-1, 1].map((s) => <B key={`${t}${s}`} p={[(s * a.w) / 4.4, b + h * t, 1]} s={[a.w / 3, h * 0.28, 1.5]} c="#7a2626" rough={0.4} />),
            )}
            <S p={[a.w / 2 - 12, b + 100, 3]} r={3} c="#d8b25a" />
          </group>
        )}
      </group>
    </group>
  );
}

function TrimBands() {
  const { x0, x1, z0, z1 } = HOUSE;
  const s = SHELL;
  const w = x1 - x0 + 2 * s;
  const d = z1 - z0 + 2 * s;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  return (
    <group>
      {/* Foundation */}
      <B p={[cx, EXT_Y, cz]} s={[w + 10, GROUND_Y - EXT_Y, d + 10]} c="#b3aa9b" rough={0.95} />
      {/* Band between floors */}
      <B p={[cx, UPPER_Y - 22, z1 + s + 1]} s={[w + 4, 14, 4]} c={TRIM} />
      <B p={[cx, UPPER_Y - 22, z0 - s - 1]} s={[w + 4, 14, 4]} c={TRIM} />
      <B p={[x1 + s + 1, UPPER_Y - 22, cz]} s={[4, 14, d + 4]} c={TRIM} />
      <B p={[x0 - s - 1, UPPER_Y - 22, cz]} s={[4, 14, d + 4]} c={TRIM} />
      {/* Corner boards */}
      {[
        [x0 - s, z0 - s],
        [x1 + s, z0 - s],
        [x0 - s, z1 + s],
        [x1 + s, z1 + s],
      ].map(([x, z], i) => (
        <B key={i} p={[x, GROUND_Y, z]} s={[14, EAVE_Y - GROUND_Y, 14]} c={TRIM} />
      ))}
      {/* Frieze under the eaves */}
      <B p={[cx, EAVE_Y - 18, z1 + s + 1]} s={[w + 4, 18, 4]} c={TRIM} />
      <B p={[cx, EAVE_Y - 18, z0 - s - 1]} s={[w + 4, 18, 4]} c={TRIM} />
    </group>
  );
}

function Roofs() {
  const { x0, x1, z0, z1 } = HOUSE;
  const w = x1 - x0 + 2 * SHELL;
  const d = z1 - z0 + 2 * SHELL;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const geos = useMemo(() => {
    const main = gableSlopes(w + 2 * OVERHANG, d + 2 * OVERHANG, ROOF_RISE, 150);
    const ends = gableEnds(w, d, ROOF_RISE, 200);
    // Front cross gable over Andy's room (ridge along z, rotated into place below)
    const gw = 900 + 2 * SHELL;
    const crossRise = 300;
    const cross = gableSlopes(CROSS_LEN + 2 * OVERHANG, gw + 2 * OVERHANG, crossRise, 150);
    const crossEnd = gableEnds(CROSS_LEN, gw, crossRise, 200);
    return { main, ends, cross, crossEnd };
  }, [w, d]);
  const frontZ = z1 + SHELL;
  return (
    <group>
      <mesh geometry={geos.main} material={roofMat()} position={[cx, EAVE_Y, cz]} />
      <mesh geometry={geos.ends} material={sidingMat()} position={[cx, EAVE_Y, cz]} />
      <group position={[0, EAVE_Y, frontZ - CROSS_LEN / 2]} rotation-y={Math.PI / 2}>
        <mesh geometry={geos.cross} material={roofMat()} />
        <mesh geometry={geos.crossEnd} material={sidingMat()} />
      </group>
      {/* Round attic vent in the front gable */}
      <mesh position={[0, EAVE_Y + 110, frontZ + 1]} material={mat(TRIM, { roughness: 0.5 })}>
        <circleGeometry args={[38, 32]} />
      </mesh>
      <mesh position={[0, EAVE_Y + 110, frontZ + 2]} material={mat("#5b6470", { roughness: 0.6 })}>
        <circleGeometry args={[30, 32]} />
      </mesh>
      {[-1050, -700].map((x) => (
        <Dormer key={x} x={x} />
      ))}
    </group>
  );
}

function Dormer({ x }: { x: number }) {
  const front = HOUSE.z1 + SHELL - 170;
  const geos = useMemo(() => ({ roof: gableSlopes(260, 200, 80, 150), end: gableEnds(220, 170, 80, 200) }), []);
  return (
    <group position={[x, EAVE_Y, front]}>
      <mesh position={[0, 115, -110]} material={sidingMat()}>
        <boxGeometry args={[170, 230, 220]} />
      </mesh>
      <B p={[0, 128, 0.5]} s={[90, 92, 2]} c={TRIM} />
      <mesh position={[0, 174, 2]} material={mat("#3d5568", { roughness: 0.1, metalness: 0.3 })}>
        <planeGeometry args={[74, 78]} />
      </mesh>
      <B p={[0, 135, 3]} s={[3, 78, 1]} c={TRIM} />
      <group position={[0, 230, -110]} rotation-y={Math.PI / 2}>
        <mesh geometry={geos.roof} material={roofMat()} />
        <mesh geometry={geos.end} material={sidingMat()} />
      </group>
    </group>
  );
}

function Chimney() {
  const top = EAVE_Y + ROOF_RISE + 70;
  return (
    <group position={[HOUSE.x1 + SHELL + 46, EXT_Y, 175]}>
      <mesh position={[0, (top - EXT_Y) / 2, 0]} material={brickMat()}>
        <boxGeometry args={[90, top - EXT_Y, 130]} />
      </mesh>
      <B p={[0, top - EXT_Y, 0]} s={[104, 10, 144]} c="#8a8076" />
      <C p={[0, top - EXT_Y + 10, 0]} r={14} h={22} c="#57534e" />
    </group>
  );
}

function Porch() {
  const z1 = HOUSE.z1 + SHELL;
  const roofY = GROUND_Y + 270;
  return (
    <group>
      <B p={[-800, EXT_Y, z1 + 90]} s={[420, GROUND_Y - EXT_Y, 180]} c="#cbc4b6" rough={0.9} />
      <B p={[-800, EXT_Y, z1 + 200]} s={[200, 27, 40]} c="#cbc4b6" rough={0.9} />
      <B p={[-800, EXT_Y, z1 + 235]} s={[200, 13, 30]} c="#cbc4b6" rough={0.9} />
      {[-990, -610].map((x) => (
        <group key={x}>
          <C p={[x, GROUND_Y, z1 + 165]} r={11} h={270} c={TRIM} seg={20} rough={0.5} />
          <B p={[x, GROUND_Y, z1 + 165]} s={[30, 12, 30]} c={TRIM} />
        </group>
      ))}
      <B p={[-800, roofY - 14, z1 + 165]} s={[420, 18, 18]} c={TRIM} />
      <mesh position={[-800, roofY + 30, z1 + 95]} rotation-x={0.3} material={roofMat()}>
        <boxGeometry args={[460, 6, 220]} />
      </mesh>
    </group>
  );
}

const GARAGE: Rect = { x0: -1904, x1: HOUSE.x0 - SHELL, z0: -150, z1: 600 };

function Garage() {
  const g = GARAGE;
  const top = GROUND_Y + 270;
  const geos = useMemo(() => {
    const walls = (["n", "s", "w"] as Side[]).map((side) => {
      const f = sideFrame(g, side, false, 0);
      const openings: WallOpening[] =
        side === "s" ? [{ u: f.toU((g.x0 + g.x1) / 2), w: 520, bottom: EXT_Y + 6, top: EXT_Y + 236 }] : side === "w" ? [{ u: f.toU(220), w: 100, bottom: GROUND_Y + 80, top: GROUND_Y + 190 }] : [];
      return { f, geos: wallPanels(f.length, EXT_Y, top, openings, 200) };
    });
    const d = g.z1 - g.z0;
    const w = g.x1 - g.x0;
    const rise = 150;
    return {
      walls,
      roof: gableSlopes(w + 2 * OVERHANG, d + 2 * OVERHANG, rise, 150),
      ends: gableEnds(w, d, rise, 200),
    };
  }, [g, top]);
  const cx = (g.x0 + g.x1) / 2;
  const cz = (g.z0 + g.z1) / 2;
  return (
    <group>
      {geos.walls.map(({ f, geos: gs }, i) => (
        <group key={i} position={f.position} rotation-y={f.rotation}>
          <Geoms geometries={gs} material={sidingMat()} />
        </group>
      ))}
      <mesh position={[cx, top, cz]} material={roofMat()} geometry={geos.roof} />
      <mesh position={[cx, top, cz]} material={sidingMat()} geometry={geos.ends} />
      {/* Ceiling so the roof void is closed from below */}
      <B p={[cx, top - 2, cz]} s={[g.x1 - g.x0, 2, g.z1 - g.z0]} c="#e7e2d6" />
      <mesh position={[cx, EXT_Y + 121, g.z1 - 4]}>
        <planeGeometry args={[520, 230]} />
        <meshStandardMaterial map={garageDoorTexture()} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <B key={s} p={[cx + s * 266, EXT_Y + 6, g.z1 + 2]} s={[12, 236, 4]} c={TRIM} />
      ))}
      <B p={[cx, EXT_Y + 236, g.z1 + 2]} s={[544, 14, 5]} c={TRIM} />
      {/* Garage side window glass */}
      <mesh position={[g.x0 - 1, GROUND_Y + 135, 220]} rotation-y={-Math.PI / 2} material={glassMat()}>
        <planeGeometry args={[100, 110]} />
      </mesh>
      {/* Coach lights */}
      {[-1, 1].map((s) => (
        <group key={s} position={[cx + s * 300, EXT_Y + 190, g.z1 + 8]}>
          <B p={[0, 0, 0]} s={[14, 26, 12]} c="#1f2937" />
          <B p={[0, 4, 1]} s={[10, 18, 10]} c="#fde68a" />
        </group>
      ))}
    </group>
  );
}

function Shrub({ p, r, c = "#3f7a34" }: { p: [number, number, number]; r: number; c?: string }) {
  return <S p={[p[0], p[1] + r * 0.6, p[2]]} r={r} c={c} scale={[1, 0.8, 1]} rough={0.9} />;
}

export function Tree({ p, scale = 1, seed = 1 }: { p: [number, number, number]; scale?: number; seed?: number }) {
  const blobs = useMemo(() => {
    const rand = seededRandom(seed);
    return Array.from({ length: 9 }, () => ({
      p: [(rand() - 0.5) * 300, 520 + rand() * 260, (rand() - 0.5) * 300] as [number, number, number],
      r: 150 + rand() * 90,
      c: rand() > 0.5 ? "#356b2b" : "#2c5d25",
    }));
  }, [seed]);
  return (
    <group position={p} scale={scale}>
      <C p={[0, 0, 0]} r={[22, 34]} h={560} c="#5b4330" seg={10} rough={0.95} />
      {blobs.map((b, i) => (
        <S key={i} p={b.p} r={b.r} c={b.c} rough={0.95} />
      ))}
    </group>
  );
}

function Flamingo({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  const pink = "#f472b6";
  return (
    <group position={p} rotation-y={r}>
      {[-6, 6].map((x) => (
        <C key={x} p={[x, 0, 0]} r={1.2} h={75} c="#1f2937" seg={6} />
      ))}
      <S p={[0, 90, 0]} r={22} c={pink} scale={[0.75, 0.75, 1.4]} rough={0.4} />
      <mesh position={[0, 118, 20]} rotation-x={-0.35} material={mat(pink, { roughness: 0.4 })}>
        <cylinderGeometry args={[3.5, 4.5, 50, 10]} />
      </mesh>
      <S p={[0, 146, 28]} r={8} c={pink} rough={0.4} />
      <mesh position={[0, 142, 40]} rotation-x={Math.PI / 2 + 0.5} material={mat("#111827")}>
        <coneGeometry args={[3, 14, 8]} />
      </mesh>
    </group>
  );
}

function Birdbath({ p }: { p: [number, number, number] }) {
  const stone = "#d6d0c4";
  return (
    <group position={p}>
      <C p={[0, 0, 0]} r={[30, 40]} h={14} c={stone} />
      <C p={[0, 14, 0]} r={[12, 18]} h={80} c={stone} />
      <C p={[0, 94, 0]} r={[60, 20]} h={18} c={stone} />
      <C p={[0, 108, 0]} r={52} h={3} c="#7cc8e8" rough={0.1} />
      <C p={[0, 112, 0]} r={[8, 12]} h={40} c={stone} />
      <S p={[0, 158, 0]} r={14} c={stone} />
    </group>
  );
}

function LoungeChair({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p} rotation-y={r}>
      <B p={[0, 25, 20]} s={[65, 6, 130]} c="#f6c533" rough={0.6} />
      <mesh position={[0, 55, -65]} rotation-x={-0.9} material={mat("#f6c533", { roughness: 0.6 })}>
        <boxGeometry args={[65, 6, 75]} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * 28, 0, sz * 55 + 10]} s={[3, 25, 3]} c="#e5e7eb" />))}
    </group>
  );
}

function Pool() {
  const center = new THREE.Vector2(-250, -1560);
  const geos = useMemo(() => {
    const outline = (rx: number, rz: number) => {
      const p = new THREE.Path();
      p.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
      return p;
    };
    const deck = new THREE.Shape();
    deck.moveTo(-480, -380);
    deck.lineTo(620, -380);
    deck.lineTo(620, 420);
    deck.lineTo(-480, 420);
    deck.closePath();
    deck.holes.push(outline(360, 215));
    const coping = new THREE.Shape();
    coping.absellipse(0, 0, 360, 215, 0, Math.PI * 2, false, 0);
    coping.holes.push(outline(335, 192));
    const water = new THREE.Shape();
    water.absellipse(0, 0, 335, 192, 0, Math.PI * 2, false, 0);
    return {
      deck: new THREE.ShapeGeometry(deck, 48),
      coping: new THREE.ShapeGeometry(coping, 64),
      water: new THREE.ShapeGeometry(water, 64),
    };
  }, []);
  const waterRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) waterRef.current.emissiveIntensity = 0.25 + Math.sin(clock.elapsedTime * 1.6) * 0.05;
  });
  return (
    <group position={[center.x, 0, center.y]}>
      <mesh geometry={geos.deck} rotation-x={-Math.PI / 2} position-y={EXT_Y + 10} material={mat("#ddd6c8", { roughness: 0.9 })} />
      <mesh geometry={geos.coping} rotation-x={-Math.PI / 2} position-y={EXT_Y + 12} material={mat("#f6f3ec", { roughness: 0.6 })} />
      <mesh geometry={geos.water} rotation-x={-Math.PI / 2} position-y={EXT_Y + 5}>
        <meshStandardMaterial ref={waterRef} color="#36b3e6" emissive="#2a9fd6" emissiveIntensity={0.25} roughness={0.05} metalness={0.1} />
      </mesh>
      <LoungeChair p={[480, EXT_Y + 10, -100]} r={Math.PI / 2 + 0.15} />
      <LoungeChair p={[480, EXT_Y + 10, 70]} r={Math.PI / 2 - 0.1} />
    </group>
  );
}

function Gazebo({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[360, 12, 360]} c="#c9b79c" />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * 160, 12, sz * 160]} s={[16, 250, 16]} c={TRIM} />))}
      <B p={[0, 255, 0]} s={[350, 18, 350]} c={TRIM} />
      <mesh position={[0, 273 + 75, 0]} rotation-y={Math.PI / 4} material={mat("#6b4f3a", { roughness: 0.85 })}>
        <coneGeometry args={[290, 150, 4]} />
      </mesh>
      <B p={[0, 12, -120]} s={[200, 45, 50]} c="#8a5a36" />
    </group>
  );
}

function Mailbox() {
  return (
    <group position={[-620, EXT_Y, HOUSE.z1 + SHELL + 280]}>
      <C p={[0, 0, 0]} r={3} h={90} c="#6b7280" />
      <B p={[0, 90, 0]} s={[28, 22, 44]} c="#1d4ed8" />
      <B p={[0, 104, 8]} s={[30, 4, 28]} c="#1e3a8a" />
      <B p={[0, 70, -4]} s={[18, 14, 2]} c="#f8fafc" />
    </group>
  );
}

function Bicycle() {
  return (
    <group position={[-980, EXT_Y, HOUSE.z1 + SHELL + 140]} rotation-y={0.5}>
      <C p={[-28, 0, 0]} r={18} h={3} c="#1f2937" seg={16} />
      <C p={[32, 0, 0]} r={18} h={3} c="#1f2937" seg={16} />
      <B p={[2, 28, 0]} s={[58, 4, 4]} c="#ef4444" />
      <B p={[-6, 40, 0]} s={[4, 28, 4]} c="#ef4444" />
      <B p={[4, 52, 0]} s={[22, 4, 10]} c="#111827" />
      <B p={[22, 36, 0]} s={[4, 4, 28]} c="#111827" />
    </group>
  );
}

function BasketHoop() {
  const x = (GARAGE.x0 + GARAGE.x1) / 2 + 320;
  const z = GARAGE.z1 + 80;
  return (
    <group position={[x, EXT_Y, z]}>
      <C p={[0, 0, 0]} r={6} h={280} c="#9ca3af" />
      <B p={[0, 280, 8]} s={[90, 60, 6]} c="#f8fafc" />
      <mesh position={[0, 258, 22]} rotation-x={Math.PI / 2} material={mat("#ea580c", { roughness: 0.4 })}>
        <torusGeometry args={[16, 1.6, 8, 20]} />
      </mesh>
    </group>
  );
}

function Yard() {
  const shrubs = useMemo(() => {
    const out: { p: [number, number, number]; r: number }[] = [];
    const z = HOUSE.z1 + SHELL + 45;
    for (let x = HOUSE.x0 + 40; x < HOUSE.x1; x += 85) {
      if (x > -1040 && x < -560) continue;
      out.push({ p: [x, EXT_Y, z], r: 34 + ((x * 7) % 11) });
    }
    return out;
  }, []);
  const concrete = once("drive-concrete", () => new THREE.MeshStandardMaterial({ map: concreteTexture(), color: "#e2ddd3", roughness: 0.9 }));
  return (
    <group>
      {/* Mulch bed along the front */}
      <B p={[(HOUSE.x0 + HOUSE.x1) / 2, EXT_Y, HOUSE.z1 + SHELL + 45]} s={[HOUSE.x1 - HOUSE.x0, 3, 80]} c="#5b3a24" rough={1} />
      {shrubs.map((s, i) => (
        <Shrub key={i} p={s.p} r={s.r} c={i % 3 ? "#3f7a34" : "#4d8b3c"} />
      ))}
      {/* Driveway and front walk */}
      <B p={[(GARAGE.x0 + GARAGE.x1) / 2, EXT_Y, (GARAGE.z1 + STREET.z0) / 2]} s={[560, 4, STREET.z0 - GARAGE.z1]} material={concrete} />
      <B p={[-800, EXT_Y, (HOUSE.z1 + 270 + STREET.z0 - STREET.sidewalk) / 2]} s={[100, 3, STREET.z0 - STREET.sidewalk - HOUSE.z1 - 270]} material={concrete} />
      {/* Back patio by the kitchen slider */}
      <B p={[-100, EXT_Y, -900]} s={[1000, 25, 360]} material={concrete} />
      <B p={[120, EXT_Y + 25, -760]} s={[260, 10, 70]} c="#cbc4b6" />
      {/* Patio table with umbrella */}
      <group position={[250, EXT_Y + 25, -950]}>
        <C p={[0, 0, 0]} r={45} h={72} c="#f8fafc" seg={24} rough={0.4} />
        <C p={[0, 72, 0]} r={2} h={150} c="#9ca3af" />
        <mesh position={[0, 215, 0]} material={mat("#16a34a", { roughness: 0.8 })}>
          <coneGeometry args={[150, 50, 8, 1, true]} />
        </mesh>
      </group>
      <Pool />
      <Gazebo p={[-1700, EXT_Y, -1550]} />
      <Birdbath p={[-1100, EXT_Y, -1250]} />
      <Flamingo p={[-1250, EXT_Y, -1150]} r={0.6} />
      <Flamingo p={[-1180, EXT_Y, -1090]} r={-0.4} />
      {[
        [-650, -760],
        [400, -760],
        [-1000, 800],
        [-600, 800],
      ].map(([x, z], i) => (
        <group key={i} position={[x, EXT_Y + (z < 0 ? 25 : 0), z]}>
          <C p={[0, 0, 0]} r={[30, 22]} h={50} c="#b4532a" rough={0.9} />
          <Shrub p={[0, 40, 0]} r={30} c="#4d8b3c" />
          <S p={[10, 80, 8]} r={8} c="#f43f5e" />
          <S p={[-12, 76, -4]} r={7} c="#fbbf24" />
        </group>
      ))}
      <Tree p={[250, EXT_Y, 1150]} seed={4} />
      <Tree p={[450, EXT_Y, -2050]} seed={9} scale={1.15} />
      <Tree p={[-2000, EXT_Y, -900]} seed={13} scale={0.9} />
      {/* Mailbox, bicycle, basketball hoop and scattered toys. */}
      <Mailbox />
      <Bicycle />
      <BasketHoop />
      <S p={[180, EXT_Y + 18, 780]} r={18} c="#ef4444" />
      <S p={[210, EXT_Y + 10, 800]} r={10} c="#facc15" />
      <group position={[-350, EXT_Y, 720]} rotation-y={0.4}>
        <B p={[0, 0, 0]} s={[70, 28, 42]} c="#c0392b" />
        <C p={[-28, 0, 22]} r={8} h={4} c="#1d1d1f" />
        <C p={[28, 0, 22]} r={8} h={4} c="#1d1d1f" />
        <C p={[-28, 0, -22]} r={8} h={4} c="#1d1d1f" />
        <C p={[28, 0, -22]} r={8} h={4} c="#1d1d1f" />
      </group>
      {/* Garden bed along the back fence */}
      <B p={[-750, EXT_Y, -2340]} s={[2600, 6, 90]} c="#5b3a24" rough={1} />
      {Array.from({ length: 22 }, (_, i) => (
        <Shrub key={i} p={[-1980 + i * 115, EXT_Y, -2340]} r={30 + (i % 3) * 8} c={["#4d8b3c", "#3f7a34", "#65a30d"][i % 3]} />
      ))}
    </group>
  );
}

/** Within this distance of a target inside Andy's room, the walls and roof are cut away like a dollhouse. */
const CUTAWAY_DISTANCE = 1300;

/**
 * Andy's house from the outside. The walls and roof only show when the camera is outside,
 * and are cut away while the camera is focused on Andy's room so the rug stays in view.
 */
export function HouseExterior() {
  const shell = useRef<THREE.Group>(null);
  const trims = useMemo(() => APERTURES.map((a, i) => <ApertureTrim key={i} a={a} />), []);
  const visibleBeforeFlight = useRef(false);
  useFrame(({ camera, controls }) => {
    if (!shell.current) return;
    const { mode, flight } = useStore.getState();
    const toyOutside = isOutsideHouse(runtime.toy) || onAndyRoof(runtime.toy);
    let visible = (mode === "room" || mode === "house" || mode === "transition") && isOutsideHouse(camera.position);
    if (mode === "toy") {
      visible = toyOutside;
      visibleBeforeFlight.current = visible;
    } else if (mode === "transition") {
      // A flight that starts in the cutaway keeps it, unless it is flying out to the street view or a toy outside.
      visible &&= visibleBeforeFlight.current || flight?.kind === "house" || (flight?.kind === "toy" && toyOutside);
    } else {
      const target = (controls as { target?: THREE.Vector3 } | null)?.target;
      if (visible && target && inRect(target, ANDY_ROOM, 60) && camera.position.distanceTo(target) < CUTAWAY_DISTANCE) visible = false;
      visibleBeforeFlight.current = visible;
    }
    shell.current.visible = visible;
    runtime.houseShellVisible = visible;
  });
  return (
    <group>
      <Enterable l={landmarkById.andy} world>
        <group ref={shell}>
          <Facades />
          {trims}
          <TrimBands />
          <Roofs />
          <Chimney />
          <Porch />
        </group>
        <Garage />
      </Enterable>
      <Yard />
    </group>
  );
}
