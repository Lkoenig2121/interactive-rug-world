"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { CAR_HALF, CAR_ROOF, carLocal, carPose, TRAFFIC } from "@/lib/explore/living";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { wrapAngle } from "@/lib/world/geometry";
import { buildCar, Built } from "../town/parts";

/**
 * Cars driving loops of the town road network. You can hitch a ride on a roof (E), and a car
 * that reaches you while you cross the street bumps you out of its way.
 */
export function Traffic() {
  const cars = useRef<(THREE.Group | null)[]>([]);
  const yaws = useRef<number[]>(TRAFFIC.map(() => NaN));
  const honkAt = useRef(-99);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const now = clock.elapsedTime;
    const ex = runtime.explore;
    TRAFFIC.forEach((_, i) => {
      const p = carPose(i, now);
      const prev = yaws.current[i];
      // Ease the heading round corners instead of snapping.
      const yaw = Number.isNaN(prev) ? p.yaw : prev + wrapAngle(p.yaw - prev) * Math.min(1, dt * 7);
      yaws.current[i] = yaw;
      const pose = (ex.traffic[i] ??= { x: 0, z: 0, yaw: 0 });
      pose.x = p.x;
      pose.z = p.z;
      pose.yaw = yaw;
      const g = cars.current[i];
      if (g) {
        g.position.set(p.x, EXT_Y + 1, p.z);
        g.rotation.y = yaw;
      }
    });

    const hitch = ex.rides.hitch;
    const ridden = ex.traffic[hitch.car];
    if (ridden) {
      hitch.x = ridden.x - Math.sin(ridden.yaw) * 30;
      hitch.z = ridden.z - Math.cos(ridden.yaw) * 30;
      hitch.y = EXT_Y + CAR_ROOF;
      hitch.yaw = ridden.yaw + Math.PI;
    }

    const s = useStore.getState();
    const t = runtime.toy;
    if (s.mode !== "toy" || s.inSpace || t.mount === "ride" || t.y > EXT_Y + 140) return;
    for (const car of ex.traffic) {
      const q = carLocal(car, t);
      if (Math.abs(q.along) > CAR_HALF.l + 12 || Math.abs(q.across) > CAR_HALF.w + 12) continue;
      // Thrown clear to whichever side of the car you were on.
      const side = q.across >= 0 ? 1 : -1;
      const off = (CAR_HALF.w + 90) * side;
      const sn = Math.sin(car.yaw);
      const cs = Math.cos(car.yaw);
      t.x = car.x + cs * off + sn * q.along;
      t.z = car.z - sn * off + cs * q.along;
      t.vy = 380;
      t.speed = 0;
      if (now - honkAt.current > 3) {
        honkAt.current = now;
        s.showToast("HONK! A car bumped you out of the way. Time your street crossings!");
      }
      break;
    }
  });

  return (
    <group>
      {TRAFFIC.map((c, i) => (
        <group
          key={i}
          ref={(g) => {
            cars.current[i] = g;
          }}
        >
          <Built deps={["traffic", c.color]} build={(b) => buildCar(b, c.color)} solid={false} />
        </group>
      ))}
    </group>
  );
}
