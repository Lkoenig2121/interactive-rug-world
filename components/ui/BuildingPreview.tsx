"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { BuildingModel } from "@/components/three/buildings/models";
import { buildingHeight } from "@/lib/world/buildings";
import type { BuildingDef } from "@/lib/world/types";

function Spinner({ b }: { b: BuildingDef }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });
  const h = buildingHeight(b);
  const s = 9 / Math.max(b.w, b.d, h * 0.9);
  return (
    <group ref={ref} scale={s} rotation-y={-0.6}>
      <group position={[0, 0, 0]}>
        <BuildingModel b={b} />
      </group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[Math.max(b.w, b.d) * 0.85, 48]} />
        <meshStandardMaterial color="#7fb563" roughness={1} />
      </mesh>
    </group>
  );
}

/** Small rotating 3D preview of a building for the info panel. */
export function BuildingPreview({ b }: { b: BuildingDef }) {
  const h = buildingHeight(b) * (9 / Math.max(b.w, b.d, buildingHeight(b) * 0.9));
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [13, 6 + h * 0.4, 13], fov: 35 }} onCreated={({ camera }) => camera.lookAt(0, h * 0.4, 0)}>
      <color attach="background" args={["#eef2f7"]} />
      <hemisphereLight args={["#ffffff", "#9ca3af", 1.1]} />
      <directionalLight position={[8, 14, 6]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
      <Spinner b={b} />
    </Canvas>
  );
}
