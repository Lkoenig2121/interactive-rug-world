"use client";

import { MapControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { MapControls as MapControlsImpl } from "three-stdlib";
import { ANDY_PLACE, clampIntoPlace, EXPLORE_EYE, explorePose, houseFloorAt, housePlaceAtPoint, INDOOR_ZOOM, roomZoomCap, type HousePlace } from "@/lib/house/doors";
import { STOREY } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { easeInOutCubic, FOV, HOUSE_TARGET_Y, housePose, overheadPose, roomCameraPose } from "@/lib/three/cameraPoses";
import { useStore } from "@/lib/store";

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

interface Anim {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t: number;
}

/** The room, the house and the whole suburb around it. */
const WORLD_BOUNDS = { x: [-78000, 78000], z: [-16000, 76000] } as const;

/**
 * WASD / arrows pan across the house and neighborhood. Drag to rotate and tilt, wheel to zoom.
 * The room and outside views can roam the whole world; the overhead map stays over the rug.
 */
const VARIANTS = {
  room: { min: 18, max: 30000, polar: 1.56, fov: FOV.room, world: true, bounds: WORLD_BOUNDS },
  house: { min: 18, max: 30000, polar: 1.48, fov: FOV.house, world: true, bounds: WORLD_BOUNDS },
  overhead: { min: 25, max: 640, polar: 1.2, fov: FOV.overhead, world: false, bounds: { x: [-260, 260], z: [-200, 280] } },
} as const;

/** Orbit height: standing eye level inside a room, or the lawn outside. */
const orbitY = (t: THREE.Vector3, indoor: boolean) => {
  if (!indoor) return HOUSE_TARGET_Y;
  const floor = houseFloorAt(t);
  return floor === null ? HOUSE_TARGET_Y : floor + EXPLORE_EYE;
};

export function MapCameraControls({ variant }: { variant: keyof typeof VARIANTS }) {
  const ref = useRef<MapControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const cmd = useStore((s) => s.cameraCommand);
  const handled = useRef(0);
  const anim = useRef<Anim | null>(null);
  const lockedRoom = useRef<HousePlace | null>(variant === "room" ? ANDY_PLACE : null);
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
    const y = variant === "house" ? HOUSE_TARGET_Y : variant === "room" ? EXPLORE_EYE : 0;
    const t = dir.y < -0.05 ? (y - camera.position.y) / dir.y : 100;
    c.target.copy(camera.position).addScaledVector(dir, t);
    c.target.y = y;
    camera.fov = cfg.fov;
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
      const cap = variant === "room" && houseFloorAt(target) !== null ? INDOOR_ZOOM : maxDistance;
      toPos = target.clone().add(offset.multiplyScalar(Math.min(1.7, cap / offset.length())));
    } else if (cmd.kind === "look") {
      if (!cmd.lookAt) return;
      if (variant === "room") {
        const dest = housePlaceAtPoint(cmd.lookAt);
        if (dest) {
          lockedRoom.current = dest;
          const view = explorePose(dest);
          toTarget = new THREE.Vector3(view.target.x, view.target.y, view.target.z);
          toPos = new THREE.Vector3(view.pos.x, view.pos.y, view.pos.z);
        } else {
          toTarget = new THREE.Vector3(cmd.lookAt.x, cmd.lookAt.y, cmd.lookAt.z);
          toPos = toTarget.clone().add(offset.length() > 1 ? offset.setLength(Math.min(offset.length(), 280)) : new THREE.Vector3(0, 180, 220));
        }
      } else if (variant === "house") {
        toTarget = new THREE.Vector3(cmd.lookAt.x, cmd.lookAt.y, cmd.lookAt.z);
        toPos = cmd.lookFrom
          ? new THREE.Vector3(cmd.lookFrom.x, cmd.lookFrom.y, cmd.lookFrom.z)
          : toTarget.clone().add(offset.length() > 1 ? offset.setLength(Math.min(offset.length(), 280)) : new THREE.Vector3(0, 180, 220));
      } else return;
    } else {
      const p = pose();
      toPos = p.pos;
      toTarget = p.target;
      if (variant === "room") lockedRoom.current = ANDY_PLACE;
    }
    anim.current = { fromPos: pos, toPos, fromTarget: target, toTarget, t: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd]);

  const setNear = (near: number) => {
    if (Math.abs(camera.near - near) < camera.near * 0.05) return;
    camera.near = near;
    camera.updateProjectionMatrix();
  };

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
    const keys = runtime.keys;
    const fwd = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    if (fwd || strafe) {
      camera.getWorldDirection(_fwd);
      if (Math.abs(_fwd.y) > 0.92) _fwd.set(0, 1, 0).applyQuaternion(camera.quaternion);
      _fwd.y = 0;
      if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, -1);
      else _fwd.normalize();
      _right.crossVectors(_fwd, _up).normalize();
      const dist = Math.max(40, camera.position.distanceTo(c.target));
      const boost = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2.4 : 1;
      _delta.copy(_fwd).multiplyScalar(fwd).addScaledVector(_right, strafe);
      if (_delta.lengthSq() > 0) {
        _delta.normalize().multiplyScalar(dist * 0.22 * boost * dt);
        camera.position.add(_delta);
        c.target.add(_delta);
        anim.current = null;
        c.update();
      }
    }
    c.target.x = THREE.MathUtils.clamp(c.target.x, cfg.bounds.x[0], cfg.bounds.x[1]);
    c.target.z = THREE.MathUtils.clamp(c.target.z, cfg.bounds.z[0], cfg.bounds.z[1]);
    if (variant === "room" && !anim.current) {
      const room = lockedRoom.current ?? housePlaceAtPoint(c.target) ?? ANDY_PLACE;
      lockedRoom.current = room;
      const ox = c.target.x;
      const oz = c.target.z;
      clampIntoPlace(c.target, room);
      camera.position.x += c.target.x - ox;
      camera.position.z += c.target.z - oz;
      const cam = { x: camera.position.x, z: camera.position.z };
      clampIntoPlace(cam, room, 20);
      camera.position.x = cam.x;
      camera.position.z = cam.z;
      c.update();
    }
    if (!cfg.world) {
      c.target.y = 0;
      setNear(0.5);
      return;
    }
    const indoor = variant === "room" && houseFloorAt(c.target) !== null;
    const cap = indoor && lockedRoom.current ? roomZoomCap(lockedRoom.current) : indoor ? INDOOR_ZOOM : cfg.max;
    c.maxDistance = cap;
    if (indoor) {
      const floor = houseFloorAt(c.target) ?? 0;
      if (camera.position.y > floor + STOREY - 16) camera.position.y = floor + STOREY - 16;
      if (!anim.current) {
        const d = camera.position.distanceTo(c.target);
        if (d > cap) camera.position.lerpVectors(c.target, camera.position, cap / d);
      }
      c.update();
    }
    // Glide between the rug's floor and the lawn instead of snapping when crossing the room's walls.
    if (!anim.current) c.target.y += (orbitY(c.target, variant === "room") - c.target.y) * Math.min(1, dt * 5);
    // A near plane that grows with distance keeps depth precision across rug and suburb scales.
    setNear(THREE.MathUtils.clamp(camera.position.distanceTo(c.target) * 0.004, 0.5, 20));
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
      rotateSpeed={0.75}
      enablePan={variant !== "room"}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      zoomToCursor
    />
  );
}
