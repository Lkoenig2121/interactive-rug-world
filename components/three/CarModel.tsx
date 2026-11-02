"use client";

import { RoundedBox } from "@react-three/drei";
import { forwardRef } from "react";
import * as THREE from "three";
import { mat } from "@/lib/three/materials";

interface CarProps {
  color?: string;
  variant?: "sedan" | "police" | "hatch";
  brakeLights?: boolean;
}

const WHEELS: [number, number][] = [
  [-0.92, -1.3],
  [0.92, -1.3],
  [-0.92, 1.3],
  [0.92, 1.3],
];

/** Toy car, 4.2 long, facing -z. Wheels are exposed via the forwarded ref group's children named "wheel". */
export const CarModel = forwardRef<THREE.Group, CarProps>(function CarModel({ color = "#ef4444", variant = "sedan", brakeLights }, ref) {
  const body = mat(color, { roughness: 0.32, metalness: 0.35 });
  const dark = mat("#1f2937", { roughness: 0.7 });
  const glass = mat("#1e293b", { roughness: 0.05, metalness: 0.6 });
  const cabinLen = variant === "hatch" ? 2.6 : 2.2;
  const cabinZ = variant === "hatch" ? 0.45 : 0.15;
  return (
    <group ref={ref}>
      <RoundedBox args={[1.9, 0.7, 4.2]} radius={0.22} smoothness={3} position={[0, 0.62, 0]} material={body} castShadow receiveShadow />
      <RoundedBox args={[1.7, 0.66, cabinLen]} radius={0.2} smoothness={3} position={[0, 1.22, cabinZ]} material={glass} castShadow />
      <RoundedBox args={[1.6, 0.12, cabinLen - 0.3]} radius={0.05} smoothness={2} position={[0, 1.56, cabinZ]} material={body} castShadow />
      {/* Bumpers */}
      <mesh position={[0, 0.42, -2.12]} material={dark}>
        <boxGeometry args={[1.86, 0.22, 0.12]} />
      </mesh>
      <mesh position={[0, 0.42, 2.12]} material={dark}>
        <boxGeometry args={[1.86, 0.22, 0.12]} />
      </mesh>
      {/* Lights */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.72, -2.11]} material={mat("#fffbe6", { emissive: "#fff3c4", emissiveIntensity: 1.2 })}>
            <boxGeometry args={[0.42, 0.16, 0.06]} />
          </mesh>
          <mesh position={[x, 0.74, 2.11]} material={mat("#b91c1c", { emissive: "#ef4444", emissiveIntensity: brakeLights ? 2.5 : 0.6 })}>
            <boxGeometry args={[0.42, 0.14, 0.06]} />
          </mesh>
        </group>
      ))}
      {variant === "police" && (
        <group>
          <mesh position={[0, 0.66, 0]} material={mat("#1d4ed8")}>
            <boxGeometry args={[1.92, 0.18, 2.2]} />
          </mesh>
          <mesh position={[-0.32, 1.7, cabinZ]} material={mat("#2563eb", { emissive: "#3b82f6", emissiveIntensity: 2 })}>
            <boxGeometry args={[0.55, 0.16, 0.3]} />
          </mesh>
          <mesh position={[0.32, 1.7, cabinZ]} material={mat("#dc2626", { emissive: "#ef4444", emissiveIntensity: 2 })}>
            <boxGeometry args={[0.55, 0.16, 0.3]} />
          </mesh>
        </group>
      )}
      {WHEELS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.38, z]} name="wheel">
          <mesh rotation-z={Math.PI / 2} material={mat("#111111", { roughness: 0.9 })} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 18]} />
          </mesh>
          <mesh rotation-z={Math.PI / 2} position={[x > 0 ? 0.16 : -0.16, 0, 0]} material={mat("#d1d5db", { metalness: 0.8, roughness: 0.3 })}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
});
