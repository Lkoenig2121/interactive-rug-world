"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

type V3 = [number, number, number];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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

interface Jet {
  wingL: React.RefObject<THREE.Group | null>;
  wingR: React.RefObject<THREE.Group | null>;
  flame: React.RefObject<THREE.Group | null>;
}

const SKIN = "#f2c9a0";

/** Folded paper plane the toy hangs under while gliding. */
function PaperPlane() {
  const paper = mat("#fbfaf5", { roughness: 0.8, side: THREE.DoubleSide });
  const wings = useMemo(
    () =>
      [-1, 1].map((s) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, -18, s * 16, 0, 14, 0, -2, 14]), 3));
        g.computeVertexNormals();
        return g;
      }),
    [],
  );
  return (
    <group position={[0, 40, 0]}>
      {wings.map((g, i) => (
        <mesh key={i} geometry={g} rotation={[0, 0, (i ? 1 : -1) * 0.18]} material={paper} />
      ))}
      <mesh position={[0, -1, 0]} material={paper}>
        <boxGeometry args={[0.4, 4, 30]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[s * 3, -10, 0]} rotation-z={s * 0.3} material={mat("#c9c3b5", { roughness: 0.9 })}>
          <cylinderGeometry args={[0.15, 0.15, 18, 4]} />
        </mesh>
      ))}
    </group>
  );
}

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

/** Space-ranger action figure, about 32 cm tall, with fold-out wings and a jetpack. */
function Ranger({ legL, legR, armL, armR, wingL, wingR, flame }: Rig & Jet) {
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
        <group key={s} ref={s < 0 ? wingL : wingR} position={[s * 2.5, 21.5, 5.6]}>
          <Box p={[s * 4.5, 0, 0]} s={[9, 1.4, 0.6]} c="#f8fafc" rough={0.3} />
          <Box p={[s * 8.4, 0, 0]} s={[1.6, 1.5, 0.7]} c="#f97316" rough={0.4} />
          <Ball p={[s * 8.4, 0.9, 0]} r={0.45} c={s < 0 ? "#ef4444" : "#22c55e"} rough={0.2} />
        </group>
      ))}
      <group ref={flame} position={[0, 16.4, 5.4]} visible={false}>
        {[-1.8, 1.8].map((x) => (
          <mesh key={x} position={[x, -3, 0]} rotation-x={Math.PI}>
            <coneGeometry args={[1.1, 6, 10]} />
            <meshBasicMaterial color="#ffb347" transparent opacity={0.85} toneMapped={false} />
          </mesh>
        ))}
      </group>
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
  const body = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Group>(null);
  const rig: Rig = { legL: useRef(null), legR: useRef(null), armL: useRef(null), armR: useRef(null) };
  const jet: Jet = { wingL: useRef(null), wingR: useRef(null), flame: useRef(null) };

  useFrame(({ clock }) => {
    const t = runtime.toy;
    const g = root.current;
    if (!g) return;
    const now = clock.elapsedTime;
    const flying = t.mount === "fly";
    // On the train roof the toy walks and jumps normally; on other rides it just stands.
    const riding = t.mount === "ride" && t.ride !== "train";
    const stride = riding ? 0 : Math.min(1, Math.abs(t.speed) / 140);
    const airborne = !riding && (Math.abs(t.vy) > 1 || flying);
    const bob = airborne ? 0 : Math.abs(Math.sin(t.phase)) * 0.8 * stride;
    g.position.set(t.x, t.y + bob + Math.sin(now * 2) * 0.08, t.z);
    g.rotation.y = t.yaw;
    // Lean into fast flight; flash when hurt in space.
    const lean = flying ? clamp01(Math.abs(t.speed) / 3000) * 0.9 : t.gliding ? 0.35 : 0;
    if (body.current) {
      body.current.rotation.x += (-lean - body.current.rotation.x) * 0.15;
      const hurt = now - runtime.explore.space.hitAt < 1;
      body.current.visible = !hurt || Math.sin(now * 40) > 0;
    }
    const swing = airborne ? 0.5 : Math.sin(t.phase) * 0.7 * stride;
    const armsUp = airborne && !flying;
    rig.legL.current?.rotation.set(flying ? 0.15 : swing, 0, 0);
    rig.legR.current?.rotation.set(flying ? 0.15 : airborne ? -0.5 : -swing, 0, 0);
    rig.armL.current?.rotation.set(armsUp || t.gliding ? -2.6 : flying ? -0.25 : -swing * 0.9, 0, 0);
    rig.armR.current?.rotation.set(armsUp || t.gliding ? -2.6 : flying ? -0.25 : swing * 0.9, 0, 0);

    // Wings snap out with a little overshoot, and fold flat against the pack when landed.
    const w = t.wings;
    const pop = w * (1 + Math.sin(Math.min(w, 1) * Math.PI) * 0.25);
    // In flight: a hover flutter that calms with speed, wings swept back when fast or boosting, and banking into turns.
    const speed = clamp01(Math.abs(t.speed) / 2800);
    const boosting = flying && t.boost > 0 ? 1 : 0;
    const flutter = flying ? Math.sin(now * (9 + speed * 6)) * (0.18 * (1 - speed) + 0.05) : 0;
    const sweep = flying ? speed * 0.35 + boosting * 0.3 : 0;
    const bank = flying ? t.turn * 0.25 : 0;
    for (const [ref, s] of [
      [jet.wingL, -1],
      [jet.wingR, 1],
    ] as const) {
      const wing = ref.current;
      if (!wing) continue;
      wing.scale.set(0.25 + 0.75 * pop, 1, 1);
      wing.rotation.set(0, s * ((1 - w) * 1.2 + sweep), s * (-0.3 * w + flutter) + bank);
    }
    const fl = jet.flame.current;
    if (fl) {
      fl.visible = flying && t.fuel > 0;
      const boost = t.boost > 0 ? 1.8 : 1;
      fl.scale.set(1, (0.8 + Math.sin(now * 40) * 0.2) * boost, 1);
    }
    if (plane.current) plane.current.visible = t.gliding && !flying;
  });

  if (!kind) return null;
  return (
    <group ref={root} userData={{ noPick: true }}>
      <group ref={body}>{kind === "cowboy" ? <Cowboy {...rig} /> : <Ranger {...rig} {...jet} />}</group>
      <group ref={plane} visible={false}>
        <PaperPlane />
      </group>
    </group>
  );
}
