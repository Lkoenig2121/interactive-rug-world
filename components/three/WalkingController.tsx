"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, FOV } from "@/lib/three/cameraPoses";
import { runtime } from "@/lib/runtime";
import { useStore, type Interaction } from "@/lib/store";
import { resolveCircle, type ColliderSet } from "@/lib/world/colliders";
import { clamp, yawToDir, yawToRight } from "@/lib/world/geometry";
import type { Vec2 } from "@/lib/world/types";

export interface WalkPose {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

interface Props {
  pose: WalkPose;
  colliders: ColliderSet;
  speed?: number;
  radius?: number;
  findInteraction?: (p: Vec2) => Interaction | null;
}

const LOOK_SPEED = 0.0024;

/** First-person explorer: WASD to move, mouse (pointer lock or drag) to look, Space to jump. */
export function WalkingController({ pose, colliders, speed = 6, radius = 0.35, findInteraction }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const vel = useRef({ x: 0, z: 0, y: 0, h: 0 });
  const bob = useRef(0);
  const checkTimer = useRef(0);

  useEffect(() => {
    camera.fov = FOV.walk;
    camera.near = 0.05;
    camera.updateProjectionMatrix();
    camera.rotation.order = "YXZ";
    vel.current = { x: 0, z: 0, y: 0, h: 0 };
    return () => useStore.getState().setInteraction(null);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const setLocked = useStore.getState().setPointerLocked;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      if (e.pointerType === "mouse" && !document.pointerLockElement) {
        try {
          const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
          r?.catch?.(() => {});
        } catch {
          /* drag-to-look fallback */
        }
      }
    };
    const up = () => {
      dragging = false;
    };
    const move = (e: PointerEvent) => {
      const locked = document.pointerLockElement === el;
      let dx: number;
      let dy: number;
      if (locked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (dragging) {
        dx = e.clientX - lastX;
        dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
      } else return;
      pose.yaw -= dx * LOOK_SPEED;
      pose.pitch = clamp(pose.pitch - dy * LOOK_SPEED, -1.35, 1.35);
    };
    const lockChange = () => setLocked(document.pointerLockElement === el);

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerlockchange", lockChange);
      if (document.pointerLockElement === el) document.exitPointerLock();
      setLocked(false);
    };
  }, [gl, pose]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = runtime.keys;
    const v = vel.current;
    const fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const strafe = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    const turn = (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0);
    pose.yaw += turn * dt * 2;
    const run = k.has("ShiftLeft") || k.has("ShiftRight") ? 1.9 : 1;

    const f = yawToDir(pose.yaw);
    const r = yawToRight(pose.yaw);
    let tx = f.x * fwd + r.x * strafe;
    let tz = f.z * fwd + r.z * strafe;
    const tl = Math.hypot(tx, tz);
    if (tl > 0) {
      tx = (tx / tl) * speed * run;
      tz = (tz / tl) * speed * run;
    }
    const grounded = v.h <= 0.001;
    const accel = grounded ? 12 : 3;
    v.x += (tx - v.x) * Math.min(1, dt * accel);
    v.z += (tz - v.z) * Math.min(1, dt * accel);

    const p = { x: pose.x + v.x * dt, z: pose.z + v.z * dt };
    resolveCircle(p, radius, colliders);
    pose.x = p.x;
    pose.z = p.z;

    if (k.has("Space") && grounded) v.y = 6.5;
    v.y -= 22 * dt;
    v.h = Math.max(0, v.h + v.y * dt);
    if (v.h === 0 && v.y < 0) v.y = 0;

    const moving = Math.hypot(v.x, v.z);
    if (grounded && moving > 0.5) bob.current += dt * moving * 1.4;
    const bobY = Math.sin(bob.current * 2) * 0.045 * Math.min(1, moving / speed);

    camera.position.set(pose.x, EYE_HEIGHT + v.h + bobY, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0, "YXZ");

    checkTimer.current -= dt;
    if (checkTimer.current <= 0 && findInteraction) {
      checkTimer.current = 0.15;
      useStore.getState().setInteraction(findInteraction(pose));
    }
  });

  return null;
}
