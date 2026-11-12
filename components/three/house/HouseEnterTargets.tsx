"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { EXT_Y, HOUSE, inRect } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { insideLandmark, type Landmark } from "@/lib/town/config";

const YELLOW = "#fde68a";

/** Buildings you can click into — parks and open lots are skipped. */
export function isEnterableBuilding(l: Landmark) {
  if (l.id === "andy") return true;
  return l.solid && l.h >= 80;
}

/** Town houses stay clickable in neighborhood view; rug picking is disabled there on purpose. */
export function landmarkPickable() {
  const { mode, spawning } = useStore.getState();
  if (spawning) return false;
  return mode === "room" || mode === "house" || mode === "toy" || mode === "overhead";
}

function HoverGlow({ w, h, d }: { w: number; h: number; d: number }) {
  const t = Math.min(36, Math.max(16, Math.min(w, d) * 0.012));
  const hw = w / 2;
  const hd = d / 2;
  const bars: [number, number, number, number, number, number][] = [
    [0, t / 2, -hd, w, t, t],
    [0, t / 2, hd, w, t, t],
    [-hw, t / 2, 0, t, t, d],
    [hw, t / 2, 0, t, t, d],
    [0, h, -hd, w, t, t],
    [0, h, hd, w, t, t],
    [-hw, h, 0, t, t, d],
    [hw, h, 0, t, t, d],
    [-hw, h / 2, -hd, t, h, t],
    [hw, h / 2, -hd, t, h, t],
    [-hw, h / 2, hd, t, h, t],
    [hw, h / 2, hd, t, h, t],
  ];
  return (
    <group>
      <mesh position={[0, h / 2, 0]} raycast={() => null}>
        <boxGeometry args={[w + t * 2, h + t, d + t * 2]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      {bars.map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} raycast={() => null} renderOrder={12}>
          <boxGeometry args={[b[3], b[4], b[5]]} />
          <meshBasicMaterial color={YELLOW} toneMapped={false} depthTest={false} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 6, 0]} raycast={() => null}>
        <planeGeometry args={[w + 180, d + 180]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function outsideBuilding(l: Landmark, p: { x: number; y?: number; z: number }) {
  return l.id === "andy" ? !inRect(p, HOUSE, -40) : !insideLandmark(l, p, -30);
}

/**
 * Hover + click-to-enter on a landmark. Put this around the building's real meshes so
 * the pointer hits walls and roofs, not a sibling hitbox the facade would steal.
 *
 * `world`: children are already in world space (Andy's house). Otherwise they are in
 * the landmark's local space (LandmarkGroup).
 */
export function Enterable({ l, children, world = false }: { l: Landmark; children: ReactNode; world?: boolean }) {
  const hoverId = `landmark-${l.id}`;
  const hovered = useStore((s) => s.hoveredId === hoverId);
  const setHovered = useStore((s) => s.setHovered);
  const live = useRef(true);
  const h = Math.max(l.h, 400);

  useFrame(({ camera }) => {
    const s = useStore.getState();
    const p = s.mode === "toy" ? runtime.toy : camera.position;
    live.current = outsideBuilding(l, p);
    if (!live.current && s.hoveredId === hoverId) {
      s.setHovered(null);
      document.body.style.cursor = "";
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!landmarkPickable() || !live.current) return;
    e.stopPropagation();
    setHovered(hoverId);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (useStore.getState().hoveredId === hoverId) setHovered(null);
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!landmarkPickable() || !live.current || e.delta > 5) return;
    e.stopPropagation();
    setHovered(null);
    document.body.style.cursor = "";
    useStore.getState().enterLandmark(l.id);
  };

  const glow = hovered && live.current && (world ? (
    <group position={[l.x, EXT_Y, l.z]} rotation-y={l.rot} raycast={() => null}>
      <HoverGlow w={l.w} h={h} d={l.d} />
    </group>
  ) : (
    <HoverGlow w={l.w} h={h} d={l.d} />
  ));

  const hitbox = world ? (
    <mesh position={[l.x, EXT_Y + h / 2, l.z]} rotation-y={l.rot}>
      <boxGeometry args={[l.w, h, l.d]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  ) : (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[l.w, h, l.d]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );

  return (
    <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} onDoubleClick={onClick}>
      {children}
      {hitbox}
      {glow}
    </group>
  );
}
