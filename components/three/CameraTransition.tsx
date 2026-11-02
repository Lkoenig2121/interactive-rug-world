"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ANDY_WINDOW, HOUSE, SHELL } from "@/lib/house/layout";
import { EYE_HEIGHT, easeInOutCubic, FOV, housePose, overheadPose, roomCameraPose, smooth } from "@/lib/three/cameraPoses";
import { useStore } from "@/lib/store";
import { yawToDir } from "@/lib/world/geometry";

function isOutsideHouse(p: THREE.Vector3) {
  const m = SHELL + 60;
  return p.x > HOUSE.x1 + m || p.x < HOUSE.x0 - m || p.z > HOUSE.z1 + m || p.z < HOUSE.z0 - m || p.y > 900;
}

interface Anim {
  curve: THREE.CatmullRomCurve3;
  l0: THREE.Vector3;
  lMid: THREE.Vector3 | null;
  lEnd: THREE.Vector3;
  fov0: number;
  fov1: number;
  near0: number;
  near1: number;
  dur: number;
  t: number;
}

export function chaseCameraPose(x: number, z: number, yaw: number) {
  const f = yawToDir(yaw);
  return {
    pos: new THREE.Vector3(x - f.x * 8.5, 3.8, z - f.z * 8.5),
    look: new THREE.Vector3(x + f.x * 4, 1.2, z + f.z * 4),
  };
}

/** Flies the camera between room, overhead map and street level along a smooth spline. */
export function CameraTransition() {
  const flight = useStore((s) => s.flight);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const anim = useRef<Anim | null>(null);

  useEffect(() => {
    if (!flight) return;
    const aspect = size.width / Math.max(1, size.height);
    const p0 = camera.position.clone();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const l0 =
      dir.y < -0.05
        ? p0.clone().addScaledVector(dir, Math.min(-p0.y / dir.y, 600))
        : p0.clone().addScaledVector(dir, 30);

    if (flight.kind === "enter") {
      const { pose, next } = flight;
      const f = yawToDir(pose.yaw);
      let end: THREE.Vector3;
      let lEnd: THREE.Vector3;
      if (next === "walk") {
        end = new THREE.Vector3(pose.x, EYE_HEIGHT, pose.z);
        lEnd = new THREE.Vector3(pose.x + f.x * 10, EYE_HEIGHT, pose.z + f.z * 10);
      } else {
        const c = chaseCameraPose(pose.x, pose.z, pose.yaw);
        end = c.pos;
        lEnd = c.look;
      }
      const high = Math.max(60, Math.min(p0.y * 0.45, 140));
      const p1 = new THREE.Vector3(
        THREE.MathUtils.lerp(p0.x, pose.x, 0.6) - f.x * 40,
        high,
        THREE.MathUtils.lerp(p0.z, pose.z, 0.6) - f.z * 40,
      );
      const p2 = new THREE.Vector3(end.x - f.x * 18, 12, end.z - f.z * 18);
      anim.current = {
        curve: new THREE.CatmullRomCurve3([p0, p1, p2, end], false, "centripetal"),
        l0,
        lMid: new THREE.Vector3(pose.x + f.x * 14, 0, pose.z + f.z * 14),
        lEnd,
        fov0: camera.fov,
        fov1: next === "walk" ? FOV.walk : FOV.drive,
        near0: camera.near,
        near1: 0.05,
        dur: 3.6,
        t: 0,
      };
    } else if (flight.kind === "house" || (flight.kind === "room" && isOutsideHouse(p0))) {
      // Fly through Andy's window: out to the street view, or back in to the room.
      const w = ANDY_WINDOW;
      const inside = new THREE.Vector3(w.x - 140, w.y, w.z);
      const outside = new THREE.Vector3(w.x + 160, w.y + 20, w.z);
      const yard = new THREE.Vector3(w.x + 1300, w.y + 600, w.z + 1500);
      if (flight.kind === "house") {
        const target = housePose(aspect);
        anim.current = {
          curve: new THREE.CatmullRomCurve3([p0, inside, outside, yard, target.pos], false, "centripetal"),
          l0,
          lMid: new THREE.Vector3(w.x + 2500, w.y - 250, w.z + 300),
          lEnd: target.target,
          fov0: camera.fov,
          fov1: FOV.house,
          near0: camera.near,
          near1: 5,
          dur: 4.6,
          t: 0,
        };
      } else {
        const target = roomCameraPose(aspect);
        anim.current = {
          curve: new THREE.CatmullRomCurve3([p0, yard, outside, inside, target.pos], false, "centripetal"),
          l0,
          lMid: new THREE.Vector3(w.x - 600, w.y - 100, w.z),
          lEnd: target.target,
          fov0: camera.fov,
          fov1: FOV.room,
          near0: camera.near,
          near1: 0.5,
          dur: 4.6,
          t: 0,
        };
      }
    } else {
      const target = flight.kind === "room" ? roomCameraPose(aspect) : overheadPose(aspect);
      const lift = new THREE.Vector3(0, Math.max(30, target.pos.y * 0.3), 0);
      const mid = p0.clone().lerp(target.pos, 0.5).add(lift);
      anim.current = {
        curve: new THREE.CatmullRomCurve3([p0, p0.clone().add(new THREE.Vector3(0, 8, 0)), mid, target.pos], false, "centripetal"),
        l0,
        lMid: null,
        lEnd: target.target,
        fov0: camera.fov,
        fov1: flight.kind === "room" ? FOV.room : FOV.overhead,
        near0: camera.near,
        near1: 0.5,
        dur: flight.kind === "room" ? 2.8 : 2.4,
        t: 0,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.id]);

  const look = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + Math.min(dt, 0.05) / a.dur);
    const e = easeInOutCubic(a.t);
    camera.position.copy(a.curve.getPoint(e));
    if (a.lMid) {
      if (e < 0.62) look.current.lerpVectors(a.l0, a.lMid, smooth(e / 0.62));
      else look.current.lerpVectors(a.lMid, a.lEnd, smooth((e - 0.62) / 0.38));
    } else {
      look.current.lerpVectors(a.l0, a.lEnd, smooth(e));
    }
    camera.lookAt(look.current);
    camera.fov = THREE.MathUtils.lerp(a.fov0, a.fov1, e);
    camera.near = e > 0.55 ? a.near1 : a.near0;
    camera.updateProjectionMatrix();
    if (a.t >= 1) {
      anim.current = null;
      useStore.getState().completeFlight();
    }
  });

  return null;
}
