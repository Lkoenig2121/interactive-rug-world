"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { glassMat, mat } from "@/lib/three/materials";
import { labelTexture } from "@/lib/three/textures";
import { useStore } from "@/lib/store";
import { seededRandom } from "@/lib/world/geometry";
import type { FurnitureItem } from "@/lib/world/interiors";
import { Box, Cyl } from "../buildings/parts";
import { InstancedParts, placement } from "../Instanced";

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitSphere = new THREE.SphereGeometry(1, 10, 8);
const PRODUCT_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#f97316", "#facc15", "#ec4899", "#14b8a6", "#e5e7eb"];

function useToggle(id?: string) {
  return useStore((s) => (id ? !!s.interiorToggles[id] : false));
}

function Legs({ w, d, h, inset = 0.06, color = "#3f3f46", r = 0.03 }: { w: number; d: number; h: number; inset?: number; color?: string; r?: number }) {
  return (
    <>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Cyl key={`${sx}${sz}`} r={r} h={h} position={[sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset)]} color={color} segments={6} />
      ))}
    </>
  );
}

function Computer({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <Box size={[0.08, 0.3, 0.08]} position={[0, 0.15, -0.2]} color="#27272a" />
      <Box size={[0.75, 0.46, 0.05]} position={[0, 0.48, -0.2]} color="#18181b" />
      <mesh position={[0, 0.48, -0.17]} material={mat("#0f172a", { emissive: "#60a5fa", emissiveIntensity: 0.7 })}>
        <planeGeometry args={[0.68, 0.38]} />
      </mesh>
      <Box size={[0.55, 0.03, 0.18]} position={[0, 0.015, 0.12]} color="#3f3f46" />
      <Box size={[0.08, 0.03, 0.12]} position={[0.42, 0.015, 0.14]} color="#3f3f46" />
    </group>
  );
}

function Desk({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 1.6;
  const d = it.d ?? 0.8;
  const h = 0.76;
  return (
    <group>
      <Box size={[w, 0.05, d]} position={[0, h - 0.025, 0]} color={it.color ?? "#8b6a4a"} />
      <Legs w={w} d={d} h={h - 0.05} />
      <Box size={[w - 0.2, 0.4, 0.03]} position={[0, h - 0.3, -d / 2 + 0.08]} color={it.color ?? "#8b6a4a"} />
      {it.computer && <Computer y={h} />}
    </group>
  );
}

function Chair({ it }: { it: FurnitureItem }) {
  const c = it.color ?? "#374151";
  return (
    <group>
      <Box size={[0.48, 0.07, 0.46]} position={[0, 0.46, 0]} color={c} />
      <Box size={[0.48, 0.52, 0.06]} position={[0, 0.76, -0.22]} color={c} />
      <Legs w={0.46} d={0.44} h={0.44} r={0.02} />
    </group>
  );
}

function Counter({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 3;
  const d = it.d ?? 0.9;
  const h = 1.05;
  return (
    <group>
      <Box size={[w, h - 0.06, d]} position={[0, (h - 0.06) / 2, 0]} color={it.color ?? "#6b4f3a"} />
      <Box size={[w + 0.1, 0.06, d + 0.12]} position={[0, h - 0.03, 0]} color="#f1ede6" />
      <Box size={[w - 0.1, 0.1, 0.02]} position={[0, 0.05, d / 2 + 0.01]} color="#1f2937" cast={false} />
      {it.computer && <Computer y={h} />}
    </group>
  );
}

function RoundTable() {
  return (
    <group>
      <Cyl r={0.55} h={0.05} position={[0, 0.75, 0]} color="#f5f5f4" segments={24} />
      <Cyl r={0.05} h={0.72} position={[0, 0.37, 0]} color="#27272a" segments={8} />
      <Cyl r={0.3} h={0.03} position={[0, 0.015, 0]} color="#27272a" segments={16} />
      <Cyl r={0.06} h={0.12} position={[0.15, 0.83, 0.1]} color="#ffffff" segments={10} />
    </group>
  );
}

function Table({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 2;
  const d = it.d ?? 1;
  return (
    <group>
      <Box size={[w, 0.06, d]} position={[0, 0.75, 0]} color={it.color ?? "#9a6b46"} />
      <Legs w={w} d={d} h={0.72} r={0.04} />
    </group>
  );
}

function Shelf({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 6;
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(Math.round(it.x * 31 + it.z * 7));
    const matrices: THREE.Matrix4[] = [];
    const colors: string[] = [];
    for (const side of [-1, 1]) {
      for (let lvl = 0; lvl < 4; lvl++) {
        const y = 0.2 + lvl * 0.45;
        let x = -w / 2 + 0.15;
        while (x < w / 2 - 0.2) {
          const pw = 0.18 + rand() * 0.14;
          const ph = 0.2 + rand() * 0.18;
          if (rand() > 0.08) {
            matrices.push(placement(x + pw / 2, y + ph / 2, side * 0.25, 0, [pw, ph, 0.3]));
            colors.push(PRODUCT_COLORS[Math.floor(rand() * PRODUCT_COLORS.length)]);
          }
          x += pw + 0.04;
        }
      }
    }
    return { matrices, colors };
  }, [it.x, it.z, w]);
  return (
    <group>
      <Box size={[w, 0.15, 1]} position={[0, 0.075, 0]} color="#e5e7eb" />
      <Box size={[w, 1.9, 0.06]} position={[0, 0.95, 0]} color="#d1d5db" />
      {[0, 1, 2, 3].map((l) =>
        [-1, 1].map((s) => <Box key={`${l}${s}`} size={[w, 0.04, 0.45]} position={[0, 0.18 + l * 0.45, s * 0.25]} color="#f3f4f6" cast={false} />),
      )}
      <Box size={[0.06, 1.9, 1]} position={[-w / 2, 0.95, 0]} color="#16a34a" />
      <Box size={[0.06, 1.9, 1]} position={[w / 2, 0.95, 0]} color="#16a34a" />
      <InstancedParts geometry={unitBox} material={mat("#ffffff", { roughness: 0.6 })} matrices={matrices} colors={colors} castShadow={false} />
    </group>
  );
}

function Bookshelf({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 3;
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(Math.round(it.x * 13 + it.z * 17));
    const matrices: THREE.Matrix4[] = [];
    const colors: string[] = [];
    for (let lvl = 0; lvl < 4; lvl++) {
      let x = -w / 2 + 0.1;
      while (x < w / 2 - 0.15) {
        const bw = 0.06 + rand() * 0.06;
        const bh = 0.24 + rand() * 0.12;
        matrices.push(placement(x + bw / 2, 0.08 + lvl * 0.48 + bh / 2, 0.02, 0, [bw, bh, 0.26]));
        colors.push(PRODUCT_COLORS[Math.floor(rand() * PRODUCT_COLORS.length)]);
        x += bw + 0.01;
      }
    }
    return { matrices, colors };
  }, [it.x, it.z, w]);
  return (
    <group>
      <Box size={[w, 2, 0.05]} position={[0, 1, -0.2]} color="#8b5a3c" />
      <Box size={[0.05, 2, 0.45]} position={[-w / 2, 1, 0]} color="#8b5a3c" />
      <Box size={[0.05, 2, 0.45]} position={[w / 2, 1, 0]} color="#8b5a3c" />
      {[0, 1, 2, 3, 4].map((l) => (
        <Box key={l} size={[w, 0.04, 0.45]} position={[0, 0.05 + l * 0.48, 0]} color="#9b6a46" />
      ))}
      <InstancedParts geometry={unitBox} material={mat("#ffffff", { roughness: 0.8 })} matrices={matrices} colors={colors} castShadow={false} />
    </group>
  );
}

function Steam({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.6 + i / 4) % 1;
      c.position.y = y + t * 0.7;
      c.scale.setScalar(0.06 + t * 0.12);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
    });
  });
  return (
    <group ref={ref}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.05, y, 0.25]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeMachine({ it }: { it: FurnitureItem }) {
  const on = useToggle(it.toggle);
  const steel = mat("#d4d4d8", { metalness: 0.85, roughness: 0.25 });
  return (
    <group position={[0, 1.05, 0]}>
      <mesh position={[0, 0.32, 0]} material={steel} castShadow>
        <boxGeometry args={[0.95, 0.64, 0.55]} />
      </mesh>
      <Box size={[0.95, 0.06, 0.55]} position={[0, 0.67, 0]} color="#7f1d1d" />
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          <Cyl r={0.06} h={0.12} position={[x, 0.3, 0.3]} color="#27272a" segments={10} />
          <Box size={[0.08, 0.04, 0.2]} position={[x, 0.3, 0.42]} color="#27272a" />
        </group>
      ))}
      <Box size={[0.8, 0.03, 0.2]} position={[0, 0.03, 0.36]} color="#3f3f46" />
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <Cyl key={x} r={0.05} h={0.08} position={[x, 0.74, 0]} color="#ffffff" segments={8} />
      ))}
      {on && (
        <>
          <Cyl r={0.06} h={0.1} position={[-0.22, 0.1, 0.32]} color="#ffffff" segments={10} />
          <Steam y={0.2} />
        </>
      )}
      <mesh position={[0.3, 0.5, 0.28]} material={mat(on ? "#22c55e" : "#7f1d1d", { emissive: on ? "#22c55e" : "#450a0a", emissiveIntensity: 1.5 })}>
        <sphereGeometry args={[0.03, 8, 6]} />
      </mesh>
    </group>
  );
}

function PastryCase() {
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(5);
    const m: THREE.Matrix4[] = [];
    const c: string[] = [];
    for (let i = 0; i < 12; i++) {
      m.push(placement(-0.45 + (i % 6) * 0.18, 1.18 + Math.floor(i / 6) * 0.22, 0, 0, [0.07, 0.05, 0.07]));
      c.push(["#d97706", "#92400e", "#fbbf24", "#f472b6"][Math.floor(rand() * 4)]);
    }
    return { matrices: m, colors: c };
  }, []);
  return (
    <group>
      <mesh position={[0, 1.27, 0]} material={mat("#e0f2fe", { transparent: true, opacity: 0.25, roughness: 0.05 })}>
        <boxGeometry args={[1.2, 0.45, 0.6]} />
      </mesh>
      <Box size={[1.15, 0.02, 0.55]} position={[0, 1.27, 0]} color="#f5f5f4" cast={false} />
      <InstancedParts geometry={unitSphere} material={mat("#ffffff")} matrices={matrices} colors={colors} castShadow={false} />
    </group>
  );
}

function Register() {
  return (
    <group position={[0, 1.05, 0]}>
      <Box size={[0.45, 0.12, 0.4]} position={[0, 0.06, 0]} color="#27272a" />
      <Box size={[0.4, 0.28, 0.03]} position={[0, 0.3, -0.05]} rotation={[-0.3, 0, 0]} color="#18181b" />
      <mesh position={[0, 0.3, -0.03]} rotation-x={-0.3} material={mat("#0f172a", { emissive: "#34d399", emissiveIntensity: 0.6 })}>
        <planeGeometry args={[0.34, 0.22]} />
      </mesh>
    </group>
  );
}

function Whiteboard({ it }: { it: FurnitureItem }) {
  const on = useToggle(it.toggle);
  const w = it.w ?? 4;
  const h = it.h ?? 1.6;
  const tex = labelTexture(on ? "How to build a rug city" : "2 + 2 = 4", { bg: "#ffffff", fg: "#1d4ed8", width: 1024, height: Math.round((1024 * h) / w), radius: 4 });
  return (
    <group position={[0, 1.7, 0.03]}>
      <Box size={[w + 0.14, h + 0.14, 0.05]} position={[0, 0, 0]} color="#9ca3af" />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.3} />
      </mesh>
      <Box size={[w * 0.6, 0.05, 0.12]} position={[0, -h / 2 - 0.08, 0.06]} color="#9ca3af" />
      {["#ef4444", "#2563eb", "#16a34a"].map((c, i) => (
        <Box key={c} size={[0.12, 0.03, 0.03]} position={[-0.3 + i * 0.2, -h / 2 - 0.04, 0.08]} color={c} cast={false} />
      ))}
    </group>
  );
}

function Cabinet() {
  return (
    <group>
      <Box size={[0.6, 1.32, 0.7]} position={[0, 0.66, 0]} color="#9ca3af" />
      {[0.25, 0.58, 0.91, 1.22].map((y) => (
        <group key={y}>
          <Box size={[0.54, 0.01, 0.01]} position={[0, y - 0.15, 0.355]} color="#4b5563" cast={false} />
          <Box size={[0.16, 0.03, 0.03]} position={[0, y, 0.36]} color="#e5e7eb" cast={false} />
        </group>
      ))}
    </group>
  );
}

function Plant() {
  return (
    <group>
      <Cyl r={0.25} rTop={0.3} h={0.5} position={[0, 0.25, 0]} color="#c2410c" segments={16} />
      {[
        [0, 0.95, 0, 0.42],
        [0.18, 1.2, 0.05, 0.3],
        [-0.15, 1.3, -0.08, 0.28],
        [0.05, 1.5, 0.1, 0.22],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s, s * 1.2, s]} material={mat(i % 2 ? "#15803d" : "#22c55e", { roughness: 0.8 })} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
      <Cyl r={0.03} h={0.6} position={[0, 0.75, 0]} color="#3f2a1d" segments={6} />
    </group>
  );
}

function Lockers({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 6;
  const n = Math.floor(w / 0.62);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -w / 2 + 0.31 + i * 0.62;
        return (
          <group key={i} position={[x, 0, 0]}>
            <Box size={[0.58, 2, 0.6]} position={[0, 1, 0]} color={i % 2 ? "#b91c1c" : "#991b1b"} />
            {[1.6, 1.68, 1.76].map((y) => (
              <Box key={y} size={[0.3, 0.02, 0.01]} position={[0, y, 0.305]} color="#450a0a" cast={false} />
            ))}
            <Box size={[0.03, 0.15, 0.03]} position={[0.2, 1, 0.31]} color="#d4d4d8" cast={false} />
            <mesh position={[0, 2.12, 0]} material={mat(i % 3 ? "#facc15" : "#ef4444", { roughness: 0.4 })} castShadow>
              <sphereGeometry args={[0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <Box size={[0.4, 0.4, 0.15]} position={[0, 0.7, 0.36]} color="#d97706" />
          </group>
        );
      })}
    </group>
  );
}

function FireTruck({ it }: { it: FurnitureItem }) {
  const on = useToggle(it.toggle);
  const red = mat("#dc2626", { roughness: 0.35, metalness: 0.3 });
  const chrome = mat("#e5e7eb", { metalness: 0.9, roughness: 0.2 });
  const lightL = useRef<THREE.MeshStandardMaterial>(null);
  const lightR = useRef<THREE.MeshStandardMaterial>(null);
  const beacon = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 8;
    const a = on ? (Math.sin(t) > 0 ? 3 : 0.2) : 0.2;
    const b = on ? (Math.sin(t) > 0 ? 0.2 : 3) : 0.2;
    if (lightL.current) lightL.current.emissiveIntensity = a;
    if (lightR.current) lightR.current.emissiveIntensity = b;
    if (beacon.current) {
      beacon.current.intensity = on ? 6 + Math.sin(t) * 5 : 0;
      beacon.current.color.set(Math.sin(t) > 0 ? "#ef4444" : "#3b82f6");
    }
  });
  return (
    <group>
      <mesh position={[0, 1, 0]} material={red} castShadow>
        <boxGeometry args={[2.6, 1, 9]} />
      </mesh>
      <mesh position={[0, 2.2, 3.4]} material={red} castShadow>
        <boxGeometry args={[2.6, 1.6, 2.2]} />
      </mesh>
      <mesh position={[0, 2.4, 4.52]} material={glassMat()}>
        <boxGeometry args={[2.3, 0.9, 0.05]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.31, 2.4, 3.6]} rotation-y={s * (Math.PI / 2)} material={glassMat()}>
          <planeGeometry args={[1.2, 0.8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, -1.2]} material={red} castShadow>
        <boxGeometry args={[2.6, 1.8, 6.2]} />
      </mesh>
      {[-1, 1].map((s) =>
        [-3.2, -1.6, 0, 1.4].map((z) => (
          <Box key={`${s}${z}`} size={[0.02, 1.4, 1.3]} position={[s * 1.31, 2.1, z - 0.6]} material={chrome} cast={false} />
        )),
      )}
      {/* Ladder */}
      {[-0.5, 0.5].map((x) => (
        <Box key={x} size={[0.08, 0.08, 7]} position={[x, 3.25, -0.8]} material={chrome} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <Box key={i} size={[1, 0.05, 0.05]} position={[0, 3.25, -4.1 + i * 0.5]} material={chrome} cast={false} />
      ))}
      <Box size={[2.7, 0.3, 0.2]} position={[0, 0.6, 4.55]} material={chrome} />
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 1.2, 4.52]} material={mat("#fffbe6", { emissive: "#fff3c4", emissiveIntensity: 1.5 })}>
          <boxGeometry args={[0.4, 0.25, 0.05]} />
        </mesh>
      ))}
      <mesh position={[-0.6, 3.1, 3.4]}>
        <boxGeometry args={[0.9, 0.2, 0.4]} />
        <meshStandardMaterial ref={lightL} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.6, 3.1, 3.4]}>
        <boxGeometry args={[0.9, 0.2, 0.4]} />
        <meshStandardMaterial ref={lightR} color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>
      <pointLight ref={beacon} position={[0, 3.6, 3.4]} distance={14} intensity={0} />
      {[3, 0, -3].flatMap((z) =>
        [-1.2, 1.2].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.5, z]} rotation-z={Math.PI / 2} material={mat("#111111", { roughness: 0.9 })} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 18]} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Pole({ roomH }: { roomH: number }) {
  return (
    <group>
      <Cyl r={0.07} h={roomH} position={[0, roomH / 2, 0]} material={mat("#d4a017", { metalness: 0.9, roughness: 0.2 })} segments={12} />
      <Cyl r={0.7} h={0.08} position={[0, 0.04, 0]} color="#1f2937" segments={24} />
      <mesh position={[0, roomH - 0.01, 0]} rotation-x={Math.PI / 2} material={mat("#111827", { side: THREE.DoubleSide })}>
        <ringGeometry args={[0.08, 0.6, 24]} />
      </mesh>
    </group>
  );
}

function Vault({ it }: { it: FurnitureItem }) {
  const open = useToggle(it.toggle);
  const hinge = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!hinge.current) return;
    const target = open ? -1.9 : 0;
    hinge.current.rotation.y += (target - hinge.current.rotation.y) * Math.min(1, dt * 2.5);
  });
  const steel = mat("#a1a1aa", { metalness: 0.85, roughness: 0.3 });
  const gold = mat("#facc15", { metalness: 0.9, roughness: 0.25, emissive: "#a16207", emissiveIntensity: 0.3 });
  return (
    <group position={[0, 1.8, 0]}>
      <mesh position={[0, 0, 0.02]} material={mat("#111827")}>
        <circleGeometry args={[1.6, 40]} />
      </mesh>
      {[0, 1, 2].flatMap((row) =>
        [-0.6, 0, 0.6].map((x) => <Cyl key={`${row}${x}`} r={0.22} h={0.3 + row * 0.1} position={[x, -1 + row * 0.12 + 0.15, 0.25]} material={gold} segments={14} />),
      )}
      <mesh position={[0, 0, 0.05]} material={steel}>
        <torusGeometry args={[1.7, 0.18, 12, 48]} />
      </mesh>
      <group ref={hinge} position={[-1.6, 0, 0.2]}>
        <group position={[1.6, 0, 0]}>
          <mesh rotation-x={Math.PI / 2} material={steel} castShadow>
            <cylinderGeometry args={[1.58, 1.58, 0.35, 40]} />
          </mesh>
          <mesh position={[0, 0, 0.2]} material={mat("#71717a", { metalness: 0.8, roughness: 0.3 })}>
            <circleGeometry args={[0.35, 24]} />
          </mesh>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r) => (
            <Box key={r} size={[1.4, 0.08, 0.08]} position={[0, 0, 0.26]} rotation={[0, 0, r]} material={steel} />
          ))}
        </group>
      </group>
    </group>
  );
}

function TellerCounter({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 9;
  const n = Math.round(w / 3);
  return (
    <group>
      <Box size={[w, 1.1, 1]} position={[0, 0.55, 0]} color="#5b3a29" />
      <Box size={[w + 0.1, 0.06, 1.1]} position={[0, 1.13, 0]} color="#f1ede6" />
      <mesh position={[0, 1.7, 0.1]} material={mat("#dbeafe", { transparent: true, opacity: 0.25, roughness: 0.05 })}>
        <boxGeometry args={[w, 1.1, 0.04]} />
      </mesh>
      {Array.from({ length: n + 1 }, (_, i) => (
        <Box key={i} size={[0.08, 1.2, 0.12]} position={[-w / 2 + (i * w) / n, 1.75, 0.1]} color="#d4af37" />
      ))}
      <Box size={[w, 0.08, 0.14]} position={[0, 2.3, 0.1]} color="#d4af37" />
      <Cyl r={0.08} h={0.06} position={[w / 2 - 0.6, 1.2, 0.35]} color="#d4af37" />
    </group>
  );
}

function Atm() {
  return (
    <group>
      <Box size={[0.9, 1.7, 0.8]} position={[0, 0.85, 0]} color="#065f46" />
      <mesh position={[0, 1.3, 0.41]} material={mat("#0f172a", { emissive: "#38bdf8", emissiveIntensity: 0.8 })}>
        <planeGeometry args={[0.5, 0.35]} />
      </mesh>
      <Box size={[0.5, 0.05, 0.3]} position={[0, 0.98, 0.45]} color="#d1d5db" />
      <Box size={[0.3, 0.04, 0.05]} position={[0, 0.8, 0.41]} color="#111827" cast={false} />
    </group>
  );
}

function Checkout({ it }: { it: FurnitureItem }) {
  const pulse = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.emissiveIntensity = 1 + Math.sin(clock.elapsedTime * 6) * 0.6;
  });
  return (
    <group>
      <Box size={[1.2, 0.9, 2.6]} position={[0, 0.45, 0]} color="#e5e7eb" />
      <Box size={[1, 0.04, 1.6]} position={[0, 0.92, -0.4]} color="#111827" />
      <mesh position={[0, 0.94, 0.7]}>
        <boxGeometry args={[0.5, 0.02, 0.3]} />
        <meshStandardMaterial ref={pulse} color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
      </mesh>
      <group position={[0.35, 0, 0.9]}>
        <Register />
      </group>
      {it.toggle && <Cyl r={0.03} h={1.2} position={[-0.5, 1.5, 1.1]} color="#9ca3af" segments={6} />}
      {it.toggle && (
        <mesh position={[-0.5, 2.15, 1.1]} material={mat("#16a34a", { emissive: "#22c55e", emissiveIntensity: 1.5 })}>
          <boxGeometry args={[0.35, 0.25, 0.05]} />
        </mesh>
      )}
    </group>
  );
}

function Fridge({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 3.6;
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(Math.round(it.x * 7 + 3));
    const m: THREE.Matrix4[] = [];
    const c: string[] = [];
    for (let lvl = 0; lvl < 4; lvl++) {
      for (let x = -w / 2 + 0.2; x < w / 2 - 0.15; x += 0.18) {
        m.push(placement(x, 0.4 + lvl * 0.45, 0.37, 0, [0.12, 0.28, 0.12]));
        c.push(PRODUCT_COLORS[Math.floor(rand() * PRODUCT_COLORS.length)]);
      }
    }
    return { matrices: m, colors: c };
  }, [it.x, w]);
  return (
    <group>
      <Box size={[w, 2.2, 1]} position={[0, 1.1, -0.05]} color="#f8fafc" />
      <mesh position={[0, 1.15, 0.2]} material={mat("#e0f2fe", { emissive: "#bae6fd", emissiveIntensity: 0.8 })}>
        <boxGeometry args={[w - 0.2, 1.9, 0.3]} />
      </mesh>
      <InstancedParts geometry={unitBox} material={mat("#ffffff")} matrices={matrices} colors={colors} castShadow={false} />
      <mesh position={[0, 1.15, 0.47]} material={mat("#dbeafe", { transparent: true, opacity: 0.18, roughness: 0.05 })}>
        <boxGeometry args={[w - 0.1, 2, 0.04]} />
      </mesh>
      {Array.from({ length: Math.max(1, Math.round(w / 1.2)) - 1 }, (_, i) => (
        <Box key={i} size={[0.05, 2, 0.06]} position={[-w / 2 + (i + 1) * (w / Math.round(w / 1.2)), 1.15, 0.48]} color="#9ca3af" cast={false} />
      ))}
    </group>
  );
}

function Cart() {
  const wire = mat("#94a3b8", { metalness: 0.7, roughness: 0.35, transparent: true, opacity: 0.85 });
  return (
    <group>
      <mesh position={[0, 0.75, 0]} material={wire} castShadow>
        <boxGeometry args={[0.55, 0.45, 0.85]} />
      </mesh>
      <Box size={[0.55, 0.04, 0.04]} position={[0, 1.1, -0.48]} color="#ef4444" />
      {[-0.22, 0.22].flatMap((x) =>
        [-0.35, 0.35].map((z) => <Cyl key={`${x}${z}`} r={0.06} h={0.05} position={[x, 0.07, z]} rotation={[0, 0, Math.PI / 2]} color="#111827" segments={10} />),
      )}
      {[-0.22, 0.22].map((x) => (
        <Box key={x} size={[0.03, 0.5, 0.03]} position={[x, 0.3, 0]} color="#94a3b8" />
      ))}
    </group>
  );
}

function Cell({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 4;
  const d = it.d ?? 3;
  const bars = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.22) {
      if (Math.abs(x) < 0.5) continue;
      m.push(placement(x, 1.3, d / 2, 0, [1, 2.6, 1]));
    }
    for (let z = -d / 2; z <= d / 2; z += 0.22) m.push(placement(-w / 2, 1.3, z, 0, [1, 2.6, 1]));
    return m;
  }, [w, d]);
  const barGeo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 1, 6), []);
  return (
    <group>
      <InstancedParts geometry={barGeo} material={mat("#52525b", { metalness: 0.8, roughness: 0.3 })} matrices={bars} />
      <Box size={[w, 0.08, 0.08]} position={[0, 2.6, d / 2]} color="#3f3f46" />
      <Box size={[0.08, 0.08, d]} position={[-w / 2, 2.6, 0]} color="#3f3f46" />
      <Box size={[0.9, 2.5, 0.05]} position={[0.25, 1.3, d / 2 + 0.2]} rotation={[0, -0.8, 0]} color="#3f3f46" />
      <Box size={[w - 0.6, 0.12, 0.6]} position={[0.2, 0.5, -d / 2 + 0.45]} color="#9ca3af" />
    </group>
  );
}

function Sofa({ it }: { it: FurnitureItem }) {
  const c = it.color ?? "#1e3a8a";
  return (
    <group>
      <Box size={[2.4, 0.45, 0.95]} position={[0, 0.25, 0]} color={c} />
      <Box size={[2.4, 0.6, 0.25]} position={[0, 0.7, -0.38]} color={c} />
      <Box size={[0.22, 0.65, 0.95]} position={[-1.1, 0.42, 0]} color={c} />
      <Box size={[0.22, 0.65, 0.95]} position={[1.1, 0.42, 0]} color={c} />
      {[-0.55, 0.55].map((x) => (
        <Box key={x} size={[1, 0.14, 0.75]} position={[x, 0.53, 0.06]} color={c} />
      ))}
    </group>
  );
}

function Bench({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 3;
  return (
    <group>
      <Box size={[w, 0.08, 0.5]} position={[0, 0.45, 0]} color="#8b5a3c" />
      <Legs w={w} d={0.5} h={0.42} r={0.04} />
    </group>
  );
}

function WallText({ it, fg, lines }: { it: FurnitureItem; fg?: string; lines?: string[] }) {
  const w = it.w ?? 3;
  const h = it.h ?? 1.2;
  const light = it.color ? new THREE.Color(it.color).getHSL({ h: 0, s: 0, l: 0 }).l > 0.6 : false;
  const tex = labelTexture(it.text ?? "", { bg: it.color ?? "#1f2937", fg: fg ?? (light ? "#1f2937" : "#ffffff"), width: 1024, height: Math.round((1024 * h) / w), radius: 12 });
  return (
    <group position={[0, 2.3, 0.03]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} transparent />
      </mesh>
      {lines?.map((l, i) => {
        const t = labelTexture(l, { bg: "transparent", fg: "#fde68a", width: 512, height: 64 });
        return (
          <mesh key={l} position={[0, -0.25 - i * 0.3, 0.01]}>
            <planeGeometry args={[w * 0.8, w * 0.1]} />
            <meshBasicMaterial map={t} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function MenuBoard({ it }: { it: FurnitureItem }) {
  const w = it.w ?? 4;
  const h = it.h ?? 1.4;
  const title = labelTexture("MENU", { bg: "transparent", fg: "#fef3c7", width: 512, height: 96 });
  const items = ["Espresso ........ 2", "Latte ........... 3", "Cinnamon roll ... 2"];
  return (
    <group position={[0, 2.5, 0.03]}>
      <Box size={[w + 0.1, h + 0.1, 0.05]} position={[0, 0, 0]} color="#3f2a1d" />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2 - 0.22, 0.04]}>
        <planeGeometry args={[w * 0.5, w * 0.09]} />
        <meshBasicMaterial map={title} transparent />
      </mesh>
      {items.map((l, i) => {
        const t = labelTexture(l, { bg: "transparent", fg: "#ffffff", width: 768, height: 72, font: "monospace" });
        return (
          <mesh key={l} position={[0, h / 2 - 0.55 - i * 0.28, 0.04]}>
            <planeGeometry args={[w * 0.82, w * 0.077]} />
            <meshBasicMaterial map={t} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function Flag() {
  return (
    <group>
      <Cyl r={0.04} h={2.4} position={[0, 1.2, 0]} color="#d4af37" segments={8} />
      <Cyl r={0.2} h={0.06} position={[0, 0.03, 0]} color="#27272a" />
      <mesh position={[0.45, 2, 0]} material={mat("#1d4ed8", { side: THREE.DoubleSide })}>
        <planeGeometry args={[0.85, 0.55]} />
      </mesh>
    </group>
  );
}

function Globe() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });
  return (
    <group position={[0, 0.76, 0]}>
      <Cyl r={0.1} h={0.04} position={[0, 0.02, 0]} color="#78350f" />
      <Cyl r={0.015} h={0.2} position={[0, 0.12, 0]} color="#78350f" segments={6} />
      <mesh ref={ref} position={[0, 0.38, 0]} rotation-z={0.4} material={mat("#2563eb", { roughness: 0.4 })} castShadow>
        <icosahedronGeometry args={[0.18, 2]} />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation-z={0.4} material={mat("#16a34a")}>
        <icosahedronGeometry args={[0.182, 0]} />
      </mesh>
    </group>
  );
}

function Produce({ it }: { it: FurnitureItem }) {
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(Math.round(it.z * 11 + 50));
    const m: THREE.Matrix4[] = [];
    const c: string[] = [];
    const palette = [["#dc2626", "#ef4444"], ["#f97316", "#fb923c"], ["#84cc16", "#a3e635"], ["#facc15", "#fde047"]];
    for (let bin = 0; bin < 4; bin++) {
      const z0 = -0.95 + bin * 0.63;
      for (let i = 0; i < 18; i++) {
        m.push(placement(-0.5 + rand() * 1, 0.95 + rand() * 0.15, z0 + rand() * 0.5, 0, 0.09 + rand() * 0.03));
        c.push(palette[bin][Math.floor(rand() * 2)]);
      }
    }
    return { matrices: m, colors: c };
  }, [it.z]);
  return (
    <group>
      <Box size={[1.6, 0.9, 2.6]} position={[0, 0.45, 0]} color="#a16207" />
      <Box size={[1.5, 0.05, 2.5]} position={[0, 0.92, 0]} rotation={[0, 0, 0.1]} color="#78350f" />
      <InstancedParts geometry={unitSphere} material={mat("#ffffff", { roughness: 0.4 })} matrices={matrices} colors={colors} castShadow={false} />
    </group>
  );
}

function Stanchion({ it }: { it: FurnitureItem }) {
  const gold = mat("#d4af37", { metalness: 0.9, roughness: 0.2 });
  return (
    <group>
      <Cyl r={0.18} h={0.04} position={[0, 0.02, 0]} material={gold} />
      <Cyl r={0.03} h={0.95} position={[0, 0.48, 0]} material={gold} segments={8} />
      <mesh position={[0, 0.98, 0]} material={gold}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
      {(it.w ?? 0) > 0 && (
        <mesh position={[(it.w ?? 0) / 2, 0.82, 0]} rotation-z={Math.PI / 2} material={mat("#991b1b", { roughness: 0.8 })}>
          <cylinderGeometry args={[0.03, 0.03, it.w, 8]} />
        </mesh>
      )}
    </group>
  );
}

function AlarmLight({ it }: { it: FurnitureItem }) {
  const on = useToggle(it.toggle);
  const ref = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }, dt) => {
    if (ref.current && on) ref.current.rotation.y += dt * 8;
    if (light.current) light.current.intensity = on ? 8 + Math.sin(clock.elapsedTime * 12) * 6 : 0;
  });
  return (
    <group position={[0, 1.08, 0]}>
      <Cyl r={0.14} h={0.06} position={[0, 0.03, 0]} color="#27272a" />
      <group ref={ref}>
        <mesh position={[0, 0.16, 0]} material={mat("#ef4444", { emissive: "#ef4444", emissiveIntensity: on ? 2.5 : 0.3, transparent: true, opacity: 0.9 })}>
          <sphereGeometry args={[0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 0.5, 0]} color="#ef4444" distance={12} intensity={0} />
    </group>
  );
}

function Column({ roomH }: { roomH: number }) {
  const m = mat("#f5f0e6", { roughness: 0.4 });
  return (
    <group>
      <Box size={[0.9, 0.3, 0.9]} position={[0, 0.15, 0]} material={m} />
      <Cyl r={0.36} h={roomH - 0.6} position={[0, roomH / 2, 0]} material={m} segments={20} />
      <Box size={[0.9, 0.3, 0.9]} position={[0, roomH - 0.15, 0]} material={m} />
    </group>
  );
}

function HoseReel() {
  return (
    <group position={[0, 1.6, 0.25]}>
      <mesh material={mat("#dc2626", { roughness: 0.5 })} castShadow>
        <torusGeometry args={[0.45, 0.12, 10, 28]} />
      </mesh>
      <Cyl r={0.3} h={0.2} position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} color="#9ca3af" />
      <Box size={[0.1, 0.1, 0.3]} position={[0, 0, -0.25]} color="#6b7280" />
    </group>
  );
}

export function Furniture({ it, roomH }: { it: FurnitureItem; roomH: number }) {
  switch (it.kind) {
    case "desk":
      return <Desk it={it} />;
    case "chair":
      return <Chair it={it} />;
    case "counter":
      return <Counter it={it} />;
    case "roundTable":
      return <RoundTable />;
    case "table":
      return <Table it={it} />;
    case "shelf":
      return <Shelf it={it} />;
    case "bookshelf":
      return <Bookshelf it={it} />;
    case "coffeeMachine":
      return <CoffeeMachine it={it} />;
    case "pastryCase":
      return <PastryCase />;
    case "register":
      return <Register />;
    case "whiteboard":
      return <Whiteboard it={it} />;
    case "cabinet":
      return <Cabinet />;
    case "plant":
      return <Plant />;
    case "lockers":
      return <Lockers it={it} />;
    case "fireTruck":
      return <FireTruck it={it} />;
    case "pole":
      return <Pole roomH={roomH} />;
    case "vault":
      return <Vault it={it} />;
    case "tellerCounter":
      return <TellerCounter it={it} />;
    case "atm":
      return <Atm />;
    case "checkout":
      return <Checkout it={it} />;
    case "fridge":
      return <Fridge it={it} />;
    case "cart":
      return <Cart />;
    case "cell":
      return <Cell it={it} />;
    case "sofa":
      return <Sofa it={it} />;
    case "bench":
      return <Bench it={it} />;
    case "menuBoard":
      return <MenuBoard it={it} />;
    case "poster":
      return <WallText it={it} />;
    case "flag":
      return <Flag />;
    case "globe":
      return <Globe />;
    case "produce":
      return <Produce it={it} />;
    case "stanchion":
      return <Stanchion it={it} />;
    case "alarmLight":
      return <AlarmLight it={it} />;
    case "column":
      return <Column roomH={roomH} />;
    case "hoseReel":
      return <HoseReel />;
  }
}
