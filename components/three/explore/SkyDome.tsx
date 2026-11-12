"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DISPLAY_RADIUS, DOME, RING_RADIUS, RINGS, TOWER_STEP_SIZE, TOWER_STEPS, TOWER_TOP, UPDRAFT } from "@/lib/explore/sky";
import { STARS } from "@/lib/explore/stars";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";
import { starGeometry } from "./Stars";

const WOOD = "#6b3d1f";
const BRASS = "#c9a227";
const BELL_H = 1.15;

function buildCase(b: Builder) {
  const { r } = DOME;
  // Turned wooden plinth with a brass rim, felt display floor and brass feet hanging below.
  b.use("wood").cyl(0, -420, 0, r * 0.82, 220, WOOD, 48, r * 0.9);
  b.use("wood").cyl(0, -200, 0, r * 0.9, 200, "#7a4a24", 48, r + 80);
  b.use("metal").torus(0, 0, 0, r + 40, 34, BRASS, { rx: Math.PI / 2 });
  b.use("paint").cyl(0, -4, 0, r, 6, "#2f6b4f", 48);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.use("metal").sphere(Math.sin(a) * r * 0.7, -520, Math.cos(a) * r * 0.7, 140, BRASS, 0.8, 12);
  }
  // Glass bell knob.
  b.use("metal").sphere(0, r * BELL_H + 60, 0, 120, BRASS, 1, 14);
  // Central pillar for the spiral climb.
  b.use("metal").cyl(0, 0, 0, 150, TOWER_TOP.y - DOME.y + 80, "#b8bec6", 20);
  for (const s of TOWER_STEPS) b.use("gloss").box(s.x - DOME.x, s.y - DOME.y - 30, s.z - DOME.z, TOWER_STEP_SIZE, 30, TOWER_STEP_SIZE, "#e63946");
  b.use("gloss").cyl(TOWER_TOP.x - DOME.x, TOWER_TOP.y - DOME.y - 6, TOWER_TOP.z - DOME.z, 130, 8, BRASS, 20);
  // Display pedestals around the rim, one per star in the game.
  STARS.forEach((_, i) => {
    const a = (i / STARS.length) * Math.PI * 2;
    b.use("wood").cyl(Math.sin(a) * DISPLAY_RADIUS, 0, Math.cos(a) * DISPLAY_RADIUS, 60, 120, "#4a2e1a", 12, 50);
    b.use("metal").cyl(Math.sin(a) * DISPLAY_RADIUS, 120, Math.cos(a) * DISPLAY_RADIUS, 56, 8, BRASS, 12);
  });
  // Trophy plinths.
  for (const x of [-500, 500]) b.use("wood").box(x, 0, -900, 260, 160, 260, "#4a2e1a");
}

const glass = new THREE.MeshStandardMaterial({ color: "#d8f1ff", transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
const goldStar = new THREE.MeshStandardMaterial({ color: "#ffd23f", emissive: "#ffb300", emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3 });
const ghostStar = new THREE.MeshStandardMaterial({ color: "#7a7f87", transparent: true, opacity: 0.35, roughness: 0.8 });
const plaqueBox = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.6, roughness: 0.35 });

function Rings() {
  const mats = useMemo(() => RINGS.map(() => new THREE.MeshBasicMaterial({ color: "#4cc9f0", transparent: true, opacity: 0.5, toneMapped: false })), []);
  useFrame(({ clock }) => {
    const ring = runtime.explore.ring;
    mats.forEach((m, i) => {
      const passed = ring.active && i < ring.next;
      const next = i === ring.next;
      const hit = runtime.town.triggers[`ring-${i}`];
      const flash = hit !== undefined && clock.elapsedTime - hit < 0.4;
      m.color.set(flash ? "#ffffff" : passed ? "#57ff8f" : next ? "#ffd23f" : "#4cc9f0");
      m.opacity = next ? 0.75 + Math.sin(clock.elapsedTime * 6) * 0.2 : passed ? 0.25 : 0.45;
    });
  });
  return (
    <>
      {RINGS.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, r.z]} rotation-y={r.yaw} material={mats[i]} raycast={() => null}>
          <torusGeometry args={[RING_RADIUS, 12, 10, 36]} />
        </mesh>
      ))}
    </>
  );
}

function Updraft() {
  const ref = useRef<THREE.MeshBasicMaterial>(null);
  const h = DOME.y - 600 - EXT_Y;
  useFrame(({ clock }) => {
    if (ref.current) ref.current.opacity = 0.1 + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return (
    <group position={[UPDRAFT.x, EXT_Y + h / 2, UPDRAFT.z]}>
      <mesh raycast={() => null}>
        <cylinderGeometry args={[UPDRAFT.r, UPDRAFT.r * 0.7, h, 24, 1, true]} />
        <meshBasicMaterial ref={ref} color="#9be7ff" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Display() {
  const stars = useStore((s) => s.stars);
  const ringBest = useStore((s) => s.ringBest);
  const boss = useStore((s) => s.bossDefeated);
  return (
    <group>
      {STARS.map((s, i) => {
        const a = (i / STARS.length) * Math.PI * 2;
        const got = stars.includes(s.id);
        // Little plaque on the front of each pedestal, facing the middle of the dome.
        const pr = DISPLAY_RADIUS - 72;
        return (
          <group key={s.id}>
            <mesh geometry={starGeometry()} material={got ? goldStar : ghostStar} position={[Math.sin(a) * DISPLAY_RADIUS, 190, Math.cos(a) * DISPLAY_RADIUS]} rotation-y={a} scale={90} raycast={() => null} />
            {got && (
              <group position={[Math.sin(a) * pr, 70, Math.cos(a) * pr]} rotation-y={a + Math.PI}>
                <mesh material={plaqueBox} position={[0, 0, -5]} raycast={() => null}>
                  <boxGeometry args={[240, 74, 10]} />
                </mesh>
                <Sign text={s.label} position={[0, 0, 0.6]} size={[224, 60]} bg="#2b1a0e" fg="#ffd23f" />
              </group>
            )}
          </group>
        );
      })}
      {ringBest !== null && (
        <group position={[-500, 160, -900]}>
          <mesh material={goldStar}>
            <torusGeometry args={[80, 14, 10, 28]} />
          </mesh>
          <Sign text={`RINGS ${ringBest.toFixed(1)}s`} position={[0, -60, 131]} size={[240, 50]} bg="#2b1a0e" fg="#ffd23f" />
        </group>
      )}
      {boss && (
        <group position={[500, 160, -900]}>
          <mesh material={goldStar} position={[0, 60, 0]}>
            <cylinderGeometry args={[70, 30, 120, 16]} />
          </mesh>
          <Sign text="BARON BEATEN" position={[0, -60, 131]} size={[240, 50]} bg="#2b1a0e" fg="#ffd23f" />
        </group>
      )}
    </group>
  );
}

/** Collector's display case floating high over the neighborhood, reachable only with the upgraded jetpack. */
export function SkyDome() {
  return (
    <group>
      <Updraft />
      <group position={[DOME.x, DOME.y, DOME.z]}>
        <Built deps={["sky-case"]} build={buildCase} />
        <mesh material={glass} scale={[DOME.r, DOME.r * BELL_H, DOME.r]} renderOrder={5} raycast={() => null}>
          <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <Sign text="COLLECTOR'S DISPLAY · DO NOT TOUCH" position={[0, 60, DOME.r - 60]} size={[1400, 120]} bg="#2b1a0e" fg="#ffd23f" doubleSided />
        <Display />
      </group>
      <Rings />
    </group>
  );
}
