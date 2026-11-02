"use client";

import { Edges } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { memo } from "react";
import { useStore } from "@/lib/store";
import { buildingHeight, facingRotation } from "@/lib/world/buildings";
import type { BuildingDef } from "@/lib/world/types";
import { BuildingModel } from "./buildings/models";

const interactive = () => {
  const m = useStore.getState().mode;
  return m === "room" || m === "overhead";
};

function Highlight({ b, strong }: { b: BuildingDef; strong: boolean }) {
  const h = buildingHeight(b);
  const color = strong ? "#3b82f6" : "#fde68a";
  return (
    <group>
      <mesh position={[0, h / 2, 0]} raycast={() => null}>
        <boxGeometry args={[b.w + 1.2, h + 0.8, b.d + 1.2]} />
        <meshBasicMaterial color={color} transparent opacity={strong ? 0.14 : 0.1} depthWrite={false} />
        <Edges color={color} lineWidth={2} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]} raycast={() => null}>
        <planeGeometry args={[b.w + 3, b.d + 3]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

export const Building = memo(function Building({ b }: { b: BuildingDef }) {
  const hovered = useStore((s) => s.hoveredId === b.id);
  const selected = useStore((s) => s.selection?.kind === "building" && s.selection.id === b.id);
  const setHovered = useStore((s) => s.setHovered);
  const select = useStore((s) => s.select);

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive()) return;
    e.stopPropagation();
    setHovered(b.id);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (useStore.getState().hoveredId === b.id) setHovered(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive() || e.delta > 5) return;
    e.stopPropagation();
    select({ kind: "building", id: b.id });
  };
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive()) return;
    e.stopPropagation();
    useStore.getState().enterWorld({ buildingId: b.id });
  };

  return (
    <group
      position={[b.x, 0, b.z]}
      rotation-y={facingRotation(b.facing)}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <BuildingModel b={b} />
      {(hovered || selected) && <Highlight b={b} strong={selected} />}
    </group>
  );
});
