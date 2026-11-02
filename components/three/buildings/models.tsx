"use client";

import { memo, useMemo } from "react";
import * as THREE from "three";
import { COLORS, glassMat, mat } from "@/lib/three/materials";
import type { BuildingDef } from "@/lib/world/types";
import { CarModel } from "../CarModel";
import {
  Awning,
  Box,
  Cyl,
  Door,
  facadeWindows,
  FlagPole,
  FlatRoof,
  GableRoof,
  HipRoof,
  Planter,
  Sign,
  Windows,
  type WindowItem,
} from "./parts";

const darken = (hex: string, f: number) => "#" + new THREE.Color(hex).multiplyScalar(f).getHexString();

function House({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const wallH = 5.5;
  const color = b.color ?? "#f1dcc0";
  const roof = b.roofColor ?? "#a0442f";
  const windows = useMemo<WindowItem[]>(
    () => [
      { x: -3, y: 2.7, z: d / 2, rot: 0, w: 1.6, h: 1.5 },
      { x: 3.4, y: 2.7, z: d / 2, rot: 0, w: 1.6, h: 1.5 },
      ...facadeWindows({ w, d, floors: 1, floorH: wallH, winW: 1.3, winH: 1.4, spacing: 4.5, sides: ["back", "left", "right"] }),
    ],
    [w, d],
  );
  return (
    <group>
      <Box size={[w, 0.5, d]} position={[0, 0.25, 0]} color="#b9b2a5" />
      <Box size={[w, wallH, d]} position={[0, wallH / 2, 0]} color={color} />
      <GableRoof w={w} d={d} h={3.5} y={wallH} color={roof} ridge="x" />
      <Box size={[0.9, 2.6, 0.9]} position={[w * 0.28, wallH + 2.2, -1.3]} material={mat("#a85a44", { map: "brick" })} />
      <Windows items={windows} />
      <Door x={0.2} z={d / 2} color={darken(roof, 0.9)} />
      {/* Porch canopy */}
      <Box size={[2.4, 0.15, 1.3]} position={[0.2, 3.05, d / 2 + 0.65]} color={COLORS.trim} />
      {/* Garden path */}
      <Box size={[1.2, 0.06, 3]} position={[0.2, 0.03, d / 2 + 2.2]} color="#d6cbb8" cast={false} />
      <Planter position={[-3, 0, d / 2 + 0.7]} w={2.4} d={0.7} />
    </group>
  );
}

function Home({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const wallH = 6;
  const main = w - 4;
  const windows = useMemo<WindowItem[]>(
    () =>
      [
        ...facadeWindows({ w: main, d, floors: 1, floorH: wallH, winW: 1.5, winH: 1.6, spacing: 3.4, skipFront: [-1.4, 1.4] }),
      ].map((it) => ({ ...it, x: it.x - 2 })),
    [main, d],
  );
  return (
    <group>
      <Box size={[w, 0.5, d]} position={[0, 0.25, 0]} color="#b9b2a5" />
      <group position={[-2, 0, 0]}>
        <Box size={[main, wallH, d]} position={[0, wallH / 2, 0]} color={b.color ?? "#fff4dc"} />
        <GableRoof w={main} d={d} h={4} y={wallH} color={b.roofColor ?? "#c0392b"} ridge="x" />
        <Box size={[1, 2.6, 1]} position={[-2.4, wallH + 2.4, -1.5]} material={mat("#a85a44", { map: "brick" })} />
        <Door x={0} z={d / 2} color="#1d4ed8" />
        <Box size={[3, 0.15, 1.6]} position={[0, 3.1, d / 2 + 0.8]} color={COLORS.trim} />
        {[-1.3, 1.3].map((x) => (
          <Cyl key={x} r={0.1} h={3} position={[x, 1.5, d / 2 + 1.5]} color={COLORS.trim} segments={8} />
        ))}
      </group>
      <Windows items={windows} />
      {/* Garage */}
      <group position={[w / 2 - 2, 0, 0.5]}>
        <Box size={[4, 4, d - 1]} position={[0, 2, 0]} color={darken(b.color ?? "#fff4dc", 0.94)} />
        <GableRoof w={4} d={d - 1} h={1.6} y={4} color={b.roofColor ?? "#c0392b"} ridge="z" overhang={0.3} />
        <Box size={[3, 2.8, 0.1]} position={[0, 1.45, (d - 1) / 2 + 0.03]} color="#e5e7eb" cast={false} />
        {[0.5, 1.1, 1.7, 2.3].map((y) => (
          <Box key={y} size={[3, 0.05, 0.06]} position={[0, y, (d - 1) / 2 + 0.1]} color="#9ca3af" cast={false} />
        ))}
        <Box size={[3.4, 0.06, 4]} position={[0, 0.03, (d - 1) / 2 + 2]} color="#a8a29e" cast={false} />
      </group>
      {/* White picket fence */}
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={i} size={[0.14, 1, 0.14]} position={[-w / 2 + 0.4 + i * 0.75, 0.5, d / 2 + 3.6]} color="#ffffff" />
      ))}
      <Box size={[6.4, 0.12, 0.08]} position={[-w / 2 + 3.4, 0.75, d / 2 + 3.6]} color="#ffffff" />
      <Sign text="HOME" w={2.2} h={0.8} position={[-w / 2 + 1.6, 1.9, d / 2 + 3.7]} bg="#ef4444" fg="#ffffff" />
      {/* Mailbox */}
      <Cyl r={0.06} h={1.1} position={[1.6, 0.55, d / 2 + 3.6]} color="#4b5563" segments={6} />
      <Box size={[0.4, 0.35, 0.6]} position={[1.6, 1.25, d / 2 + 3.6]} color="#1d4ed8" />
    </group>
  );
}

function Apartment({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const floors = 4;
  const fh = 3.2;
  const H = floors * fh;
  const color = b.color ?? "#e7c9a5";
  const windows = useMemo(
    () => facadeWindows({ w, d, floors, floorH: fh, baseY: 0.4, winW: 1.4, winH: 1.7, spacing: 3.2, skipFront: [-2, 2] }),
    [w, d],
  );
  const balconies = windows.filter((it) => it.z === d / 2 && it.y > fh);
  return (
    <group>
      <Box size={[w, 0.4, d]} position={[0, 0.2, 0]} color="#9ca3af" />
      <Box size={[w, H, d]} position={[0, 0.4 + H / 2, 0]} color={color} />
      <Box size={[w + 0.1, fh * 0.9, d + 0.1]} position={[0, 0.4 + fh * 0.45, 0]} color={darken(color, 0.82)} />
      {Array.from({ length: floors - 1 }, (_, i) => (
        <Box key={i} size={[w + 0.25, 0.18, d + 0.25]} position={[0, 0.4 + (i + 1) * fh, 0]} color={COLORS.trim} />
      ))}
      <Windows items={windows} />
      {balconies.map((it, i) => (
        <group key={i} position={[it.x, it.y - it.h / 2 - 0.25, d / 2]}>
          <Box size={[2.2, 0.15, 1]} position={[0, 0, 0.5]} color="#e5e7eb" />
          <mesh position={[0, 0.5, 1]} material={mat("#bfdbfe", { transparent: true, opacity: 0.45, roughness: 0.1 })}>
            <boxGeometry args={[2.2, 0.9, 0.05]} />
          </mesh>
          <Box size={[2.2, 0.06, 0.08]} position={[0, 0.96, 1]} color="#6b7280" cast={false} />
        </group>
      ))}
      <Door x={0} z={d / 2} w={2} h={2.5} glass y={0.4} />
      <Box size={[3.6, 0.2, 2]} position={[0, 3.2, d / 2 + 1]} color="#374151" />
      <FlatRoof w={w} d={d} y={0.4 + H} color="#6b7280" />
      <Box size={[2.6, 1.6, 2]} position={[-w / 4, 0.4 + H + 1, -1]} color="#d1d5db" />
      <Cyl r={1} h={2} position={[w / 4, 0.4 + H + 1.2, 1]} color="#9ca3af" />
      <Sign text={b.name.toUpperCase()} w={6} h={0.7} position={[0, 0.4 + fh - 0.35, d / 2 + 0.1]} bg="#1f2937" fg="#ffffff" />
    </group>
  );
}

function School({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 8;
  const windows = useMemo(
    () => facadeWindows({ w, d, floors: 2, floorH: 4, winW: 1.8, winH: 2, spacing: 3.2, skipFront: [-3.5, 3.5] }),
    [w, d],
  );
  const brick = mat("#ffffff", { map: "brick" });
  return (
    <group>
      <Box size={[w + 1, 0.4, d + 1]} position={[0, 0.2, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} material={brick} />
      <Box size={[w + 0.2, 0.3, d + 0.2]} position={[0, 4, 0]} color="#f5f5f4" />
      <HipRoof w={w} d={d} h={2.4} y={H} color="#57534e" overhang={0.6} />
      <Windows items={windows} />
      {/* Clock tower */}
      <group position={[0, 0, d / 2 - 2]}>
        <Box size={[6, 12, 5]} position={[0, 6, 0]} material={brick} />
        <HipRoof w={6} d={5} h={3} y={12} color="#3f3f46" overhang={0.4} />
        <mesh position={[0, 10, 2.56]} material={mat("#fffbeb")}>
          <circleGeometry args={[1.3, 32]} />
        </mesh>
        <mesh position={[0, 10, 2.53]} material={mat("#78350f")}>
          <circleGeometry args={[1.45, 32]} />
        </mesh>
        <Box size={[0.12, 1, 0.05]} position={[0, 10.45, 2.6]} color="#111827" cast={false} />
        <Box size={[0.7, 0.12, 0.05]} position={[0.3, 10, 2.6]} color="#111827" cast={false} />
        <Sign text="SCHOOL" w={4.6} h={1} position={[0, 6.4, 2.6]} bg="#ca8a04" fg="#ffffff" />
        <Door x={-0.8} z={2.5} w={1.4} h={3} glass />
        <Door x={0.8} z={2.5} w={1.4} h={3} glass />
        <Box size={[4.4, 0.2, 1.6]} position={[0, 3.6, 3.3]} color="#f5f5f4" />
      </group>
      <FlagPole position={[w / 2 - 1, 0, d / 2 + 2.5]} color="#dc2626" h={9} />
      {/* Bike rack */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-w / 2 + 3 + i * 0.7, 0.5, d / 2 + 2]} rotation-y={Math.PI / 2} material={mat("#6b7280", { metalness: 0.7, roughness: 0.3 })}>
          <torusGeometry args={[0.45, 0.05, 6, 16, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
}

function Bank({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 7;
  const stone = mat("#efe8da", { roughness: 0.6 });
  const windows = useMemo(
    () => facadeWindows({ w, d, floors: 1, floorH: H, winW: 1.2, winH: 3.2, spacing: 3, sides: ["left", "right", "back"] }),
    [w, d],
  );
  const cols = [-4.5, -1.5, 1.5, 4.5];
  return (
    <group>
      <Box size={[w + 1, 0.6, d + 1]} position={[0, 0.3, 0]} color="#d6cfc0" />
      <Box size={[w, H, d]} position={[0, 0.6 + H / 2, 0]} material={stone} />
      <Windows items={windows.map((it) => ({ ...it, y: it.y + 0.6 }))} frameColor="#d6cfc0" />
      {/* Steps */}
      {[0, 1, 2].map((i) => (
        <Box key={i} size={[w - 1 - i * 0.6, 0.25, 3.4 - i * 0.7]} position={[0, 0.12 + i * 0.25, d / 2 + 1.7 - i * 0.35]} color="#e7e1d4" />
      ))}
      {/* Portico */}
      {cols.map((x) => (
        <group key={x} position={[x, 0.75, d / 2 + 1.4]}>
          <Cyl r={0.42} h={5.6} position={[0, 2.8, 0]} material={stone} segments={20} />
          <Box size={[1.1, 0.25, 1.1]} position={[0, 5.7, 0]} color="#e7e1d4" />
          <Box size={[1.1, 0.25, 1.1]} position={[0, 0.12, 0]} color="#e7e1d4" />
        </group>
      ))}
      <Box size={[w, 1, 3.4]} position={[0, 7.1, d / 2 + 1.1]} material={stone} />
      <group position={[0, 7.6, d / 2 + 1.1]}>
        <GableRoof w={w} d={3.4} h={2} y={0} color="#e7e1d4" ridge="z" overhang={0.15} textured={false} />
      </group>
      <Sign text="BANK" w={4} h={0.75} position={[0, 7.1, d / 2 + 2.82]} bg="#065f46" fg="#fef3c7" />
      <Door x={0} z={d / 2} w={2.2} h={3.6} color="#8a6a2f" y={0.6} />
      <FlatRoof w={w} d={d} y={0.6 + H} color="#cfc7b6" trim="#e7e1d4" />
      {/* Gold dome accent */}
      <mesh position={[0, 0.6 + H + 0.3, -1]} material={mat("#d4af37", { metalness: 0.8, roughness: 0.3 })} castShadow>
        <sphereGeometry args={[1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

function Church({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 9;
  const stone = mat("#f1ebe0", { roughness: 0.7 });
  const nave = d - 6;
  const stained = useMemo(() => ["#7c3aed", "#2563eb", "#dc2626", "#059669"], []);
  return (
    <group>
      <Box size={[w + 1, 0.4, d + 1]} position={[0, 0.2, 0]} color="#b8b0a2" />
      {/* Nave */}
      <group position={[0, 0, -3]}>
        <Box size={[w, H, nave]} position={[0, H / 2, 0]} material={stone} />
        <GableRoof w={w} d={nave} h={7} y={H} color="#3f4652" ridge="z" overhang={0.6} />
        {[-1, 1].map((side) =>
          [-6, -2, 2, 6].map((z, i) => (
            <group key={`${side}${z}`} position={[side * (w / 2 + 0.05), 4.8, z]} rotation-y={side * (Math.PI / 2)}>
              <mesh material={mat(stained[i % 4], { emissive: stained[i % 4], emissiveIntensity: 0.35, roughness: 0.2 })}>
                <boxGeometry args={[1.1, 3.6, 0.1]} />
              </mesh>
              <mesh position={[0, 1.8, 0]} rotation-x={-Math.PI / 2} material={mat(stained[i % 4], { emissive: stained[i % 4], emissiveIntensity: 0.35 })}>
                <cylinderGeometry args={[0.55, 0.55, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
              </mesh>
              {/* Buttress */}
              <Box size={[0.8, 5, 0.8]} position={[2, -2.3, 0.3]} material={stone} />
            </group>
          )),
        )}
      </group>
      {/* Tower */}
      <group position={[0, 0, d / 2 - 3]}>
        <Box size={[6.4, 18, 6]} position={[0, 9, 0]} material={stone} />
        <Box size={[6.8, 0.5, 6.4]} position={[0, 18, 0]} color="#e2dccf" />
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
          <group key={r} rotation-y={r}>
            <Box size={[1.6, 2.6, 0.1]} position={[0, 15.4, 3.02]} color="#1f2937" cast={false} />
            <mesh position={[0, 16.7, 3.02]} rotation-x={-Math.PI / 2} material={mat("#1f2937")}>
              <cylinderGeometry args={[0.8, 0.8, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 18.25 + 5, 0]} rotation-y={Math.PI / 4} material={mat("#3f4652", { roughness: 0.7, map: "shingle" })} castShadow>
          <coneGeometry args={[4.2, 10, 4]} />
        </mesh>
        <Box size={[0.25, 2.2, 0.25]} position={[0, 29.4, 0]} color="#d4af37" />
        <Box size={[1.2, 0.25, 0.25]} position={[0, 29.8, 0]} color="#d4af37" />
        {/* Rose window */}
        <mesh position={[0, 10.5, 3.03]} material={mat("#7c3aed", { emissive: "#a78bfa", emissiveIntensity: 0.5, roughness: 0.2 })}>
          <circleGeometry args={[1.5, 32]} />
        </mesh>
        <mesh position={[0, 10.5, 3.02]} material={mat("#e2dccf")}>
          <ringGeometry args={[1.5, 1.85, 32]} />
        </mesh>
        {/* Arched door */}
        <Box size={[2.2, 3.4, 0.12]} position={[0, 1.9, 3.03]} color="#6b3f1f" cast={false} />
        <mesh position={[0, 3.6, 3.03]} rotation-x={-Math.PI / 2} material={mat("#6b3f1f")}>
          <cylinderGeometry args={[1.1, 1.1, 0.12, 20, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
        <Box size={[3.4, 0.25, 1.6]} position={[0, 0.5, 3.8]} color="#d6cfc0" />
      </group>
    </group>
  );
}

function Police({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 7.6;
  const windows = useMemo(
    () => facadeWindows({ w, d, floors: 2, floorH: 3.8, winW: 1.6, winH: 1.6, spacing: 3, skipFront: [-3, 3] }),
    [w, d],
  );
  return (
    <group>
      <Box size={[w + 1, 0.4, d + 1]} position={[0, 0.2, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} color="#e8edf3" />
      <Box size={[w + 0.2, 0.6, d + 0.2]} position={[0, 3.8, 0]} color="#1d4ed8" />
      <Box size={[w + 0.1, 0.8, d + 0.1]} position={[0, 0.4, 0]} color="#475569" />
      <Windows items={windows} frameColor="#cbd5e1" />
      <Door x={-0.9} z={d / 2} w={1.6} h={2.8} glass />
      <Door x={0.9} z={d / 2} w={1.6} h={2.8} glass />
      <Box size={[6, 0.25, 2.2]} position={[0, 3.3, d / 2 + 1.1]} color="#1e3a8a" />
      {[-2.7, 2.7].map((x) => (
        <Cyl key={x} r={0.12} h={3.2} position={[x, 1.6, d / 2 + 2]} color="#e5e7eb" segments={8} />
      ))}
      <Sign text="POLICE" w={6} h={1.2} position={[0, 5.6, d / 2 + 0.12]} bg="#1d4ed8" fg="#ffffff" />
      <FlatRoof w={w} d={d} y={H} color="#64748b" trim="#cbd5e1" />
      {/* Roof light bar */}
      <Box size={[0.8, 0.5, 0.8]} position={[-w / 2 + 1.2, H + 0.85, d / 2 - 1.2]} material={mat("#2563eb", { emissive: "#3b82f6", emissiveIntensity: 2 })} />
      <Box size={[0.8, 0.5, 0.8]} position={[w / 2 - 1.2, H + 0.85, d / 2 - 1.2]} material={mat("#dc2626", { emissive: "#ef4444", emissiveIntensity: 2 })} />
      <Box size={[3, 2, 2]} position={[3, H + 1, -2]} color="#cbd5e1" />
      <FlagPole position={[-w / 2 + 1, 0, d / 2 + 3]} color="#1d4ed8" h={8} />
      <group position={[w / 2 - 2.6, 0, d / 2 + 3.4]} rotation-y={Math.PI / 2}>
        <CarModel color="#f8fafc" variant="police" />
      </group>
    </group>
  );
}

const FIRE_DOORS_X = [-6, 0, 6];

function FireStation({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 8;
  const brick = mat("#ffffff", { map: "brick" });
  const windows = useMemo(
    () => facadeWindows({ w, d, floors: 2, floorH: 4, winW: 1.5, winH: 1.5, spacing: 3.2, sides: ["back", "left", "right"] }),
    [w, d],
  );
  const upper = useMemo<WindowItem[]>(() => FIRE_DOORS_X.map((x) => ({ x, y: 6.6, z: d / 2, rot: 0, w: 2.6, h: 1.3 })), [d]);
  return (
    <group>
      <Box size={[w + 1, 0.4, d + 1]} position={[0, 0.2, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} material={brick} />
      <Windows items={[...windows, ...upper]} />
      {FIRE_DOORS_X.map((x) => (
        <group key={x} position={[x, 0, d / 2]}>
          <Box size={[4.9, 5.5, 0.2]} position={[0, 2.75, 0.05]} color="#f5f5f4" cast={false} />
          <Box size={[4.4, 5.1, 0.12]} position={[0, 2.6, 0.13]} color="#b91c1c" cast={false} />
          {[1, 2, 3, 4].map((k) => (
            <Box key={k} size={[4.4, 0.06, 0.05]} position={[0, k * 1.05, 0.21]} color="#7f1d1d" cast={false} />
          ))}
          <mesh position={[0, 3.2, 0.2]} material={glassMat()}>
            <boxGeometry args={[3.8, 0.6, 0.04]} />
          </mesh>
        </group>
      ))}
      <Sign text="FIRE STATION" w={9} h={1} position={[0, 7.6, d / 2 + 0.12]} bg="#b91c1c" fg="#ffffff" />
      <FlatRoof w={w} d={d} y={H} color="#57534e" trim="#e7e5e4" />
      {/* Hose tower */}
      <group position={[-w / 2 + 2.2, 0, -d / 2 + 2.2]}>
        <Box size={[4.4, 14.2, 4.4]} position={[0, 7.1, 0]} material={brick} />
        <Box size={[5, 0.5, 5]} position={[0, 14.4, 0]} color="#e7e5e4" />
        <Box size={[1, 2, 0.1]} position={[0, 12.5, 2.25]} color="#1f2937" cast={false} />
      </group>
      {/* Siren */}
      <Cyl r={0.35} h={0.8} position={[w / 2 - 2, H + 0.6, 0]} color="#ef4444" />
      <Box size={[w, 0.05, 3]} position={[0, 0.03, d / 2 + 1.5]} color="#d6d3d1" cast={false} />
    </group>
  );
}

function Coffee({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 4.5;
  return (
    <group>
      <Box size={[w + 0.6, 0.35, d + 0.6]} position={[0, 0.17, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} color="#f5e6d3" />
      <Box size={[w + 0.1, 1, d + 0.1]} position={[0, 0.5, 0]} color="#7c4a2d" />
      <mesh position={[-1.8, 2.2, d / 2 + 0.06]} material={glassMat()}>
        <boxGeometry args={[6.6, 2.4, 0.1]} />
      </mesh>
      <Box size={[6.9, 0.2, 0.2]} position={[-1.8, 3.45, d / 2 + 0.06]} color="#5b3a29" />
      <Door x={3.6} z={d / 2} w={1.4} h={2.6} glass />
      <Awning w={w - 0.6} y={3.95} z={d / 2} a="#7c4a2d" b="#fdf3e1" />
      <Sign text="COFFEE" w={4.2} h={0.8} position={[0, 4.15, d / 2 + 0.1]} bg="#3f2a1d" fg="#fde68a" />
      <FlatRoof w={w} d={d} y={H} color="#78716c" trim="#e7e5e4" />
      {/* Giant cup on the roof */}
      <group position={[2, H + 0.2, -0.6]}>
        <Cyl r={1.6} h={0.2} position={[0, 0.1, 0]} color="#ffffff" segments={24} />
        <Cyl r={0.9} rTop={1.2} h={1.9} position={[0, 1.15, 0]} color="#ffffff" segments={24} />
        <mesh position={[0, 2.08, 0]} rotation-x={-Math.PI / 2} material={mat("#5b3a29")}>
          <circleGeometry args={[1.1, 24]} />
        </mesh>
        <mesh position={[1.15, 1.2, 0]} material={mat("#ffffff")} castShadow>
          <torusGeometry args={[0.45, 0.13, 8, 16]} />
        </mesh>
      </group>
      {/* Patio tables */}
      {[-3.6, 0.2].map((x) => (
        <group key={x} position={[x, 0, d / 2 + 2.8]}>
          <Cyl r={0.6} h={0.08} position={[0, 1, 0]} color="#e7e5e4" />
          <Cyl r={0.06} h={1} position={[0, 0.5, 0]} color="#44403c" segments={6} />
          <Cyl r={0.05} h={2.6} position={[0, 1.3, 0]} color="#44403c" segments={6} />
          <mesh position={[0, 2.5, 0]} material={mat(x < 0 ? "#b45309" : "#15803d", { side: THREE.DoubleSide })} castShadow>
            <coneGeometry args={[1.5, 0.7, 8, 1, true]} />
          </mesh>
          {[-0.95, 0.95].map((cx) => (
            <Box key={cx} size={[0.5, 0.6, 0.5]} position={[cx, 0.3, 0]} color="#78350f" />
          ))}
        </group>
      ))}
    </group>
  );
}

function Supermarket({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 6.5;
  const panes = useMemo(() => Array.from({ length: 9 }, (_, i) => -w / 2 + 2.2 + i * ((w - 4.4) / 8)), [w]);
  return (
    <group>
      <Box size={[w + 1, 0.35, d + 1]} position={[0, 0.17, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} color="#f1f1ea" />
      <Box size={[w + 0.15, 1, d + 0.15]} position={[0, H - 0.5, 0]} color="#16a34a" />
      <mesh position={[0, 1.8, d / 2 + 0.06]} material={glassMat()}>
        <boxGeometry args={[w - 3, 3.2, 0.1]} />
      </mesh>
      {panes.map((x) => (
        <Box key={x} size={[0.15, 3.3, 0.18]} position={[x, 1.8, d / 2 + 0.1]} color="#e5e7eb" cast={false} />
      ))}
      <Box size={[8, 0.3, 3]} position={[0, 3.7, d / 2 + 1.5]} color="#15803d" />
      {[-3.6, 3.6].map((x) => (
        <Cyl key={x} r={0.15} h={3.6} position={[x, 1.8, d / 2 + 2.8]} color="#e5e7eb" segments={8} />
      ))}
      <Sign text="FRESHMART" w={12} h={1.8} position={[0, H + 1.1, d / 2 - 0.4]} bg="#16a34a" fg="#ffffff" border="#fef08a" />
      <FlatRoof w={w} d={d} y={H} color="#9ca3af" trim="#e5e7eb" />
      {[-9, -4, 6].map((x) => (
        <Box key={x} size={[2.6, 1.4, 2.4]} position={[x, H + 0.7, -2]} color="#d1d5db" />
      ))}
      {/* Cart corral */}
      <group position={[w / 2 - 3, 0, d / 2 + 2.5]}>
        {[0, 0.5, 1, 1.5].map((z) => (
          <Box key={z} size={[0.9, 0.7, 0.45]} position={[0, 0.55, z]} material={mat("#94a3b8", { metalness: 0.6, roughness: 0.4 })} />
        ))}
      </group>
      {/* Loading dock */}
      <Box size={[6, 3.4, 0.2]} position={[-w / 4, 1.7, -d / 2 - 0.05]} color="#9ca3af" cast={false} />
    </group>
  );
}

function GasStation({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const canopyY = 5;
  return (
    <group>
      <Box size={[w, 0.12, d]} position={[0, 0.06, 0]} material={mat("#c9c5bc", { map: "concrete" })} cast={false} />
      {/* Kiosk */}
      <group position={[0, 0, -6]}>
        <Box size={[10, 3.8, 5]} position={[0, 1.9, 0]} color="#fff7ed" />
        <Box size={[10.1, 0.8, 5.1]} position={[0, 3.4, 0]} color="#ea580c" />
        <mesh position={[-1.5, 1.5, 2.56]} material={glassMat()}>
          <boxGeometry args={[5, 2, 0.08]} />
        </mesh>
        <Door x={2.8} z={2.5} w={1.4} h={2.4} glass />
        <Sign text="MARKET" w={3.4} h={0.6} position={[0, 3.4, 2.62]} bg="#ea580c" fg="#ffffff" />
        <FlatRoof w={10} d={5} y={3.8} color="#78716c" parapet={0.3} />
      </group>
      {/* Canopy */}
      <group position={[0, 0, 2]}>
        <Box size={[16, 0.6, 9]} position={[0, canopyY + 0.3, 0]} color="#fafafa" />
        <Box size={[16.2, 0.45, 9.2]} position={[0, canopyY + 0.1, 0]} color="#f97316" />
        {[
          [-6, -3],
          [6, -3],
          [-6, 3],
          [6, 3],
        ].map(([x, z]) => (
          <Cyl key={`${x}${z}`} r={0.22} h={canopyY} position={[x, canopyY / 2, z]} color="#e5e7eb" segments={10} />
        ))}
        {[-4.5, 4.5].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box size={[1.2, 0.25, 3.4]} position={[0, 0.12, 0]} color="#d6d3d1" />
            {[-0.9, 0.9].map((z) => (
              <group key={z} position={[0, 0.25, z]}>
                <Box size={[0.7, 1.6, 0.5]} position={[0, 0.8, 0]} color="#ef4444" />
                <mesh position={[0, 1.15, 0.26]} material={mat("#0f172a", { emissive: "#38bdf8", emissiveIntensity: 0.6 })}>
                  <planeGeometry args={[0.45, 0.3]} />
                </mesh>
                <Box size={[0.08, 0.6, 0.08]} position={[0.4, 0.8, 0]} color="#111827" />
              </group>
            ))}
          </group>
        ))}
      </group>
      {/* Price pylon */}
      <group position={[w / 2 - 1.5, 0, d / 2 - 1.5]}>
        <Box size={[0.5, 6, 0.5]} position={[0, 3, 0]} color="#e5e7eb" />
        <Box size={[2.6, 3.4, 0.4]} position={[0, 7, 0]} color="#f97316" />
        <Sign text="FUEL" w={2.2} h={0.9} position={[0, 7.9, 0.21]} bg="#ffffff" fg="#ea580c" doubleSided />
        <Sign text="1.99" w={2.2} h={1.2} position={[0, 6.5, 0.21]} bg="#111827" fg="#facc15" doubleSided />
      </group>
    </group>
  );
}

const AWNINGS: Record<string, [string, string]> = {
  POST: ["#1d4ed8", "#fef3c7"],
  TOYS: ["#db2777", "#fdf2f8"],
  BAKERY: ["#b45309", "#fff7ed"],
  FLOWERS: ["#16a34a", "#f0fdf4"],
  PIZZA: ["#dc2626", "#ffffff"],
};

function Shop({ b }: { b: BuildingDef }) {
  const { w, d } = b;
  const H = 4.6;
  const sign = b.signText ?? "SHOP";
  const [a, c] = AWNINGS[sign] ?? ["#7c3aed", "#f5f3ff"];
  const windows = useMemo(
    () => facadeWindows({ w, d, floors: 1, floorH: H, winW: 1.2, winH: 1.3, spacing: 3.4, sides: ["left", "right", "back"] }),
    [w, d],
  );
  return (
    <group>
      <Box size={[w + 0.4, 0.3, d + 0.4]} position={[0, 0.15, 0]} color="#a8a29e" />
      <Box size={[w, H, d]} position={[0, H / 2, 0]} color={b.color ?? "#f5f5f4"} />
      <Windows items={windows} />
      <mesh position={[-w * 0.15, 1.9, d / 2 + 0.06]} material={glassMat()}>
        <boxGeometry args={[w * 0.55, 2.2, 0.1]} />
      </mesh>
      <Door x={w * 0.3} z={d / 2} w={1.3} h={2.5} glass />
      <Awning w={w - 0.4} y={3.6} z={d / 2} a={a} b={c} depth={1.3} />
      <Sign text={sign} w={Math.min(w - 1.2, 5)} h={0.8} position={[0, 4.15, d / 2 + 0.1]} bg={a} fg="#ffffff" />
      <FlatRoof w={w} d={d} y={H} color="#a8a29e" trim={a} parapet={0.8} />
      <Box size={[1.6, 1, 1.4]} position={[-w / 4, H + 0.5, -d / 6]} color="#d6d3d1" />
      {sign === "FLOWERS" &&
        [-1.2, -0.4, 0.4].map((x, i) => (
          <mesh key={x} position={[x - w * 0.15, 0.45, d / 2 + 0.7]} material={mat(["#f43f5e", "#facc15", "#a855f7"][i])} castShadow>
            <sphereGeometry args={[0.35, 10, 8]} />
          </mesh>
        ))}
    </group>
  );
}

export const BuildingModel = memo(function BuildingModel({ b }: { b: BuildingDef }) {
  switch (b.type) {
    case "house":
      return <House b={b} />;
    case "home":
      return <Home b={b} />;
    case "apartment":
      return <Apartment b={b} />;
    case "school":
      return <School b={b} />;
    case "bank":
      return <Bank b={b} />;
    case "church":
      return <Church b={b} />;
    case "police":
      return <Police b={b} />;
    case "fire":
      return <FireStation b={b} />;
    case "coffee":
      return <Coffee b={b} />;
    case "supermarket":
      return <Supermarket b={b} />;
    case "gas":
      return <GasStation b={b} />;
    case "shop":
      return <Shop b={b} />;
  }
});
