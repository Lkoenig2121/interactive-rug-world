"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { hourOf, neighborPose } from "@/lib/explore/living";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

type G = RefObject<THREE.Group | null>;
interface Limbs {
  legL: G;
  legR: G;
  armL: G;
  armR: G;
}
interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  cap?: string;
  helmet?: string;
  bag?: boolean;
  ponytail?: boolean;
}

const useLimbs = (): Limbs => ({ legL: useRef(null), legR: useRef(null), armL: useRef(null), armR: useRef(null) });

/** A simple blocky grown-up (about 175 cm, facing +z); kids use the same rig scaled down. */
function Person({ look, limbs }: { look: Look; limbs: Limbs }) {
  const m = (color: string, roughness = 0.75) => <meshStandardMaterial color={color} roughness={roughness} />;
  return (
    <group>
      {(
        [
          [limbs.legL, -10],
          [limbs.legR, 10],
        ] as const
      ).map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 88, 0]}>
          <mesh position={[0, -42, 0]} castShadow>
            <boxGeometry args={[14, 84, 16]} />
            {m(look.pants)}
          </mesh>
          <mesh position={[0, -84, 4]} castShadow>
            <boxGeometry args={[15, 8, 27]} />
            {m(look.shoes, 0.5)}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 118, 0]} castShadow>
        <boxGeometry args={[42, 60, 24]} />
        {m(look.shirt)}
      </mesh>
      <mesh position={[0, 150, 0]}>
        <cylinderGeometry args={[5, 6, 8, 8]} />
        {m(look.skin)}
      </mesh>
      <mesh position={[0, 164, 0]} castShadow>
        <sphereGeometry args={[12, 16, 12]} />
        {m(look.skin, 0.6)}
      </mesh>
      <mesh position={[0, 167, -1.5]} scale={[1.04, 0.85, 1.04]}>
        <sphereGeometry args={[12.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {m(look.hair, 0.9)}
      </mesh>
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, 166, 11]}>
          <sphereGeometry args={[1.5, 8, 6]} />
          <meshStandardMaterial color="#1d1d1f" roughness={0.3} />
        </mesh>
      ))}
      {look.ponytail && (
        <mesh position={[0, 160, -13]} rotation-x={0.4}>
          <capsuleGeometry args={[4, 14, 4, 8]} />
          {m(look.hair, 0.9)}
        </mesh>
      )}
      {look.cap && (
        <group position={[0, 174, 0]}>
          <mesh>
            <cylinderGeometry args={[12.6, 12.8, 7, 16]} />
            {m(look.cap, 0.6)}
          </mesh>
          <mesh position={[0, -3, 13]}>
            <boxGeometry args={[18, 1.6, 11]} />
            {m(look.cap, 0.6)}
          </mesh>
        </group>
      )}
      {look.helmet && (
        <mesh position={[0, 168, 0]} scale={[1.15, 0.9, 1.25]}>
          <sphereGeometry args={[12.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {m(look.helmet, 0.3)}
        </mesh>
      )}
      {look.bag && (
        <group>
          <mesh position={[-27, 104, 0]} castShadow>
            <boxGeometry args={[9, 30, 30]} />
            {m("#6b4a2b", 0.8)}
          </mesh>
          <mesh position={[0, 126, 0]} rotation-z={0.75}>
            <boxGeometry args={[3, 66, 25]} />
            {m("#5a3d22", 0.8)}
          </mesh>
        </group>
      )}
      {(
        [
          [limbs.armL, -26],
          [limbs.armR, 26],
        ] as const
      ).map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 144, 0]}>
          <mesh position={[0, -30, 0]} castShadow>
            <boxGeometry args={[10, 60, 11]} />
            {m(look.shirt)}
          </mesh>
          <mesh position={[0, -63, 0]}>
            <sphereGeometry args={[5.5, 10, 8]} />
            {m(look.skin, 0.6)}
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A scruffy cream terrier with brown patches (facing +z). */
function Dog({ legs, toy }: { legs: G[]; toy: G }) {
  const fur = <meshStandardMaterial color="#efe3c8" roughness={1} />;
  const patch = <meshStandardMaterial color="#8a5a33" roughness={1} />;
  return (
    <group>
      <mesh position={[0, 36, 0]} castShadow>
        <boxGeometry args={[22, 22, 50]} />
        {fur}
      </mesh>
      <mesh position={[6, 44, -6]}>
        <boxGeometry args={[11.5, 8, 18]} />
        {patch}
      </mesh>
      <mesh position={[0, 50, 28]} castShadow>
        <boxGeometry args={[17, 17, 18]} />
        {fur}
      </mesh>
      <mesh position={[0, 46, 40]}>
        <boxGeometry args={[10, 9, 10]} />
        {fur}
      </mesh>
      <mesh position={[0, 49, 45.5]}>
        <sphereGeometry args={[2.6, 8, 6]} />
        <meshStandardMaterial color="#1d1d1f" roughness={0.3} />
      </mesh>
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 54, 37.2]}>
          <sphereGeometry args={[1.6, 8, 6]} />
          <meshStandardMaterial color="#1d1d1f" roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 9, 58, 25]} rotation-z={s * 0.5}>
          <boxGeometry args={[4, 11, 8]} />
          {patch}
        </mesh>
      ))}
      <mesh position={[0, 43, 21]}>
        <boxGeometry args={[18, 4, 4]} />
        <meshStandardMaterial color="#d62828" roughness={0.5} />
      </mesh>
      <mesh position={[0, 48, -28]} rotation-x={-0.7}>
        <cylinderGeometry args={[2, 3, 16, 6]} />
        {fur}
      </mesh>
      {legs.map((ref, i) => (
        <group key={i} ref={ref} position={[i % 2 ? 7 : -7, 26, i < 2 ? 18 : -18]}>
          <mesh position={[0, -12, 0]}>
            <boxGeometry args={[6, 26, 6]} />
            {fur}
          </mesh>
        </group>
      ))}
      {/* The toy it ran off with. */}
      <group ref={toy} position={[0, 44, 48]} visible={false}>
        <mesh>
          <boxGeometry args={[10, 12, 8]} />
          <meshStandardMaterial color="#3a86ff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 9, 0]}>
          <sphereGeometry args={[5, 10, 8]} />
          <meshStandardMaterial color="#ffd166" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Kid's bike (wheels, frame, bars, basket) with the rider sitting on top. */
function Bike({ frame, look, limbs }: { frame: string; look: Look; limbs: Limbs }) {
  const metal = <meshStandardMaterial color={frame} roughness={0.35} metalness={0.4} />;
  return (
    <group>
      {[-46, 46].map((z) => (
        <mesh key={z} position={[0, 30, z]} rotation-y={Math.PI / 2} castShadow>
          <torusGeometry args={[28, 3.2, 8, 24]} />
          <meshStandardMaterial color="#1d1d1f" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 58, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[2.2, 2.2, 80, 8]} />
        {metal}
      </mesh>
      <mesh position={[0, 44, 10]} rotation-x={Math.PI / 2 + 0.6}>
        <cylinderGeometry args={[2.2, 2.2, 66, 8]} />
        {metal}
      </mesh>
      <mesh position={[0, 62, 42]} rotation-x={-0.25}>
        <cylinderGeometry args={[2, 2, 66, 8]} />
        {metal}
      </mesh>
      <mesh position={[0, 92, 48]}>
        <boxGeometry args={[46, 3, 3]} />
        {metal}
      </mesh>
      <mesh position={[0, 76, 58]}>
        <boxGeometry args={[26, 15, 18]} />
        <meshStandardMaterial color="#d9d4c7" roughness={0.6} wireframe />
      </mesh>
      <mesh position={[0, 70, -24]}>
        <boxGeometry args={[11, 4, 20]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
      </mesh>
      <group position={[0, 8, -24]} scale={0.72}>
        <Person look={look} limbs={limbs} />
      </group>
    </group>
  );
}

const CARRIER: Look = { skin: "#c68863", hair: "#2b1d14", shirt: "#8fb8de", pants: "#24364f", shoes: "#1d1d1f", cap: "#24364f", bag: true };
const WALKER: Look = { skin: "#f1c7a6", hair: "#b5651d", shirt: "#3e8e5e", pants: "#3b5b8c", shoes: "#e9e6dc", ponytail: true };
const KID_A: Look = { skin: "#e8b48f", hair: "#3b2a1a", shirt: "#ffb703", pants: "#2a6f97", shoes: "#d62828", helmet: "#e63946" };
const KID_B: Look = { skin: "#8d5a3b", hair: "#1d1d1f", shirt: "#7bd389", pants: "#4a4e69", shoes: "#f1faee", helmet: "#3a86ff" };

/** The second kid rides this far behind the first, single file on the sidewalk. */
const KID_GAP = 170;

const walkSwing = (l: Limbs, phase: number, amount: number) => {
  const a = Math.sin(phase) * amount;
  l.legL.current?.rotation.set(a, 0, 0);
  l.legR.current?.rotation.set(-a, 0, 0);
  l.armL.current?.rotation.set(-a * 0.8, 0, 0);
  l.armR.current?.rotation.set(a * 0.8, 0, 0);
};

const pedal = (l: Limbs, phase: number) => {
  l.legL.current?.rotation.set(-1.2 + Math.sin(phase) * 0.45, 0, 0);
  l.legR.current?.rotation.set(-1.2 - Math.sin(phase) * 0.45, 0, 0);
  l.armL.current?.rotation.set(-1.15, 0, 0);
  l.armR.current?.rotation.set(-1.15, 0, 0);
};

/** Keeps the toy from walking through someone's legs. */
function pushOut(cx: number, cz: number, r: number) {
  const t = runtime.toy;
  const dx = t.x - cx;
  const dz = t.z - cz;
  const d = Math.hypot(dx, dz);
  if (d < r && d > 0.01) {
    t.x = cx + (dx / d) * r;
    t.z = cz + (dz / d) * r;
  }
}

/**
 * Neighbors with daily routines on Elm Street: the mail carrier in the morning, kids on bikes after
 * lunch, and a dog walker in the late afternoon. The dog can run off with a toy during its event.
 */
export function Neighbors() {
  const carrier = useRef<THREE.Group>(null);
  const walker = useRef<THREE.Group>(null);
  const dog = useRef<THREE.Group>(null);
  const kids = useRef<THREE.Group>(null);
  const kidA = useRef<THREE.Group>(null);
  const kidB = useRef<THREE.Group>(null);
  const carrierLimbs = useLimbs();
  const walkerLimbs = useLimbs();
  const kidALimbs = useLimbs();
  const kidBLimbs = useLimbs();
  const dogLegs: G[] = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const dogToy = useRef<THREE.Group>(null);
  const dogState = useRef({ x: 0, z: 0, yaw: 0, phase: 0, placed: false });
  const bellAt = useRef(-99);
  const leash = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    return g;
  }, []);
  const leashLine = useRef<THREE.LineSegments>(null);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const now = clock.elapsedTime;
    const s = useStore.getState();
    const t = runtime.toy;
    const hour = hourOf(runtime.explore.dayTime);
    const touchy = s.mode === "toy" && !s.inSpace && t.mount !== "ride" && t.y < EXT_Y + 170;

    const mail = neighborPose("mail", hour, now);
    if (carrier.current) {
      carrier.current.visible = !!mail;
      if (mail) {
        carrier.current.position.set(mail.x, EXT_Y + 6, mail.z);
        carrier.current.rotation.y = mail.yaw;
        walkSwing(carrierLimbs, mail.dist / 22, 0.45);
        if (touchy) pushOut(mail.x, mail.z, 34);
      }
    }

    const walk = neighborPose("walker", hour, now);
    if (walker.current) {
      walker.current.visible = !!walk;
      if (walk) {
        walker.current.position.set(walk.x, EXT_Y + 6, walk.z);
        walker.current.rotation.y = walk.yaw;
        walkSwing(walkerLimbs, walk.dist / 20, 0.4);
        walkerLimbs.armR.current?.rotation.set(-0.7, 0, 0);
        if (touchy) pushOut(walk.x, walk.z, 34);
      }
    }

    // The dog trots ahead of its walker, or races round a front yard with a toy during its event.
    const e = s.worldEvent;
    const anchor = e?.kind === "dog" ? e.anchor : undefined;
    const loose = !!anchor;
    const d = dogState.current;
    const dg = dog.current;
    if (dg) {
      dg.visible = !!walk || loose;
      let target: { x: number; z: number } | null = null;
      if (anchor && e) {
        const a = (now - e.start) * 0.62;
        const r = 420 + Math.sin(a * 2.3) * 120;
        target = { x: anchor.x + Math.cos(a) * r * 1.6, z: anchor.z + Math.sin(a) * r * 0.8 };
      } else if (walk) {
        const sn = Math.sin(walk.yaw);
        const cs = Math.cos(walk.yaw);
        target = { x: walk.x + sn * 150 - cs * 45, z: walk.z + cs * 150 + sn * 45 };
      }
      if (target) {
        if (!d.placed) Object.assign(d, { x: target.x, z: target.z, placed: true });
        const dx = target.x - d.x;
        const dz = target.z - d.z;
        const dist = Math.hypot(dx, dz);
        const step = Math.min(dist, (loose ? 700 : 450) * dt);
        if (dist > 0.5) {
          d.x += (dx / dist) * step;
          d.z += (dz / dist) * step;
          if (step > 1) d.yaw += (THREE.MathUtils.euclideanModulo(Math.atan2(dx, dz) - d.yaw + Math.PI, Math.PI * 2) - Math.PI) * Math.min(1, dt * 8);
        }
        d.phase += step * 0.09;
        dg.position.set(d.x, EXT_Y + 6, d.z);
        dg.rotation.y = d.yaw;
        dogLegs.forEach((ref, i) => ref.current?.rotation.set(Math.sin(d.phase + (i % 2 ? Math.PI : 0) + (i < 2 ? 0 : 0.6)) * (step > 0.5 ? 0.6 : 0), 0, 0));
        if (dogToy.current) dogToy.current.visible = !!loose;
        if (loose && e) {
          if (Math.abs(e.x - d.x) + Math.abs(e.z - d.z) > 250) s.setWorldEvent({ ...e, x: d.x, z: d.z });
          if (touchy && Math.hypot(t.x - d.x, t.z - d.z) < 75) s.completeEvent("You caught the dog and got the toy back! It wags its tail and trots home.");
        } else if (touchy) pushOut(d.x, d.z, 28);
      } else d.placed = false;
    }
    const line = leashLine.current;
    if (line) {
      line.visible = !!walk && !loose && !!dg?.visible;
      if (line.visible && walk) {
        const sn = Math.sin(walk.yaw);
        const cs = Math.cos(walk.yaw);
        const p = leash.attributes.position.array as Float32Array;
        p.set([walk.x - cs * 26 + sn * 20, EXT_Y + 90, walk.z + sn * 26 + cs * 20, d.x + Math.sin(d.yaw) * 20, EXT_Y + 50, d.z + Math.cos(d.yaw) * 20]);
        leash.attributes.position.needsUpdate = true;
      }
    }

    // Kids ride single file round the sidewalks; the bikes bump toys out of the way like cars do.
    const ride = neighborPose("kids", hour, now);

    const people = runtime.explore.people;
    people.mail = mail;
    people.walker = walk;
    people.kids = ride;
    people.dog = dg?.visible && d.placed ? { x: d.x, z: d.z } : null;
    if (kids.current) {
      kids.current.visible = !!ride;
      if (ride) {
        kids.current.position.set(ride.x, EXT_Y + 6, ride.z);
        kids.current.rotation.y = ride.yaw;
        pedal(kidALimbs, ride.dist / 30);
        pedal(kidBLimbs, ride.dist / 30 + 1.3);
        if (kidA.current) kidA.current.position.y = Math.sin(now * 2) * 0.6;
        if (kidB.current) kidB.current.position.y = Math.cos(now * 2) * 0.6;
        if (touchy) {
          const sn = Math.sin(ride.yaw);
          const cs = Math.cos(ride.yaw);
          for (const back of [0, KID_GAP]) {
            const bx = ride.x - sn * back;
            const bz = ride.z - cs * back;
            const dx = t.x - bx;
            const dz = t.z - bz;
            const along = dx * sn + dz * cs;
            const across = dx * cs - dz * sn;
            if (Math.abs(along) < 80 && Math.abs(across) < 22) {
              const side = across >= 0 ? 1 : -1;
              t.x = bx + cs * side * 60 + sn * along;
              t.z = bz - sn * side * 60 + cs * along;
              t.vy = 300;
              t.speed = 0;
              if (now - bellAt.current > 3) {
                bellAt.current = now;
                s.showToast("Ring ring! A kid swerves round you on a bike.");
              }
            }
          }
        }
      }
    }
  });

  return (
    <group>
      <group ref={carrier} visible={false}>
        <Person look={CARRIER} limbs={carrierLimbs} />
      </group>
      <group ref={walker} visible={false}>
        <Person look={WALKER} limbs={walkerLimbs} />
      </group>
      <group ref={dog} visible={false}>
        <Dog legs={dogLegs} toy={dogToy} />
      </group>
      <lineSegments ref={leashLine} geometry={leash} visible={false} raycast={() => null} frustumCulled={false}>
        <lineBasicMaterial color="#d62828" />
      </lineSegments>
      <group ref={kids} visible={false}>
        <group ref={kidA}>
          <Bike frame="#e63946" look={KID_A} limbs={kidALimbs} />
        </group>
        <group ref={kidB} position={[0, 0, -KID_GAP]}>
          <Bike frame="#2a9d8f" look={KID_B} limbs={kidBLimbs} />
        </group>
      </group>
    </group>
  );
}
