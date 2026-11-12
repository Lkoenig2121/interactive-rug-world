"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { TRUCK_SPEED, truckPose } from "@/lib/explore/events";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { landmarkById, toWorld } from "@/lib/town/config";
import type { Builder } from "../town/builder";
import { buildTrain, TRAIN_ROOF, TRAIN_Z } from "../town/landmarks/Western";
import { Built } from "../town/parts";

/** Seconds for the train to run from one end of the line and back. */
const TRAIN_PERIOD = 110;
const TRAIN_RANGE = 12000;

function Train() {
  const ref = useRef<THREE.Group>(null);
  const l = landmarkById.western;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const w = (Math.PI * 2) / TRAIN_PERIOD;
    const ph = clock.elapsedTime * w;
    const lx = Math.sin(ph) * TRAIN_RANGE;
    const heading = Math.cos(ph) >= 0 ? 1 : -1;
    const yaw = heading > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.position.set(l.x + lx, EXT_Y + 30, l.z + TRAIN_Z);
    g.rotation.y = yaw;
    // Riders sit on the roof of the first carriage, behind the engine.
    const r = runtime.explore.rides.train;
    r.x = l.x + lx - heading * 900;
    r.y = EXT_Y + TRAIN_ROOF;
    r.z = l.z + TRAIN_Z;
    r.yaw = heading > 0 ? -Math.PI / 2 : Math.PI / 2;
    r.cx = l.x + lx;
    r.cz = l.z + TRAIN_Z;
    r.heading = heading;
    r.trainYaw = yaw;
  });
  return (
    <group ref={ref}>
      <Built deps={["train"]} build={buildTrain} />
    </group>
  );
}

const BELT = { rx: 650, rz: 240, y: 62 };
const BAGS = ["#e63946", "#2a9d8f", "#264653", "#e9c46a", "#f4a261", "#6d597a", "#1d3557", "#ffb703", "#8ecae6", "#b5838d"];

/** Suitcases going round the airport baggage carousel; toys can ride one. */
function Carousel() {
  const l = landmarkById.terminal;
  const bags = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const base = clock.elapsedTime * 0.22;
    BAGS.forEach((_, i) => {
      const a = base + (i / BAGS.length) * Math.PI * 2;
      const m = bags.current[i];
      if (m) {
        m.position.set(2600 + Math.sin(a) * BELT.rx, BELT.y, Math.cos(a) * BELT.rz);
        m.rotation.y = a + Math.PI / 2;
      }
      if (i === 0) {
        const p = toWorld(l, 2600 + Math.sin(a) * BELT.rx, Math.cos(a) * BELT.rz);
        const r = runtime.explore.rides.carousel;
        r.x = p.x;
        r.z = p.z;
        r.y = EXT_Y + BELT.y + 36;
        r.yaw = l.rot + a + Math.PI;
      }
    });
  });
  return (
    <group position={[l.x, EXT_Y, l.z]} rotation-y={l.rot}>
      {BAGS.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            bags.current[i] = m;
          }}
          castShadow
          raycast={() => null}
        >
          <boxGeometry args={[i === 0 ? 120 : 90, 36, 60]} />
          <meshStandardMaterial color={c} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function buildTruck(b: Builder) {
  b.use("gloss").box(0, 40, 260, 250, 230, 200, "#2a9d8f");
  b.use("glass").box(0, 160, 362, 220, 90, 4, "#26323d");
  b.use("gloss").box(0, 50, -150, 260, 300, 620, "#3a7d44");
  b.use("metal").box(0, 50, -470, 270, 280, 40, "#5c6773");
  b.use("metal").box(0, 30, -500, 240, 16, 60, "#9aa3ad");
  b.use("paint").box(0, 200, -149, 262, 50, 600, "#f1faee");
  for (const z of [240, -60, -300]) for (const s of [-1, 1]) b.use("paint").rod(s * 125, 50, z, 50, 30, "#1d1d1f", 0, 14);
  b.use("glow").sphere(-90, 110, 362, 16, "#fff3b0", 1, 8);
  b.use("glow").sphere(90, 110, 362, 16, "#fff3b0", 1, 8);
  b.use("glow").sphere(0, 360, 300, 14, "#ffb703", 1, 8);
}

/** Garbage truck that drives from Sid's curb to the landfill during the garbage-day event. */
function GarbageTruck() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    const r = runtime.explore.rides.truck;
    const s = useStore.getState();
    const e = s.worldEvent;
    if (!g) return;
    if (!e || e.kind !== "garbage") {
      g.visible = false;
      r.active = false;
      return;
    }
    const pose = truckPose(Math.max(0, runtime.town.clock - e.start - 4) * TRUCK_SPEED);
    g.visible = true;
    g.position.set(pose.x, EXT_Y, pose.z);
    g.rotation.y = pose.yaw;
    const back = { x: pose.x - Math.sin(pose.yaw) * 520, z: pose.z - Math.cos(pose.yaw) * 520 };
    Object.assign(r, { x: back.x, y: EXT_Y + 46, z: back.z, yaw: pose.yaw + Math.PI, active: !pose.done });
    // Beacon follows the truck.
    if (Math.abs(e.x - pose.x) + Math.abs(e.z - pose.z) > 200) s.setWorldEvent({ ...e, x: pose.x, z: pose.z });
    if (pose.done) {
      const riding = runtime.toy.mount === "ride" && runtime.toy.ride === "truck";
      r.active = false;
      if (riding) {
        s.setMount("none");
        s.completeEvent("You rode the garbage truck all the way to the landfill! Watch out for the claw…");
      } else {
        s.setWorldEvent(null);
        s.showToast("The garbage truck reached the landfill.");
      }
    }
  });
  return (
    <group ref={ref} visible={false}>
      <Built deps={["garbage-truck"]} build={buildTruck} />
    </group>
  );
}

export function Rides() {
  return (
    <group>
      <Train />
      <Carousel />
      <GarbageTruck />
    </group>
  );
}
