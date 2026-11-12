"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STARS } from "@/lib/explore/stars";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

let starGeo: THREE.ExtrudeGeometry | null = null;
/** Chunky five-pointed star, 1 unit across, centered on the origin. */
export function starGeometry() {
  if (starGeo) return starGeo;
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.22 : 0.5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  starGeo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
  starGeo.center();
  return starGeo;
}

const gold = new THREE.MeshStandardMaterial({ color: "#ffd23f", emissive: "#ffb300", emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 });
const moon = new THREE.MeshStandardMaterial({ color: "#c7d7ff", emissive: "#7aa2ff", emissiveIntensity: 1.1, metalness: 0.3, roughness: 0.3 });
const halo = new THREE.MeshBasicMaterial({ color: "#fff2b3", transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false });

/** Every uncollected star token in town, spinning; night-only ones fade in after dark. */
export function Stars() {
  const collected = useStore((s) => s.stars);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const left = useMemo(() => STARS.filter((s) => !collected.includes(s.id)), [collected]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const night = runtime.explore.night > 0.5;
    left.forEach((s, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = !s.night || night;
      g.rotation.y = t * 1.8 + i;
      g.position.y = s.y + Math.sin(t * 2 + i) * 8;
    });
  });

  return (
    <group>
      {left.map((s, i) => (
        <group
          key={s.id}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[s.x, s.y, s.z]}
          userData={{ noPick: true }}
        >
          <mesh geometry={starGeometry()} material={s.night ? moon : gold} scale={44} castShadow raycast={() => null} />
          <mesh material={halo} raycast={() => null}>
            <sphereGeometry args={[46, 16, 10]} />
          </mesh>
          {/* A faint pillar of light so stars on rooftops can be spotted from the street. */}
          <mesh position={[0, 600, 0]} material={halo} raycast={() => null}>
            <cylinderGeometry args={[6, 6, 1200, 6, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
