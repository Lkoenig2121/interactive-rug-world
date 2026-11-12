"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { landmarkById, PLANE_FLOOR, type Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { dressAirport, dressPlane } from "../filmSet";
import { buildProps } from "../interiorProps";
import { buildCars, buildFlatRoof, buildLamp, buildParking, buildShell, buildTree, Built, LandmarkGroup, Roof, Sign } from "../parts";

const NAVY = "#1d3557";
const WHITE = "#f7f8fa";
const RUNWAY_Z = 59500;
const APRON = { x0: 30000, x1: 52000, z0: 50500, z1: 57600 };

function buildTerminal(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "concrete", color: "#e9edf1" }, int: "#f4f6f8", floor: { slot: "tile", color: "#eef1f4" }, trim: NAVY, doorH: 400 });
  // Curtain-wall glazing on both long sides, with mullions.
  for (const side of [1, -1]) {
    for (let x = -hw + 200; x < hw - 200; x += 400) {
      const door = side > 0 ? l.door! : l.backDoor!;
      if (Math.abs(x + 200 - door.offset) < door.width / 2 + 220) continue;
      b.use("glass").box(x + 200, 60, side * (hd + 9), 380, 800, 3, "#a9d3ee");
      b.use("metal").box(x, 60, side * (hd + 10), 12, 800, 5, "#5c6773");
    }
    b.use("metal").box(0, 860, side * (hd + 10), l.w, 20, 6, "#5c6773");
  }
  b.use("glass").box(l.door!.offset, 0, hd + 9, l.door!.width, 400, 3, "#cfe8f7");
  // Drop-off canopy and curb.
  b.use("metal").box(0, 520, hd + 500, 5000, 30, 900, WHITE);
  for (let x = -2400; x <= 2400; x += 800) b.use("metal").cyl(x, 0, hd + 900, 18, 520, "#9aa3ad", 10);
  b.use("concrete").box(0, 0, hd + 150, l.w, 12, 300, "#d9d4c8");
  b.use("asphalt").box(0, 0, hd + 800, 7000, 2, 1000, "#7d8086");
  for (let x = -3200; x <= 3200; x += 800) b.use("paint").box(x, 2.2, hd + 800, 300, 0.5, 12, "#f4f4f0");
  // Inside: check-in, carousel, gate seating, departure board, shops and plants.
  buildProps(b, INTERIOR_SOLIDS.terminal, 11);
  dressAirport(b, l);
  b.use("paint").box(-3000, 0, -900, 4600, 260, 30, NAVY);
  b.use("metal").box(0, 500, 300, 1600, 280, 30, "#1f2933");
  for (let r = 0; r < 6; r++) b.use("glow").box(0, 520 + r * 42, 316, 1500, 26, 2, r % 2 ? "#ffd166" : "#f8fafc");
  for (const [x, c] of [
    [4600, "#e63946"],
    [5300, "#2a9d8f"],
  ] as const) {
    b.use("gloss").box(x, 0, -1300, 600, 300, 400, c);
    b.use("glass").box(x, 30, -1095, 500, 200, 3, "#e6f7ff");
  }
  for (let i = 0; i < 6; i++) {
    b.use("paint").cyl(-5000 + i * 2000, 0, 1500, 40, 60, "#c8a165", 12, 50);
    b.use("paint").sphere(-5000 + i * 2000, 120, 1500, 70, "#3f7a34", 1, 10);
  }
  // Control tower beside the terminal.
  b.at(-hw - 1500, 0, -500, 0, () => {
    b.use("concrete").cyl(0, 0, 0, 300, 3200, "#e9edf1", 20, 220);
    b.use("metal").cyl(0, 3200, 0, 520, 60, "#5c6773", 20);
    b.use("glass").cyl(0, 3260, 0, 500, 380, "#7fb7e6", 20, 540);
    b.use("metal").cyl(0, 3640, 0, 580, 60, "#5c6773", 20, 420);
    b.use("metal").cyl(0, 3700, 0, 20, 500, "#c0c7cf", 6);
    b.use("glow").sphere(0, 4210, 0, 30, "#ff3b30", 1, 8);
  });
  // Car parks either side of the access road.
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 1500 : -5800;
    buildParking(b, x0, hd + 2000, 15, 280, 520);
    buildCars(b, x0, hd + 2000, 15, 280, Math.PI, s > 0 ? 4 : 8);
    buildParking(b, x0, hd + 3300, 15, 280, 520);
    buildCars(b, x0, hd + 3300, 15, 280, 0, s > 0 ? 6 : 2);
    buildLamp(b, x0 + 2000, hd + 2650, 0);
  }
}

function buildRoof(b: Builder, l: Landmark) {
  buildFlatRoof(b, l, l.h, "#a7a39b", 0);
  // Wave-shaped roof made of tilted panels.
  for (let i = 0; i < 24; i++) {
    const x = -l.w / 2 + (i + 0.5) * (l.w / 24);
    const y = l.h + 180 + Math.sin((i / 23) * Math.PI) * 260;
    b.use("metal").cbox(x, y, 0, l.w / 24 + 6, 24, l.d + 600, "#dfe5ea", { rx: Math.sin(i * 0.5) * 0.05 });
    b.use("metal").box(x, l.h, l.d / 2 + 200, 20, y - l.h, 20, "#9aa3ad");
    b.use("metal").box(x, l.h, -l.d / 2 - 200, 20, y - l.h, 20, "#9aa3ad");
  }
}

const PLANE_FLOOR_LOCAL = PLANE_FLOOR - EXT_Y;
const HULL_R = 300;
const HULL_Y = 330;
/** Angles (see Builder.arc) where the door is cut out of the +z side of the hull. */
const DOOR_LOW = -0.6;
const DOOR_HIGH = 0.3;

/** Hull pieces along x, with the door opening cut out of the segment around the door. */
function hull(b: Builder, l: Landmark, upper: boolean) {
  const len = l.w;
  const d0 = l.door!.offset - 70;
  const d1 = l.door!.offset + 70;
  const piece = (a: number, c: number, start: number, length: number) => b.use("double").arc((a + c) / 2, HULL_Y, 0, HULL_R, c - a, WHITE, start, length, 32);
  if (upper) {
    piece(-len / 2, d0, 0, Math.PI);
    piece(d0, d1, DOOR_HIGH, Math.PI - DOOR_HIGH);
    piece(d1, len / 2, 0, Math.PI);
  } else {
    piece(-len / 2, d0, Math.PI, Math.PI);
    piece(d0, d1, Math.PI, Math.PI + DOOR_LOW);
    piece(d1, len / 2, Math.PI, Math.PI);
  }
}

/** The jet: lower hull and cabin always shown, upper hull hidden while the toy is aboard. */
function buildJetLower(b: Builder, l: Landmark) {
  const len = l.w;
  const r = HULL_R;
  const cy = HULL_Y;
  hull(b, l, false);
  b.use("double").box(0, 158, 0, len - 40, 4, 480, "#5a6b8c");
  b.use("gloss").sphere(len / 2, cy, 0, r, WHITE, 1, 24);
  b.use("gloss").sphere(-len / 2, cy + 40, 0, r * 0.9, WHITE, 1, 20);
  b.use("gloss").arc(0, cy, 0, r + 2, len, NAVY, Math.PI + 0.25, 0.25, 32);
  b.use("gloss").arc(0, cy, 0, r + 2, len, NAVY, -0.5, 0.25, 32);
  // Wings, engines and tail.
  for (const s of [-1, 1]) {
    b.use("gloss").cbox(-150, 200, s * 1250, 900, 26, 1800, "#dfe3e8", { ry: s * 0.35 });
    b.use("gloss").cyl(150, 120, s * 1000, 90, 380, "#c9ced4", 20, 90, { rz: Math.PI / 2 });
    b.use("paint").cyl(345, 120, s * 1000, 80, 6, "#1d1d1f", 20, 80, { rz: Math.PI / 2 });
    b.use("gloss").cbox(-len / 2 + 150, cy + 40, s * 450, 400, 18, 700, "#dfe3e8", { ry: s * 0.4 });
  }
  b.use("gloss").cbox(-len / 2 + 250, cy + 450, 0, 560, 600, 22, NAVY, { rz: -0.45 });
  // Landing gear
  for (const [x, z] of [
    [len / 2 - 300, 0],
    [-200, 250],
    [-200, -250],
  ]) {
    b.use("metal").cyl(x, 40, z, 10, 90, "#5c6773", 8);
    b.use("paint").rod(x, 40, z, 40, 30, "#1d1d1f", Math.PI / 2, 14);
  }
  // Cabin: seats from the shared layout, galley and cockpit.
  b.at(0, 160, 0, 0, () => {
    buildProps(b, INTERIOR_SOLIDS.plane, 2);
    dressPlane(b, l);
    b.use("metal").box(1500, 0, -120, 250, 110, 80, "#c0c7cf");
    b.use("paint").box(1800, 0, 0, 120, 70, 200, "#2b2f36");
    b.use("glow").box(1840, 70, 0, 40, 30, 160, "#4cc9f0");
    b.use("paint").box(-200, 0, 0, l.w - 400, 1, 80, "#9b2226");
  });
  // Air stairs truck at the door.
  const door = l.door!;
  b.at(door.offset, 0, l.d / 2, 0, () => {
    for (let i = 0; i < 10; i++) b.use("metal").box(0, (i * PLANE_FLOOR_LOCAL) / 10, 480 - i * 48 - 24, 140, PLANE_FLOOR_LOCAL / 10, 48, "#c0c7cf");
    for (const s of [-1, 1]) b.use("metal").cbox(s * 74, PLANE_FLOOR_LOCAL / 2 + 90, 240, 6, 6, 520, "#ffc300", { rx: Math.atan2(PLANE_FLOOR_LOCAL, 480) });
    b.use("gloss").box(0, 0, 640, 200, 120, 260, "#ffc300");
  });
}

function buildJetUpper(b: Builder, l: Landmark) {
  hull(b, l, true);
  for (let x = -l.w / 2 + 300; x < l.w / 2 - 300; x += 110) {
    if (Math.abs(x - l.door!.offset) < 110) continue;
    for (const s of [-1, 1]) b.use("paint").box(x, 340, s * (HULL_R - 3), 26, 36, 10, "#1f2933");
  }
  b.use("glass").box(l.w / 2 + 170, 400, 0, 80, 60, 300, "#1f2933");
  for (const s of [-1, 1]) b.use("paint").box(0, 500, s * 140, l.w - 600, 40, 70, "#e8e4da");
}

function buildAirfield(b: Builder) {
  const ax = (APRON.x0 + APRON.x1) / 2;
  const az = (APRON.z0 + APRON.z1) / 2;
  b.use("concrete").box(ax, 0, az, APRON.x1 - APRON.x0, 2, APRON.z1 - APRON.z0, "#c4c0b8");
  for (let x = APRON.x0 + 2000; x < APRON.x1; x += 6000) b.use("paint").box(x, 2, az, 40, 0.5, APRON.z1 - APRON.z0 - 400, "#f2c230");
  b.use("paint").box(ax, 2, APRON.z1 - 800, APRON.x1 - APRON.x0 - 600, 0.5, 40, "#f2c230");
  // Taxiways down to the runway.
  for (const x of [32000, 50000]) {
    b.use("asphalt").box(x, 0, (APRON.z1 + RUNWAY_Z) / 2, 1600, 1.6, RUNWAY_Z - APRON.z1, "#7a7d83");
    b.use("paint").box(x, 1.8, (APRON.z1 + RUNWAY_Z) / 2, 30, 0.5, RUNWAY_Z - APRON.z1, "#f2c230");
  }
  // Runway with threshold bars, centerline and edge lights.
  const x0 = 22000;
  const x1 = 62000;
  b.use("asphalt").box((x0 + x1) / 2, 0, RUNWAY_Z, x1 - x0, 1.8, 3000, "#5f6268");
  for (let x = x0 + 2500; x < x1 - 2500; x += 1800) b.use("paint").box(x, 1.9, RUNWAY_Z, 900, 0.5, 60, "#f4f4f0");
  for (const end of [x0 + 600, x1 - 600]) for (let z = -1200; z <= 1200; z += 200) b.use("paint").box(end, 1.9, RUNWAY_Z + z, 900, 0.5, 100, "#f4f4f0");
  for (let x = x0; x <= x1; x += 1500) for (const s of [-1, 1]) b.use("glow").box(x, 0, RUNWAY_Z + s * 1550, 30, 30, 30, s > 0 ? "#fff3b0" : "#9be7ff");
  // Windsock
  b.use("metal").cyl(x0 + 3000, 0, RUNWAY_Z - 2200, 8, 700, "#c0c7cf", 8);
  b.use("gloss").cyl(x0 + 3200, 700, RUNWAY_Z - 2200, 50, 400, "#f97316", 12, 25, { rz: Math.PI / 2 - 0.15 });
  // Ground vehicles: baggage tug with carts, a fuel truck and a catering truck.
  const plane = landmarkById.plane;
  b.at(plane.x + 500, 0, plane.z - 1600, Math.PI / 2, () => {
    b.use("gloss").box(0, 30, 0, 160, 110, 240, "#ffc300");
    b.use("glass").box(0, 140, -40, 150, 70, 4, "#26323d");
    for (let i = 1; i <= 4; i++) {
      b.use("metal").box(0, 30, -i * 330, 150, 20, 260, "#5c6773");
      for (let k = 0; k < 3; k++) b.use("gloss").box((k - 1) * 45, 50, -i * 330 + ((k * 31) % 60) - 30, 40, 40 + k * 10, 80, ["#1d3557", "#e63946", "#2a9d8f", "#6d597a"][(i + k) % 4]);
      for (const z of [-90, 90]) for (const s of [-1, 1]) b.use("paint").rod(s * 80, 20, -i * 330 + z, 20, 14, "#1d1d1f", 0, 10);
    }
  });
  b.at(plane.x - 2500, 0, plane.z - 1200, 0.2, () => {
    b.use("gloss").box(0, 60, 300, 250, 260, 300, WHITE);
    b.use("metal").cyl(0, 220, -200, 140, 700, "#d0d5db", 18, 140, { rx: Math.PI / 2 });
    b.use("paint").box(0, 40, 0, 240, 40, 1100, "#2b2f36");
    for (const z of [-400, 0, 350]) for (const s of [-1, 1]) b.use("paint").rod(s * 125, 50, z, 50, 30, "#1d1d1f", 0, 12);
  });
  b.at(plane.x + 2600, 0, plane.z - 800, -0.4, () => {
    b.use("gloss").box(0, 60, 0, 240, 520, 600, WHITE);
    b.use("gloss").box(0, 60, 420, 230, 200, 240, NAVY);
    for (const z of [-200, 380]) for (const s of [-1, 1]) b.use("paint").rod(s * 120, 45, z, 45, 26, "#1d1d1f", 0, 12);
  });
  // A second jet parked further along (scenery only).
  b.at(48000, 0, 54500, Math.PI, () => {
    b.use("gloss").cyl(0, 330, 0, 230, 3600, WHITE, 24, 230, { rz: Math.PI / 2 });
    b.use("gloss").sphere(1800, 330, 0, 230, WHITE, 1, 20);
    b.use("gloss").box(0, 260, 0, 3600, 40, 464, "#e63946");
    for (const s of [-1, 1]) b.use("gloss").cbox(-150, 200, s * 1100, 900, 26, 1800, "#dfe3e8", { ry: s * 0.35 });
    b.use("gloss").cbox(-1550, 780, 0, 560, 600, 22, "#e63946", { rz: -0.45 });
  });
  for (let i = 0; i < 8; i++) buildTree(b, 24000 + i * 900, 49500, 1.1);
}

/** Bags travel around the carousel once it has been started. */
function Carousel({ l }: { l: Landmark }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t0 = runtime.town.triggers.carousel;
    if (ref.current && t0 !== undefined && clock.elapsedTime - t0 < 20) ref.current.rotation.y += dt * 0.4;
  });
  return (
    <LandmarkGroup l={l}>
      <group position={[2600, 66, 0]}>
        <group ref={ref}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 600, 25, Math.sin(a) * 250]} rotation-y={-a} castShadow>
                <boxGeometry args={[90, 50, 60]} />
                <meshStandardMaterial color={["#1d3557", "#e63946", "#2a9d8f", "#6d597a", "#ffc300"][i % 5]} roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      </group>
    </LandmarkGroup>
  );
}

export function Airport({ l }: { l: Landmark }) {
  const plane = landmarkById.plane;
  const hd = l.d / 2;
  return (
    <>
      <group position={[0, EXT_Y, 0]}>
        <Built build={buildAirfield} castShadow={false} />
      </group>
      <LandmarkGroup l={l}>
        <Built deps={[l.id]} build={(b) => buildTerminal(b, l)} />
        <Roof l={l}>
          <Built deps={[l.id]} build={(b) => buildRoof(b, l)} />
        </Roof>
        <Sign text="TRI-COUNTY AIRPORT" position={[0, 960, hd + 12]} size={[3000, 240]} bg={NAVY} fg="#ffffff" glow />
        <Sign text="DEPARTURES" position={[0, 600, hd + 952]} size={[900, 110]} bg="#ffc300" fg={NAVY} glow />
        <Sign text="GATES 1-12" position={[0, 480, -hd + 22]} size={[700, 110]} rotationY={0} bg={NAVY} fg="#ffffff" glow />
        <Sign text="CHECK-IN" position={[-3000, 300, -884]} size={[600, 90]} bg="#ffffff" fg={NAVY} />
        <Sign text="BAGGAGE CLAIM" position={[2600, 430, 0]} size={[700, 90]} bg="#ffc300" fg={NAVY} glow doubleSided />
        <Sign text="FLIGHT 2  TOKYO" position={[0, 700, 318]} size={[900, 70]} bg="#1f2933" fg="#57ff8f" glow />
      </LandmarkGroup>
      <Carousel l={l} />
      <LandmarkGroup l={plane}>
        <Built deps={[plane.id]} build={(b) => buildJetLower(b, plane)} />
        <Roof l={plane}>
          <Built deps={[plane.id]} build={(b) => buildJetUpper(b, plane)} />
        </Roof>
        <Sign text="FLIGHT 2" position={[1200, 520, -232]} rotationY={Math.PI} size={[400, 80]} bg="transparent" fg={NAVY} />
      </LandmarkGroup>
    </>
  );
}
