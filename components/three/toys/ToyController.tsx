"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EXT_Y, GROUND_Y, HOUSE, inRect, STOREY, UPPER_Y } from "@/lib/house/layout";
import { groundHeight, onRug, resolveWalls, STEP_HEIGHT, wallsNear } from "@/lib/house/walkable";
import { FOV, toyCameraPose } from "@/lib/three/cameraPoses";
import { runtime, type Mount } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { landmarkById } from "@/lib/town/config";
import { placeAt, townInteraction } from "@/lib/town/interact";
import { nearestOnRoute, remainingLength, streetForSegment } from "@/lib/town/navigation";
import { clamp, wrapAngle, yawToDir } from "@/lib/world/geometry";

const GRAVITY = 980;
const LOOK_SPEED = 0.005;
const FLY_CEILING = EXT_Y + 9000;

/** How each way of getting around moves (cm, cm/s, rad/s) and where the camera sits. */
const PACE: Record<Mount, { walk: number; run: number; back: number; turn: number; radius: number; jump: number; cam: number; lift: number; accel: number }> = {
  none: { walk: 150, run: 480, back: 90, turn: 2.6, radius: 7, jump: 280, cam: 110, lift: 0, accel: 8 },
  car: { walk: 1300, run: 2600, back: 450, turn: 1.8, radius: 22, jump: 150, cam: 230, lift: 6, accel: 2.2 },
  horse: { walk: 450, run: 1500, back: 150, turn: 2.2, radius: 18, jump: 380, cam: 220, lift: 40, accel: 3 },
  fly: { walk: 900, run: 2800, back: 300, turn: 2, radius: 16, jump: 0, cam: 420, lift: 0, accel: 3 },
};

/** Fraction of the way from `a` to `b` where the segment first crosses a wall at height `y`, or 1. */
function firstWallHit(a: THREE.Vector3, b: THREE.Vector3, y: number) {
  let best = 1;
  const rx = b.x - a.x;
  const rz = b.z - a.z;
  const near = wallsNear(a.x, a.z);
  const far = wallsNear(b.x, b.z);
  for (const w of far === near ? near : near.concat(far)) {
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

/**
 * Third-person control of the toy: W/S to walk, A/D to turn, Shift to run, Space to jump, drag to look.
 * F flies (space ranger), H rides a horse (cowboy), R hops in an RC car, N opens town navigation.
 */
export function ToyController() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const checkTimer = useRef(0);
  const navTimer = useRef(0);
  const camPos = useRef<THREE.Vector3 | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    camera.fov = FOV.toy;
    camera.near = 0.5;
    camera.updateProjectionMatrix();
    return () => useStore.getState().setInteraction(null);
  }, [camera]);

  // Camera distance follows the mount.
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.mount !== prev.mount) runtime.toy.camDist = PACE[s.mount].cam;
      }),
    [],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.repeat || (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))) return;
      const s = useStore.getState();
      const m = runtime.toy.mount;
      switch (e.code) {
        case "KeyF":
          if (s.toy !== "ranger") s.showToast("Only the space ranger can fly. Cowboys ride horses: press H.");
          else {
            s.setMount(m === "fly" ? "none" : "fly");
            if (m !== "fly") s.showToast("To infinity! Space to climb, C to descend, F to land.");
          }
          break;
        case "KeyH":
          if (s.toy !== "cowboy") s.showToast("Only the cowboy rides horses. Space rangers fly: press F.");
          else {
            s.setMount(m === "horse" ? "none" : "horse");
            if (m !== "horse") s.showToast("Giddy-up! Shift to gallop, H to hop off.");
          }
          break;
        case "KeyR":
          s.setMount(m === "car" ? "none" : "car");
          break;
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

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
      t.camDist = clamp(t.camDist * Math.exp(e.deltaY * 0.0015), 40, t.mount === "none" ? 900 : 3000);
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

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = runtime.keys;
    const t = runtime.toy;
    const store = useStore.getState();
    const pace = PACE[t.mount];
    runtime.town.clock = clock.elapsedTime;

    let fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    let turn = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    let running = k.has("ShiftLeft") || k.has("ShiftRight");

    // Autopilot steers along the route until you touch the controls.
    const route = store.townRoute;
    if (store.townAutopilot && route && route.points.length > 1) {
      if (fwd !== 0 || turn !== 0) useStore.setState({ townAutopilot: false });
      else {
        const nav = runtime.town.nav;
        const target = route.points[Math.min(nav.routeIndex + 1, route.points.length - 1)];
        const dx = target.x - t.x;
        const dz = target.z - t.z;
        const d = Math.hypot(dx, dz);
        const reach = Math.max(60, pace.radius * 4, Math.abs(t.speed) * 0.25);
        if (d < reach && nav.routeIndex < route.points.length - 2) nav.routeIndex++;
        const diff = wrapAngle(Math.atan2(-dx, -dz) - t.yaw);
        turn = clamp(diff * 3, -1, 1);
        fwd = Math.abs(diff) < 1.1 ? 1 : 0.25;
        running = true;
        if (nav.routeIndex >= route.points.length - 2 && d < reach * 0.6) fwd = 0;
      }
    }

    t.turn = turn;
    t.yaw = wrapAngle(t.yaw + turn * pace.turn * dt * (t.mount === "car" ? clamp(Math.abs(t.speed) / 600, 0.25, 1) * Math.sign(t.speed || 1) : 1));
    const targetSpeed = fwd > 0 ? (running ? pace.run : pace.walk) * fwd : fwd < 0 ? -pace.back : 0;
    t.speed += (targetSpeed - t.speed) * Math.min(1, dt * pace.accel);

    // The camera swings back behind the toy unless you are dragging to look around.
    if (!dragging.current) {
      const rate = Math.abs(t.speed) > 5 || turn !== 0 ? 5 : 2;
      t.camYaw += wrapAngle(t.yaw - t.camYaw) * Math.min(1, dt * rate);
    }

    const dir = yawToDir(t.yaw);
    const step = t.speed * dt;
    const flying = t.mount === "fly";
    const tryMove = (dx: number, dz: number) => {
      const p = { x: t.x + dx, z: t.z + dz };
      resolveWalls(p, pace.radius, t.y + 2);
      const g = groundHeight(p.x, p.z, t.y);
      if (!flying && g > t.y + STEP_HEIGHT) return false;
      t.x = p.x;
      t.z = p.z;
      return true;
    };
    // Long steps (fast mounts) are split so walls can't be skipped.
    const sub = Math.max(1, Math.ceil(Math.abs(step) / (pace.radius * 0.8)));
    for (let i = 0; i < sub && Math.abs(step) > 0.001; i++) {
      const s = step / sub;
      if (!tryMove(dir.x * s, dir.z * s) && !tryMove(dir.x * s, 0)) tryMove(0, dir.z * s);
    }

    const ground = groundHeight(t.x, t.z, t.y);
    if (flying) {
      const climb = (k.has("Space") ? 1 : 0) - (k.has("KeyC") || k.has("ControlLeft") ? 1 : 0);
      const autoClimb = store.townAutopilot ? clamp((ground + 500 - t.y) / 200, -1, 1) : 0;
      t.vy += ((climb || autoClimb) * 700 - t.vy) * Math.min(1, dt * 4);
      t.y = clamp(t.y + t.vy * dt, ground, FLY_CEILING);
    } else {
      const grounded = t.vy <= 0 && t.y - ground < 4;
      if (grounded) {
        t.y = Math.max(ground, t.y - 400 * dt);
        if (t.y - ground < 4) t.y = ground;
        t.vy = 0;
        if (k.has("Space") && pace.jump > 0) t.vy = pace.jump;
      }
      if (t.vy !== 0 || t.y > ground) {
        t.vy -= GRAVITY * dt;
        t.y += t.vy * dt;
        if (t.y <= ground) {
          t.y = ground;
          t.vy = 0;
        }
      }
    }
    t.phase += dt * t.speed * (t.mount === "horse" ? 0.012 : t.mount === "none" ? 0.085 : 0.02);

    // Follow camera, pulled in when a wall would come between it and the toy.
    const pose = toyCameraPose({ ...t, y: t.y + pace.lift });
    const hit = firstWallHit(pose.target, pose.pos, Math.min(pose.pos.y, pose.target.y));
    if (hit < 1) pose.pos.lerpVectors(pose.target, pose.pos, Math.max(0.05, hit - 6 / t.camDist));
    if (inRect(t, HOUSE)) {
      const floor = t.y > (GROUND_Y + UPPER_Y) / 2 ? UPPER_Y : GROUND_Y;
      pose.pos.y = Math.min(pose.pos.y, floor + STOREY - 12);
    }
    pose.pos.y = Math.max(pose.pos.y, groundHeight(pose.pos.x, pose.pos.z, pose.pos.y) + 6);
    if (!camPos.current || runtime.town.snapCamera) {
      camPos.current = pose.pos.clone();
      runtime.town.snapCamera = false;
    }
    camPos.current.lerp(pose.pos, Math.min(1, dt * 12));
    camera.position.copy(camPos.current);
    camera.lookAt(pose.target);
    const near = clamp(t.camDist * 0.004, 0.5, 8);
    if (Math.abs(camera.near - near) > 0.05) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }

    checkTimer.current -= dt;
    if (checkTimer.current <= 0) {
      checkTimer.current = 0.15;
      const onTheRug = onRug(t) && t.y > -2 && t.y < 40 && t.mount === "none";
      store.setInteraction(onTheRug ? { label: "Shrink into Carpet World", action: () => useStore.getState().enterWorld({ at: { x: t.x, z: t.z } }) } : townInteraction(t, store.toy));
    }

    // Turn-by-turn progress, re-routing when you wander off, and arrival.
    navTimer.current -= dt;
    if (navTimer.current <= 0) {
      navTimer.current = 0.4;
      store.setPlace(placeAt(t));
      if (store.townNavigating && route && store.townDestination && route.points.length > 1) {
        const nav = runtime.town.nav;
        const near = nearestOnRoute(route.points, t);
        if (!store.townAutopilot) nav.routeIndex = near.index;
        else nav.routeIndex = Math.max(nav.routeIndex, near.index);
        if (near.dist > 1500 && !store.townAutopilot) {
          store.recomputeTownRoute();
          nav.routeIndex = 0;
        }
        nav.remaining = remainingLength(route.points, t, nav.routeIndex);
        nav.street = streetForSegment(route.points, nav.routeIndex);
        const end = route.points[route.points.length - 1];
        if (Math.hypot(end.x - t.x, end.z - t.z) < Math.max(250, pace.radius * 6)) {
          store.showToast(`You have arrived at ${landmarkById[store.townDestination].name}!`);
          runtime.town.triggers.wave = clock.elapsedTime;
          useStore.setState({ townNavigating: false, townAutopilot: false });
          t.speed = 0;
        }
      }
    }
  });

  return null;
}
