"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fabricTexture, skyTexture, wallTexture, woodFloorTexture } from "@/lib/three/textures";
import { seededRandom } from "@/lib/world/geometry";
import { FLOOR_Y } from "@/lib/world/roads";

export const ROOM = {
  minX: -450,
  maxX: 450,
  minZ: -260,
  maxZ: 520,
  height: 330,
};

const WINDOWS = [
  { x: -150, w: 170 },
  { x: 150, w: 170 },
];
const WIN_BOTTOM = FLOOR_Y + 28;
const WIN_TOP = FLOOR_Y + 268;

function useRepeated(tex: THREE.Texture, rx: number, ry: number) {
  return useMemo(() => {
    const t = tex.clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return t;
  }, [tex, rx, ry]);
}

function Floor() {
  const w = ROOM.maxX - ROOM.minX;
  const d = ROOM.maxZ - ROOM.minZ;
  const map = useRepeated(woodFloorTexture(), w / 170, d / 170);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, (ROOM.minZ + ROOM.maxZ) / 2]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} roughness={0.42} metalness={0.02} envMapIntensity={0.7} />
    </mesh>
  );
}

function Walls() {
  const map = useRepeated(wallTexture(), 6, 2);
  const w = ROOM.maxX - ROOM.minX;
  const d = ROOM.maxZ - ROOM.minZ;
  const cy = FLOOR_Y + ROOM.height / 2;
  const mat = <meshStandardMaterial map={map} color="#f3ece1" roughness={0.95} />;
  return (
    <group>
      {/* Back wall, built around the window openings */}
      <BackWall />
      <mesh position={[ROOM.minX, cy, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[d, ROOM.height]} />
        {mat}
      </mesh>
      <mesh position={[ROOM.maxX, cy, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[d, ROOM.height]} />
        {mat}
      </mesh>
      <mesh position={[0, cy, ROOM.maxZ]} rotation-y={Math.PI} receiveShadow>
        <planeGeometry args={[w, ROOM.height]} />
        {mat}
      </mesh>
      <mesh position={[0, FLOOR_Y + ROOM.height, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f7f3ec" roughness={1} />
      </mesh>
      {/* Baseboards */}
      {[
        [0, ROOM.minZ + 1, w, 0],
        [0, ROOM.maxZ - 1, w, Math.PI],
        [ROOM.minX + 1, (ROOM.minZ + ROOM.maxZ) / 2, d, Math.PI / 2],
        [ROOM.maxX - 1, (ROOM.minZ + ROOM.maxZ) / 2, d, -Math.PI / 2],
      ].map(([x, z, len, rot], i) => (
        <mesh key={i} position={[x, FLOOR_Y + 6, z]} rotation-y={rot}>
          <boxGeometry args={[len, 12, 2]} />
          <meshStandardMaterial color="#f8f6f1" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function BackWall() {
  const map = useRepeated(wallTexture(), 6, 2);
  const z = ROOM.minZ;
  const panels: [number, number, number, number][] = [];
  // Horizontal bands below and above the windows
  const fullW = ROOM.maxX - ROOM.minX;
  panels.push([0, (FLOOR_Y + WIN_BOTTOM) / 2, fullW, WIN_BOTTOM - FLOOR_Y]);
  const top = FLOOR_Y + ROOM.height;
  panels.push([0, (WIN_TOP + top) / 2, fullW, top - WIN_TOP]);
  // Vertical piers between windows
  const edges = [ROOM.minX, ...WINDOWS.flatMap((wi) => [wi.x - wi.w / 2, wi.x + wi.w / 2]), ROOM.maxX];
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    panels.push([(a + b) / 2, (WIN_BOTTOM + WIN_TOP) / 2, b - a, WIN_TOP - WIN_BOTTOM]);
  }
  return (
    <group>
      {panels.map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={map} color="#f3ece1" roughness={0.95} />
        </mesh>
      ))}
      {WINDOWS.map((wi) => (
        <WindowFrame key={wi.x} x={wi.x} w={wi.w} />
      ))}
    </group>
  );
}

function WindowFrame({ x, w }: { x: number; w: number }) {
  const sky = skyTexture();
  const h = WIN_TOP - WIN_BOTTOM;
  const cy = (WIN_TOP + WIN_BOTTOM) / 2;
  const z = ROOM.minZ;
  const frame = <meshStandardMaterial color="#fbfaf7" roughness={0.5} />;
  return (
    <group>
      {/* Daylight beyond the glass */}
      <mesh position={[x, cy, z - 6]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <mesh position={[x, cy, z - 2]}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.05} metalness={0} />
      </mesh>
      {/* Frame */}
      <mesh position={[x, WIN_TOP + 3, z + 2]}>
        <boxGeometry args={[w + 12, 6, 8]} />
        {frame}
      </mesh>
      <mesh position={[x, WIN_BOTTOM - 2, z + 6]} castShadow>
        <boxGeometry args={[w + 22, 4, 16]} />
        {frame}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[x + s * (w / 2 + 3), cy, z + 2]}>
          <boxGeometry args={[6, h + 6, 8]} />
          {frame}
        </mesh>
      ))}
      <mesh position={[x, cy, z]}>
        <boxGeometry args={[4, h, 5]} />
        {frame}
      </mesh>
      {[0.36, 0.72].map((f) => (
        <mesh key={f} position={[x, WIN_BOTTOM + h * f, z]}>
          <boxGeometry args={[w, 3, 5]} />
          {frame}
        </mesh>
      ))}
    </group>
  );
}

function Curtain({ x, width, flip }: { x: number; width: number; flip?: boolean }) {
  const height = WIN_TOP - FLOOR_Y + 30;
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 64, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const t = px / width + 0.5;
      const bunch = flip ? 1 - t : t;
      const amp = 3 + bunch * 2.5;
      pos.setZ(i, Math.sin(t * Math.PI * 2 * 7) * amp);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height, flip]);
  const map = useRepeated(fabricTexture(), 3, 6);
  return (
    <mesh geometry={geometry} position={[x, FLOOR_Y + height / 2 + 1, ROOM.minZ + 20]} castShadow receiveShadow>
      <meshStandardMaterial map={map} color="#eadbc2" roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Curtains() {
  return (
    <group>
      {WINDOWS.map((wi) => (
        <group key={wi.x}>
          <Curtain x={wi.x - wi.w / 2 - 6} width={66} />
          <Curtain x={wi.x + wi.w / 2 + 6} width={66} flip />
          <mesh position={[wi.x, WIN_TOP + 34, ROOM.minZ + 21]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[1.4, 1.4, wi.w + 110, 12]} />
            <meshStandardMaterial color="#3b3027" metalness={0.6} roughness={0.35} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[wi.x + s * (wi.w / 2 + 55), WIN_TOP + 34, ROOM.minZ + 21]}>
              <sphereGeometry args={[3, 16, 12]} />
              <meshStandardMaterial color="#3b3027" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Bookshelf() {
  const books = useMemo(() => {
    const rand = seededRandom(88);
    const out: { x: number; y: number; w: number; h: number; color: string }[] = [];
    const colors = ["#7f1d1d", "#1e3a8a", "#065f46", "#a16207", "#6b21a8", "#334155", "#be123c", "#0f766e"];
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -82;
      while (x < 80) {
        const w = 3 + rand() * 4;
        const h = 22 + rand() * 12;
        if (rand() > 0.12) out.push({ x: x + w / 2, y: shelf * 45 + 4 + h / 2, w, h, color: colors[Math.floor(rand() * colors.length)] });
        x += w + 0.4;
      }
    }
    return out;
  }, []);
  return (
    <group position={[ROOM.minX + 20, FLOOR_Y, 120]} rotation-y={Math.PI / 2}>
      <mesh position={[0, 92, -18]} castShadow receiveShadow>
        <boxGeometry args={[176, 184, 4]} />
        <meshStandardMaterial color="#8a6243" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 88, 92, 0]} castShadow>
          <boxGeometry args={[4, 184, 38]} />
          <meshStandardMaterial color="#8a6243" roughness={0.7} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, i * 45 + 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[176, 3, 38]} />
          <meshStandardMaterial color="#9b704d" roughness={0.7} />
        </mesh>
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, -2]} castShadow>
          <boxGeometry args={[b.w, b.h, 24]} />
          <meshStandardMaterial color={b.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Plant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const leaves = useMemo(() => {
    const rand = seededRandom(Math.floor(x * 13 + z));
    return Array.from({ length: 14 }, () => ({
      p: [(rand() - 0.5) * 50, 70 + rand() * 80, (rand() - 0.5) * 50] as [number, number, number],
      s: 10 + rand() * 9,
      r: [rand() * 2, rand() * 3, rand()] as [number, number, number],
    }));
  }, [x, z]);
  return (
    <group position={[x, FLOOR_Y, z]} scale={scale}>
      <mesh position={[0, 22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[20, 15, 44, 28]} />
        <meshStandardMaterial color="#c9b9a3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 60, 0]}>
        <cylinderGeometry args={[1.2, 1.6, 80, 8]} />
        <meshStandardMaterial color="#5b4630" />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} rotation={l.r} scale={[l.s, l.s * 0.25, l.s * 0.7]} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={i % 3 ? "#2f6b34" : "#3f8a43"} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ToyBlocks() {
  const blocks: [number, number, number, number, string][] = [
    [190, 30, 0.3, 9, "#ef4444"],
    [201, 36, -0.4, 9, "#3b82f6"],
    [194, 33, 0.1, 9, "#facc15"],
    [178, 58, 0.7, 8, "#22c55e"],
  ];
  return (
    <group>
      {blocks.map(([x, z, r, s, c], i) => (
        <mesh key={i} position={[x, FLOOR_Y + s / 2 + (i === 2 ? s : 0), z]} rotation-y={r} castShadow receiveShadow>
          <boxGeometry args={[s, s, s]} />
          <meshStandardMaterial color={c} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Frames() {
  return (
    <group>
      {[
        [ROOM.maxX - 1, 170, 60, 80, 60, "#a3c4bc"],
        [ROOM.maxX - 1, 180, 180, 60, 80, "#e7c8a0"],
      ].map(([x, y, z, w, h, c], i) => (
        <group key={i} position={[x as number, FLOOR_Y + (y as number), z as number]} rotation-y={-Math.PI / 2}>
          <mesh castShadow>
            <boxGeometry args={[(w as number) + 8, (h as number) + 8, 3]} />
            <meshStandardMaterial color="#3a2a1d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 1.6]}>
            <planeGeometry args={[w as number, h as number]} />
            <meshStandardMaterial color={c as string} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function RoomLighting() {
  return (
    <group>
      <hemisphereLight args={["#fdf6e8", "#8a6a4a", 0.55]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[-140, 330, -250]}
        intensity={2.4}
        color="#fff3df"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-185}
        shadow-camera-right={185}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-camera-near={50}
        shadow-camera-far={900}
      />
      <directionalLight position={[120, 260, 400]} intensity={0.45} color="#e8eeff" />
      <pointLight position={[0, FLOOR_Y + ROOM.height - 60, 140]} intensity={8000} distance={900} decay={2} color="#ffe2b8" />
    </group>
  );
}

export function RoomScene() {
  return (
    <group>
      <Floor />
      <Walls />
      <Curtains />
      <Bookshelf />
      <Plant x={-375} z={-200} />
      <Plant x={385} z={-205} scale={0.85} />
      <ToyBlocks />
      <Frames />
      {/* Pendant lamp */}
      <group position={[0, FLOOR_Y + ROOM.height, 140]}>
        <mesh position={[0, -30, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 60, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, -66, 0]}>
          <coneGeometry args={[22, 18, 32, 1, true]} />
          <meshStandardMaterial color="#e8dcc8" side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        <mesh position={[0, -70, 0]}>
          <sphereGeometry args={[5, 16, 12]} />
          <meshBasicMaterial color="#fff2d6" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
