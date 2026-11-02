"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { interiorInteraction } from "@/lib/interactions";
import { mat } from "@/lib/three/materials";
import { concreteTexture, labelTexture, marbleTexture, skyTexture, tileTexture, wallTexture, woodFloorTexture } from "@/lib/three/textures";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import type { ColliderSet } from "@/lib/world/colliders";
import { furnitureFootprint, interiors, type InteriorDef } from "@/lib/world/interiors";
import type { Rect } from "@/lib/world/types";
import { Box } from "./buildings/parts";
import { Furniture } from "./interior/Furniture";
import { WalkingController } from "./WalkingController";

function floorTexture(def: InteriorDef) {
  const { w, d } = def.size;
  let base: THREE.Texture;
  let tile = 4;
  switch (def.floor) {
    case "wood":
      base = woodFloorTexture();
      tile = 3;
      break;
    case "tile":
      base = tileTexture("#e7e5e4", "#c4c0ba");
      tile = 2;
      break;
    case "concrete":
      base = concreteTexture();
      tile = 4;
      break;
    case "marble":
      base = marbleTexture();
      tile = 3;
      break;
  }
  const t = base.clone();
  t.repeat.set(w / tile, d / tile);
  t.needsUpdate = true;
  return t;
}

function Shell({ def }: { def: InteriorDef }) {
  const { w, d, h } = def.size;
  const floor = useMemo(() => floorTexture(def), [def]);
  const wallMap = useMemo(() => {
    const t = wallTexture().clone();
    t.repeat.set(w / 4, h / 4);
    t.needsUpdate = true;
    return t;
  }, [w, h]);
  const wall = <meshStandardMaterial map={wallMap} color={def.wallColor} roughness={0.95} />;
  const sky = skyTexture();
  const exitTex = labelTexture("EXIT", { bg: "#15803d", fg: "#ffffff", width: 256, height: 96, radius: 8 });
  const doorZ = d / 2;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} roughness={def.floor === "marble" ? 0.25 : 0.7} />
      </mesh>
      <mesh position={[0, h, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f8f7f4" roughness={1} />
      </mesh>
      {/* Walls face inward */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        {wall}
      </mesh>
      <mesh position={[0, h / 2, d / 2]} rotation-y={Math.PI} receiveShadow>
        <planeGeometry args={[w, h]} />
        {wall}
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[d, h]} />
        {wall}
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[d, h]} />
        {wall}
      </mesh>
      {/* Accent band and baseboards */}
      {[
        [0, -d / 2 + 0.02, w, 0],
        [0, d / 2 - 0.02, w, Math.PI],
        [-w / 2 + 0.02, 0, d, Math.PI / 2],
        [w / 2 - 0.02, 0, d, -Math.PI / 2],
      ].map(([x, z, len, rot], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={rot}>
          <Box size={[len, 0.15, 0.04]} position={[0, 0.075, 0]} color="#f5f5f4" cast={false} />
          <Box size={[len, 0.12, 0.03]} position={[0, 1.05, 0]} color={def.accent} cast={false} />
        </group>
      ))}
      {/* Windows on the side walls */}
      {[-1, 1].flatMap((side) =>
        [-d / 4, d / 4].map((z) => (
          <group key={`${side}${z}`} position={[side * (w / 2 - 0.03), h * 0.6, z]} rotation-y={-side * (Math.PI / 2)}>
            <Box size={[2.2, 1.5, 0.08]} position={[0, 0, 0]} color="#f8fafc" cast={false} />
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[2, 1.3]} />
              <meshBasicMaterial map={sky} toneMapped={false} />
            </mesh>
            <Box size={[0.06, 1.3, 0.04]} position={[0, 0, 0.08]} color="#f8fafc" cast={false} />
          </group>
        )),
      )}
      {/* Ceiling light panels */}
      {[-w / 4, w / 4].flatMap((x) =>
        [-d / 4, d / 4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, h - 0.02, z]} rotation-x={Math.PI / 2} material={mat("#ffffff", { emissive: "#fff7e6", emissiveIntensity: 1.6 })}>
            <planeGeometry args={[1.6, 0.7]} />
          </mesh>
        )),
      )}
      {/* Exit door */}
      <group position={[def.doorX, 0, doorZ - 0.03]} rotation-y={Math.PI}>
        <Box size={[1.9, 2.7, 0.1]} position={[0, 1.35, 0]} color="#f8fafc" cast={false} />
        <mesh position={[0, 1.3, 0.06]}>
          <planeGeometry args={[1.6, 2.5]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        <Box size={[0.05, 2.5, 0.04]} position={[0, 1.3, 0.08]} color="#d1d5db" cast={false} />
        <mesh position={[0, 3, 0.06]}>
          <planeGeometry args={[0.8, 0.3]} />
          <meshBasicMaterial map={exitTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.01, 0.8]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.8, 1.2]} />
          <meshStandardMaterial color="#374151" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

function InteriorLights({ def }: { def: InteriorDef }) {
  const { w, d, h } = def.size;
  return (
    <group>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#fffaf0", "#b7a68e", 0.6]} />
      <directionalLight
        position={[w * 0.3, h * 3, d * 0.4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-w}
        shadow-camera-right={w}
        shadow-camera-top={d}
        shadow-camera-bottom={-d}
      />
      {[-w / 4, w / 4].map((x) => (
        <pointLight key={x} position={[x, h - 0.4, 0]} intensity={10} distance={w * 1.2} decay={1.6} color="#fff2dc" />
      ))}
    </group>
  );
}

export function InteriorScene() {
  const id = useStore((s) => s.interiorId);
  const def = id ? interiors[id] : null;
  const colliders = useMemo<ColliderSet | null>(() => {
    if (!def) return null;
    const { w, d } = def.size;
    return {
      boxes: def.items.map(furnitureFootprint).filter((r): r is Rect => !!r),
      circles: [],
      bounds: { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2 },
    };
  }, [def]);
  if (!def || !colliders) return null;
  return (
    <group>
      <InteriorLights def={def} />
      <Shell def={def} />
      {def.items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]} rotation-y={it.rot ?? 0}>
          <Furniture it={it} roomH={def.size.h} />
        </group>
      ))}
      <WalkingController
        key={def.id}
        pose={runtime.interiorPlayer}
        colliders={colliders}
        speed={3.6}
        radius={0.3}
        findInteraction={(p) => interiorInteraction(def.id, p)}
      />
    </group>
  );
}
