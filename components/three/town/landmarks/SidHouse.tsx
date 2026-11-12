"use client";

import type { Landmark } from "@/lib/town/config";
import { EXT_Y } from "@/lib/house/layout";
import { INTERIOR_SOLIDS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { dressSid } from "../filmSet";
import { buildProps } from "../interiorProps";
import { buildFence, buildShell, Built, LandmarkGroup, Roof, Sign } from "../parts";
import { buildDino } from "./DinoGas";

const SIDING = "#857b6f";
const TRIM = "#5b544c";
const ROOF = "#2b2927";

/** Doll head on spidery construction-set legs (a backyard "creation"). */
function spiderDoll(b: Builder, x: number, z: number, s = 1) {
  b.use("paint").sphere(x, 26 * s, z, 12 * s, "#f1d1b5", 1, 12);
  b.use("paint").sphere(x, 34 * s, z - 2 * s, 9 * s, "#c9a227", 0.6, 10);
  b.use("paint").sphere(x - 4 * s, 27 * s, z + 10 * s, 2 * s, "#111111", 1, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.use("metal").cbox(x + Math.sin(a) * 14 * s, 18 * s, z + Math.cos(a) * 14 * s, 2 * s, 30 * s, 2 * s, "#9aa3ad", { ry: a, rx: 0.9 });
    b.use("metal").cbox(x + Math.sin(a) * 26 * s, 6 * s, z + Math.cos(a) * 26 * s, 2 * s, 16 * s, 2 * s, "#9aa3ad", { ry: a, rx: -0.4 });
  }
}

/** Toy truck cab with a doll's legs instead of wheels. */
function legTruck(b: Builder, x: number, z: number) {
  b.use("gloss").box(x, 22, z, 40, 22, 26, "#b23a2a");
  b.use("gloss").box(x - 8, 44, z, 20, 16, 24, "#b23a2a");
  for (const [dx, dz] of [
    [-14, -10],
    [14, -10],
    [-14, 10],
    [14, 10],
  ])
    b.use("paint").cyl(x + dx, 0, z + dz, 3.5, 22, "#f1d1b5", 8);
}

/** Robot torso with a jack-in-the-box spring for a neck. */
function springBot(b: Builder, x: number, z: number) {
  b.use("metal").box(x, 0, z, 30, 40, 22, "#6b7280");
  for (let i = 0; i < 5; i++) b.use("metal").torus(x, 46 + i * 6, z, 7, 1.5, "#c0c7cf", { rx: Math.PI / 2 });
  b.use("gloss").sphere(x, 82, z, 12, "#f4f1ea", 1, 12);
  b.use("gloss").cone(x, 92, z, 8, 14, "#7a2e2e", 8);
}

function buildSid(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "siding", color: SIDING }, int: "#3f3832", floor: { slot: "wood", color: "#4a3728" }, trim: TRIM, doorH: 230 });
  buildProps(b, INTERIOR_SOLIDS.sid, 11);
  dressSid(b, l);
  // Messy living room extras: pizza boxes, a lamp, stairs to the dark upstairs.
  b.use("paint").box(-40, 50, 90, 70, 8, 70, "#c0392b");
  b.use("paint").box(-10, 58, 70, 70, 8, 70, "#f4d35e");
  b.use("wood").box(620, 0, -200, 220, 18, 900, "#6b4a2b");
  for (let i = 0; i < 8; i++) b.use("wood").box(620, 18 + i * 22, -200 - i * 28, 220, 18, 90, i % 2 ? "#5b4330" : "#6b4a2b");
  b.use("paint").box(620, 200, -480, 220, 8, 80, "#3a2a22");
  b.use("metal").cyl(-600, 0, 200, 8, 140, "#3b4148", 8);
  b.use("glow").sphere(-600, 150, 200, 18, "#fff3b0", 1, 8);
  // Windows with dark drawn curtains, one boarded up.
  for (const [x, y] of [
    [-450, 120],
    [450, 120],
    [-450, 520],
    [0, 520],
    [450, 520],
  ]) {
    b.use("paint").box(x, y, hd + 9, 220, 190, 4, "#2b2a28");
    b.use("paint").box(x, y + 10, hd + 11, 200, 170, 2, x === 0 ? "#3f2a44" : "#4a3a3a");
    b.use("paint").box(x, y - 14, hd + 12, 250, 14, 10, TRIM);
  }
  b.use("planks").cbox(0, 600, hd + 14, 260, 30, 4, "#8a6a45", { rz: 0.4 }).cbox(0, 600, hd + 15, 260, 30, 4, "#8a6a45", { rz: -0.3 });
  // Sagging steps up to the open front door.
  b.use("concrete").box(-50, 0, hd + 80, 260, 22, 140, "#8f8a80");
  b.use("concrete").cbox(-50, 30, hd + 170, 220, 14, 60, "#8f8a80", { rx: 0.08 });
  // Garage with a dented door, and a basketball hoop with a torn net.
  b.use("siding").box(hw + 330, 0, 200, 660, 320, 760, SIDING);
  b.use("shingle").gable(hw + 330, 320, 200, 760, 170, 860, ROOF);
  b.use("paint").box(hw + 330, 0, 200 + 382, 520, 250, 4, "#8f8a80");
  b.use("paint").cbox(hw + 400, 120, 200 + 386, 120, 60, 3, "#6d675d", { rz: 0.3 });
  b.use("paint").box(hw + 330, 330, 200 + 385, 180, 120, 6, "#f4f1ea");
  b.use("paint").torus(hw + 330, 320, 200 + 420, 23, 2, "#e63946", { rx: Math.PI / 2 });
  for (let i = 0; i < 6; i++) b.use("paint").box(hw + 330 + Math.sin(i) * 18, 296, 200 + 420 + Math.cos(i) * 18, 1.5, 22 - (i % 3) * 6, 1.5, "#e5e5e5");
  b.use("concrete").box(hw + 330, 0, 1100, 520, 3, 1000, "#a8a398");
  // Messy front yard: dead patches, chain-link fence with broken sections, trash cans, a tyre.
  for (let i = 0; i < 9; i++) b.use("dirt").box(-hw + 150 + ((i * 431) % (l.w - 200)), 0, hd + 300 + ((i * 197) % 700), 160 + (i % 3) * 80, 1.5, 120 + (i % 4) * 60, "#8a7a52");
  buildFence(b, -hw - 650, hd + 1000, hw - 120, hd + 1000, "#9aa3ad", 110, 10, (i) => (i > 40 && i < 52) || (i > 120 && i < 128));
  for (const x of [hw + 700, hw + 790]) {
    b.use("metal").cyl(x, 0, 520, 30, 90, "#5c6773", 12, 33);
    b.use("metal").cyl(x, 90, 520, 34, 6, "#4b5563", 12);
  }
  b.use("paint").torus(-hw + 200, 30, hd + 600, 40, 14, "#1d1d1f", { rx: 1.3 });
  // Back yard: workbench, launch pad, dog house and the toy creations.
  const by = -hd - 200;
  b.use("dirt").box(0, 0, by - 600, l.w + 600, 1.5, 1200, "#7c6b45");
  buildFence(b, -hw - 650, -hd, -hw - 650, by - 1700, "#7a6a55", 180, 14, (i) => i % 9 === 4 || i % 13 === 0);
  buildFence(b, hw + 650, -hd, hw + 650, by - 1700, "#7a6a55", 180, 14, (i) => i % 11 === 3);
  b.use("wood").box(-400, 0, by - 100, 400, 90, 120, "#6b4a2b");
  b.use("metal").box(-500, 90, by - 120, 40, 20, 30, "#b23a2a").box(-300, 90, by - 120, 90, 6, 40, "#9aa3ad");
  b.use("metal").box(-400, 90, by - 60, 50, 40, 40, "#3b4148");
  b.use("concrete").box(400, 0, by - 700, 240, 20, 240, "#6b6359");
  b.use("gloss").cyl(400, 20, by - 700, 14, 110, "#d9d4c8", 12);
  b.use("gloss").cone(400, 130, by - 700, 14, 40, "#3f3b38", 12);
  for (let i = 0; i < 3; i++) b.use("gloss").cbox(400 + Math.sin(i * 2.1) * 18, 40, by - 700 + Math.cos(i * 2.1) * 18, 3, 50, 18, "#3f3b38", { ry: i * 2.1 });
  b.use("planks").box(-hw + 200, 0, by - 1100, 300, 180, 260, "#5b4330");
  b.use("planks").gable(-hw + 200, 180, by - 1100, 340, 120, 280, ROOF);
  b.use("paint").box(-hw + 200, 0, by - 968, 110, 120, 4, "#111111");
  spiderDoll(b, 0, by - 400, 1.4);
  spiderDoll(b, 300, by - 1100, 1);
  legTruck(b, -200, by - 900);
  springBot(b, 650, by - 300);
  // Cage in the far yard: the rescue beat. Open toward the house (+z).
  const cx = 80;
  const cz = -1250;
  b.use("planks").box(cx, 0, cz, 110, 10, 110, "#6b4a2b");
  for (const [dx, dz] of [
    [-48, -48],
    [48, -48],
    [-48, 48],
    [48, 48],
  ])
    b.use("wood").box(cx + dx, 10, cz + dz, 10, 78, 10, "#5b4330");
  for (let i = 0; i < 6; i++) {
    const x = cx - 45 + i * 18;
    b.use("metal").box(x, 10, cz - 50, 3, 72, 3, "#9aa3ad");
  }
  for (let i = 0; i < 6; i++) {
    const z = cz - 45 + i * 18;
    b.use("metal").box(cx - 50, 10, z, 3, 72, 3, "#9aa3ad");
    b.use("metal").box(cx + 50, 10, z, 3, 72, 3, "#9aa3ad");
  }
  b.use("planks").box(cx, 88, cz, 116, 8, 116, "#5b4330");
  b.use("paint").box(cx, 40, cz + 58, 80, 36, 4, "#7a1f1f");
  // Work lamp aimed at the cage.
  b.use("metal").cyl(cx + 90, 0, cz + 80, 6, 160, "#3b4148", 8);
  b.use("metal").cbox(cx + 70, 155, cz + 40, 16, 8, 70, "#3b4148", { rx: 0.5 });
  b.use("glow").sphere(cx + 50, 148, cz + 10, 10, "#fff3b0", 1, 8);
  b.use("planks").cbox(-hw - 40, 40, -hd - 20, 8, 160, 220, "#8a6a45", { ry: 0.15 });
  b.at(-700, 0, by - 600, 0.6, () => {
    buildDino(b, 0, 10, 0, 0.18, "#7a8a5a");
    for (const [dx, dz] of [
      [8, 8],
      [8, -8],
      [-8, 8],
      [-8, -8],
    ])
      b.use("paint").rod(dx, 8, dz, 8, 4, "#1d1d1f", Math.PI / 2, 10);
  });
}

/** Extra touches around Andy's house: mailbox, bike, hoop and toys on the lawn. */
function buildAndyYard(b: Builder) {
  b.use("wood").box(-1100, 0, 1380, 12, 100, 12, "#f4f1ea");
  b.use("gloss").box(-1100, 100, 1380, 30, 30, 52, "#1f3a5f");
  b.use("gloss").dome(-1100, 130, 1380, 15, "#1f3a5f", 1);
  b.use("gloss").box(-1080, 110, 1360, 3, 25, 6, "#e63946");
  // Basketball hoop beside the driveway.
  b.use("metal").cyl(-1260, 0, 900, 7, 300, "#2b2f36", 10);
  b.use("metal").box(-1290, 280, 900, 70, 6, 6, "#2b2f36");
  b.use("paint").box(-1330, 260, 900, 6, 110, 180, "#f8fafc");
  b.use("paint").box(-1326, 280, 900, 2, 45, 60, "#e63946");
  b.use("metal").torus(-1360, 270, 900, 23, 1.5, "#e85d04", { rx: Math.PI / 2 });
  b.use("gloss").sphere(-1500, 12, 1050, 12, "#e85d04", 1, 12);
  // Bicycle on its side on the lawn.
  b.at(-300, 0, 950, 0.7, () => {
    b.use("paint").torus(-50, 3, 0, 33, 3, "#1d1d1f", { rx: Math.PI / 2 }).torus(50, 3, 0, 33, 3, "#1d1d1f", { rx: Math.PI / 2 });
    b.use("gloss").cbox(0, 7, 0, 90, 4, 4, "#e63946").cbox(-15, 7, 18, 4, 4, 40, "#e63946");
    b.use("metal").box(50, 4, 25, 4, 4, 40, "#9aa3ad");
  });
  // Toys on the lawn: a wagon, a ball and a toy truck.
  b.at(150, 0, 850, -0.4, () => {
    b.use("gloss").box(0, 14, 0, 60, 18, 100, "#c0392b");
    for (const [dx, dz] of [
      [-30, -35],
      [30, -35],
      [-30, 35],
      [30, 35],
    ])
      b.use("paint").rod(dx, 10, dz, 9, 4, "#1d1d1f", Math.PI / 2, 10);
    b.use("metal").cbox(0, 18, 80, 3, 3, 70, "#3b4148", { rx: -0.3 });
  });
  b.use("gloss").sphere(-500, 18, 1150, 18, "#f8fafc", 1, 14);
  b.use("gloss").box(-200, 0, 1200, 34, 18, 20, "#ffc300").box(-210, 18, 1200, 14, 12, 18, "#ffc300");
}

export function SidHouse({ l }: { l: Landmark }) {
  return (
    <>
      <LandmarkGroup l={l}>
        <Built deps={[l.id]} build={(b) => buildSid(b, l)} />
        <Roof l={l}>
          <Built
            deps={[l.id]}
            build={(b) => {
              b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#5b544c");
              b.use("shingle").gable(0, l.h, 0, l.d + 120, 420, l.w + 120, ROOF, Math.PI / 2);
              b.use("brick").box(-l.w / 2 + 120, l.h - 200, -100, 140, 700, 140, "#6b3a2e");
              b.use("metal").cyl(l.w / 2 - 200, l.h + 200, 0, 4, 220, "#3b4148", 6);
              b.use("metal").box(l.w / 2 - 200, l.h + 400, 0, 150, 4, 4, "#3b4148");
            }}
          />
        </Roof>
        <Sign text="KEEP OUT" position={[-20, 150, -l.d / 2 - 30]} size={[240, 72]} bg="#7a1f1f" fg="#f4f1ea" rotationY={Math.PI} />
      </LandmarkGroup>
      <group position={[0, EXT_Y, 0]}>
        <Built build={buildAndyYard} />
      </group>
    </>
  );
}
