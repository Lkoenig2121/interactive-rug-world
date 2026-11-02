"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { buildings } from "@/lib/world/buildings";
import { ROAD_Y } from "@/lib/world/roads";
import { Building } from "./Building";
import { CarModel } from "./CarModel";
import { RoadNetwork } from "./RoadNetwork";
import { Benches, Bushes, ParkingLots, Parks, Ponds, RoadSigns, RoundaboutIsland, StreetLights, Trees } from "./Scenery";

function PlayerCar() {
  const group = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const c = runtime.car;
    g.position.set(c.x, ROAD_Y - 0.02, c.z);
    g.rotation.y = c.yaw;
    spin.current -= (c.speed * dt) / 0.38;
    model.current?.children.forEach((ch) => {
      if (ch.name !== "wheel") return;
      ch.rotation.order = "YXZ";
      ch.rotation.x = spin.current;
      if (ch.position.z < 0) ch.rotation.y = c.steer;
    });
    // Subtle body roll in turns
    if (model.current) model.current.rotation.z = THREE.MathUtils.lerp(model.current.rotation.z, -c.steer * Math.min(1, Math.abs(c.speed) / 20) * 0.08, 0.1);
  });
  return (
    <group ref={group}>
      <CarModel ref={model} color="#e11d48" />
    </group>
  );
}

function PlayerMarker() {
  const mode = useStore((s) => s.mode);
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const p = runtime.lastWorldMode === "drive" ? runtime.car : runtime.player;
    ref.current.position.set(p.x, 0.5, p.z);
    ref.current.rotation.y = p.yaw;
    if (ring.current) {
      const s = 1 + (clock.elapsedTime % 1.6) * 1.4;
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - (clock.elapsedTime % 1.6) / 1.6);
    }
  });
  if (mode !== "overhead") return null;
  return (
    <group ref={ref}>
      <mesh rotation-x={-Math.PI / 2} raycast={() => null}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} raycast={() => null}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} raycast={() => null}>
        <ringGeometry args={[2.2, 2.8, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.05, -3]} rotation-x={-Math.PI / 2} raycast={() => null}>
        <circleGeometry args={[1.2, 3, Math.PI / 2]} />
        <meshBasicMaterial color="#2563eb" />
      </mesh>
    </group>
  );
}

export function CarpetWorld() {
  return (
    <group>
      <RoadNetwork />
      <RoundaboutIsland />
      <ParkingLots />
      <Parks />
      <Ponds />
      <Trees />
      <Bushes />
      <StreetLights />
      <RoadSigns />
      <Benches />
      {buildings.map((b) => (
        <Building key={b.id} b={b} />
      ))}
      <PlayerCar />
      <PlayerMarker />
    </group>
  );
}
