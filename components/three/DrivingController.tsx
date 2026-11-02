"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FOV } from "@/lib/three/cameraPoses";
import { worldDriveInteraction } from "@/lib/interactions";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { pointInsideAnyBox, resolveCircle, worldColliders } from "@/lib/world/colliders";
import { parkingLots } from "@/lib/world/features";
import { clamp, dirToYaw, pointAtDistance, pointInRect, projectOnPolyline, wrapAngle, yawToDir } from "@/lib/world/geometry";
import { projectToNetwork } from "@/lib/world/pathfinding";
import { ROAD_WIDTH, ROUNDABOUT } from "@/lib/world/roads";
import type { Route, Vec2 } from "@/lib/world/types";

const ACCEL = 12;
const BRAKE = 28;
const MAX_ROAD = 24;
const MAX_OFFROAD = 8;
const MAX_REVERSE = 6;
const WHEELBASE = 2.6;

function onDrivableSurface(p: Vec2): boolean {
  if (projectToNetwork(p).dist < ROAD_WIDTH / 2 + 0.9) return true;
  if (Math.hypot(p.x - ROUNDABOUT.x, p.z - ROUNDABOUT.z) < ROUNDABOUT.radius + ROAD_WIDTH / 2 + 0.5) return true;
  return parkingLots.some((l) => pointInRect(p, l.rect, 2.5));
}

interface AutoCommand {
  throttle: number;
  steer: number;
  brake: boolean;
  arrived: boolean;
}

/** Pure-pursuit driver that follows the navigation route in the right-hand lane. */
function autopilot(c: typeof runtime.car, route: Route): AutoCommand {
  const pr = projectOnPolyline(route.points, c);
  const remaining = route.length - pr.s;
  if (remaining < 9) return { throttle: 0, steer: 0, brake: true, arrived: true };
  const lookahead = clamp(4 + Math.abs(c.speed) * 0.55, 5, 13);
  const { point, dir } = pointAtDistance(route.points, pr.s + lookahead);
  const lane = remaining > 18 ? 2.3 : 0;
  const target = { x: point.x - dir.z * lane, z: point.z + dir.x * lane };
  const desired = dirToYaw({ x: target.x - c.x, z: target.z - c.z });
  const err = wrapAngle(desired - c.yaw);
  const ahead1 = pointAtDistance(route.points, pr.s + 3).dir;
  const ahead2 = pointAtDistance(route.points, pr.s + 18).dir;
  const bend = Math.abs(wrapAngle(dirToYaw(ahead2) - dirToYaw(ahead1)));
  let targetSpeed = bend > 0.9 ? 6.5 : bend > 0.4 ? 10 : 16;
  targetSpeed = Math.min(targetSpeed, remaining * 0.7 + 2);
  if (Math.abs(err) > 1.2) targetSpeed = Math.min(targetSpeed, 4);
  return {
    throttle: c.speed < targetSpeed ? 1 : 0,
    steer: clamp(err * 2.4, -1, 1),
    brake: c.speed > targetSpeed + 2.5,
    arrived: false,
  };
}

/** Arcade car physics with a smoothed third-person chase camera. */
export function DrivingController() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const look = useRef(new THREE.Vector3());
  const timers = useRef({ hud: 0, interact: 0 });
  const desired = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.fov = FOV.drive;
    camera.near = 0.05;
    camera.updateProjectionMatrix();
    const f = yawToDir(runtime.car.yaw);
    look.current.set(runtime.car.x + f.x * 4, 1.2, runtime.car.z + f.z * 4);
    return () => {
      useStore.getState().setInteraction(null);
      useStore.getState().setSpeed(0);
    };
  }, [camera]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = runtime.car;
    const k = runtime.keys;
    const st = useStore.getState();
    const up = k.has("KeyW") || k.has("ArrowUp");
    const down = k.has("KeyS") || k.has("ArrowDown");
    const left = k.has("KeyA") || k.has("ArrowLeft");
    const right = k.has("KeyD") || k.has("ArrowRight");
    const handbrake = k.has("Space");

    if (st.autopilot && (up || down || left || right || handbrake)) st.setAutopilot(false);

    let throttle = 0;
    let steerIn = 0;
    let braking = handbrake;
    if (st.autopilot && st.route) {
      const ap = autopilot(c, st.route);
      throttle = ap.throttle;
      steerIn = ap.steer;
      braking = ap.brake;
      if (ap.arrived && Math.abs(c.speed) < 0.5) st.setAutopilot(false);
    } else {
      if (up) throttle = 1;
      if (down) {
        if (c.speed > 0.4) braking = true;
        else throttle = -1;
      }
      steerIn = (left ? 1 : 0) - (right ? 1 : 0);
    }

    const onRoad = onDrivableSurface(c);
    const maxF = onRoad ? MAX_ROAD : MAX_OFFROAD;

    if (throttle > 0) c.speed += (c.speed < -0.2 ? BRAKE : ACCEL) * dt;
    else if (throttle < 0) c.speed -= (c.speed > 0.2 ? BRAKE : ACCEL * 0.6) * dt;
    if (braking) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), BRAKE * dt);
    if (throttle === 0 && !braking) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 2.5 * dt);
    c.speed -= c.speed * (onRoad ? 0.06 : 0.8) * dt;
    if (c.speed > maxF) c.speed -= (c.speed - maxF) * Math.min(1, dt * 3);
    c.speed = Math.max(c.speed, -MAX_REVERSE);

    const maxSteer = 0.62 / (1 + Math.abs(c.speed) * 0.045);
    c.steer += (steerIn * maxSteer - c.steer) * Math.min(1, dt * 8);
    c.yaw += (c.speed / WHEELBASE) * Math.tan(c.steer) * dt;

    const f = yawToDir(c.yaw);
    c.x += f.x * c.speed * dt;
    c.z += f.z * c.speed * dt;

    // Two-circle body vs. buildings, trees, poles and the rug edge.
    let collided = false;
    for (const off of [1.25, -1.25]) {
      const p = { x: c.x + f.x * off, z: c.z + f.z * off };
      const bx = p.x;
      const bz = p.z;
      if (resolveCircle(p, 1.0, worldColliders)) {
        collided = true;
        c.x += p.x - bx;
        c.z += p.z - bz;
      }
    }
    if (collided && Math.abs(c.speed) > 1.5) c.speed *= -0.3;

    // Chase camera
    const d = desired.current.set(c.x - f.x * 8.5, 3.8 + Math.max(0, c.speed) * 0.04, c.z - f.z * 8.5);
    for (let i = 0; i < 8 && pointInsideAnyBox({ x: d.x, z: d.z }, worldColliders, 0.6); i++) {
      d.x += (c.x - d.x) * 0.25;
      d.z += (c.z - d.z) * 0.25;
      d.y += 0.6;
    }
    camera.position.lerp(d, 1 - Math.exp(-dt * 4.5));
    look.current.lerp(new THREE.Vector3(c.x + f.x * 4, 1.2, c.z + f.z * 4), 1 - Math.exp(-dt * 9));
    camera.lookAt(look.current);

    const t = timers.current;
    t.hud -= dt;
    t.interact -= dt;
    if (t.hud <= 0) {
      t.hud = 0.1;
      st.setSpeed(Math.round(Math.abs(c.speed) * 3.6));
    }
    if (t.interact <= 0) {
      t.interact = 0.25;
      st.setInteraction(worldDriveInteraction(c, c.speed));
    }
  });

  return null;
}
