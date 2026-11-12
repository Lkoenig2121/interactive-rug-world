"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ARENA, BOSS_HP, bossPos, HOME_PAD, ROCKS, SPACE, SPACE_SPAWN, VILLAGES } from "@/lib/explore/space";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";

const SHOT_SPEED_ENEMY = 900;
const SHOT_LIFE = 3;
const POOL = 32;

function buildPlanet(b: Builder) {
  const { r } = SPACE;
  // Planet top: a lilac disc with a rim of rocks and scattered craters.
  b.use("paint").cyl(0, -600, 0, r, 600, "#9d8cc9", 64, r);
  b.use("paint").cyl(0, -1800, 0, r * 0.75, 1200, "#7d6ba8", 48, r);
  b.use("paint").cone(0, -3600, 0, r * 0.7, 1800, "#5e4f8a", 32);
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39;
    const d = 900 + ((i * 677) % 4400);
    const x = Math.sin(a) * d;
    const z = Math.cos(a) * d;
    if (Math.hypot(x - (ARENA.x - SPACE.x), z - (ARENA.z - SPACE.z)) < ARENA.r + 300) continue;
    const cr = 120 + (i % 4) * 70;
    b.use("paint").torus(x, 0, z, cr, cr * 0.18, "#b3a4dc", { rx: Math.PI / 2 });
    b.use("paint").cyl(x, -2, z, cr, 3, "#8a7ab8", 20);
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    b.use("paint").sphere(Math.sin(a) * (r - 60), 0, Math.cos(a) * (r - 60), 90 + (i % 3) * 40, "#6f5f9c", 0.7, 8);
  }
  // Floating rocks to hop between.
  for (const k of ROCKS) b.use("paint").cyl(k.x - SPACE.x, k.y - SPACE.y - 60, k.z - SPACE.z, k.r, 60, "#8a7ab8", 14, k.r * 0.9);
  // Boss arena: raised ring platform with glowing pylons.
  const ax = ARENA.x - SPACE.x;
  const az = ARENA.z - SPACE.z;
  const ay = ARENA.y - SPACE.y;
  b.use("metal").cyl(ax, 0, az, ARENA.r, ay, "#4a4e69", 48);
  b.use("glow").torus(ax, ay + 2, az, ARENA.r - 30, 14, "#f72585", { rx: Math.PI / 2 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.use("metal").cyl(ax + Math.sin(a) * (ARENA.r - 80), ay, az + Math.cos(a) * (ARENA.r - 80), 40, 400, "#22223b", 10);
    b.use("glow").sphere(ax + Math.sin(a) * (ARENA.r - 80), ay + 430, az + Math.cos(a) * (ARENA.r - 80), 40, "#f72585", 1, 10);
  }
  // Ramp up to the arena.
  b.use("metal").cbox(ax, ay / 2, az + ARENA.r + 200, 400, 20, 460, "#4a4e69", { rx: Math.atan2(ay, 460) });
  // Villages: dome huts with round doors.
  for (const v of VILLAGES) {
    const vx = v.x - SPACE.x;
    const vz = v.z - SPACE.z;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const hx = vx + Math.sin(a) * 380;
      const hz = vz + Math.cos(a) * 380;
      b.use("gloss").dome(hx, 0, hz, 120 + (i % 2) * 30, v.color, 0.9);
      b.use("paint").cyl(hx + Math.sin(a) * 110, 0, hz + Math.cos(a) * 110, 34, 60, "#2b2d42", 12);
    }
    b.use("metal").cyl(vx, 0, vz, 10, 260, "#c0c7cf", 8);
    b.use("glow").sphere(vx, 270, vz, 26, v.color, 1, 10);
  }
  // Home pad and antenna.
  const hx = HOME_PAD.x - SPACE.x;
  const hz = HOME_PAD.z - SPACE.z;
  b.use("metal").cyl(hx, 0, hz, HOME_PAD.r, 8, "#c0c7cf", 32);
  b.use("glow").torus(hx, 9, hz, HOME_PAD.r - 20, 8, "#57ff8f", { rx: Math.PI / 2 });
  b.use("metal").cyl(hx + HOME_PAD.r + 100, 0, hz, 14, 700, "#9aa3ad", 8);
  b.use("metal").dome(hx + HOME_PAD.r + 100, 640, hz, 120, "#d9d9d9", 0.4);
}

function Starfield() {
  const geo = useMemo(() => {
    const n = 2500;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const h = Math.sqrt(1 - u * u);
      const r = 60000;
      arr.set([SPACE.x + Math.cos(a) * h * r, SPACE.y + u * r, SPACE.z + Math.sin(a) * h * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false} raycast={() => null}>
      <pointsMaterial color="#ffffff" size={120} sizeAttenuation fog={false} depthWrite={false} />
    </points>
  );
}

function Backdrop() {
  return (
    <group position={[SPACE.x, SPACE.y, SPACE.z]}>
      <mesh position={[-22000, 9000, -30000]} raycast={() => null}>
        <sphereGeometry args={[7000, 32, 20]} />
        <meshStandardMaterial color="#ff9f1c" emissive="#ff6b35" emissiveIntensity={0.25} roughness={0.9} />
      </mesh>
      <mesh position={[-22000, 9000, -30000]} rotation={[1.2, 0.3, 0]} raycast={() => null}>
        <torusGeometry args={[11000, 900, 2, 64]} />
        <meshBasicMaterial color="#ffd6a5" transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[26000, 4000, -18000]} raycast={() => null}>
        <sphereGeometry args={[3000, 24, 16]} />
        <meshStandardMaterial color="#4cc9f0" emissive="#3a86ff" emissiveIntensity={0.25} roughness={0.8} />
      </mesh>
      <mesh position={[8000, 26000, 30000]} raycast={() => null}>
        <sphereGeometry args={[1800, 20, 14]} />
        <meshBasicMaterial color="#e5e5e5" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Round pastel critters with one big eye and a springy antenna: the locals of Planet Zurbo. */
function Critters() {
  const group = useRef<THREE.Group>(null);
  const list = useMemo(
    () =>
      VILLAGES.flatMap((v, vi) =>
        Array.from({ length: 4 }, (_, i) => {
          const a = (i / 4) * Math.PI * 2 + 0.6;
          return { x: v.x + Math.sin(a) * 200, z: v.z + Math.cos(a) * 200, color: v.color, seed: vi * 4 + i };
        }),
      ),
    [],
  );
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const party = useStore.getState().bossDefeated;
    const toy = runtime.toy;
    g.children.forEach((c, i) => {
      const s = list[i];
      const hop = Math.abs(Math.sin(t * (party ? 6 : 2.5) + s.seed)) * (party ? 60 : 18);
      c.position.set(s.x, SPACE.y + 18 + hop, s.z);
      c.rotation.y = Math.atan2(toy.x - s.x, toy.z - s.z);
    });
  });
  return (
    <group ref={group}>
      {list.map((s) => (
        <group key={s.seed}>
          <mesh castShadow>
            <sphereGeometry args={[18, 18, 14]} />
            <meshStandardMaterial color={s.color} roughness={0.5} />
          </mesh>
          <mesh position={[0, 4, 15]}>
            <sphereGeometry args={[7, 14, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, 4, 21]}>
            <sphereGeometry args={[3.2, 10, 8]} />
            <meshStandardMaterial color="#1d1d1f" roughness={0.2} />
          </mesh>
          <mesh position={[0, 26, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 16, 6]} />
            <meshStandardMaterial color="#2b2d42" />
          </mesh>
          <mesh position={[0, 35, 0]}>
            <sphereGeometry args={[3.5, 10, 8]} />
            <meshBasicMaterial color="#fff3b0" toneMapped={false} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 10, -15, 2]}>
              <sphereGeometry args={[6, 10, 8]} />
              <meshStandardMaterial color="#2b2d42" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Baron Voltrix: a hovering orange-and-teal robot with a radar-dish head and pincer arms. */
function Boss() {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshStandardMaterial>(null);
  const dish = useRef<THREE.Group>(null);
  const lastShot = useRef(0);
  const shots = useRef<(THREE.Mesh | null)[]>([]);
  const shotMats = useMemo(
    () => ({
      mine: new THREE.MeshBasicMaterial({ color: "#57ff8f", toneMapped: false }),
      enemy: new THREE.MeshBasicMaterial({ color: "#f72585", toneMapped: false }),
    }),
    [],
  );

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    const s = useStore.getState();
    const sp = runtime.explore.space;
    const toy = runtime.toy;
    const alive = sp.bossHp > 0 && !s.bossDefeated;
    const p = bossPos(t);
    const g = ref.current;
    if (g) {
      g.visible = alive;
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = Math.atan2(toy.x - p.x, toy.z - p.z);
    }
    if (dish.current) dish.current.rotation.y = t * 3;
    if (body.current) body.current.emissiveIntensity = t - sp.bossHitAt < 0.15 ? 1.5 : 0.15;

    // Boss attack: a fan of orbs when you're on or near the arena.
    const near = Math.hypot(toy.x - ARENA.x, toy.z - ARENA.z) < ARENA.r + 900;
    if (alive && near && t - lastShot.current > 1.6) {
      lastShot.current = t;
      const base = Math.atan2(toy.x - p.x, toy.z - p.z);
      for (const off of [-0.25, 0, 0.25]) {
        const a = base + off;
        sp.shots.push({ x: p.x, y: toy.y + 25, z: p.z, vx: Math.sin(a) * SHOT_SPEED_ENEMY, vz: Math.cos(a) * SHOT_SPEED_ENEMY, t, enemy: true });
      }
    }

    // Move shots, hit-test, expire.
    sp.shots = sp.shots.filter((sh) => {
      sh.x += sh.vx * dt;
      sh.z += sh.vz * dt;
      if (t - sh.t > SHOT_LIFE) return false;
      if (sh.enemy) {
        const hit = Math.hypot(sh.x - toy.x, sh.y - (toy.y + 20), sh.z - toy.z) < 30;
        if (hit && t - sp.hitAt > 1.2) {
          sp.hitAt = t;
          sp.hearts -= 1;
          if (sp.hearts <= 0) {
            sp.hearts = 3;
            sp.bossHp = BOSS_HP;
            Object.assign(toy, { ...SPACE_SPAWN, vy: 0, speed: 0 });
            runtime.town.snapCamera = true;
            s.showToast("Knocked out! Back to the landing site. The Baron recharged.");
          }
          return false;
        }
        return !hit;
      }
      if (alive && Math.hypot(sh.x - p.x, sh.y - p.y, sh.z - p.z) < 170) {
        sp.bossHp -= 1;
        sp.bossHitAt = t;
        if (sp.bossHp <= 0) {
          sp.shots = [];
          s.defeatBoss();
        }
        return false;
      }
      return true;
    });

    sp.shots.slice(0, POOL).forEach((sh, i) => {
      const m = shots.current[i];
      if (!m) return;
      m.visible = true;
      m.position.set(sh.x, sh.y, sh.z);
      m.material = sh.enemy ? shotMats.enemy : shotMats.mine;
      m.scale.setScalar(sh.enemy ? 2.2 : 1);
    });
    for (let i = Math.min(sp.shots.length, POOL); i < POOL; i++) {
      const m = shots.current[i];
      if (m) m.visible = false;
    }
  });

  return (
    <>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[180, 160, 140]} />
          <meshStandardMaterial ref={body} color="#ff7f11" emissive="#ff3b30" emissiveIntensity={0.15} roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, -110, 0]}>
          <coneGeometry args={[80, 90, 16]} />
          <meshStandardMaterial color="#1b998b" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -170, 0]}>
          <sphereGeometry args={[40, 12, 10]} />
          <meshBasicMaterial color="#ffd166" toneMapped={false} />
        </mesh>
        <mesh position={[0, 20, 72]}>
          <boxGeometry args={[130, 50, 6]} />
          <meshBasicMaterial color="#1b998b" toneMapped={false} />
        </mesh>
        {[-35, 35].map((x) => (
          <mesh key={x} position={[x, 22, 76]}>
            <boxGeometry args={[24, 14, 4]} />
            <meshBasicMaterial color="#fff3b0" toneMapped={false} />
          </mesh>
        ))}
        <group ref={dish} position={[0, 110, 0]}>
          <mesh>
            <cylinderGeometry args={[8, 8, 60, 8]} />
            <meshStandardMaterial color="#c0c7cf" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 40, 0]} rotation-x={0.6}>
            <sphereGeometry args={[70, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3]} />
            <meshStandardMaterial color="#d9d9d9" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 120, 0, 20]} rotation-z={s * 0.4}>
            <mesh position={[s * 40, 0, 0]}>
              <cylinderGeometry args={[14, 14, 100, 10]} />
              <meshStandardMaterial color="#1b998b" metalness={0.5} roughness={0.3} />
            </mesh>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[s * 40 + k * 14, -60, 20]} rotation-x={k * 0.4}>
                <boxGeometry args={[10, 50, 14]} />
                <meshStandardMaterial color="#ff7f11" roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            shots.current[i] = m;
          }}
          visible={false}
          raycast={() => null}
        >
          <sphereGeometry args={[8, 10, 8]} />
        </mesh>
      ))}
    </>
  );
}

/** Planet Zurbo: the space level reached by the Pizza Planet rocket. */
export function SpaceLevel() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#c8b8ff" />
      <directionalLight position={[SPACE.x + 8000, SPACE.y + 12000, SPACE.z + 6000]} intensity={2.4} color="#fff1e0" />
      <Starfield />
      <Backdrop />
      <group position={[SPACE.x, SPACE.y, SPACE.z]}>
        <Built deps={["planet-zurbo"]} build={buildPlanet} />
        <Sign text="HOME" position={[HOME_PAD.x - SPACE.x, 220, HOME_PAD.z - SPACE.z + HOME_PAD.r]} size={[300, 100]} bg="#1b1b3a" fg="#57ff8f" glow doubleSided />
        <Sign text="BARON VOLTRIX'S ARENA" position={[ARENA.x - SPACE.x, 520, ARENA.z - SPACE.z + ARENA.r + 420]} size={[1100, 140]} bg="#22223b" fg="#f72585" glow doubleSided />
        {VILLAGES.map((v) => (
          <Sign key={v.name} text={v.name.toUpperCase()} position={[v.x - SPACE.x, 330, v.z - SPACE.z]} size={[420, 90]} bg="#1b1b3a" fg={v.color} glow doubleSided />
        ))}
      </group>
      <Critters />
      <Boss />
    </group>
  );
}
