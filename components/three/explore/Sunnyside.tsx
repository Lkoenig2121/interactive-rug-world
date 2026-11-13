"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { CAST, chase, DUMPSTER, LOCKET, OUTFITS, TOSS, updateChase, useSunny, type SunnyStage } from "@/lib/explore/sunnyside";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { landmarkById, toLocal } from "@/lib/town/config";
import { SUNNY_DUCT } from "@/lib/town/interiors";

const l = landmarkById.daycare;
const ORDER: SunnyStage[] = ["meet", "doll", "outfits", "confess", "locket", "baby", "bear", "chase", "done"];
const after = (stage: SunnyStage, than: SunnyStage) => ORDER.indexOf(stage) > ORDER.indexOf(than);

const M = ({ c, r = 0.7, m = 0, e }: { c: string; r?: number; m?: number; e?: string }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000000"} emissiveIntensity={e ? 0.6 : 0} />
);

/** Toy position in the daycare's local frame. */
const toyLocal = () => toLocal(l, runtime.toy);

/** Turns `g` to face the toy when it's close, easing back to `rest` otherwise. */
function faceToy(g: THREE.Object3D, x: number, z: number, rest: number, dt: number, range = 450) {
  const q = toyLocal();
  const want = Math.hypot(q.x - x, q.z - z) < range ? Math.atan2(q.x - x, q.z - z) : rest;
  const d = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y));
  g.rotation.y += d * Math.min(1, dt * 5);
}

const BEAR = { fur: "#f19cbb", light: "#f9cfe0", nose: "#6a1b4d" };

/** Round pink strawberry-scented bear with a walking cane (about 50 cm sitting). */
function BearModel({ legs, stars }: { legs: RefObject<THREE.Group | null>[]; stars: RefObject<THREE.Group | null> }) {
  return (
    <group>
      <mesh position={[0, 20, 0]} scale={[1, 1.05, 0.9]} castShadow>
        <sphereGeometry args={[16, 18, 14]} />
        <M c={BEAR.fur} r={1} />
      </mesh>
      <mesh position={[0, 19, 9]} scale={[1, 1.1, 0.5]}>
        <sphereGeometry args={[10, 14, 10]} />
        <M c={BEAR.light} r={1} />
      </mesh>
      <mesh position={[0, 43, 0]} castShadow>
        <sphereGeometry args={[13, 18, 14]} />
        <M c={BEAR.fur} r={1} />
      </mesh>
      <mesh position={[0, 39, 10]} scale={[1.1, 0.8, 0.8]}>
        <sphereGeometry args={[6, 12, 10]} />
        <M c={BEAR.light} r={1} />
      </mesh>
      <mesh position={[0, 41, 15]}>
        <sphereGeometry args={[2.6, 10, 8]} />
        <M c={BEAR.nose} r={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 4.6, 46, 11.2]}>
            <sphereGeometry args={[1.5, 8, 6]} />
            <M c="#1d1d1f" r={0.2} />
          </mesh>
          <mesh position={[s * 9.5, 53, -1]} scale={[1, 1, 0.6]}>
            <sphereGeometry args={[5, 10, 8]} />
            <M c={BEAR.fur} r={1} />
          </mesh>
          <mesh position={[s * 9.5, 53, 1.6]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[3, 10, 8]} />
            <M c={BEAR.light} r={1} />
          </mesh>
          <mesh position={[s * 15, 24, 4]} rotation-z={s * 0.5} castShadow>
            <capsuleGeometry args={[4.4, 10, 4, 10]} />
            <M c={BEAR.fur} r={1} />
          </mesh>
          <group ref={legs[s < 0 ? 0 : 1]} position={[s * 8, 9, 4]}>
            <mesh position={[0, -3, 3]} rotation-x={Math.PI / 2 - 0.3} castShadow>
              <capsuleGeometry args={[5, 6, 4, 10]} />
              <M c={BEAR.fur} r={1} />
            </mesh>
            <mesh position={[0, -3, 9]}>
              <sphereGeometry args={[3, 10, 8]} />
              <M c={BEAR.light} r={1} />
            </mesh>
          </group>
        </group>
      ))}
      {/* Cane in his right paw. */}
      <group position={[18, 0, 10]}>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[1, 1, 30, 8]} />
          <M c="#6b3d1f" r={0.4} />
        </mesh>
        <mesh position={[-3, 30, 0]} rotation-z={0}>
          <torusGeometry args={[3, 1, 6, 12, Math.PI]} />
          <M c="#6b3d1f" r={0.4} />
        </mesh>
      </group>
      <group ref={stars} position={[0, 64, 0]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 12, 0, Math.sin((i * Math.PI * 2) / 3) * 12]}>
            <octahedronGeometry args={[3]} />
            <meshBasicMaterial color="#ffd166" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Giant baby doll in a lavender romper and bonnet (about 95 cm tall), one sleepy eyelid. */
function BabyModel({ arms }: { arms: RefObject<THREE.Group | null>[] }) {
  const skin = "#f2d0b5";
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 9, 8, 0]} castShadow>
            <cylinderGeometry args={[6, 6.5, 16, 12]} />
            <M c={skin} />
          </mesh>
          <mesh position={[s * 9, 2, 5]} scale={[1, 0.6, 1.5]}>
            <sphereGeometry args={[6.5, 10, 8]} />
            <M c="#ffffff" />
          </mesh>
          <group ref={arms[s < 0 ? 0 : 1]} position={[s * 22, 52, 0]}>
            <mesh position={[0, -12, 0]} castShadow>
              <capsuleGeometry args={[5.5, 18, 4, 10]} />
              <M c={skin} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh position={[0, 20, 0]} scale={[1.1, 0.7, 1]}>
        <sphereGeometry args={[18, 16, 12]} />
        <M c="#ffffff" r={0.9} />
      </mesh>
      <mesh position={[0, 38, 0]} scale={[1, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[20, 18, 14]} />
        <M c="#cdb4db" r={0.9} />
      </mesh>
      <mesh position={[0, 74, 0]} castShadow>
        <sphereGeometry args={[21, 20, 16]} />
        <M c={skin} />
      </mesh>
      {/* Bonnet */}
      <mesh position={[0, 78, -3]} scale={[1.08, 1.05, 1.05]}>
        <sphereGeometry args={[21, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <M c="#ffc8dd" r={0.9} />
      </mesh>
      <mesh position={[0, 74, 15]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[19, 2, 8, 24, Math.PI]} />
        <M c="#ffafcc" r={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={`e${s}`}>
          <mesh position={[s * 7.5, 76, 18]}>
            <sphereGeometry args={[4.2, 12, 10]} />
            <M c="#ffffff" r={0.2} />
          </mesh>
          <mesh position={[s * 7.5, 76, 21.6]}>
            <sphereGeometry args={[2.2, 10, 8]} />
            <M c="#4a6fa5" r={0.2} />
          </mesh>
          <mesh position={[s * 12, 68, 16]}>
            <sphereGeometry args={[3, 8, 6]} />
            <M c="#f7a8b8" />
          </mesh>
        </group>
      ))}
      {/* The droopy left eyelid. */}
      <mesh position={[-7.5, 77.4, 18.6]} scale={[1.05, 0.62, 1.05]}>
        <sphereGeometry args={[4.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M c={skin} />
      </mesh>
      <mesh position={[0, 66, 19.5]} scale={[1.4, 0.5, 0.6]}>
        <sphereGeometry args={[2.4, 10, 8]} />
        <M c="#c9184a" />
      </mesh>
    </group>
  );
}

/** Vain fashion doll: blond swoop, pastel jacket, orange ascot (about 34 cm). */
function DollModel() {
  const skin = "#e8b98a";
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.4, 7, 0]} castShadow>
            <cylinderGeometry args={[1.8, 1.5, 14, 8]} />
            <M c="#f8f9fa" />
          </mesh>
          <mesh position={[s * 2.4, 0.8, 1.2]}>
            <boxGeometry args={[3, 1.6, 5]} />
            <M c="#6b3d1f" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 20, 0]} castShadow>
        <boxGeometry args={[9, 12, 5]} />
        <M c="#90e0ef" />
      </mesh>
      <mesh position={[0, 24, 2.8]} rotation-x={0.2}>
        <coneGeometry args={[2.2, 5, 8]} />
        <M c="#f77f00" />
      </mesh>
      <mesh position={[-6, 20, 0]} rotation-z={0.15}>
        <capsuleGeometry args={[1.3, 9, 4, 8]} />
        <M c="#90e0ef" />
      </mesh>
      {/* Hand on hip. */}
      <mesh position={[6, 20, 0]} rotation-z={-0.9}>
        <capsuleGeometry args={[1.3, 7, 4, 8]} />
        <M c="#90e0ef" />
      </mesh>
      <mesh position={[0, 30, 0]} castShadow>
        <sphereGeometry args={[4, 14, 12]} />
        <M c={skin} />
      </mesh>
      <mesh position={[0, 33, -0.6]} scale={[1.05, 0.7, 1.1]}>
        <sphereGeometry args={[4.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <M c="#f6d365" r={0.4} />
      </mesh>
      <mesh position={[0.8, 34, 2.6]} rotation-x={-0.6} scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[2, 10, 8]} />
        <M c="#f6d365" r={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 1.4, 30.6, 3.7]}>
          <sphereGeometry args={[0.6, 8, 6]} />
          <M c="#1d3557" r={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function OutfitModel({ id, color }: { id: string; color: string }) {
  if (id === "ascot")
    return (
      <group>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[5, 1.2, 8, 16]} />
          <M c={color} />
        </mesh>
        <mesh position={[0, -5, 4]}>
          <coneGeometry args={[3, 8, 8]} />
          <M c={color} />
        </mesh>
      </group>
    );
  if (id === "vest")
    return (
      <group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 3.2, 0, 0]}>
            <boxGeometry args={[5, 12, 2]} />
            <M c={color} r={0.2} m={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 7, 0]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[4, 0.5, 6, 12, Math.PI]} />
          <M c="#adb5bd" m={0.6} />
        </mesh>
      </group>
    );
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3, 0, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, -6 + i * 3.4, 0]}>
              <cylinderGeometry args={[2, 2, 3.2, 10]} />
              <M c={i % 2 ? "#ffffff" : color} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** A glowing quest pickup: spins and bobs over a gold ring. */
function Pickup({ x, y, z, children, visible }: { x: number; y: number; z: number; children: ReactNode; visible: boolean }) {
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!spin.current) return;
    spin.current.rotation.y = clock.elapsedTime * 1.8;
    spin.current.position.y = 18 + Math.sin(clock.elapsedTime * 3) * 3;
  });
  if (!visible) return null;
  return (
    <group position={[x, y, z]}>
      <group ref={spin}>{children}</group>
      <mesh position={[0, 1, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[14, 18, 28]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.7} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 22, 0]} color="#ffd166" intensity={0.8} distance={160} decay={1} />
    </group>
  );
}

function Locket() {
  return (
    <group scale={1.3}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.4, 2, 0]}>
          <sphereGeometry args={[3, 12, 10]} />
          <M c="#ffd166" r={0.2} m={0.8} e="#ff4d6d" />
        </mesh>
      ))}
      <mesh position={[0, -1.6, 0]} rotation-z={Math.PI}>
        <coneGeometry args={[4.6, 6, 12]} />
        <M c="#ffd166" r={0.2} m={0.8} e="#ff4d6d" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <torusGeometry args={[5, 0.4, 6, 18]} />
        <M c="#e9c46a" m={0.8} r={0.3} />
      </mesh>
    </group>
  );
}

/** Sunnyside's boss toys, the outfit and locket pickups, and the bear chase. */
export function Sunnyside() {
  const stage = useSunny((s) => s.stage);
  const outfits = useSunny((s) => s.outfits);
  const bear = useRef<THREE.Group>(null);
  const bearLegs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const bearStars = useRef<THREE.Group>(null);
  const baby = useRef<THREE.Group>(null);
  const babyArms = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const doll = useRef<THREE.Group>(null);

  useEffect(() => useSunny.getState().hydrate(), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const now = clock.elapsedTime;
    const s = useStore.getState();
    if (s.mode === "toy" && !s.inSpace) updateChase(now, dt);
    const st = useSunny.getState().stage;

    // Bear: on his throne, running, being tossed, or stuck in the dumpster.
    const g = bear.current;
    if (g) {
      let stunned = false;
      let running = false;
      if (st === "chase") {
        if (chase.tossAt >= 0) {
          const age = now - chase.tossAt;
          stunned = age < TOSS.walk;
          if (age < TOSS.walk) g.position.set(chase.x, 0, chase.z);
          else {
            const k = Math.min(1, (age - TOSS.walk) / TOSS.fly);
            g.position.set(chase.x + (DUMPSTER.x - chase.x) * k, (DUMPSTER.h - 20) * k + Math.sin(k * Math.PI) * 420, chase.z + (DUMPSTER.z - chase.z) * k);
            g.rotation.x = k * Math.PI * 4;
          }
        } else {
          stunned = now < chase.stunUntil;
          running = !stunned;
          g.position.set(chase.x, running ? Math.abs(Math.sin(now * 14)) * 4 : 0, chase.z);
          g.rotation.x = 0;
          if (running) g.rotation.y = chase.yaw;
          else g.rotation.y += dt * 9;
        }
      } else if (st === "done") {
        g.position.set(DUMPSTER.x, DUMPSTER.h - 34, DUMPSTER.z);
        g.rotation.set(0.3, Math.sin(now * 0.8) * 0.3, 0);
      } else {
        g.position.set(CAST.bear.home.x, 44, CAST.bear.home.z - 10);
        g.rotation.x = 0;
        faceToy(g, CAST.bear.home.x, CAST.bear.home.z, 0, dt);
      }
      bearLegs.forEach((ref, i) => ref.current?.rotation.set(running ? Math.sin(now * 14 + i * Math.PI) * 0.8 : 0, 0, 0));
      if (bearStars.current) {
        bearStars.current.visible = stunned;
        bearStars.current.rotation.y = now * 6;
      }
    }

    // Baby: sits by the throne, stomps over to throw the bear, then rocks happily.
    const b = baby.current;
    if (b) {
      const home = CAST.baby.home;
      let throwing = 0;
      if (st === "chase" && chase.tossAt >= 0) {
        const age = now - chase.tossAt;
        const k = Math.min(1, age / TOSS.walk);
        const tx = chase.x - 70;
        const tz = chase.z - 40;
        b.position.set(home.x + (tx - home.x) * k, k < 1 ? Math.abs(Math.sin(age * 9)) * 5 : 0, home.z + (tz - home.z) * k);
        b.rotation.y = Math.atan2(chase.x - b.position.x, chase.z - b.position.z);
        throwing = age > TOSS.walk ? Math.min(1, (age - TOSS.walk) * 3) : 0;
      } else {
        b.position.set(home.x, st === "done" ? Math.abs(Math.sin(now * 3)) * 6 : 0, home.z);
        faceToy(b, home.x, home.z, 0.3, dt, 600);
      }
      babyArms.forEach((ref, i) => {
        const sway = Math.sin(now * 1.5 + i) * 0.12;
        ref.current?.rotation.set(-throwing * 2.6 + sway, 0, 0);
      });
    }

    // Doll: preening by his wardrobe, or flopped on the floor once he's spilled the secret.
    const d = doll.current;
    if (d) {
      const home = CAST.doll.home;
      if (after(st, "confess")) {
        d.position.set(home.x, 2, home.z);
        d.rotation.set(-Math.PI / 2, d.rotation.y, 0);
      } else {
        d.position.set(home.x, Math.abs(Math.sin(now * 2)) * 1.5, home.z);
        d.rotation.x = 0;
        faceToy(d, home.x, home.z, Math.PI, dt, 400);
      }
    }
  });

  const ductZ = (SUNNY_DUCT.z0 + SUNNY_DUCT.z1) / 2;
  return (
    <group position={[l.x, EXT_Y, l.z]} rotation-y={l.rot}>
      <group ref={bear}>
        <BearModel legs={bearLegs} stars={bearStars} />
      </group>
      <group ref={baby}>
        <BabyModel arms={babyArms} />
      </group>
      <group ref={doll}>
        <DollModel />
      </group>
      {OUTFITS.map((o) => (
        <Pickup key={o.id} x={o.x} y={o.h} z={o.z} visible={stage === "outfits" && !outfits.includes(o.id)}>
          <OutfitModel id={o.id} color={o.color} />
        </Pickup>
      ))}
      <Pickup x={LOCKET.x} y={LOCKET.h} z={LOCKET.z} visible={!after(stage, "locket")}>
        <Locket />
      </Pickup>
      {/* Hatches in the duct floor where you can drop back down. */}
      {[-2650, 0, 2650].map((x) => (
        <mesh key={x} position={[x, SUNNY_DUCT.h + 0.6, ductZ]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[70, 46]} />
          <meshStandardMaterial color="#5c6773" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
