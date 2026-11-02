"use client";

import { Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { housePlaceAtPoint, PORTALS, type Portal } from "@/lib/house/doors";
import { travelPortal } from "@/lib/house/travel";
import { GROUND_Y, HOUSE, UPPER_Y } from "@/lib/house/layout";
import { useStore } from "@/lib/store";
import { Sign } from "../town/parts";

const GOLD = "#f5c518";
const GOLD_HOT = "#ffe566";
const MID = (GROUND_Y + UPPER_Y) / 2;
const HIT_PX = 70;
const CLUSTER_PX = 88;
const _proj = new THREE.Vector3();
const _dest = new THREE.Vector3();

function arrowVisible(p: Portal, mode: string, target: THREE.Vector3 | undefined) {
  if (mode === "toy") return false;
  const from = housePlaceAtPoint(p);
  const here = target ? housePlaceAtPoint(target) : null;
  const nearHouse = Math.abs((target?.x ?? 0) - (HOUSE.x0 + HOUSE.x1) / 2) < 5000 && Math.abs((target?.z ?? 0) - (HOUSE.z0 + HOUSE.z1) / 2) < 5000;
  const sameFloor = !target || (target.y > MID) === (p.y > MID);
  if (mode === "room" || mode === "transition") return !!from && !!here && from.id === here.id;
  if (mode === "house") return !from && nearHouse && sameFloor;
  return false;
}

function arrowTexture(hot: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);
  ctx.translate(128, 128);
  ctx.beginPath();
  ctx.moveTo(-78, -38);
  ctx.lineTo(6, -38);
  ctx.lineTo(6, -78);
  ctx.lineTo(96, 0);
  ctx.lineTo(6, 78);
  ctx.lineTo(6, 38);
  ctx.lineTo(-78, 38);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#1a1408";
  ctx.stroke();
  ctx.fillStyle = hot ? GOLD_HOT : GOLD;
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function FlatArrow({ p, hot, tex, texHot }: { p: Portal; hot: boolean; tex: THREE.CanvasTexture; texHot: THREE.CanvasTexture }) {
  const spin = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = spin.current;
    const parent = g?.parent;
    if (!g || !parent) return;
    _dest.set(p.to.x, p.y + 96, p.to.z);
    parent.worldToLocal(_dest);
    g.rotation.z = Math.atan2(_dest.y, _dest.x);
  });
  return (
    <group ref={spin} scale={hot ? 1.22 : 1}>
      <mesh renderOrder={20} raycast={() => {}}>
        <planeGeometry args={[96, 96]} />
        <meshBasicMaterial map={hot ? texHot : tex} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function DoorArrow({
  p,
  show,
  hot,
  stacked,
  tex,
  texHot,
}: {
  p: Portal;
  show: boolean;
  hot: boolean;
  stacked: boolean;
  tex: THREE.CanvasTexture;
  texHot: THREE.CanvasTexture;
}) {
  const root = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    g.visible = show;
    if (show) g.position.y = p.y + 108 + Math.sin(clock.elapsedTime * 2.6 + p.x * 0.01) * 8;
  });

  return (
    <group ref={root} position={[p.x, p.y + 108, p.z]} visible={show}>
      <Billboard follow>
        <FlatArrow p={p} hot={hot} tex={tex} texHot={texHot} />
        {hot && !stacked && <Sign text={p.label} position={[0, -56, 0]} size={[96, 22]} bg="#111827" fg={GOLD} border={GOLD} radius={8} glow />}
        {hot && stacked && <Sign text={`${p.label} + more`} position={[0, -56, 0]} size={[120, 22]} bg="#111827" fg={GOLD} border={GOLD} radius={8} glow />}
      </Billboard>
    </group>
  );
}

/** Flat doorway arrows. Picking is done in screen space so hover matches the cursor. */
export function RoomArrows() {
  const toy = useStore((s) => s.mode === "toy");
  const portals = useMemo(() => PORTALS, []);
  const tex = useMemo(() => arrowTexture(false), []);
  const texHot = useMemo(() => arrowTexture(true), []);
  const [shown, setShown] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cluster, setCluster] = useState<string[]>([]);
  const shownRef = useRef<string[]>([]);
  const hoverRef = useRef<string | null>(null);
  const clusterRef = useRef<string[]>([]);
  const pending = useRef<{ x: number; y: number; ids: string[] } | null>(null);
  const controls = useThree((s) => s.controls) as { target?: THREE.Vector3 } | null;
  const gl = useThree((s) => s.gl);

  useFrame(({ camera, pointer, size }) => {
    const mode = useStore.getState().mode;
    const target = controls?.target;
    const nextShown: string[] = [];
    const hits: { id: string; d: number; sx: number; sy: number }[] = [];
    for (const p of portals) {
      const show = arrowVisible(p, mode, target);
      if (!show) continue;
      nextShown.push(p.id);
      _proj.set(p.x, p.y + 108, p.z).project(camera);
      if (_proj.z < -1 || _proj.z > 1) continue;
      const dx = (_proj.x - pointer.x) * size.width * 0.5;
      const dy = (_proj.y - pointer.y) * size.height * 0.5;
      const d = Math.hypot(dx, dy);
      hits.push({ id: p.id, d, sx: _proj.x, sy: _proj.y });
    }
    hits.sort((a, b) => a.d - b.d);
    const top = hits.find((h) => h.d <= HIT_PX) ?? null;
    let nextCluster: string[] = [];
    if (top) {
      nextCluster = hits.filter((h) => Math.hypot((h.sx - top.sx) * size.width * 0.5, (h.sy - top.sy) * size.height * 0.5) <= CLUSTER_PX).map((h) => h.id);
      if (!nextCluster.includes(top.id)) nextCluster.unshift(top.id);
      const seen = new Set<string>();
      nextCluster = nextCluster.filter((id) => {
        const p = portals.find((x) => x.id === id);
        if (!p || seen.has(p.toName)) return false;
        seen.add(p.toName);
        return true;
      });
    }
    const nextHover = top?.id ?? null;
    if (nextShown.join() !== shownRef.current.join()) {
      shownRef.current = nextShown;
      setShown(nextShown);
    }
    if (nextHover !== hoverRef.current) {
      hoverRef.current = nextHover;
      setHovered(nextHover);
      document.body.style.cursor = nextHover ? "pointer" : "";
    }
    if (nextCluster.join() !== clusterRef.current.join()) {
      clusterRef.current = nextCluster;
      setCluster(nextCluster);
    }
  });

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      const ids = clusterRef.current;
      if (!ids.length) return;
      e.stopPropagation();
      pending.current = { x: e.clientX, y: e.clientY, ids: [...ids] };
    };
    const up = (e: PointerEvent) => {
      const hold = pending.current;
      pending.current = null;
      if (!hold) {
        if (useStore.getState().arrowPicker) useStore.getState().setArrowPicker(null);
        return;
      }
      if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 8) return;
      const unique = hold.ids;
      if (unique.length === 1) {
        const p = PORTALS.find((x) => x.id === unique[0]);
        if (p) travelPortal(p);
        return;
      }
      useStore.getState().setArrowPicker(unique);
    };
    el.addEventListener("pointerdown", down, true);
    el.addEventListener("pointerup", up, true);
    return () => {
      el.removeEventListener("pointerdown", down, true);
      el.removeEventListener("pointerup", up, true);
      document.body.style.cursor = "";
    };
  }, [gl]);

  if (toy) return null;
  const stacked = cluster.length > 1;
  const shownSet = new Set(shown);
  return (
    <group>
      {portals.map((p) => (
        <DoorArrow key={p.id} p={p} show={shownSet.has(p.id)} hot={hovered === p.id || (stacked && cluster.includes(p.id))} stacked={stacked && hovered === p.id} tex={tex} texHot={texHot} />
      ))}
    </group>
  );
}
