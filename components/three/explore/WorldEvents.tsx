"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { EVENT_GAP, FIRST_EVENT_DELAY, makeEvent, type WorldEventKind } from "@/lib/explore/events";
import { EXT_Y } from "@/lib/house/layout";
import { useStore } from "@/lib/store";
import { Sign } from "../town/parts";

const KINDS: WorldEventKind[] = ["meteor", "garbage", "sale"];

/** Starts a random town event every few minutes while a toy is out, and ends it when it runs out of time. */
function Scheduler() {
  const nextAt = useRef<number | null>(null);
  const last = useRef<WorldEventKind | null>(null);
  useFrame(({ clock }) => {
    const s = useStore.getState();
    const now = clock.elapsedTime;
    if (s.mode !== "toy" || s.inSpace || s.launching) return;
    if (nextAt.current === null) nextAt.current = now + FIRST_EVENT_DELAY;
    const e = s.worldEvent;
    if (e) {
      if (now > e.start + e.duration) {
        s.setWorldEvent(null);
        s.showToast(`${e.title.replace(/!$/, "")} is over.`);
      }
      return;
    }
    if (now < nextAt.current) return;
    const options = KINDS.filter((k) => k !== last.current);
    const kind = options[Math.floor(Math.random() * options.length)];
    last.current = kind;
    const ev = makeEvent(kind, now);
    s.setWorldEvent(ev);
    s.showToast(`${ev.title} ${ev.hint}`);
    nextAt.current = now + EVENT_GAP[0] + Math.random() * (EVENT_GAP[1] - EVENT_GAP[0]);
  });
  return null;
}

/** Tall pulsing pillar over the event so it can be found from anywhere in town. */
function EventBeacon() {
  const ref = useRef<THREE.Group>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    const e = useStore.getState().worldEvent;
    if (!g) return;
    g.visible = !!e && !useStore.getState().inSpace;
    if (!e) return;
    g.position.set(e.x, EXT_Y, e.z);
    if (beam.current) beam.current.opacity = 0.18 + Math.sin(clock.elapsedTime * 3) * 0.08;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 3000, 0]} raycast={() => null}>
        <cylinderGeometry args={[60, 160, 6000, 16, 1, true]} />
        <meshBasicMaterial ref={beam} color="#ff8c42" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 3, 0]} raycast={() => null}>
        <ringGeometry args={[220, 300, 40]} />
        <meshBasicMaterial color="#ff8c42" transparent opacity={0.6} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A lost toy streaks down as a "meteor" and sits in a little crater waiting to be found. */
function Meteor() {
  const ref = useRef<THREE.Group>(null);
  const fire = useRef<THREE.Mesh>(null);
  const toy = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    const e = useStore.getState().worldEvent;
    if (!g) return;
    g.visible = e?.kind === "meteor";
    if (!e || e.kind !== "meteor") return;
    const age = clock.elapsedTime - e.start;
    const fall = Math.max(0, 1 - age / 4);
    g.position.set(e.x, EXT_Y, e.z);
    if (toy.current) {
      toy.current.position.set(fall * 3000, 20 + fall * 9000, fall * -2000);
      toy.current.rotation.y = clock.elapsedTime * (fall > 0 ? 8 : 0.8);
    }
    if (fire.current) {
      fire.current.visible = fall > 0;
      fire.current.position.copy(toy.current?.position ?? fire.current.position);
    }
  });
  return (
    <group ref={ref} visible={false}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 2, 0]} raycast={() => null}>
        <ringGeometry args={[60, 140, 24]} />
        <meshStandardMaterial color="#6b4f36" roughness={1} />
      </mesh>
      <group ref={toy}>
        {/* A little wind-up robot, about 20 cm tall. */}
        <mesh position={[0, 8, 0]} castShadow>
          <boxGeometry args={[14, 14, 10]} />
          <meshStandardMaterial color="#e76f51" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 20, 0]} castShadow>
          <boxGeometry args={[10, 9, 9]} />
          <meshStandardMaterial color="#d9d9d9" roughness={0.3} metalness={0.6} />
        </mesh>
        {[-2.5, 2.5].map((x) => (
          <mesh key={x} position={[x, 21, -4.6]}>
            <sphereGeometry args={[1.4, 10, 8]} />
            <meshBasicMaterial color="#57ff8f" toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 8, 6]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[3, 0.8, 6, 12]} />
          <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <mesh ref={fire} raycast={() => null}>
        <sphereGeometry args={[60, 12, 10]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.7} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Banner and balloons outside the Toy Barn during a sale. */
function Sale() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    const e = useStore.getState().worldEvent;
    if (!g) return;
    g.visible = e?.kind === "sale";
    if (e?.kind === "sale") {
      g.position.set(e.x, EXT_Y, e.z);
      g.children.forEach((c, i) => {
        if (c.userData.balloon) c.position.y = 380 + Math.sin(clock.elapsedTime * 1.5 + i) * 20;
      });
    }
  });
  return (
    <group ref={ref} visible={false}>
      <Sign text="BIG SALE TODAY!" position={[0, 300, 0]} size={[900, 160]} bg="#ffc300" fg="#b3261e" doubleSided glow />
      {["#e63946", "#2a9d8f", "#ffb703", "#8ecae6"].map((c, i) => (
        <mesh key={c} position={[-450 + i * 300, 380, 0]} userData={{ balloon: true }}>
          <sphereGeometry args={[50, 14, 12]} />
          <meshStandardMaterial color={c} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function WorldEvents() {
  return (
    <group>
      <Scheduler />
      <EventBeacon />
      <Meteor />
      <Sale />
    </group>
  );
}