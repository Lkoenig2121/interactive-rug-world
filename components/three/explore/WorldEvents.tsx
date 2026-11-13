"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { EVENT_GAP, FIRST_EVENT_DELAY, makeEvent, NEIGHBOR_EVENT, type WorldEventKind } from "@/lib/explore/events";
import { hourOf, neighborPose, ROUTINES, type NeighborId } from "@/lib/explore/living";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { Sign } from "../town/parts";

const KINDS: WorldEventKind[] = ["meteor", "garbage", "sale"];
const NEIGHBORS = Object.keys(NEIGHBOR_EVENT) as NeighborId[];

/**
 * Starts a random town event every few minutes while a toy is out, and ends it when it runs out of time.
 * Each neighbor also starts their own event once a day, a little way into their routine.
 */
function Scheduler() {
  const nextAt = useRef<number | null>(null);
  const last = useRef<WorldEventKind | null>(null);
  const day = useRef({ index: 0, prevTime: runtime.explore.dayTime, done: {} as Partial<Record<NeighborId, number>> });
  const endedAt = useRef(-99);
  useFrame(({ clock }) => {
    const s = useStore.getState();
    const now = clock.elapsedTime;
    if (s.mode !== "toy" || s.inSpace || s.launching) return;
    if (nextAt.current === null) nextAt.current = now + FIRST_EVENT_DELAY;
    const d = day.current;
    const dayTime = runtime.explore.dayTime;
    // A new day starts at 6:00 (dayTime 0.75).
    if (d.prevTime < 0.75 && dayTime >= 0.75) d.index++;
    d.prevTime = dayTime;
    const e = s.worldEvent;
    if (e) {
      if (now > e.start + e.duration) {
        s.setWorldEvent(null);
        s.showToast(`${e.title.replace(/!$/, "")} is over.`);
        endedAt.current = now;
      }
      return;
    }
    const hour = hourOf(dayTime);
    if (now - endedAt.current > 20 && now > 30) {
      for (const id of NEIGHBORS) {
        const r = ROUTINES[id];
        const pose = neighborPose(id, hour, now);
        if (!pose || d.done[id] === d.index || hour < r.from + (r.to - r.from) * 0.25 || hour > r.to - (r.to - r.from) * 0.3) continue;
        d.done[id] = d.index;
        const ev = makeEvent(NEIGHBOR_EVENT[id], now, Math.random, pose);
        s.setWorldEvent(ev);
        s.showToast(`${ev.title} ${ev.hint}`);
        nextAt.current = Math.max(nextAt.current, now + EVENT_GAP[0]);
        return;
      }
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

/** The mail carrier's parcel on a porch, with a toy peeking out of the flaps. */
function Parcel() {
  const ref = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    const e = useStore.getState().worldEvent;
    if (!g) return;
    g.visible = e?.kind === "mail";
    if (e?.kind !== "mail") return;
    g.position.set(e.x, EXT_Y, e.z);
    // The toy inside wiggles the flaps.
    if (lid.current) lid.current.rotation.x = -0.15 - Math.max(0, Math.sin(clock.elapsedTime * 2.5)) * 0.35;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 22, 0]} castShadow>
        <boxGeometry args={[60, 44, 44]} />
        <meshStandardMaterial color="#c79a62" roughness={0.9} />
      </mesh>
      <mesh position={[0, 44.2, 0]}>
        <boxGeometry args={[60.5, 0.6, 8]} />
        <meshStandardMaterial color="#d9c7a3" roughness={0.6} />
      </mesh>
      <group ref={lid} position={[0, 44, -22]}>
        <mesh position={[0, 0, 11]}>
          <boxGeometry args={[60, 1.2, 22]} />
          <meshStandardMaterial color="#b88a55" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[8, 48, 6]}>
        <sphereGeometry args={[7, 12, 10]} />
        <meshStandardMaterial color="#58b368" roughness={0.5} />
      </mesh>
      {[-3, 3].map((x) => (
        <mesh key={x} position={[8 + x, 54, 2]}>
          <sphereGeometry args={[2.2, 8, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** A toy ball that bounced out of a bike basket into the street. */
function DroppedToy() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    const e = useStore.getState().worldEvent;
    if (!g) return;
    g.visible = e?.kind === "bikes";
    if (e?.kind !== "bikes") return;
    const age = clock.elapsedTime - e.start;
    const bounce = Math.abs(Math.sin(age * 5)) * 60 * Math.max(0, 1 - age / 2.5);
    g.position.set(e.x, EXT_Y + 14 + bounce, e.z);
    g.rotation.y = age * 0.6;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh castShadow>
        <sphereGeometry args={[14, 18, 14]} />
        <meshStandardMaterial color="#e63946" roughness={0.35} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[14.1, 2.2, 6, 24]} />
        <meshStandardMaterial color="#ffd166" roughness={0.35} />
      </mesh>
      <mesh>
        <torusGeometry args={[14.1, 2.2, 6, 24]} />
        <meshStandardMaterial color="#3a86ff" roughness={0.35} />
      </mesh>
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
      <Parcel />
      <DroppedToy />
    </group>
  );
}