"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

type V3 = [number, number, number];

function Box({ p, s, c, r, rough = 0.6 }: { p: V3; s: V3; c: string; r?: V3; rough?: number }) {
  return (
    <mesh position={p} rotation={r} castShadow material={mat(c, { roughness: rough })}>
      <boxGeometry args={s} />
    </mesh>
  );
}

function Cyl({ p, r, h, c, rot, rough = 0.6 }: { p: V3; r: number | [number, number]; h: number; c: string; rot?: V3; rough?: number }) {
  const [rt, rb] = typeof r === "number" ? [r, r] : r;
  return (
    <mesh position={p} rotation={rot} castShadow material={mat(c, { roughness: rough })}>
      <cylinderGeometry args={[rt, rb, h, 18]} />
    </mesh>
  );
}

function Ball({ p, r, c, scale, rough = 0.5 }: { p: V3; r: number; c: string; scale?: V3; rough?: number }) {
  return (
    <mesh position={p} scale={scale} castShadow material={mat(c, { roughness: rough })}>
      <sphereGeometry args={[r, 20, 14]} />
    </mesh>
  );
}

interface Rig {
  legL: React.RefObject<THREE.Group | null>;
  legR: React.RefObject<THREE.Group | null>;
  armL: React.RefObject<THREE.Group | null>;
  armR: React.RefObject<THREE.Group | null>;
}

const SKIN = "#f2c9a0";

/** Face details on a head of radius `r` centered at `y`, looking toward -z. */
function Face({ y, r }: { y: number; r: number }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball p={[s * r * 0.33, y + r * 0.15, -r * 0.88]} r={r * 0.16} c="#ffffff" />
          <Ball p={[s * r * 0.33, y + r * 0.15, -r * 0.99]} r={r * 0.08} c="#1f2937" />
          <Box p={[s * r * 0.34, y + r * 0.42, -r * 0.86]} s={[r * 0.36, r * 0.08, r * 0.1]} c="#5a3a1e" />
        </group>
      ))}
      <Ball p={[0, y - r * 0.08, -r * 0.98]} r={r * 0.15} c="#e8b48c" />
      <Box p={[0, y - r * 0.42, -r * 0.86]} s={[r * 0.5, r * 0.08, r * 0.1]} c="#9a3412" />
    </group>
  );
}

/** Cowboy doll, about 36 cm tall with the hat. */
function Cowboy({ legL, legR, armL, armR }: Rig) {
  const leg = (
    <>
      <Cyl p={[0, -6.5, 0]} r={1.7} h={13} c="#3b5b92" rough={0.9} />
      <Cyl p={[0, -11.2, 0]} r={1.95} h={4} c="#7c4a24" />
      <Box p={[0, -13.4, -0.9]} s={[3.6, 1.6, 5.4]} c="#6b3d1c" />
    </>
  );
  const arm = (side: number) => (
    <group rotation-z={side * 0.12}>
      <Cyl p={[0, -4, 0]} r={1.4} h={8} c="#c0392b" rough={0.85} />
      <Ball p={[0, -8.8, 0]} r={1.5} c={SKIN} />
    </group>
  );
  return (
    <group>
      <group ref={legL} position={[-2.2, 15, 0]}>
        {leg}
      </group>
      <group ref={legR} position={[2.2, 15, 0]}>
        {leg}
      </group>
      <Box p={[0, 15.6, 0]} s={[8.6, 2, 4.6]} c="#5a3a1e" />
      <Box p={[0, 15.6, -2.4]} s={[1.9, 1.5, 0.4]} c="#e5b53b" rough={0.3} />
      <Box p={[0, 20.6, 0]} s={[8.4, 8, 4.4]} c="#c0392b" rough={0.85} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 2.7, 20.6, -2.3]} s={[2.9, 7.6, 0.4]} c="#7a4b26" />
      ))}
      <Box p={[0, 20.6, 2.3]} s={[8.6, 7.6, 0.4]} c="#7a4b26" />
      <Cyl p={[0, 25, 0]} r={1.2} h={1.6} c={SKIN} />
      <Cyl p={[0, 24.8, -0.3]} r={[2.1, 2.5]} h={1.3} c="#e0b21b" />
      <group ref={armL} position={[-5.2, 23.6, 0]}>
        {arm(-1)}
      </group>
      <group ref={armR} position={[5.2, 23.6, 0]}>
        {arm(1)}
      </group>
      <Ball p={[0, 29, 0]} r={3.6} c={SKIN} scale={[0.95, 1.08, 0.95]} />
      <Ball p={[0, 29.7, 0.7]} r={3.65} c="#5a3a1e" scale={[1, 0.95, 1]} rough={0.9} />
      <Face y={29} r={3.45} />
      <Cyl p={[0, 32.4, 0]} r={6.6} h={0.6} c="#a8743c" rough={0.8} />
      <Cyl p={[0, 34.3, 0]} r={[3.1, 3.7]} h={3.8} c="#a8743c" rough={0.8} />
      <Cyl p={[0, 32.95, 0]} r={3.75} h={0.7} c="#3f2a17" />
    </group>
  );
}

/** Space-ranger action figure, about 32 cm tall. */
function Ranger({ legL, legR, armL, armR }: Rig) {
  const leg = (
    <>
      <Cyl p={[0, -5.5, 0]} r={2.1} h={11} c="#f8fafc" rough={0.35} />
      <Cyl p={[0, -6, 0]} r={2.2} h={1.2} c="#f97316" rough={0.4} />
      <Box p={[0, -12, -0.6]} s={[4.2, 3, 5.8]} c="#2563eb" rough={0.35} />
    </>
  );
  const arm = (side: number) => (
    <group rotation-z={side * 0.14}>
      <Cyl p={[0, -3.8, 0]} r={1.7} h={7.6} c="#f8fafc" rough={0.35} />
      <Cyl p={[0, -7.4, 0]} r={1.85} h={1} c="#f97316" rough={0.4} />
      <Ball p={[0, -8.9, 0]} r={1.75} c="#2563eb" rough={0.4} />
    </group>
  );
  return (
    <group>
      <group ref={legL} position={[-2.4, 13.5, 0]}>
        {leg}
      </group>
      <group ref={legR} position={[2.4, 13.5, 0]}>
        {leg}
      </group>
      <Box p={[0, 14, 0]} s={[9, 3, 5]} c="#2563eb" rough={0.35} />
      <Box p={[0, 19.6, 0]} s={[10.6, 8.4, 6]} c="#f8fafc" rough={0.3} />
      <Box p={[0, 20, -3.05]} s={[6, 4.2, 0.4]} c="#1e3a8a" rough={0.3} />
      {(["#ef4444", "#facc15", "#22c55e"] as const).map((c, i) => (
        <Ball key={c} p={[-1.6 + i * 1.6, 20, -3.3]} r={0.5} c={c} rough={0.3} />
      ))}
      <Box p={[0, 20, 4.4]} s={[7, 7, 3]} c="#f8fafc" rough={0.3} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 5.5, 21.5, 5]} rotation-z={s * -0.35}>
          <Box p={[s * 3.5, 0, 0]} s={[9, 1.4, 0.6]} c="#f8fafc" rough={0.3} />
          <Box p={[s * 7.4, 0, 0]} s={[1.6, 1.5, 0.7]} c="#f97316" rough={0.4} />
        </group>
      ))}
      <Cyl p={[0, 24.2, 0]} r={3.4} h={1.2} c="#f97316" rough={0.4} />
      <group ref={armL} position={[-6.4, 22.6, 0]}>
        {arm(-1)}
      </group>
      <group ref={armR} position={[6.4, 22.6, 0]}>
        {arm(1)}
      </group>
      <Ball p={[0, 27.6, 0]} r={3.1} c={SKIN} />
      <Ball p={[0, 28.1, 0.55]} r={3.25} c="#1e3a8a" rough={0.6} />
      <Face y={27.6} r={3} />
      <mesh position={[0, 27.8, 0]} material={mat("#dbeafe", { roughness: 0.05, transparent: true, opacity: 0.22 })}>
        <sphereGeometry args={[4.7, 24, 16]} />
      </mesh>
    </group>
  );
}

/** The toy you play as, standing wherever it was dropped, with a simple walk cycle. */
export function Toy() {
  const kind = useStore((s) => s.toy);
  const root = useRef<THREE.Group>(null);
  const rig: Rig = { legL: useRef(null), legR: useRef(null), armL: useRef(null), armR: useRef(null) };

  useFrame(({ clock }) => {
    const t = runtime.toy;
    const g = root.current;
    if (!g) return;
    const stride = Math.min(1, Math.abs(t.speed) / 140);
    const airborne = Math.abs(t.vy) > 1;
    const bob = airborne ? 0 : Math.abs(Math.sin(t.phase)) * 0.8 * stride;
    g.position.set(t.x, t.y + bob + Math.sin(clock.elapsedTime * 2) * 0.08, t.z);
    g.rotation.y = t.yaw;
    const swing = airborne ? 0.5 : Math.sin(t.phase) * 0.7 * stride;
    rig.legL.current?.rotation.set(swing, 0, 0);
    rig.legR.current?.rotation.set(airborne ? -0.5 : -swing, 0, 0);
    rig.armL.current?.rotation.set(airborne ? -2.6 : -swing * 0.9, 0, 0);
    rig.armR.current?.rotation.set(airborne ? -2.6 : swing * 0.9, 0, 0);
  });

  if (!kind) return null;
  return (
    <group ref={root} userData={{ noPick: true }}>
      {kind === "cowboy" ? <Cowboy {...rig} /> : <Ranger {...rig} />}
    </group>
  );
}
