"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { yawToDir } from "@/lib/world/geometry";
import { missionStep, pickupPose } from "@/lib/town/missions";

/** Yellow rubber dinosaur — generic look-alike, not a film character. */
export function Squeak({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 9, 1]} castShadow material={mat("#f4d03f", { roughness: 0.35 })}>
        <sphereGeometry args={[7.5, 16, 12]} />
      </mesh>
      <mesh position={[0, 14.5, -5]} castShadow material={mat("#f4d03f", { roughness: 0.35 })}>
        <sphereGeometry args={[5.2, 14, 10]} />
      </mesh>
      <mesh position={[0, 13.2, -9.2]} material={mat("#c0392b", { roughness: 0.5 })}>
        <sphereGeometry args={[1.6, 8, 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.2, 15.4, -8.4]} material={mat("#ffffff")}>
            <sphereGeometry args={[1.35, 8, 6]} />
          </mesh>
          <mesh position={[s * 2.2, 15.4, -9.4]} material={mat("#1f2937")}>
            <sphereGeometry args={[0.7, 8, 6]} />
          </mesh>
          <mesh position={[s * 4.2, 3, 3]} castShadow material={mat("#e8b923", { roughness: 0.4 })}>
            <sphereGeometry args={[2.4, 8, 6]} />
          </mesh>
          <mesh position={[s * 3.6, 3, -3.5]} castShadow material={mat("#e8b923", { roughness: 0.4 })}>
            <sphereGeometry args={[2.2, 8, 6]} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 12 + i * 2.2, 7.5]} material={mat("#e67e22")}>
          <sphereGeometry args={[1.1, 6, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Beacon({ x, y, z }: { x: number; y: number; z: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.55 + Math.sin(t * 3) * 0.35;
    if (ring.current) {
      ring.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.18);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + pulse * 0.35;
    }
    if (beam.current) {
      (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + pulse * 0.16;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 2, 0]}>
        <ringGeometry args={[16, 28, 28]} />
        <meshBasicMaterial color="#f4d03f" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={[0, 70, 0]}>
        <cylinderGeometry args={[6, 18, 140, 12, 1, true]} />
        <meshBasicMaterial color="#fff3b0" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Token() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.6;
    ref.current.position.y = 14 + Math.sin(clock.elapsedTime * 2.5) * 3;
  });
  return (
    <group ref={ref}>
      <mesh rotation-y={0} material={mat("#f4d03f", { roughness: 0.2, metalness: 0.7, emissive: "#f4d03f", emissiveIntensity: 0.35 })}>
        <cylinderGeometry args={[8, 8, 2.2, 24]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} material={mat("#e67e22", { roughness: 0.3 })}>
        <torusGeometry args={[8, 1.1, 8, 24]} />
      </mesh>
    </group>
  );
}

function Charm() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime;
    ref.current.position.y = 12 + Math.sin(clock.elapsedTime * 2) * 2;
  });
  return (
    <group ref={ref} scale={0.22}>
      <mesh position={[0, 40, 0]} material={mat("#3aa655", { roughness: 0.4 })}>
        <sphereGeometry args={[30, 12, 10]} />
      </mesh>
      <mesh position={[0, 78, 18]} material={mat("#3aa655")}>
        <sphereGeometry args={[14, 10, 8]} />
      </mesh>
    </group>
  );
}

function Badge() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.2;
    ref.current.position.y = 16 + Math.sin(clock.elapsedTime * 2.2) * 3;
  });
  return (
    <group ref={ref}>
      <mesh rotation-x={Math.PI / 2} material={mat("#f4d03f", { roughness: 0.25, metalness: 0.65, emissive: "#f4d03f", emissiveIntensity: 0.25 })}>
        <cylinderGeometry args={[9, 9, 2, 5]} />
      </mesh>
    </group>
  );
}

/** Follows the player after the rescue, sits on the rug when the mission is done. */
function SqueakActor() {
  const missionId = useStore((s) => s.missionId);
  const root = useRef<THREE.Group>(null);
  const follow = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const seeded = useRef(false);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    if (missionId === "sid-rescue") {
      const p = pickupPose(missionStep("sid-rescue")!);
      g.position.set(p.x, p.y + 10 + Math.sin(clock.elapsedTime * 6) * 1.4, p.z);
      g.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.4;
      follow.current.set(p.x, p.y + 10, p.z);
      seeded.current = true;
      return;
    }
    if (missionId === "done" || missionId === "idle") {
      g.position.set(8, 4 + Math.sin(clock.elapsedTime * 1.5) * 0.4, 200);
      g.rotation.y = clock.elapsedTime * 0.3;
      return;
    }
    const t = runtime.toy;
    const dir = yawToDir(t.yaw);
    const rightX = -dir.z;
    const rightZ = dir.x;
    target.current.set(t.x - dir.x * 22 + rightX * 16, t.y + 6 + Math.sin(clock.elapsedTime * 5) * 2.2, t.z - dir.z * 22 + rightZ * 16);
    if (!seeded.current) {
      follow.current.copy(target.current);
      seeded.current = true;
    }
    follow.current.lerp(target.current, 0.12);
    g.position.copy(follow.current);
    g.rotation.y = t.yaw + Math.sin(clock.elapsedTime * 4) * 0.2;
  });

  if (missionId === "idle") return null;
  return (
    <group ref={root} userData={{ noPick: true }}>
      <Squeak />
    </group>
  );
}

function CurrentPickup() {
  const missionId = useStore((s) => s.missionId);
  const step = missionStep(missionId);
  if (!step) return null;
  const p = pickupPose(step);
  return (
    <group position={[p.x, p.y, p.z]}>
      <Beacon x={0} y={0} z={0} />
      {missionId === "pizza-token" && <Token />}
      {missionId === "dino-charm" && <Charm />}
      {missionId === "barn-badge" && <Badge />}
    </group>
  );
}

/** Rescue pickups, Squeak, and a beacon on the current objective. */
export function MissionWorld() {
  return (
    <>
      <CurrentPickup />
      <SqueakActor />
    </>
  );
}
