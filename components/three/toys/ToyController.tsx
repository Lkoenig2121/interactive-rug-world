"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GROUND_Y, HOUSE, inRect, STOREY, UPPER_Y } from "@/lib/house/layout";
import { groundHeight, onRug, resolveWalls, STEP_HEIGHT, WALLS } from "@/lib/house/walkable";
import { FOV, toyCameraPose } from "@/lib/three/cameraPoses";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { clamp, wrapAngle, yawToDir } from "@/lib/world/geometry";

const WALK = 150;
const RUN = 480;
const GRAVITY = 980;
const JUMP = 280;
const RADIUS = 7;
const LOOK_SPEED = 0.005;
const TURN_SPEED = 2.6;

/** Fraction of the way from `a` to `b` where the segment first crosses a wall at height `y`, or 1. */
function firstWallHit(a: THREE.Vector3, b: THREE.Vector3, y: number) {
  let best = 1;
  const rx = b.x - a.x;
  const rz = b.z - a.z;
  for (const w of WALLS) {
    if (y < w.y0 || y >= w.y1) continue;
    const sx = w.bx - w.ax;
    const sz = w.bz - w.az;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-6) continue;
    const t = ((w.ax - a.x) * sz - (w.az - a.z) * sx) / den;
    const u = ((w.ax - a.x) * rz - (w.az - a.z) * rx) / den;
    if (t > 0 && t < best && u >= 0 && u <= 1) best = t;
  }
  return best;
}

/** Third-person control of the toy: WASD to walk, Shift to run, Space to jump, drag to look around. */
export function ToyController() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const checkTimer = useRef(0);
  const camPos = useRef<THREE.Vector3 | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    camera.fov = FOV.toy;
    camera.near = 0.5;
    camera.updateProjectionMatrix();
    return () => useStore.getState().setInteraction(null);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    const t = runtime.toy;
    let lastX = 0;
    let lastY = 0;
    const down = (e: PointerEvent) => {
      dragging.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging.current = false;
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      t.camYaw -= (e.clientX - lastX) * LOOK_SPEED;
      t.camPitch = clamp(t.camPitch + (e.clientY - lastY) * LOOK_SPEED, -0.25, 1.35);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      t.camDist = clamp(t.camDist * Math.exp(e.deltaY * 0.0015), 40, 900);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = runtime.keys;
    const t = runtime.toy;

    // W/S walk forward and back along the way the toy faces; A/D turn it.
    const fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const turn = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    t.yaw = wrapAngle(t.yaw + turn * TURN_SPEED * dt);
    const pace = k.has("ShiftLeft") || k.has("ShiftRight") ? RUN : WALK;
    const target = fwd > 0 ? pace : fwd < 0 ? -WALK * 0.6 : 0;
    t.speed += (target - t.speed) * Math.min(1, dt * 8);

    // The camera swings back behind the toy unless you are dragging to look around.
    if (!dragging.current) {
      const rate = Math.abs(t.speed) > 5 || turn !== 0 ? 5 : 2;
      t.camYaw += wrapAngle(t.yaw - t.camYaw) * Math.min(1, dt * rate);
    }

    const dir = yawToDir(t.yaw);
    const step = t.speed * dt;
    const tryMove = (dx: number, dz: number) => {
      const p = { x: t.x + dx, z: t.z + dz };
      resolveWalls(p, RADIUS, t.y + 2);
      if (groundHeight(p.x, p.z, t.y) > t.y + STEP_HEIGHT) return false;
      t.x = p.x;
      t.z = p.z;
      return true;
    };
    if (Math.abs(step) > 0.001 && !tryMove(dir.x * step, dir.z * step) && !tryMove(dir.x * step, 0)) tryMove(0, dir.z * step);

    const ground = groundHeight(t.x, t.z, t.y);
    const grounded = t.vy <= 0 && t.y - ground < 4;
    if (grounded) {
      t.y = Math.max(ground, t.y - 400 * dt);
      if (t.y - ground < 4) t.y = ground;
      t.vy = 0;
      if (k.has("Space")) t.vy = JUMP;
    }
    if (t.vy !== 0 || t.y > ground) {
      t.vy -= GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y <= ground) {
        t.y = ground;
        t.vy = 0;
      }
    }
    t.phase += dt * t.speed * 0.085;

    // Follow camera, pulled in when a wall would come between it and the toy.
    const pose = toyCameraPose(t);
    const hit = firstWallHit(pose.target, pose.pos, Math.min(pose.pos.y, pose.target.y));
    if (hit < 1) pose.pos.lerpVectors(pose.target, pose.pos, Math.max(0.05, hit - 6 / t.camDist));
    if (inRect(t, HOUSE)) {
      const floor = t.y > (GROUND_Y + UPPER_Y) / 2 ? UPPER_Y : GROUND_Y;
      pose.pos.y = Math.min(pose.pos.y, floor + STOREY - 12);
    }
    pose.pos.y = Math.max(pose.pos.y, groundHeight(pose.pos.x, pose.pos.z, pose.pos.y) + 6);
    if (!camPos.current) camPos.current = camera.position.clone();
    camPos.current.lerp(pose.pos, Math.min(1, dt * 12));
    camera.position.copy(camPos.current);
    camera.lookAt(pose.target);

    checkTimer.current -= dt;
    if (checkTimer.current <= 0) {
      checkTimer.current = 0.15;
      const s = useStore.getState();
      const onTheRug = onRug(t) && t.y > -2 && t.y < 40;
      s.setInteraction(onTheRug ? { label: "Shrink into Carpet World", action: () => useStore.getState().enterWorld({ at: { x: t.x, z: t.z } }) } : null);
    }
  });

  return null;
}
