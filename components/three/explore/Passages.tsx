"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PASSAGES, SHORTCUTS } from "@/lib/explore/routes";
import { EAVE_Y, EXT_Y, GROUND_Y, HOUSE, inRect, SHELL } from "@/lib/house/layout";
import { ATTIC } from "@/lib/house/walkable";
import { runtime } from "@/lib/runtime";
import { onAndyRoof } from "@/lib/town/blocks";
import { BARN_DUCT, BARN_DUCT_Y, landmarkById, SID_LOFT, SID_UPSTAIRS_Y } from "@/lib/town/config";
import type { Builder } from "../town/builder";
import { Built, Sign } from "../town/parts";

function ladder(b: Builder, x: number, z: number, y0: number, y1: number, ry: number) {
  b.at(x, y0, z, ry, () => {
    for (const s of [-1, 1]) b.use("wood").box(s * 18, 0, 0, 5, y1 - y0, 5, "#8a5a35");
    for (let y = 20; y < y1 - y0; y += 26) b.use("wood").box(0, y, 0, 36, 3, 4, "#a0703f");
  });
}

function grille(b: Builder, x: number, y: number, z: number) {
  b.use("metal").box(x, y, z, 70, 2, 46, "#9aa3ad");
  for (let i = -3; i <= 3; i++) b.use("metal").box(x + i * 9, y + 2, z, 3, 1.5, 40, "#5c6773");
}

function buildMarkers(b: Builder) {
  for (const p of PASSAGES) {
    if (!p.draw) continue;
    if (p.kind === "vent") grille(b, p.from.x, p.from.y, p.from.z);
    else ladder(b, p.from.x, p.from.z, p.from.y, p.to.y + 20, 0);
  }
}

/** Pet flap set into a wall, drawn on both faces; the wall runs along local x at z = 0. */
function petFlap(b: Builder, x: number, y: number, z: number, half: number, frame: string, flap: string) {
  b.at(x, y, z, 0, () => {
    for (const s of [-1, 1]) {
      b.use("paint").box(0, 0, s * (half + 1.5), 46, 52, 3, frame);
      b.use("gloss").box(0, 4, s * (half + 3.5), 34, 40, 1.5, flap);
      b.use("paint").box(0, 40, s * (half + 4.5), 30, 3, 1, "#1d1d1f");
    }
  });
}

/** Mail slots, pet doors, the dryer vent and the rain gutter around Andy's house, plus Sid's dog flap. */
function buildShortcuts(b: Builder) {
  const z1 = HOUSE.z1 + SHELL;
  const z0 = HOUSE.z0 - SHELL;
  const x1 = HOUSE.x1 + SHELL;
  // Brass mail slot on both sides of the front door.
  for (const [z, d] of [
    [z1 + 1, 1],
    [HOUSE.z1 - 1, -1],
  ]) {
    b.use("metal").box(SHORTCUTS.mailX, GROUND_Y + 90, z, 36, 11, 2, "#c9a227");
    b.use("metal").box(SHORTCUTS.mailX, GROUND_Y + 93, z + d, 28, 5, 1, "#1d1d1f");
  }
  // Pet door in the kitchen's back wall.
  petFlap(b, SHORTCUTS.petX, GROUND_Y, (z0 + HOUSE.z0) / 2, SHELL / 2, "#f8fafc", "#8a929c");
  // Dryer vent: louvered hood outside, grille and a bit of lint inside.
  b.use("metal").box(x1 + 8, GROUND_Y + 10, SHORTCUTS.dryerZ, 16, 34, 34, "#dfe3e8");
  for (let i = 0; i < 3; i++) b.use("metal").box(x1 + 17, GROUND_Y + 14 + i * 10, SHORTCUTS.dryerZ, 2, 4, 30, "#9aa3ad");
  b.use("metal").box(HOUSE.x1 - 1, GROUND_Y + 6, SHORTCUTS.dryerZ, 2, 30, 40, "#9aa3ad");
  for (let i = -3; i <= 3; i++) b.use("metal").box(HOUSE.x1 - 2.5, GROUND_Y + 8, SHORTCUTS.dryerZ + i * 5, 1, 26, 2, "#5c6773");
  b.use("paint").sphere(HOUSE.x1 - 30, GROUND_Y + 4, SHORTCUTS.dryerZ + 18, 9, "#d9dde3", 0.5, 8);
  // Rain gutter along the front eave and a drainpipe down the front-right corner.
  const { spout, gutterZ } = SHORTCUTS;
  b.use("paint").box((HOUSE.x0 + HOUSE.x1) / 2, EAVE_Y - 16, gutterZ, HOUSE.x1 - HOUSE.x0 + 120, 14, 16, "#f4f4f0");
  b.use("paint").box(spout.x, EXT_Y + 20, spout.z, 10, EAVE_Y - EXT_Y - 30, 10, "#f4f4f0");
  b.use("paint").box(spout.x, EAVE_Y - 24, (spout.z + gutterZ) / 2, 10, 10, gutterZ - spout.z + 10, "#f4f4f0");
  b.use("paint").box(spout.x + 12, EXT_Y, spout.z + 12, 30, 20, 30, "#f4f4f0", { ry: Math.PI / 4 });
  for (let y = EXT_Y + 120; y < EAVE_Y - 40; y += 220) b.use("metal").box(spout.x, y, spout.z - 6, 14, 4, 4, "#9aa3ad");
  // Sid's dog flap, chewed and grubby.
  const sid = landmarkById.sid;
  b.at(sid.x, EXT_Y, sid.z, sid.rot, () => petFlap(b, SHORTCUTS.sidPetX, 0, -sid.d / 2 - 7, 7, "#5b4a3a", "#3b3530"));
}

/** Dusty attic over Andy's bedrooms: rafters, boxes and forgotten toys. */
function buildAttic(b: Builder) {
  const { x0, x1, z0, z1 } = ATTIC;
  const y = EAVE_Y;
  b.use("planks").box((x0 + x1) / 2, y - 6, (z0 + z1) / 2, x1 - x0, 6, z1 - z0, "#b08a5e");
  for (let x = x0; x <= x1; x += 160) b.use("wood").box(x, y, (z0 + z1) / 2, 14, 14, z1 - z0, "#7a5230");
  const boxes: [number, number, number, number, string][] = [
    [x0 + 120, z0 + 120, 90, 70, "#c8a26b"],
    [x0 + 240, z0 + 110, 70, 60, "#b8915a"],
    [x1 - 140, z1 - 140, 110, 80, "#c8a26b"],
    [x1 - 300, z1 - 120, 60, 50, "#d4b07a"],
    [(x0 + x1) / 2, z0 + 140, 80, 120, "#a37c4a"],
  ];
  for (const [bx, bz, s, h, c] of boxes) {
    b.use("paint").box(bx, y, bz, s, h, s * 0.8, c);
    b.use("paint").box(bx, y + h, bz, s + 4, 2, 6, "#e8dcc0");
  }
  // Old rocking horse, a lamp and a trunk.
  b.use("wood").box(x1 - 420, y, z0 + 160, 120, 60, 200, "#5b3417");
  b.use("metal").box(x1 - 420, y + 60, z0 + 160, 124, 6, 204, "#c9a227");
  b.use("paint").sphere(x0 + 520, y + 60, z1 - 200, 30, "#e63946", 0.9, 12);
  b.use("metal").cyl(x0 + 300, y, z1 - 220, 6, 70, "#3b4148", 8);
  b.use("glow").sphere(x0 + 300, y + 76, z1 - 220, 10, "#ffe6a8", 1, 10);
}

/** Sid's loft: a sagging platform over the back of the house, with his workshop rejects. */
function buildSidLoft(b: Builder) {
  const l = landmarkById.sid;
  b.at(l.x, EXT_Y, l.z, l.rot, () => {
    const { x0, x1, z0, z1 } = SID_LOFT;
    const y = SID_UPSTAIRS_Y - EXT_Y;
    b.use("planks").box((x0 + x1) / 2, y - 14, (z0 + z1) / 2, x1 - x0, 14, z1 - z0, "#4a3a2c");
    b.use("wood").box((x0 + x1) / 2, y, z1 - 6, x1 - x0, 40, 6, "#3a2c20");
    // Mattress, a skull poster and shelves of mixed-up toys.
    b.use("paint").box(-450, y, -400, 260, 30, 160, "#5b5f4a");
    b.use("paint").box(-450, y + 30, -460, 260, 8, 40, "#d9d4c8");
    b.use("paint").box(0, y + 30, z0 + 8, 160, 200, 4, "#1d1d1f");
    b.use("paint").sphere(0, y + 150, z0 + 12, 34, "#efe8d8", 1, 12);
    for (const s of [-1, 1]) b.use("paint").sphere(s * 12, y + 154, z0 + 40, 7, "#1d1d1f", 1, 8);
    b.use("wood").box(300, y, z0 + 30, 300, 160, 50, "#5b3417");
    for (let i = 0; i < 6; i++) {
      b.use("paint").sphere(180 + i * 48, y + 110, z0 + 40, 14, ["#a8dadc", "#e76f51", "#e9c46a", "#8d99ae"][i % 4], 1, 8);
      b.use("metal").cyl(180 + i * 48, y + 60, z0 + 40, 4, 40, "#9aa3ad", 6);
    }
  });
}

/** Toy Barn: locked back storeroom (walls, crates, vintage boxed figures) and the ceiling duct catwalk. */
function buildBarnSecrets(b: Builder) {
  const l = landmarkById.toybarn;
  b.at(l.x, EXT_Y, l.z, l.rot, () => {
    b.use("paint").box(3250, 0, -2550, 2500, l.h, 14, "#e9dfd0");
    b.use("paint").box(2000, 0, -2775, 14, l.h, 450, "#e9dfd0");
    b.use("paint").box(3250, 0, -2545, 220, 320, 4, "#7a5230");
    for (let i = 0; i < 8; i++) {
      const x = 2500 + (i % 4) * 420;
      const z = -2900 + Math.floor(i / 4) * 160;
      b.use("wood").box(x, 0, z, 140, 120 + (i % 3) * 40, 120, "#b8915a");
    }
    b.use("metal").box(3900, 0, -2960, 900, 260, 60, "#6b7280");
    for (let i = 0; i < 8; i++) {
      b.use("gloss").box(3500 + i * 105, 130, -2935, 70, 100, 18, i % 2 ? "#2563eb" : "#c0392b");
      b.use("glass").box(3500 + i * 105, 140, -2925, 56, 76, 2, "#e6f7ff");
    }
    b.use("glow").sphere(3250, l.h - 60, -2780, 22, "#ffe6a8", 1, 10);
    // Duct: an open sheet-metal tray with low sides so the camera can follow you along it.
    const { x0, x1, z0, z1 } = BARN_DUCT;
    const y = BARN_DUCT_Y - EXT_Y;
    b.use("metal").box((x0 + x1) / 2, y - 8, (z0 + z1) / 2, x1 - x0, 8, z1 - z0, "#aab3bd");
    for (const z of [z0, z1]) b.use("metal").box((x0 + x1) / 2, y, z, x1 - x0, 30, 4, "#8a929c");
    for (let x = x0 + 200; x < x1; x += 600) b.use("metal").cyl(x, y, (z0 + z1) / 2, 3, l.h - y, "#5c6773", 6);
  });
}

/** Attic only shows while the toy is up there, so it doesn't clutter the dollhouse cutaway. */
function Attic() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = inRect(runtime.toy, HOUSE) && runtime.toy.y > EAVE_Y - 80 && !onAndyRoof(runtime.toy);
  });
  return (
    <group ref={ref} visible={false}>
      <Built deps={["attic"]} build={buildAttic} />
      <pointLight position={[(ATTIC.x0 + ATTIC.x1) / 2, EAVE_Y + 160, (ATTIC.z0 + ATTIC.z1) / 2]} intensity={6000} distance={1200} decay={2} color="#ffd9a0" />
    </group>
  );
}

export function Passages() {
  const barn = landmarkById.toybarn;
  return (
    <group>
      <Built deps={["passage-markers"]} build={buildMarkers} />
      <Built deps={["shortcuts"]} build={buildShortcuts} />
      <Built deps={["sid-loft"]} build={buildSidLoft} />
      <Built deps={["barn-secrets"]} build={buildBarnSecrets} />
      <Attic />
      <group position={[barn.x, EXT_Y, barn.z]} rotation-y={barn.rot}>
        <Sign text="STAFF ONLY" position={[3250, 360, -2540]} size={[260, 60]} bg="#c0392b" fg="#ffffff" />
      </group>
    </group>
  );
}
