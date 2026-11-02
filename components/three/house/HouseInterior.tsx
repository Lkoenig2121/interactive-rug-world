"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  APERTURES,
  DOORWAYS,
  HOUSE,
  HOUSE_ROOMS,
  levelY,
  SLAB,
  STAIR_VOID,
  STOREY,
  type FloorStyle,
  type HouseRoom,
  type Side,
  type WallStyle,
} from "@/lib/house/layout";
import { mat } from "@/lib/three/materials";
import { tileTexture, wallTexture, woodFloorTexture } from "@/lib/three/textures";
import { B, C, Geoms, quadXZ, rectMinusHole, S, sideFrame, wallPanels, type WallOpening } from "./kit";

const WALL_COLORS: Record<WallStyle, string> = {
  beige: "#efe3cc",
  pink: "#f7c6d9",
  tile: "#d7eef0",
  green: "#cfe0c3",
  lavender: "#e2d9ef",
  warm: "#f1d9b5",
  yellow: "#f8e7a6",
};

const materialCache = new Map<string, THREE.Material>();
function cached(key: string, make: () => THREE.Material) {
  let m = materialCache.get(key);
  if (!m) {
    m = make();
    materialCache.set(key, m);
  }
  return m;
}

function wallMaterial(style: WallStyle) {
  return cached(`wall-${style}`, () => {
    const map = style === "tile" ? tileTexture("#ffffff", "#c9dfe1", "bath-tile") : wallTexture();
    return new THREE.MeshStandardMaterial({ map, color: WALL_COLORS[style], roughness: style === "tile" ? 0.3 : 0.9 });
  });
}

function floorMaterial(style: FloorStyle) {
  return cached(`floor-${style}`, () => {
    switch (style) {
      case "wood": {
        const map = woodFloorTexture().clone();
        map.repeat.set(1, 1);
        map.needsUpdate = true;
        return new THREE.MeshStandardMaterial({ map, roughness: 0.4 });
      }
      case "tile":
        return new THREE.MeshStandardMaterial({ map: tileTexture("#f4f4f2", "#cfcfca", "bath-floor"), roughness: 0.35 });
      case "checker":
        return new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.35 });
      case "carpet-pink":
        return new THREE.MeshStandardMaterial({ color: "#f3b6cc", roughness: 1 });
    }
  });
}

let checker: THREE.CanvasTexture | null = null;
function checkerTexture() {
  if (checker) return checker;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#2f3b4a" : "#f5f1e6";
      ctx.fillRect(i * 32, j * 32, 32, 32);
    }
  checker = new THREE.CanvasTexture(c);
  checker.wrapS = checker.wrapT = THREE.RepeatWrapping;
  checker.colorSpace = THREE.SRGBColorSpace;
  return checker;
}

const FLOOR_TILE: Record<FloorStyle, number> = { wood: 220, tile: 80, checker: 120, "carpet-pink": 200 };

const SIDES: Side[] = ["n", "s", "e", "w"];

/** Openings that cut through one side of a room: outside windows/doors plus doorways to other rooms. */
function roomOpenings(room: HouseRoom, side: Side): { u: number; w: number; bottom: number; top: number }[] {
  const frame = sideFrame(room, side, true);
  const y0 = levelY(room.level);
  const out: WallOpening[] = [];
  const lineZ = side === "n" ? room.z0 : side === "s" ? room.z1 : null;
  const lineX = side === "w" ? room.x0 : side === "e" ? room.x1 : null;
  const onHouseEdge =
    (side === "n" && room.z0 === HOUSE.z0) ||
    (side === "s" && room.z1 === HOUSE.z1) ||
    (side === "w" && room.x0 === HOUSE.x0) ||
    (side === "e" && room.x1 === HOUSE.x1);
  const [lo, hi] = lineZ !== null ? [room.x0, room.x1] : [room.z0, room.z1];
  if (onHouseEdge) {
    for (const a of APERTURES) {
      if (a.side !== side || a.level !== room.level || a.c < lo || a.c > hi) continue;
      out.push({ u: frame.toU(a.c), w: a.w, bottom: y0 + a.bottom, top: y0 + a.top });
    }
  }
  for (const d of DOORWAYS) {
    if (d.level !== room.level || d.c < lo || d.c > hi) continue;
    const line = d.axis === "z" ? lineZ : lineX;
    if (line === null || Math.abs(line - d.at) > 1.6) continue;
    out.push({ u: frame.toU(d.c), w: d.w, bottom: y0, top: y0 + d.h });
  }
  return out;
}

function RoomShell({ room }: { room: HouseRoom }) {
  const y0 = levelY(room.level);
  const y1 = y0 + STOREY;
  const walls = useMemo(
    () =>
      SIDES.map((side) => {
        const f = sideFrame(room, side, true);
        const geos = wallPanels(f.length, y0, y1, roomOpenings(room, side), 150);
        return { f, geos };
      }),
    [room, y0, y1],
  );
  const floors = useMemo(() => rectMinusHole(room, room.floorHole).map((r) => quadXZ(r, y0, FLOOR_TILE[room.floor])), [room, y0]);
  const ceilings = useMemo(() => rectMinusHole(room, room.ceilingHole).map((r) => quadXZ(r, y1, 100, true)), [room, y1]);
  return (
    <group>
      {walls.map(({ f, geos }, i) => (
        <group key={i} position={f.position} rotation-y={f.rotation}>
          <Geoms geometries={geos} material={wallMaterial(room.wall)} />
        </group>
      ))}
      <Geoms geometries={floors} material={floorMaterial(room.floor)} />
      <Geoms geometries={ceilings} material={mat("#fbfaf6", { roughness: 1 })} />
    </group>
  );
}

/** White casings around doorways between rooms, on both faces. */
function DoorCasings() {
  return (
    <group>
      {DOORWAYS.map((d, i) => {
        const y = levelY(d.level);
        const along = d.axis === "z" ? "x" : "z";
        return (
          <group key={i} position={d.axis === "z" ? [d.c, y, d.at] : [d.at, y, d.c]} rotation-y={along === "x" ? 0 : Math.PI / 2}>
            {[-1, 1].map((s) => (
              <B key={s} p={[s * (d.w / 2 + 4), 0, 0]} s={[8, d.h + 8, 8]} c="#f8f6f0" rough={0.5} />
            ))}
            <B p={[0, d.h, 0]} s={[d.w + 16, 8, 8]} c="#f8f6f0" rough={0.5} />
          </group>
        );
      })}
    </group>
  );
}

const RISE = 20;
const RUN = 25;

function Stairs() {
  const y0 = levelY(0);
  const steps = Math.round((STOREY + SLAB) / RISE);
  const { x0, z0, z1 } = STAIR_VOID;
  const width = z1 - z0;
  const cz = (z0 + z1) / 2;
  const slope = Math.atan2(RISE, RUN);
  const length = Math.hypot(steps * RUN, steps * RISE);
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => (
        <group key={i}>
          <B p={[x0 + RUN * (i + 0.5), y0, cz]} s={[RUN, RISE * (i + 1) - 2, width]} c="#f4f1ea" rough={0.6} />
          <B p={[x0 + RUN * (i + 0.5), y0 + RISE * (i + 1) - 2, cz]} s={[RUN + 2, 2.5, width]} c="#8a5a36" rough={0.45} />
          <B p={[x0 + RUN * (i + 0.5), y0 + RISE * (i + 1), z1 - 3]} s={[2, 90, 2]} c="#fbfaf6" />
        </group>
      ))}
      {/* Sloped handrail */}
      <mesh
        position={[x0 + (steps * RUN) / 2, y0 + (steps * RISE) / 2 + 92, z1 - 3]}
        rotation-z={slope}
        material={mat("#6b4226", { roughness: 0.4 })}
      >
        <boxGeometry args={[length, 5, 6]} />
      </mesh>
      <C p={[x0 + 6, y0, z1 - 3]} r={5} h={110} c="#6b4226" />
    </group>
  );
}

/** Railing around the stair opening upstairs, plus the slab edge faces. */
function Landing() {
  const y = levelY(1);
  const { x0, x1, z0, z1 } = STAIR_VOID;
  const balusters = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = x0 + 6; x < x1; x += 14) out.push([x, z1 - 2]);
    for (let z = z0 + 6; z < z1; z += 14) out.push([x0 + 2, z]);
    return out;
  }, [x0, x1, z0, z1]);
  const edge = mat("#fbfaf6", { roughness: 0.8, side: THREE.DoubleSide });
  return (
    <group>
      {balusters.map(([x, z], i) => (
        <B key={i} p={[x, y, z]} s={[2.4, 92, 2.4]} c="#fbfaf6" />
      ))}
      <B p={[(x0 + x1) / 2, y + 92, z1 - 2]} s={[x1 - x0, 5, 7]} c="#6b4226" rough={0.4} />
      <B p={[x0 + 2, y + 92, (z0 + z1) / 2]} s={[7, 5, z1 - z0]} c="#6b4226" rough={0.4} />
      {(
        [
          [(x0 + x1) / 2, z0, x1 - x0, 0],
          [(x0 + x1) / 2, z1, x1 - x0, 0],
          [x0, (z0 + z1) / 2, z1 - z0, Math.PI / 2],
          [x1, (z0 + z1) / 2, z1 - z0, Math.PI / 2],
        ] as const
      ).map(([x, z, len, rot], i) => (
        <mesh key={i} position={[x, y - SLAB / 2, z]} rotation-y={rot} material={edge}>
          <planeGeometry args={[len, SLAB]} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ p, shade = "#f6ead2" }: { p: [number, number, number]; shade?: string }) {
  return (
    <group position={p}>
      <C p={[0, 0, 0]} r={[5, 8]} h={4} c="#3f3a35" />
      <C p={[0, 4, 0]} r={1.2} h={34} c="#c9a347" metal={0.7} rough={0.3} />
      <mesh position={[0, 46, 0]} material={mat(shade, { roughness: 0.9, emissive: "#ffe9b8", emissiveIntensity: 0.35 })}>
        <cylinderGeometry args={[9, 14, 18, 20, 1, true]} />
      </mesh>
    </group>
  );
}

function Sofa({ p, r = 0, c, len = 220 }: { p: [number, number, number]; r?: number; c: string; len?: number }) {
  return (
    <group position={p} rotation-y={r}>
      <B p={[0, 0, 0]} s={[len, 42, 90]} c={c} rough={0.95} />
      <B p={[0, 42, -36]} s={[len, 45, 18]} c={c} rough={0.95} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (len / 2 - 10), 42, 0]} s={[20, 22, 90]} c={c} rough={0.95} />
      ))}
      {[-1, 0, 1].map((s) => (
        <B key={s} p={[s * (len / 3.2), 42, 4]} s={[len / 3.4, 10, 64]} c={c} rough={1} />
      ))}
    </group>
  );
}

function Bed({ p, r = 0, w = 160, l = 210, spread, head = "#6b4226" }: { p: [number, number, number]; r?: number; w?: number; l?: number; spread: string; head?: string }) {
  return (
    <group position={p} rotation-y={r}>
      <B p={[0, 0, l / 2]} s={[w, 30, l]} c={head} rough={0.5} />
      <B p={[0, 30, l / 2]} s={[w - 6, 22, l - 6]} c="#f8f8f4" rough={0.9} />
      <B p={[0, 44, l / 2 + 30]} s={[w + 6, 12, l - 54]} c={spread} rough={0.9} />
      <B p={[0, 0, 2]} s={[w + 10, 120, 6]} c={head} rough={0.5} />
      {[-1, 1].map((s) => (
        <B key={s} p={[(s * w) / 4.2, 52, 30]} s={[w / 2.5, 12, 30]} c="#ffffff" rough={0.9} />
      ))}
    </group>
  );
}

function Chair({ p, r = 0, c = "#8a5a36" }: { p: [number, number, number]; r?: number; c?: string }) {
  return (
    <group position={p} rotation-y={r}>
      <B p={[0, 44, 0]} s={[42, 4, 42]} c={c} />
      <B p={[0, 48, -19]} s={[42, 48, 4]} c={c} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * 18, 0, sz * 18]} s={[3.5, 44, 3.5]} c={c} />))}
    </group>
  );
}

function Table({ p, w, d, h = 76, c = "#9b6b43" }: { p: [number, number, number]; w: number; d: number; h?: number; c?: string }) {
  return (
    <group position={p}>
      <B p={[0, h - 4, 0]} s={[w, 4, d]} c={c} rough={0.45} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * (w / 2 - 6), 0, sz * (d / 2 - 6)]} s={[5, h - 4, 5]} c={c} />))}
    </group>
  );
}

function Rug({ p, w, d, c, r = 0 }: { p: [number, number, number]; w: number; d: number; c: string; r?: number }) {
  return <B p={[p[0], p[1] + 0.3, p[2]]} s={[w, 0.8, d]} c={c} r={r} rough={1} />;
}

function Frame({ p, r, w, h, c }: { p: [number, number, number]; r: number; w: number; h: number; c: string }) {
  return (
    <group position={p} rotation-y={r}>
      <B p={[0, -h / 2 - 4, 0]} s={[w + 8, h + 8, 3]} c="#3a2a1d" />
      <mesh position={[0, 0, 1.7]} material={mat(c, { roughness: 0.9 })}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

function Hall() {
  const y = levelY(1);
  return (
    <group>
      <Rug p={[-180, y, -361]} w={1000} d={80} c="#8b2e2e" />
      <Table p={[330, y, -440]} w={80} d={32} />
      <Lamp p={[330, y + 76, -440]} />
      <Frame p={[0, y + 170, -263]} r={Math.PI} w={60} h={45} c="#a3c4bc" />
      <Frame p={[-450, y + 170, -263]} r={Math.PI} w={50} h={60} c="#e7c8a0" />
      <Frame p={[100, y + 165, -459]} r={0} w={70} h={50} c="#c8b6e2" />
    </group>
  );
}

function SistersRoom() {
  const y = levelY(1);
  return (
    <group>
      <Rug p={[150, y, -590]} w={180} d={150} c="#fde68a" />
      {/* Crib */}
      <group position={[360, y, -640]}>
        <B p={[0, 30, 0]} s={[70, 6, 130]} c="#ffffff" />
        <B p={[0, 36, 0]} s={[64, 10, 124]} c="#bfdbfe" rough={0.9} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <B p={[s * 35, 0, 0]} s={[3, 100, 130]} c="#ffffff" />
            {Array.from({ length: 9 }, (_, i) => (
              <B key={i} p={[i * 7 - 28, 36, s * 65]} s={[2, 60, 2]} c="#ffffff" />
            ))}
          </group>
        ))}
      </group>
      <B p={[-60, y, -700]} s={[90, 80, 40]} c="#ffffff" rough={0.5} />
      <S p={[-80, y + 92, -700]} r={10} c="#f9a8d4" />
      <B p={[60, y, -700]} s={[60, 40, 36]} c="#f472b6" rough={0.6} />
      <S p={[200, y + 10, -520]} r={10} c="#60a5fa" />
    </group>
  );
}

function Bathroom() {
  const y = levelY(1);
  return (
    <group>
      <B p={[-405, y, -620]} s={[80, 55, 170]} c="#ffffff" rough={0.2} />
      <B p={[-405, y + 50, -620]} s={[64, 5, 154]} c="#bae6fd" rough={0.05} />
      <B p={[-250, y, -700]} s={[40, 42, 40]} c="#ffffff" rough={0.2} />
      <B p={[-250, y + 42, -712]} s={[42, 40, 16]} c="#ffffff" rough={0.2} />
      <B p={[-180, y, -560]} s={[50, 85, 90]} c="#9ca3af" rough={0.5} />
      <B p={[-180, y + 85, -560]} s={[54, 4, 94]} c="#f3f4f6" rough={0.2} />
      <B p={[-152 - 2, y + 120, -560]} s={[2, 70, 60]} c="#dbeafe" rough={0.05} metal={0.6} />
      <Rug p={[-300, y, -560]} w={80} d={50} c="#60a5fa" />
    </group>
  );
}

function Study() {
  const y = levelY(1);
  return (
    <group>
      <Table p={[-850, y, -675]} w={150} d={70} c="#6b4226" />
      <B p={[-870, y + 76, -690]} s={[40, 32, 36]} c="#e5e1d6" rough={0.5} />
      <B p={[-870, y + 86, -671]} s={[30, 22, 1]} c="#1f2a33" rough={0.1} />
      <B p={[-820, y + 76, -660]} s={[44, 2, 16]} c="#d6d3cb" />
      <Chair p={[-850, y, -610]} r={Math.PI} c="#334155" />
      <group position={[-470, y, -620]}>
        <B p={[0, 0, 0]} s={[34, 200, 140]} c="#8a6243" />
        {[40, 80, 120, 160].map((h, i) => (
          <B key={h} p={[-2, h, 0]} s={[28, 30, 130]} c={["#7f1d1d", "#1e3a8a", "#065f46", "#a16207"][i]} rough={0.8} />
        ))}
      </group>
      <Rug p={[-900, y, -580]} w={200} d={120} c="#475569" />
    </group>
  );
}

function ParentsRoom() {
  const y = levelY(1);
  return (
    <group>
      <Bed p={[-1030, y, -258]} spread="#7c8db5" head="#5a3a22" />
      {[-1135, -925].map((x) => (
        <group key={x}>
          <B p={[x, y, -235]} s={[45, 55, 40]} c="#5a3a22" />
          <Lamp p={[x, y + 55, -235]} />
        </group>
      ))}
      <B p={[-480, y, 200]} s={[50, 90, 150]} c="#5a3a22" />
      <B p={[-456, y + 110, 200]} s={[2, 90, 70]} c="#cbd5e1" rough={0.05} metal={0.7} />
      <Sofa p={[-750, y, 420]} r={Math.PI} c="#a78b6d" len={90} />
      <Rug p={[-1030, y, 40]} w={260} d={200} c="#c4b5a0" />
    </group>
  );
}

function LivingRoom() {
  const y = levelY(0);
  return (
    <group>
      <Rug p={[180, y, 210]} w={300} d={260} c="#9a3b3b" />
      <Sofa p={[20, y, 210]} r={Math.PI / 2} c="#4a6b8a" />
      <Sofa p={[200, y, 430]} r={Math.PI} c="#4a6b8a" len={110} />
      <Table p={[190, y, 210]} w={70} d={120} h={42} c="#6b4226" />
      {/* Fireplace on the outside wall */}
      <group position={[450, y, 175]} rotation-y={-Math.PI / 2}>
        <B p={[0, 0, 22]} s={[200, 130, 44]} c="#a5543a" rough={0.9} />
        <B p={[0, 22, 44.5]} s={[80, 70, 1]} c="#1c1917" rough={0.9} />
        <B p={[0, 130, 26]} s={[220, 8, 52]} c="#f5f5f0" />
        <B p={[0, 138, 10]} s={[150, 192, 20]} c="#a5543a" rough={0.9} />
        <Frame p={[0, 230, 21]} r={0} w={90} h={60} c="#6d9fc7" />
      </group>
      <B p={[-200, y, 505]} s={[160, 55, 30]} c="#5a3a22" />
      <B p={[-200, y + 55, 505]} s={[70, 52, 45]} c="#2b2d31" rough={0.5} />
      <Lamp p={[-380, y + 100, -60]} />
      <B p={[-380, y, -60]} s={[40, 100, 40]} c="#6b4226" />
      <group position={[-430, y, 50]}>
        <B p={[0, 0, 0]} s={[34, 180, 110]} c="#8a6243" />
      </group>
    </group>
  );
}

function Kitchen() {
  const y = levelY(0);
  const counter = "#f7f4ec";
  const top = "#c9c4b8";
  return (
    <group>
      {/* Counters along the north and east walls */}
      <B p={[-215, y, -690]} s={[430, 90, 60]} c={counter} rough={0.5} />
      <B p={[-215, y + 90, -690]} s={[434, 4, 64]} c={top} rough={0.3} />
      <B p={[420, y, -460]} s={[60, 90, 460]} c={counter} rough={0.5} />
      <B p={[420, y + 90, -460]} s={[64, 4, 464]} c={top} rough={0.3} />
      <B p={[420, y + 94, -620]} s={[54, 3, 60]} c="#1f2937" rough={0.4} />
      <B p={[-250, y + 82, -690]} s={[60, 10, 40]} c="#9ca3af" metal={0.6} rough={0.3} />
      {/* Upper cabinets */}
      <B p={[-90, y + 150, -700]} s={[200, 70, 36]} c={counter} />
      <B p={[432, y + 150, -270]} s={[36, 70, 160]} c={counter} />
      {/* Fridge */}
      <B p={[-410, y, -680]} s={[76, 190, 70]} c="#e5e7eb" rough={0.25} metal={0.3} />
      {/* Island and dining table */}
      <B p={[20, y, -430]} s={[200, 88, 90]} c="#6b8e9b" rough={0.5} />
      <B p={[20, y + 88, -430]} s={[210, 5, 100]} c={top} rough={0.3} />
      <Table p={[-250, y, -250]} w={150} d={90} />
      {[
        [-300, -305, 0],
        [-200, -305, 0],
        [-300, -195, Math.PI],
        [-200, -195, Math.PI],
      ].map(([x, z, r], i) => (
        <Chair key={i} p={[x, y, z]} r={r} />
      ))}
      <S p={[-250, y + 82, -250]} r={12} c="#f59e0b" scale={[1, 0.5, 1]} />
    </group>
  );
}

function Foyer() {
  const y = levelY(0);
  return (
    <group>
      <Rug p={[-800, y, 440]} w={140} d={90} c="#7c2d12" />
      <B p={[-1180, y, 300]} s={[50, 45, 130]} c="#6b4226" />
      <group position={[-560, y, 470]}>
        <C p={[0, 0, 0]} r={[4, 14]} h={4} c="#3f3a35" />
        <C p={[0, 4, 0]} r={2} h={170} c="#3f3a35" />
        <S p={[0, 140, 6]} r={14} c="#1e40af" scale={[1, 1.6, 0.6]} />
      </group>
      <Sofa p={[-860, y, -100]} r={Math.PI} c="#7a6a55" />
      <Table p={[-860, y, -10]} w={110} d={55} h={42} c="#6b4226" />
      <B p={[-860, y, 160]} s={[150, 55, 40]} c="#5a3a22" />
      <B p={[-860, y + 55, 160]} s={[90, 55, 8]} c="#111827" rough={0.15} />
      <Rug p={[-860, y, 30]} w={260} d={200} c="#a3a380" />
      <Lamp p={[-1180, y + 45, 330]} />
    </group>
  );
}

/** Everything inside the house except Andy's room. */
export function HouseInterior() {
  return (
    <group>
      {HOUSE_ROOMS.map((r) => (
        <RoomShell key={r.id} room={r} />
      ))}
      <DoorCasings />
      <Stairs />
      <Landing />
      <Hall />
      <SistersRoom />
      <Bathroom />
      <Study />
      <ParentsRoom />
      <LivingRoom />
      <Kitchen />
      <Foyer />
    </group>
  );
}
