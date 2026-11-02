"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";
import { ribbonGeometry } from "@/lib/three/ribbon";
import { asphaltTexture, labelTexture } from "@/lib/three/textures";
import { benches, flowerBeds, parkingLots, parks, ponds } from "@/lib/world/features";
import { seededRandom } from "@/lib/world/geometry";
import { ROAD_Y, ROUNDABOUT } from "@/lib/world/roads";
import { bushes, roadSigns, streetLights, trees } from "@/lib/world/scenery";
import { Box, Cyl } from "./buildings/parts";
import { CarModel } from "./CarModel";
import { InstancedParts, placement } from "./Instanced";

const geo = {
  trunk: new THREE.CylinderGeometry(0.22, 0.32, 1, 7).translate(0, 0.5, 0),
  blob: new THREE.IcosahedronGeometry(1, 1),
  cone: new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
  pole: new THREE.CylinderGeometry(0.1, 0.13, 1, 8).translate(0, 0.5, 0),
};

export function Trees() {
  const parts = useMemo(() => {
    const trunks: THREE.Matrix4[] = [];
    const birchTrunks: THREE.Matrix4[] = [];
    const blobs: THREE.Matrix4[] = [];
    const blobColors: string[] = [];
    const cones: THREE.Matrix4[] = [];
    const coneColors: string[] = [];
    const rand = seededRandom(3);
    for (const t of trees) {
      const s = t.scale;
      const rot = rand() * Math.PI * 2;
      if (t.kind === "pine") {
        trunks.push(placement(t.x, 0, t.z, rot, [s, 1.6 * s, s]));
        cones.push(placement(t.x, 1.2 * s, t.z, rot, [2.2 * s, 3.6 * s, 2.2 * s]));
        cones.push(placement(t.x, 3.2 * s, t.z, rot, [1.6 * s, 3 * s, 1.6 * s]));
        coneColors.push(t.color, t.color);
      } else if (t.kind === "birch") {
        birchTrunks.push(placement(t.x, 0, t.z, rot, [0.7 * s, 4 * s, 0.7 * s]));
        blobs.push(placement(t.x, 4.6 * s, t.z, rot, [1.5 * s, 2.2 * s, 1.5 * s]));
        blobColors.push("#7fae4a");
      } else {
        trunks.push(placement(t.x, 0, t.z, rot, [s, 2.6 * s, s]));
        blobs.push(placement(t.x, 3.8 * s, t.z, rot, [2.1 * s, 1.9 * s, 2.1 * s]));
        blobs.push(placement(t.x, 4.6 * s, t.z, rot, 1.3 * s, [0.7 * s, 0, 0.4 * s]));
        blobColors.push(t.color, t.color);
      }
    }
    return { trunks, birchTrunks, blobs, blobColors, cones, coneColors };
  }, []);
  return (
    <group>
      <InstancedParts geometry={geo.trunk} material={mat("#6b4a32", { roughness: 0.9 })} matrices={parts.trunks} />
      <InstancedParts geometry={geo.trunk} material={mat("#ece8df", { roughness: 0.8 })} matrices={parts.birchTrunks} />
      <InstancedParts geometry={geo.blob} material={mat("#ffffff", { roughness: 0.85 })} matrices={parts.blobs} colors={parts.blobColors} />
      <InstancedParts geometry={geo.cone} material={mat("#ffffff", { roughness: 0.85 })} matrices={parts.cones} colors={parts.coneColors} />
    </group>
  );
}

export function Bushes() {
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(8);
    return {
      matrices: bushes.map((b) => placement(b.x, 0.45 * b.scale, b.z, rand() * 6, [1.1 * b.scale, 0.8 * b.scale, 1.1 * b.scale])),
      colors: bushes.map((b) => b.color),
    };
  }, []);
  return <InstancedParts geometry={geo.blob} material={mat("#ffffff", { roughness: 0.9 })} matrices={matrices} colors={colors} />;
}

export function StreetLights() {
  const parts = useMemo(
    () => ({
      poles: streetLights.map((l) => placement(l.x, 0.3, l.z, l.rot, [1, 5.6, 1])),
      arms: streetLights.map((l) => placement(l.x, 5.75, l.z, l.rot, [2.2, 0.1, 0.12], [1.05, 0, 0])),
      heads: streetLights.map((l) => placement(l.x, 5.62, l.z, l.rot, [0.9, 0.22, 0.45], [2.05, 0, 0])),
      bulbs: streetLights.map((l) => placement(l.x, 5.48, l.z, l.rot, [0.6, 0.06, 0.3], [2.05, 0, 0])),
    }),
    [],
  );
  return (
    <group>
      <InstancedParts geometry={geo.pole} material={mat("#374151", { metalness: 0.5, roughness: 0.4 })} matrices={parts.poles} />
      <InstancedParts geometry={geo.box} material={mat("#374151", { metalness: 0.5, roughness: 0.4 })} matrices={parts.arms} />
      <InstancedParts geometry={geo.box} material={mat("#1f2937", { metalness: 0.4, roughness: 0.5 })} matrices={parts.heads} />
      <InstancedParts
        geometry={geo.box}
        material={mat("#fff7d6", { emissive: "#ffe9a8", emissiveIntensity: 1.4 })}
        matrices={parts.bulbs}
        castShadow={false}
      />
    </group>
  );
}

function StopSign({ x, z, rot }: { x: number; z: number; rot: number }) {
  const tex = labelTexture("STOP", { bg: "#dc2626", fg: "#ffffff", width: 256, height: 256, border: "#ffffff", radius: 60 });
  return (
    <group position={[x, 0.3, z]} rotation-y={rot}>
      <mesh geometry={geo.pole} scale={[0.6, 2.6, 0.6]} material={mat("#9ca3af", { metalness: 0.6, roughness: 0.4 })} castShadow />
      <mesh position={[0, 2.6, 0.06]} rotation-z={Math.PI / 8}>
        <circleGeometry args={[0.55, 8]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.6, 0.04]} rotation-y={Math.PI} rotation-z={Math.PI / 8} material={mat("#9ca3af")}>
        <circleGeometry args={[0.55, 8]} />
      </mesh>
    </group>
  );
}

function NameSign({ x, z, names }: { x: number; z: number; names: [string, string] }) {
  return (
    <group position={[x, 0.3, z]}>
      <mesh geometry={geo.pole} scale={[0.6, 3.4, 0.6]} material={mat("#4b5563", { metalness: 0.6, roughness: 0.4 })} castShadow />
      {names.map((n, i) => {
        const tex = labelTexture(n, { bg: "#166534", fg: "#ffffff", width: 512, height: 96, border: "#ffffff", radius: 10 });
        return (
          <group key={n} position={[0, 3.1 + i * 0.42, 0]} rotation-y={i * (Math.PI / 2)}>
            <mesh>
              <boxGeometry args={[2.4, 0.4, 0.04]} />
              <meshStandardMaterial map={tex} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function RoadSigns() {
  return (
    <group>
      {roadSigns.map((s, i) =>
        s.kind === "stop" ? <StopSign key={i} x={s.x} z={s.z} rot={s.rot} /> : <NameSign key={i} x={s.x} z={s.z} names={s.names!} />,
      )}
    </group>
  );
}

export function BenchModel() {
  const wood = mat("#9a6a43", { roughness: 0.8 });
  const iron = mat("#27272a", { metalness: 0.6, roughness: 0.4 });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.55, -0.2 + i * 0.2]} material={wood} castShadow>
          <boxGeometry args={[2, 0.06, 0.16]} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={`b${i}`} position={[0, 0.8 + i * 0.22, -0.32]} rotation-x={-0.15} material={wood} castShadow>
          <boxGeometry args={[2, 0.14, 0.05]} />
        </mesh>
      ))}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.45, -0.05]} material={iron} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.6]} />
        </mesh>
      ))}
    </group>
  );
}

export function Benches() {
  return (
    <group>
      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation-y={b.rot}>
          <BenchModel />
        </group>
      ))}
    </group>
  );
}

function ellipsePoints(rx: number, rz: number, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * rx, z: Math.sin(a) * rz };
  });
}

function Duck({ radius, speed, phase, y }: { radius: [number, number]; speed: number; phase: number; y: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + phase;
    if (!ref.current) return;
    ref.current.position.set(Math.cos(a) * radius[0], y + Math.sin(clock.elapsedTime * 3 + phase) * 0.03, Math.sin(a) * radius[1]);
    ref.current.rotation.y = -a + (speed > 0 ? Math.PI : 0);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.25, 0]} scale={[0.45, 0.32, 0.65]} material={mat("#fde047")} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.65, 0.4]} material={mat("#fde047")} castShadow>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.62, 0.68]} rotation-x={Math.PI / 2} material={mat("#f97316")}>
        <coneGeometry args={[0.08, 0.22, 8]} />
      </mesh>
    </group>
  );
}

export function Ponds() {
  return (
    <group>
      {ponds.map((p) => (
        <PondView key={p.id} p={p} />
      ))}
    </group>
  );
}

function PondView({ p }: { p: (typeof ponds)[number] }) {
  const stones = useMemo(() => {
    const rand = seededRandom(Math.round(p.x * 7 + p.z));
    const n = Math.round((p.rx + p.rz) * 2.4);
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const s = 0.45 + rand() * 0.35;
      return placement(p.x + Math.cos(a) * (p.rx + 0.2), 0.12, p.z + Math.sin(a) * (p.rz + 0.2), rand() * 6, [s, s * 0.6, s]);
    });
  }, [p]);
  const pads = useMemo(() => {
    const rand = seededRandom(Math.round(p.z * 3));
    return Array.from({ length: 6 }, () => ({
      x: p.x + (rand() - 0.5) * p.rx * 1.2,
      z: p.z + (rand() - 0.5) * p.rz * 1.2,
      r: 0.4 + rand() * 0.4,
    }));
  }, [p]);
  return (
    <group>
      <mesh position={[p.x, 0.04, p.z]} rotation-x={-Math.PI / 2} scale={[p.rx + 0.3, p.rz + 0.3, 1]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#c8b78f" roughness={1} />
      </mesh>
      <mesh position={[p.x, 0.1, p.z]} rotation-x={-Math.PI / 2} scale={[p.rx, p.rz, 1]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#3d8fc9" roughness={0.06} metalness={0.25} envMapIntensity={1.4} />
      </mesh>
      <InstancedParts geometry={geo.blob} material={mat("#9ca3af", { roughness: 0.9 })} matrices={stones} />
      {pads.map((pd, i) => (
        <mesh key={i} position={[pd.x, 0.13, pd.z]} rotation-x={-Math.PI / 2} material={mat("#4d7c0f")}>
          <circleGeometry args={[pd.r, 12, 0.3, Math.PI * 1.8]} />
        </mesh>
      ))}
      <group position={[p.x, 0, p.z]}>
        <Duck radius={[p.rx * 0.55, p.rz * 0.55]} speed={0.25} phase={0} y={0.1} />
        <Duck radius={[p.rx * 0.4, p.rz * 0.4]} speed={-0.3} phase={2} y={0.1} />
      </group>
    </group>
  );
}

export function Parks() {
  const paths = useMemo(
    () =>
      ponds.map((p) => {
        const pts = ellipsePoints(p.rx + 2.6, p.rz + 2.6).map((q) => ({ x: q.x + p.x, z: q.z + p.z }));
        return ribbonGeometry(pts, 1.6, 0.035, { vScale: 2 });
      }),
    [],
  );
  return (
    <group>
      {parks
        .filter((k) => k.id !== "playground")
        .map((k) => (
          <mesh key={k.id} position={[k.x, 0.015, k.z]} rotation-x={-Math.PI / 2} scale={[k.rx, k.rz, 1]} receiveShadow>
            <circleGeometry args={[1, 48]} />
            <meshStandardMaterial color="#79b35a" roughness={1} />
          </mesh>
        ))}
      {paths.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial color="#d9c9a3" roughness={1} />
        </mesh>
      ))}
      <Playground />
      <FlowerBeds />
    </group>
  );
}

function Playground() {
  const p = parks.find((k) => k.id === "playground")!;
  const metal = mat("#ef4444", { metalness: 0.4, roughness: 0.4 });
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[p.rx * 2, p.rz * 2]} />
        <meshStandardMaterial color="#e8cf9a" roughness={1} />
      </mesh>
      {/* Swings */}
      <group position={[0, 0, -4.5]}>
        {[-1.6, 1.6].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 1.4, -0.7]} rotation-x={0.45} material={metal} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 3.1, 8]} />
            </mesh>
            <mesh position={[0, 1.4, 0.7]} rotation-x={-0.45} material={metal} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 3.1, 8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.8, 0]} rotation-z={Math.PI / 2} material={metal} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3.4, 8]} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Box size={[0.03, 2, 0.03]} position={[-0.25, 1.8, 0]} color="#6b7280" cast={false} />
            <Box size={[0.03, 2, 0.03]} position={[0.25, 1.8, 0]} color="#6b7280" cast={false} />
            <Box size={[0.6, 0.06, 0.3]} position={[0, 0.8, 0]} color="#2563eb" />
          </group>
        ))}
      </group>
      {/* Slide */}
      <group position={[0, 0, 3]}>
        <Box size={[1.2, 0.1, 1.2]} position={[-1.2, 2, 0]} color="#facc15" />
        {[-0.5, 0.5].flatMap((dz) => [-0.6, 0.6].map((dx) => <Cyl key={`${dx}${dz}`} r={0.06} h={2} position={[-1.2 + dx, 1, dz]} color="#2563eb" segments={6} />))}
        <mesh position={[0.4, 1.05, 0]} rotation-z={-0.62} material={mat("#22c55e", { roughness: 0.3 })} castShadow>
          <boxGeometry args={[3.6, 0.08, 0.9]} />
        </mesh>
        <mesh position={[-2.2, 1, 0]} rotation-z={0.35} material={metal} castShadow>
          <boxGeometry args={[0.1, 2.3, 0.7]} />
        </mesh>
      </group>
      {/* Seesaw */}
      <group position={[0, 0, 0]}>
        <Cyl r={0.15} h={0.6} position={[0, 0.3, 0]} color="#6b7280" />
        <mesh position={[0, 0.6, 0]} rotation-z={0.15} material={mat("#f97316")} castShadow>
          <boxGeometry args={[3.6, 0.1, 0.35]} />
        </mesh>
      </group>
    </group>
  );
}

function FlowerBeds() {
  const { matrices, colors } = useMemo(() => {
    const rand = seededRandom(55);
    const matrices: THREE.Matrix4[] = [];
    const colors: string[] = [];
    for (const f of flowerBeds) {
      const n = Math.round(f.r * f.r * 6);
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * (f.r - 0.2);
        matrices.push(placement(f.x + Math.cos(a) * r, 0.35, f.z + Math.sin(a) * r, 0, 0.18 + rand() * 0.08));
        colors.push(rand() < 0.75 ? f.color : "#fefce8");
      }
    }
    return { matrices, colors };
  }, []);
  return (
    <group>
      {flowerBeds.map((f, i) => (
        <mesh key={i} position={[f.x, 0.1, f.z]} receiveShadow castShadow material={mat("#5b3b25", { roughness: 1 })}>
          <cylinderGeometry args={[f.r, f.r + 0.15, 0.2, 24]} />
        </mesh>
      ))}
      <InstancedParts geometry={geo.blob} material={mat("#ffffff", { roughness: 0.6 })} matrices={matrices} colors={colors} castShadow={false} />
    </group>
  );
}

function FountainWater() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.06;
    ref.current.scale.set(s, 1 + Math.sin(clock.elapsedTime * 4) * 0.08, s);
  });
  return (
    <mesh ref={ref} position={[0, 4.1, 0]} material={mat("#bfe3ff", { transparent: true, opacity: 0.55, roughness: 0.05, emissive: "#7cc4ff", emissiveIntensity: 0.25 })}>
      <coneGeometry args={[1.5, 2, 20, 1, true]} />
    </mesh>
  );
}

export function RoundaboutIsland() {
  const flowers = useMemo(() => {
    const rand = seededRandom(91);
    const palette = ["#f43f5e", "#facc15", "#a855f7", "#fb923c", "#f472b6"];
    const matrices: THREE.Matrix4[] = [];
    const colors: string[] = [];
    for (let i = 0; i < 120; i++) {
      const a = rand() * Math.PI * 2;
      const r = 6.2 + rand() * 3;
      matrices.push(placement(Math.cos(a) * r, 0.75, Math.sin(a) * r, 0, 0.22 + rand() * 0.1));
      colors.push(palette[Math.floor(rand() * palette.length)]);
    }
    return { matrices, colors };
  }, []);
  const stone = mat("#e7e1d4", { roughness: 0.6 });
  return (
    <group position={[ROUNDABOUT.x, 0, ROUNDABOUT.z]}>
      <mesh position={[0, 0.3, 0]} material={mat("#d6d1c7", { roughness: 0.8 })} receiveShadow castShadow>
        <cylinderGeometry args={[ROUNDABOUT.island, ROUNDABOUT.island + 0.1, 0.6, 48]} />
      </mesh>
      <mesh position={[0, 0.61, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[ROUNDABOUT.island - 0.5, 48]} />
        <meshStandardMaterial color="#6fae4f" roughness={1} />
      </mesh>
      <InstancedParts geometry={geo.blob} material={mat("#ffffff", { roughness: 0.6 })} matrices={flowers.matrices} colors={flowers.colors} castShadow={false} />
      {/* Fountain */}
      <mesh position={[0, 1, 0]} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.9, 40]} />
      </mesh>
      <mesh position={[0, 1.46, 0]} rotation-x={-Math.PI / 2} material={mat("#4aa3df", { roughness: 0.05, metalness: 0.2 })}>
        <circleGeometry args={[3.8, 40]} />
      </mesh>
      <Cyl r={0.45} h={2.6} position={[0, 2.6, 0]} material={stone} />
      <mesh position={[0, 3.9, 0]} material={stone} castShadow>
        <cylinderGeometry args={[1.7, 0.5, 0.5, 32]} />
      </mesh>
      <FountainWater />
    </group>
  );
}

export function ParkingLots() {
  const asphalt = asphaltTexture();
  const lots = useMemo(
    () =>
      parkingLots.map((lot) => {
        const { minX, maxX, minZ, maxZ } = lot.rect;
        const w = maxX - minX;
        const d = maxZ - minZ;
        const stall = 2.9;
        const lines: THREE.Matrix4[] = [];
        const cars: { x: number; z: number; rot: number }[] = [];
        if (lot.stallsAlong === "x") {
          const n = Math.floor(w / stall);
          for (let i = 0; i <= n; i++) {
            const x = minX + 0.6 + i * stall;
            lines.push(placement(x, ROAD_Y - 0.01, minZ + 2.8, 0, [0.14, 1, 5]));
          }
          for (const i of lot.parkedCars) if (i < n) cars.push({ x: minX + 0.6 + (i + 0.5) * stall, z: minZ + 2.8, rot: i % 3 === 0 ? 0 : Math.PI });
        } else {
          const n = Math.floor(d / stall);
          for (let i = 0; i <= n; i++) {
            const z = minZ + 0.6 + i * stall;
            lines.push(placement(maxX - 2.8, ROAD_Y - 0.01, z, 0, [5, 1, 0.14]));
          }
          for (const i of lot.parkedCars) if (i < n) cars.push({ x: maxX - 2.8, z: minZ + 0.6 + (i + 0.5) * stall, rot: i % 2 ? Math.PI / 2 : -Math.PI / 2 });
        }
        return { lot, w, d, lines, cars };
      }),
    [],
  );
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const carColors = ["#2563eb", "#f59e0b", "#10b981", "#e11d48", "#f8fafc", "#7c3aed", "#0ea5e9", "#facc15", "#334155", "#fb7185", "#22c55e", "#a16207"];
  return (
    <group>
      {lots.map(({ lot, w, d, lines, cars }, li) => {
        const cx = (lot.rect.minX + lot.rect.maxX) / 2;
        const cz = (lot.rect.minZ + lot.rect.maxZ) / 2;
        const drive =
          lot.stallsAlong === "x"
            ? { x: cx, z: lot.rect.maxZ + 1.4, w: 6, d: 3.2 }
            : { x: lot.rect.minX - 2.5, z: cz, w: 5, d: 6 };
        return (
          <group key={lot.id}>
            <mesh position={[cx, ROAD_Y - 0.02, cz]} rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial map={asphalt} color="#7a7e86" roughness={0.9} />
            </mesh>
            <mesh position={[drive.x, ROAD_Y - 0.015, drive.z]} rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[drive.w, drive.d]} />
              <meshStandardMaterial map={asphalt} color="#7a7e86" roughness={0.9} />
            </mesh>
            <InstancedParts geometry={lineGeo} material={mat("#f8fafc", { roughness: 0.6 })} matrices={lines} castShadow={false} />
            {cars.map((c, i) => (
              <group key={i} position={[c.x, ROAD_Y - 0.02, c.z]} rotation-y={c.rot}>
                <CarModel color={carColors[(i * 5 + li * 3) % carColors.length]} variant={i % 2 ? "hatch" : "sedan"} />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
