"use client";

import { MapControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { MapControls as MapControlsImpl } from "three-stdlib";
import { easeInOutCubic, FOV, HOUSE_TARGET_Y, housePose, overheadPose, roomCameraPose } from "@/lib/three/cameraPoses";
import { useStore } from "@/lib/store";

interface Anim {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t: number;
}

/**
 * Google-Maps style controls: drag to pan, right-drag / two fingers to rotate and tilt, wheel to zoom.
 * Used for the room view and the in-world overhead map.
 */
const VARIANTS = {
  room: { min: 18, max: 820, polar: 1.38, near: 0.5, fov: FOV.room, y: 0, bounds: { x: [-260, 260], z: [-200, 280] } },
  overhead: { min: 25, max: 640, polar: 1.2, near: 0.5, fov: FOV.overhead, y: 0, bounds: { x: [-260, 260], z: [-200, 280] } },
  house: { min: 700, max: 16000, polar: 1.48, near: 5, fov: FOV.house, y: HOUSE_TARGET_Y, bounds: { x: [-9000, 9000], z: [-7000, 12000] } },
} as const;

export function MapCameraControls({ variant }: { variant: keyof typeof VARIANTS }) {
  const ref = useRef<MapControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cmd = useStore((s) => s.cameraCommand);
  const handled = useRef(cmd?.id ?? 0);
  const anim = useRef<Anim | null>(null);
  const cfg = VARIANTS[variant];
  const minDistance = cfg.min;
  const maxDistance = cfg.max;

  const pose = () => {
    const aspect = size.width / Math.max(1, size.height);
    return variant === "room" ? roomCameraPose(aspect) : variant === "house" ? housePose(aspect) : overheadPose(aspect);
  };

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    // Aim at the point the camera is already looking at so mounting causes no jump.
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const t = dir.y < -0.05 ? (cfg.y - camera.position.y) / dir.y : 100;
    c.target.copy(camera.position).addScaledVector(dir, t);
    c.target.y = cfg.y;
    camera.fov = cfg.fov;
    camera.near = cfg.near;
    camera.updateProjectionMatrix();
    c.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cmd || cmd.id === handled.current) return;
    handled.current = cmd.id;
    const c = ref.current;
    if (!c) return;
    const target = c.target.clone();
    const pos = camera.position.clone();
    const offset = pos.clone().sub(target);
    let toPos = pos;
    let toTarget = target;
    if (cmd.kind === "zoomIn") {
      toPos = target.clone().add(offset.multiplyScalar(Math.max(0.55, minDistance / offset.length())));
    } else if (cmd.kind === "zoomOut") {
      toPos = target.clone().add(offset.multiplyScalar(Math.min(1.7, maxDistance / offset.length())));
    } else {
      const p = pose();
      toPos = p.pos;
      toTarget = p.target;
    }
    anim.current = { fromPos: pos, toPos, fromTarget: target, toTarget, t: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd]);

  useFrame((_, dt) => {
    const c = ref.current;
    if (!c) return;
    const a = anim.current;
    if (a) {
      a.t = Math.min(1, a.t + dt / 0.7);
      const e = easeInOutCubic(a.t);
      camera.position.lerpVectors(a.fromPos, a.toPos, e);
      c.target.lerpVectors(a.fromTarget, a.toTarget, e);
      c.update();
      if (a.t >= 1) anim.current = null;
    }
    c.target.x = THREE.MathUtils.clamp(c.target.x, cfg.bounds.x[0], cfg.bounds.x[1]);
    c.target.z = THREE.MathUtils.clamp(c.target.z, cfg.bounds.z[0], cfg.bounds.z[1]);
    c.target.y = cfg.y;
  });

  return (
    <MapControls
      ref={ref}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={cfg.polar}
      screenSpacePanning={false}
      zoomSpeed={0.9}
      panSpeed={1.1}
      rotateSpeed={0.6}
      zoomToCursor
    />
  );
}
