"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ribbonGeometry } from "@/lib/three/ribbon";
import {
  cowboyPosterTexture,
  globeTexture,
  labelTexture,
  spaceBedspreadTexture,
  starBallTexture,
  starWallpaperTexture,
  woodFloorTexture,
} from "@/lib/three/textures";
import { seededRandom } from "@/lib/world/geometry";
import { FLOOR_Y } from "@/lib/world/roads";

export const ROOM = {
  minX: -450,
  maxX: 450,
  minZ: -260,
  maxZ: 520,
  height: 330,
};

const CEILING_Y = FLOOR_Y + ROOM.height;
const ROOM_CZ = (ROOM.minZ + ROOM.maxZ) / 2;
/** Wallpaper repeat size in cm, shared by every wall so the stars line up across panels. */
const WALLPAPER_TILE = 150;
const WHITE_TRIM = "#f6f3ec";
const BED_WOOD = "#c4542b";
const PINE = "#d8a465";

interface Opening {
  /** Center along the wall (local x). */
  u: number;
  w: number;
  bottom: number;
  top: number;
}

const BACK_DOORS = [
  { u: -205, w: 92, open: -0.95 },
  { u: 170, w: 92, open: 0 },
];
const DOOR_H = 212;
const RIGHT_WINDOW: Opening = { u: 100, w: 150, bottom: FLOOR_Y + 95, top: FLOOR_Y + 250 };
/** Front wall windows; the front wall faces -z so its local x runs along world -x. */
const FRONT_WINDOWS: Opening[] = [-200, 200].map((x) => ({ u: -x, w: 120, bottom: FLOOR_Y + 95, top: FLOOR_Y + 245 }));

function wallPanelGeometry(u0: number, u1: number, y0: number, y1: number) {
  const g = new THREE.PlaneGeometry(u1 - u0, y1 - y0);
  g.translate((u0 + u1) / 2, (y0 + y1) / 2, 0);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / WALLPAPER_TILE, pos.getY(i) / WALLPAPER_TILE);
  return g;
}

/** A wallpapered wall in local space (x along the wall, +z into the room) with rectangular openings. */
function Wall({ length, openings = [], position, rotation = 0 }: { length: number; openings?: Opening[]; position: [number, number, number]; rotation?: number }) {
  const map = starWallpaperTexture();
  const geometries = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    let cursor = -length / 2;
    for (const o of [...openings].sort((a, b) => a.u - b.u)) {
      const a = o.u - o.w / 2;
      const b = o.u + o.w / 2;
      if (a > cursor) out.push(wallPanelGeometry(cursor, a, FLOOR_Y, CEILING_Y));
      if (o.bottom > FLOOR_Y) out.push(wallPanelGeometry(a, b, FLOOR_Y, o.bottom));
      if (o.top < CEILING_Y) out.push(wallPanelGeometry(a, b, o.top, CEILING_Y));
      cursor = b;
    }
    if (cursor < length / 2) out.push(wallPanelGeometry(cursor, length / 2, FLOOR_Y, CEILING_Y));
    return out;
  }, [length, openings]);
  return (
    <group position={position} rotation-y={rotation}>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial map={map} roughness={0.9} />
        </mesh>
      ))}
      {/* Baseboard */}
      <mesh position={[0, FLOOR_Y + 6, 1]}>
        <boxGeometry args={[length, 12, 2]} />
        <meshStandardMaterial color={WHITE_TRIM} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Floor() {
  const w = ROOM.maxX - ROOM.minX;
  const d = ROOM.maxZ - ROOM.minZ;
  const map = woodFloorTexture();
  map.repeat.set(w / 220, d / 220);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, ROOM_CZ]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} color="#ffffff" roughness={0.38} metalness={0} envMapIntensity={0.6} />
    </mesh>
  );
}

function Walls() {
  const w = ROOM.maxX - ROOM.minX;
  const d = ROOM.maxZ - ROOM.minZ;
  const backOpenings = useMemo<Opening[]>(
    () => BACK_DOORS.filter((door) => door.open !== 0).map((door) => ({ u: door.u, w: door.w, bottom: FLOOR_Y, top: FLOOR_Y + DOOR_H })),
    [],
  );
  const rightOpenings = useMemo(() => [RIGHT_WINDOW], []);
  return (
    <group>
      <Wall length={w} openings={backOpenings} position={[0, 0, ROOM.minZ]} />
      <Wall length={d} position={[ROOM.minX, 0, ROOM_CZ]} rotation={Math.PI / 2} />
      <group position={[ROOM.maxX, 0, ROOM_CZ]} rotation-y={-Math.PI / 2}>
        <Window {...RIGHT_WINDOW} />
      </group>
      <Wall length={d} openings={rightOpenings} position={[ROOM.maxX, 0, ROOM_CZ]} rotation={-Math.PI / 2} />
      <group position={[0, 0, ROOM.maxZ]} rotation-y={Math.PI}>
        {FRONT_WINDOWS.map((o) => (
          <Window key={o.u} {...o} />
        ))}
      </group>
      <Wall length={w} openings={FRONT_WINDOWS} position={[0, 0, ROOM.maxZ]} rotation={Math.PI} />
      <mesh position={[0, CEILING_Y, ROOM_CZ]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#d6ecfa" roughness={1} />
      </mesh>
    </group>
  );
}

/** Window in wall-local space, looking out onto the real neighborhood. */
function Window({ u, w, bottom, top }: Opening) {
  const h = top - bottom;
  const cy = (top + bottom) / 2;
  const frame = <meshStandardMaterial color={WHITE_TRIM} roughness={0.5} />;
  return (
    <group position-x={u}>
      {/* Jambs spanning the wall thickness */}
      {[-1, 1].map((s) => (
        <mesh key={`j${s}`} position={[s * (w / 2), cy, -3]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[8, h]} />
          <meshStandardMaterial color={WHITE_TRIM} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, cy, -2]}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} />
      </mesh>
      <mesh position={[0, top + 4, 2]}>
        <boxGeometry args={[w + 16, 8, 6]} />
        {frame}
      </mesh>
      <mesh position={[0, bottom - 2, 6]} castShadow>
        <boxGeometry args={[w + 24, 4, 14]} />
        {frame}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 4), cy, 2]}>
          <boxGeometry args={[8, h + 8, 6]} />
          {frame}
        </mesh>
      ))}
      <mesh position={[0, cy, 0]}>
        <boxGeometry args={[4, h, 4]} />
        {frame}
      </mesh>
      <mesh position={[0, cy, 0]}>
        <boxGeometry args={[w, 4, 4]} />
        {frame}
      </mesh>
    </group>
  );
}

/** Six-panel white door with casing; `open` swings the leaf into the room (radians). */
function Door({ u, w, open }: { u: number; w: number; open: number }) {
  const white = <meshStandardMaterial color={WHITE_TRIM} roughness={0.45} />;
  const leafW = w - 4;
  const leafH = DOOR_H - 3;
  const panels: [number, number, number, number][] = [
    [-leafW * 0.22, leafH * 0.83, leafW * 0.34, leafH * 0.2],
    [leafW * 0.22, leafH * 0.83, leafW * 0.34, leafH * 0.2],
    [-leafW * 0.22, leafH * 0.52, leafW * 0.34, leafH * 0.32],
    [leafW * 0.22, leafH * 0.52, leafW * 0.34, leafH * 0.32],
    [-leafW * 0.22, leafH * 0.18, leafW * 0.34, leafH * 0.26],
    [leafW * 0.22, leafH * 0.18, leafW * 0.34, leafH * 0.26],
  ];
  return (
    <group position={[u, FLOOR_Y, ROOM.minZ]}>
      {/* Casing */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 4), DOOR_H / 2, 1.5]}>
          <boxGeometry args={[8, DOOR_H, 3]} />
          {white}
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + 4, 1.5]}>
        <boxGeometry args={[w + 16, 8, 3]} />
        {white}
      </mesh>
      <group position={[-leafW / 2, 0, 2]} rotation-y={open}>
        <mesh position={[leafW / 2, leafH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[leafW, leafH, 4]} />
          {white}
        </mesh>
        {[-1, 1].map((side) =>
          panels.map(([x, y, pw, ph], i) => (
            <mesh key={`${side}-${i}`} position={[leafW / 2 + x, y, side * 2.3]}>
              <boxGeometry args={[pw, ph, 0.8]} />
              <meshStandardMaterial color="#fbf9f4" roughness={0.4} />
            </mesh>
          )),
        )}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[leafW - 8, 96, side * 5]} castShadow>
            <sphereGeometry args={[2.6, 16, 12]} />
            <meshStandardMaterial color="#d8b25a" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PiggyBank({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const pink = <meshStandardMaterial color="#f4a3b8" roughness={0.35} />;
  return (
    <group position={position} scale={scale} rotation-y={0.5}>
      <mesh position={[0, 9, 0]} scale={[1.3, 1, 1]} castShadow>
        <sphereGeometry args={[8, 24, 18]} />
        {pink}
      </mesh>
      <mesh position={[10.5, 9.5, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[3, 3, 2.5, 16]} />
        {pink}
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 5.5, 2, sz * 4]}>
            <cylinderGeometry args={[1.6, 1.6, 4, 10]} />
            {pink}
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[6, 16, s * 3.5]} rotation-z={-0.4}>
          <coneGeometry args={[2.2, 4, 3]} />
          {pink}
        </mesh>
      ))}
      <mesh position={[0, 17, 0]}>
        <boxGeometry args={[4, 0.6, 0.8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}

function Dresser() {
  const white = <meshStandardMaterial color="#f7f4ec" roughness={0.45} />;
  const W = 96;
  const D = 48;
  const H = 108;
  const drawers = [0, 1, 2, 3];
  const globe = globeTexture();
  return (
    <group position={[-20, FLOOR_Y, ROOM.minZ + D / 2 + 1]}>
      <mesh position={[0, 8 + (H - 8) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H - 8, D]} />
        {white}
      </mesh>
      <mesh position={[0, H + 1.5, 1]} castShadow>
        <boxGeometry args={[W + 6, 3, D + 4]} />
        {white}
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 5), 4, sz * (D / 2 - 5)]}>
            <cylinderGeometry args={[2.5, 2, 8, 10]} />
            {white}
          </mesh>
        )),
      )}
      {drawers.map((i) => {
        const y = 14 + i * 23.5 + 10;
        const pull = i === 0 ? 14 : i === 1 ? 5 : 0;
        return (
          <group key={i} position={[0, y, D / 2 + pull]}>
            <mesh castShadow>
              <boxGeometry args={[W - 8, 20, 3]} />
              <meshStandardMaterial color="#fdfbf6" roughness={0.4} />
            </mesh>
            {pull > 0 && (
              <mesh position={[0, -1, -pull / 2]}>
                <boxGeometry args={[W - 10, 16, pull]} />
                {white}
              </mesh>
            )}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 22, 0, 2.5]}>
                <sphereGeometry args={[2, 12, 10]} />
                <meshStandardMaterial color="#e9e3d4" roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Globe */}
      <group position={[-22, H + 3, 4]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[7, 8, 3, 20]} />
          <meshStandardMaterial color="#3b2a1e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 12, 8]} />
          <meshStandardMaterial color="#c9a347" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 26, 0]} rotation-z={0.4} castShadow>
          <sphereGeometry args={[14, 32, 24]} />
          <meshStandardMaterial map={globe} roughness={0.35} />
        </mesh>
        <mesh position={[0, 26, 0]} rotation-z={0.4}>
          <torusGeometry args={[15.5, 0.7, 8, 40, Math.PI * 1.2]} />
          <meshStandardMaterial color="#c9a347" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <PiggyBank position={[20, H + 3, 6]} scale={0.9} />
      {/* Toy truck */}
      <group position={[4, H + 3, -8]} rotation-y={-0.3}>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[18, 6, 9]} />
          <meshStandardMaterial color="#2f8f4e" roughness={0.4} />
        </mesh>
        <mesh position={[5, 10, 0]}>
          <boxGeometry args={[7, 5, 8]} />
          <meshStandardMaterial color="#2f8f4e" roughness={0.4} />
        </mesh>
        {[-6, 6].flatMap((x) =>
          [-5, 5].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 2, z]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[2.2, 2.2, 1.5, 12]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Bed() {
  const wood = <meshStandardMaterial color={BED_WOOD} roughness={0.38} />;
  const spread = spaceBedspreadTexture();
  const x0 = ROOM.maxX - 98;
  const x1 = ROOM.maxX - 2;
  const cx = (x0 + x1) / 2;
  const headZ = ROOM.minZ + 6;
  const footZ = ROOM.minZ + 210;
  const len = footZ - headZ;
  const cz = (headZ + footZ) / 2;
  const board = (z: number, postH: number, railTop: number) => (
    <group>
      {[x0, x1].map((x) => (
        <group key={x} position={[x, 0, z]}>
          <mesh position={[0, postH / 2, 0]} castShadow>
            <cylinderGeometry args={[4, 4.6, postH, 16]} />
            {wood}
          </mesh>
          <mesh position={[0, postH + 5, 0]} castShadow>
            <sphereGeometry args={[6, 18, 14]} />
            {wood}
          </mesh>
        </group>
      ))}
      <mesh position={[cx, railTop, z]} castShadow>
        <boxGeometry args={[x1 - x0, 8, 5]} />
        {wood}
      </mesh>
      <mesh position={[cx, 44, z]}>
        <boxGeometry args={[x1 - x0, 6, 4]} />
        {wood}
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[x0 + ((i + 1) * (x1 - x0)) / 8, (44 + railTop) / 2, z]} castShadow>
          <cylinderGeometry args={[1.6, 1.6, railTop - 44, 10]} />
          {wood}
        </mesh>
      ))}
    </group>
  );
  return (
    <group position-y={FLOOR_Y}>
      {board(headZ, 112, 102)}
      {board(footZ, 76, 68)}
      {[x0, x1].map((x) => (
        <mesh key={x} position={[x, 36, cz]} castShadow>
          <boxGeometry args={[4, 16, len]} />
          {wood}
        </mesh>
      ))}
      <mesh position={[cx, 54, cz]} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0 - 6, 20, len - 6]} />
        <meshStandardMaterial color="#f3f1ea" roughness={0.9} />
      </mesh>
      <RoundedBox args={[66, 13, 34]} radius={5} smoothness={3} position={[cx, 69, headZ + 26]} rotation-x={0.12} castShadow>
        <meshStandardMaterial color="#f8f8fb" roughness={0.85} />
      </RoundedBox>
      {/* Bedspread draped over the mattress */}
      <mesh position={[cx, 55, cz + 22]} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0 + 2, 28, len - 48]} />
        <meshStandardMaterial map={spread} roughness={0.85} />
      </mesh>
      <mesh position={[cx, 69.5, headZ + 50]}>
        <boxGeometry args={[x1 - x0, 1.5, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Poster() {
  const map = cowboyPosterTexture();
  return (
    <group position={[ROOM.maxX - 1, FLOOR_Y + 190, ROOM.minZ + 120]} rotation-y={-Math.PI / 2} rotation-z={0.03}>
      <mesh>
        <planeGeometry args={[66, 88]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      {[
        [-30, 41],
        [30, 41],
      ].map(([x, y]) => (
        <mesh key={x} position={[x, y, 0.6]}>
          <sphereGeometry args={[1.2, 8, 6]} />
          <meshStandardMaterial color="#e3262d" />
        </mesh>
      ))}
    </group>
  );
}

function ToyChest() {
  return (
    <group position={[ROOM.maxX - 150, FLOOR_Y, ROOM.minZ + 26]} rotation-y={-0.06}>
      <mesh position={[0, 20, 0]} castShadow receiveShadow>
        <boxGeometry args={[70, 40, 40]} />
        <meshStandardMaterial color="#9a3b22" roughness={0.55} />
      </mesh>
      <mesh position={[0, 43, 0]} castShadow>
        <boxGeometry args={[73, 6, 43]} />
        <meshStandardMaterial color="#e9dfc8" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 26, 20, 20.3]}>
          <boxGeometry args={[4, 40, 1]} />
          <meshStandardMaterial color="#e2b13c" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 38, 20.6]}>
        <boxGeometry args={[8, 7, 1]} />
        <meshStandardMaterial color="#e2b13c" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

const BOOK_COLORS = ["#d62828", "#1d4ed8", "#16a34a", "#f59e0b", "#7c3aed", "#0ea5e9", "#ef4444", "#facc15", "#14b8a6"];

function bookRow(seed: number, from: number, to: number, maxH: number) {
  const rand = seededRandom(seed);
  const out: { x: number; w: number; h: number; tilt: number; color: string }[] = [];
  let x = from;
  while (x < to) {
    const w = 2.5 + rand() * 3.5;
    const h = maxH * (0.7 + rand() * 0.3);
    if (rand() > 0.15) out.push({ x: x + w / 2, w, h, tilt: rand() > 0.9 ? 0.25 : 0, color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)] });
    x += w + 0.3;
  }
  return out;
}

/** Floating wall shelves on the left wall, in wall-local space (x along the wall, +z into the room). */
function WallShelves() {
  const shelves = useMemo(
    () =>
      [130, 170, 210].map((y, i) => ({
        y,
        books: bookRow(300 + i, -60, i === 1 ? 10 : 25, 24),
      })),
    [],
  );
  return (
    <group position={[ROOM.minX, FLOOR_Y, -150]} rotation-y={Math.PI / 2}>
      {shelves.map((s, i) => (
        <group key={i} position-y={s.y}>
          <mesh position={[0, 0, 10]} castShadow receiveShadow>
            <boxGeometry args={[130, 2.5, 20]} />
            <meshStandardMaterial color="#f7f4ec" roughness={0.5} />
          </mesh>
          {s.books.map((b, j) => (
            <mesh key={j} position={[b.x, 1.25 + b.h / 2, 9]} rotation-z={b.tilt} castShadow>
              <boxGeometry args={[b.w, b.h, 15]} />
              <meshStandardMaterial color={b.color} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Knick-knacks */}
      <mesh position={[40, 170 + 9, 10]} castShadow>
        <sphereGeometry args={[8, 20, 16]} />
        <meshStandardMaterial color="#e3262d" roughness={0.35} />
      </mesh>
      <PiggyBank position={[48, 130 + 1.25, 9]} scale={0.6} />
      <group position={[45, 210 + 1.25, 10]}>
        <mesh position={[0, 6, 0]} castShadow>
          <cylinderGeometry args={[6, 6, 12, 18]} />
          <meshStandardMaterial color="#2563eb" roughness={0.4} />
        </mesh>
        <mesh position={[0, 14, 0]}>
          <sphereGeometry args={[5, 16, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** Low pine bookcase stuffed with books, board games stacked on top. */
function Bookcase() {
  const W = 112;
  const H = 96;
  const D = 34;
  const rows = useMemo(() => [0, 1, 2].map((i) => bookRow(500 + i, -W / 2 + 3, W / 2 - 3, 26)), []);
  const games: [number, number, number, string, number][] = [
    [0, 8, 46, "#d62828", 0.05],
    [8, 6, 42, "#1d4ed8", -0.1],
    [14, 7, 38, "#f59e0b", 0.15],
    [21, 5, 34, "#16a34a", -0.05],
  ];
  const wood = <meshStandardMaterial color={PINE} roughness={0.55} />;
  return (
    <group position={[ROOM.minX, FLOOR_Y, 40]} rotation-y={Math.PI / 2}>
      <group position-z={D / 2 + 1}>
        <mesh position={[0, H / 2, -D / 2 + 1]} receiveShadow>
          <boxGeometry args={[W, H, 2]} />
          {wood}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (W / 2 - 1.5), H / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, H, D]} />
            {wood}
          </mesh>
        ))}
        {[1.5, 32, 63, H - 1.5].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[W, 3, D]} />
            {wood}
          </mesh>
        ))}
        {rows.map((row, i) =>
          row.map((b, j) => (
            <mesh key={`${i}-${j}`} position={[b.x, 3 + i * 31 + b.h / 2, 0]} rotation-z={b.tilt} castShadow>
              <boxGeometry args={[b.w, b.h, D - 8]} />
              <meshStandardMaterial color={b.color} roughness={0.7} />
            </mesh>
          )),
        )}
        {games.map(([y, h, w, c, r], i) => (
          <mesh key={i} position={[-10 + i * 2, H + y + h / 2, 0]} rotation-y={r} castShadow>
            <boxGeometry args={[w, h, 30]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Orange plastic race track snaking across the floorboards, ending in a loop. */
function RaceTrack() {
  const { geometry, loop } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        [-420, 360],
        [-330, 330],
        [-250, 270],
        [-205, 175],
        [-215, 70],
        [-270, 10],
        [-330, -30],
        [-330, -100],
      ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
    );
    const pts = curve.getSpacedPoints(120).map((p) => ({ x: p.x, z: p.z }));
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = new THREE.Vector3(end.x - prev.x, 0, end.z - prev.z).normalize();
    const axis = new THREE.Vector3(-dir.z, 0, dir.x);
    return {
      geometry: ribbonGeometry(pts, 9, FLOOR_Y + 0.6),
      loop: {
        position: [end.x + dir.x * 2, FLOOR_Y + 24, end.z + dir.z * 2] as [number, number, number],
        quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis),
      },
    };
  }, []);
  const orange = <meshStandardMaterial color="#f26a1b" roughness={0.35} side={THREE.DoubleSide} />;
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        {orange}
      </mesh>
      <mesh position={loop.position} quaternion={loop.quaternion} castShadow>
        <cylinderGeometry args={[24, 24, 9, 48, 1, true]} />
        {orange}
      </mesh>
    </group>
  );
}

function PlayingCards() {
  const cards = useMemo(() => {
    const rand = seededRandom(52);
    const faces = ["A♥", "7♠", "K♦", "3♣", "Q♥", "9♠", "J♦", "5♣", "2♥", "10♠", "8♦", "4♣", "6♥", "A♠"];
    return faces.map((f) => ({
      face: f,
      x: 215 + rand() * 120,
      z: 120 + rand() * 120,
      rot: rand() * Math.PI * 2,
      red: f.includes("♥") || f.includes("♦"),
    }));
  }, []);
  return (
    <group>
      {cards.map((c, i) => (
        <mesh key={i} position={[c.x, FLOOR_Y + 0.25 + i * 0.03, c.z]} rotation={[-Math.PI / 2, 0, c.rot]} receiveShadow>
          <planeGeometry args={[6.3, 8.8]} />
          <meshStandardMaterial
            map={labelTexture(c.face, { bg: "#ffffff", fg: c.red ? "#c81e1e" : "#111827", width: 64, height: 90, radius: 8, border: "#e5e7eb" })}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function StarBall() {
  const map = starBallTexture();
  return (
    <mesh position={[-280, FLOOR_Y + 13, 330]} rotation={[0.3, 0.8, -0.2]} castShadow>
      <sphereGeometry args={[13, 32, 24]} />
      <meshStandardMaterial map={map} roughness={0.3} />
    </mesh>
  );
}

/** Little CRT TV on a stand plus a kid-sized chair, front-left. */
function TvCorner() {
  return (
    <group>
      <group position={[ROOM.minX + 30, FLOOR_Y, 250]} rotation-y={Math.PI / 2 - 0.35}>
        <mesh position={[0, 20, 0]} castShadow receiveShadow>
          <boxGeometry args={[60, 40, 36]} />
          <meshStandardMaterial color={PINE} roughness={0.55} />
        </mesh>
        <mesh position={[0, 58, -2]} castShadow>
          <boxGeometry args={[46, 36, 38]} />
          <meshStandardMaterial color="#2b2d31" roughness={0.5} />
        </mesh>
        <mesh position={[-3, 59, 17.2]}>
          <planeGeometry args={[34, 26]} />
          <meshStandardMaterial color="#1d2a33" emissive="#2a4b5c" emissiveIntensity={0.6} roughness={0.15} />
        </mesh>
        <mesh position={[0, 41, 12]} castShadow>
          <boxGeometry args={[30, 2, 10]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.4} />
        </mesh>
      </group>
      <group position={[-330, FLOOR_Y, 400]} rotation-y={0.7}>
        <mesh position={[0, 28, 0]} castShadow>
          <boxGeometry args={[34, 3, 32]} />
          <meshStandardMaterial color="#f7c531" roughness={0.4} />
        </mesh>
        <mesh position={[0, 46, -15]} castShadow>
          <boxGeometry args={[34, 34, 3]} />
          <meshStandardMaterial color="#f7c531" roughness={0.4} />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 14, 13.5, sz * 13]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 27, 8]} />
              <meshStandardMaterial color="#e2a91c" roughness={0.4} />
            </mesh>
          )),
        )}
      </group>
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

function CeilingLight() {
  return (
    <group position={[0, CEILING_Y, 140]}>
      <mesh position={[0, -6, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[26, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#fff6e0" emissive="#fff1cf" emissiveIntensity={0.8} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[27, 27, 2, 32]} />
        <meshStandardMaterial color={WHITE_TRIM} />
      </mesh>
    </group>
  );
}

export function RoomLighting() {
  return (
    <group>
      <hemisphereLight args={["#eef6ff", "#8a6a4a", 0.6]} />
      <ambientLight intensity={0.18} />
      {/* Afternoon sun through the window on the right wall */}
      <directionalLight
        position={[360, 340, 200]}
        intensity={2.5}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-190}
        shadow-camera-right={190}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={50}
        shadow-camera-far={1000}
      />
      <directionalLight position={[-300, 260, 120]} intensity={0.4} color="#dce9ff" />
      <pointLight position={[0, CEILING_Y - 60, 140]} intensity={8000} distance={900} decay={2} color="#ffe6c0" />
    </group>
  );
}

export function RoomScene() {
  return (
    <group>
      <Floor />
      <Walls />
      {BACK_DOORS.map((d) => (
        <Door key={d.u} {...d} />
      ))}
      <Dresser />
      <Bed />
      <Poster />
      <ToyChest />
      <WallShelves />
      <Bookcase />
      <RaceTrack />
      <PlayingCards />
      <StarBall />
      <TvCorner />
      <ToyBlocks />
      <CeilingLight />
    </group>
  );
}
