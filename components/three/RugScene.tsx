"use client";

import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { carpetBumpTexture, carpetTexture, rugBorderTexture } from "@/lib/three/textures";
import { RUG } from "@/lib/world/roads";
import { CarpetWorld } from "./CarpetWorld";

function useTiled(factory: () => import("three").Texture, rx: number, ry: number) {
  return useMemo(() => {
    const t = factory().clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return t;
  }, [factory, rx, ry]);
}

function Border() {
  const inner = { w: RUG.width - RUG.border * 2, d: RUG.depth - RUG.border * 2 };
  const longTex = useTiled(rugBorderTexture, RUG.width / 24, 1);
  const shortTex = useTiled(rugBorderTexture, inner.d / 24, 1);
  const b = RUG.border;
  return (
    <group position={[0, 0.012, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[0, 0, s * (RUG.depth / 2 - b / 2)]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[RUG.width, b]} />
          <meshStandardMaterial map={longTex} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`v${s}`} position={[s * (RUG.width / 2 - b / 2), 0, 0]} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} receiveShadow>
          <planeGeometry args={[inner.d, b]} />
          <meshStandardMaterial map={shortTex} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function RugScene() {
  const inner = { w: RUG.width - RUG.border * 2, d: RUG.depth - RUG.border * 2 };
  const map = useTiled(carpetTexture, inner.w / 14, inner.d / 14);
  const bump = useTiled(carpetBumpTexture, inner.w / 5, inner.d / 5);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const { mode, select } = useStore.getState();
    if ((mode !== "room" && mode !== "overhead") || e.delta > 5) return;
    e.stopPropagation();
    select({ kind: "location", point: { x: e.point.x, z: e.point.z } });
  };
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    const { mode, enterWorld } = useStore.getState();
    if (mode !== "room" && mode !== "overhead") return;
    e.stopPropagation();
    enterWorld({ at: { x: e.point.x, z: e.point.z } });
  };

  return (
    <group>
      <RoundedBox args={[RUG.width, RUG.thickness, RUG.depth]} radius={0.5} smoothness={3} position={[0, -RUG.thickness / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#284b8f" roughness={1} />
      </RoundedBox>
      <Border />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow onClick={onClick} onDoubleClick={onDoubleClick}>
        <planeGeometry args={[inner.w, inner.d]} />
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={1.2} roughness={1} color="#ffffff" />
      </mesh>
      <CarpetWorld />
    </group>
  );
}
