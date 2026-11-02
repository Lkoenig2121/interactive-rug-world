"use client";

import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS, PARTITIONS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { buildProps, buildTableSet } from "../interiorProps";
import { buildCars, buildFence, buildFlatRoof, buildParking, buildShell, buildTree, Built, LandmarkGroup, Roof, Sign } from "../parts";
import { buildBench, buildBlocks, buildRocketClimber, buildSandbox, buildSeesaw, buildSlide, buildSwings } from "./playKit";

const WALL = "#ffe08a";
const ACCENTS = ["#e63946", "#f4a261", "#2a9d8f", "#457b9d", "#8e44ad", "#3ddc97"];

/** Low open toy shelf against a wall, running along local x. */
function lowShelf(b: Builder, x: number, z: number, w: number, seed: number) {
  b.use("wood").box(x, 0, z, w, 90, 45, "#d9a35b");
  b.use("wood").box(x, 44, z, w, 4, 45, "#c58f4a");
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const c = ACCENTS[(i + seed) % ACCENTS.length];
    const px = x - w / 2 + 30 + i * 60;
    if ((i + seed) % 3 === 0) b.use("gloss").sphere(px, 64, z, 14, c, 1, 10);
    else if ((i + seed) % 3 === 1) b.use("gloss").box(px, 48, z, 30, 30, 26, c);
    else b.use("gloss").cyl(px, 48, z, 12, 34, c, 10);
    b.use("gloss").box(px, 4, z, 40, 36, 30, ACCENTS[(i + seed + 2) % ACCENTS.length]);
  }
}

function buildDaycare(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "siding", color: WALL }, int: "#fff6dc", floor: { slot: "tile", color: "#eef6ff" }, trim: "#2a9d8f", doorH: 260, windows: { y: 120, h: 220, every: 520, w: 300 } });
  // Colorful columns, a rainbow over the door and painted handprints.
  for (let i = 0; i < 6; i++) b.use("gloss").box(-hw + 500 + i * 1000, 0, hd + 14, 50, l.h, 14, ACCENTS[i]);
  for (let i = 0; i < 6; i++) {
    const r = 330 - i * 28;
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI;
      b.use("gloss").cbox(Math.cos(a) * r, 270 + Math.sin(a) * r * 0.6, hd + 20, 28, 92, 10, ACCENTS[i], { rz: a });
    }
  }
  b.use("gloss").box(0, 260, hd + 200, 900, 20, 380, "#2a9d8f");
  for (const x of [-430, 430]) b.use("gloss").box(x, 0, hd + 360, 30, 260, 30, "#e63946");

  // Interior partitions (rooms) from the shared layout, with colored door frames.
  for (const p of PARTITIONS.daycare) {
    const len = Math.hypot(p.bx - p.ax, p.bz - p.az);
    const ry = Math.atan2(p.bx - p.ax, p.bz - p.az);
    b.use("paint").cbox((p.ax + p.bx) / 2, l.h / 2, (p.az + p.bz) / 2, 12, l.h, len, "#fff6dc", { ry });
  }
  for (const x of [-2000, 2000]) b.use("gloss").box(x, 200, 607, 200, 20, 4, x < 0 ? "#8e44ad" : "#3ddc97");
  buildProps(b, INTERIOR_SOLIDS.daycare, 5);

  // Butterfly Room (west): rug, tables, a reading corner.
  b.use("paint").box(-2000, 1, -600, 1600, 1, 1700, "#d8c7f0");
  buildTableSet(b, -2300, -300, "#fff6dc", "#8e44ad", false);
  buildTableSet(b, -1600, -300, "#fff6dc", "#2a9d8f", false);
  lowShelf(b, -2000, -1760, 1600, 1);
  b.use("gloss").sphere(-1300, 30, -1300, 70, "#ff8fab", 0.5, 14).sphere(-1500, 30, -1350, 70, "#9bf6ff", 0.5, 14);
  for (let i = 0; i < 5; i++) b.use("gloss").box(-2900 + i * 320, 380, -1785, 120, 80, 3, ACCENTS[i]);

  // Caterpillar Room (east): the toddler room, a bit of a mess.
  b.use("paint").box(2000, 1, -600, 1960, 1, 2360, "#c7f0d8");
  lowShelf(b, 2000, -1760, 1900, 2);
  lowShelf(b, 2000, 520, 1600, 4);
  for (let i = 0; i < 4; i++) buildTableSet(b, 1400 + (i % 2) * 800, -1100 + Math.floor(i / 2) * 700, "#fff6dc", ACCENTS[i], false);
  buildBlocks(b, 1300, -300, 1);
  buildBlocks(b, 2500, -200, 3);
  buildBlocks(b, 2100, -1400, 5);
  // Play kitchen, easel and a caterpillar mural along the back wall.
  b.use("gloss").box(2850, 0, -400, 100, 100, 300, "#ff8fab");
  b.use("paint").cyl(2850, 100, -460, 20, 4, "#2b2f36", 12).cyl(2850, 100, -340, 20, 4, "#2b2f36", 12);
  b.use("wood").cbox(1150, 90, -1500, 120, 180, 6, "#c58f4a", { rx: -0.2 });
  b.use("paint").box(1150, 110, -1490, 100, 80, 2, "#f8fafc");
  for (let i = 0; i < 9; i++) b.use("gloss").sphere(1300 + i * 170, 420 + Math.sin(i) * 40, -1786, 60, i === 8 ? "#3ddc97" : ACCENTS[i % ACCENTS.length], 1, 12);
  for (let i = 0; i < 30; i++) b.use("gloss").box(1200 + ((i * 131) % 1700), 0, -1500 + ((i * 89) % 1900), 14, 6, 14, ACCENTS[i % 6], { ry: i });

  // Central play area and storage room.
  b.use("paint").cyl(0, 1, 0, 500, 1, "#ffd6a5", 32);
  buildSlide(b, -300, -200, Math.PI / 2, 110, "#e63946");
  buildBlocks(b, 300, 200, 2);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) b.use("planks").box(-700 + i * 450, k * 80, -1700, 300, 70, 160, ["#c8a165", "#b48a55", "#e9c46a"][(i + k) % 3]);
  b.use("gloss").box(600, 0, -1200, 200, 120, 120, "#457b9d");
  b.use("planks").box(900, 0, 200, 180, 140, 160, "#c8a165");
  b.use("planks").box(900, 140, 200, 188, 16, 168, "#b48a55");
  b.use("gloss").sphere(400, 40, 400, 38, "#65a30d", 1.3, 12);
  b.use("gloss").sphere(430, 70, 400, 22, "#65a30d", 1, 10);

  // Hall: benches and coat hooks.
  for (const x of [-2600, -1300, 1300, 2600]) b.use("wood").box(x, 0, 1650, 500, 40, 80, "#d9a35b");
  for (let x = -2800; x < 2800; x += 140) {
    if (Math.abs(x) < 400) continue;
    b.use("metal").box(x, 140, 1780, 6, 6, 20, "#3b4148");
    if ((x / 140) % 3 === 0) b.use("gloss").box(x, 80, 1775, 40, 60, 10, ACCENTS[Math.abs(x / 140) % 6]);
  }

  // Fenced playground behind the building.
  const pz = -hd - 200;
  const pd = 2800;
  b.use("grass").box(0, 0, pz - pd / 2, l.w, 1, pd, "#7cc36a");
  b.use("concrete").box(-1500, 0, pz - pd / 2, 2000, 3, 1600, "#e8c99a");
  buildFence(b, -hw, pz, -hw, pz - pd, "#f4f1ea", 120);
  buildFence(b, hw, pz, hw, pz - pd, "#f4f1ea", 120);
  buildFence(b, -hw, pz - pd, hw, pz - pd, "#f4f1ea", 120);
  buildSwings(b, -2000, pz - 700, 4);
  buildSlide(b, -900, pz - 900, 0, 200, "#ffc300");
  buildSandbox(b, 500, pz - 1400, 600, 600);
  buildRocketClimber(b, 1900, pz - 1100, 600);
  buildSeesaw(b, -1500, pz - 1800, 0.4);
  buildBench(b, 2400, pz - 2300, Math.PI);
  buildTree(b, -2600, pz - 2300, 1.2);
  buildTree(b, 2700, pz - 500, 1);

  // Parking in front.
  const lotZ = hd + 1300;
  buildParking(b, -hw + 500, lotZ, 19, 280, 520);
  buildCars(b, -hw + 500, lotZ, 19, 280, Math.PI, 12);
}

export function Daycare({ l }: { l: Landmark }) {
  const hd = l.d / 2;
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildDaycare(b, l)} />
      <Roof l={l}>
        <Built
          deps={[l.id]}
          build={(b) => {
            buildFlatRoof(b, l, l.h, "#8b8378", 0);
            for (let i = 0; i < 6; i++) b.use("gloss").wedge(-l.w / 2 + 500 + i * 1000, l.h + 16, 0, 1000, 260, l.d + 40, ACCENTS[i]);
            b.use("gloss").sphere(-l.w / 2 + 400, l.h + 500, l.d / 2 - 400, 220, "#ffc300", 1, 20);
            for (let i = 0; i < 10; i++) {
              const a = (i / 10) * Math.PI * 2;
              b.use("gloss").cbox(-l.w / 2 + 400 + Math.cos(a) * 320, l.h + 500 + Math.sin(a) * 320, l.d / 2 - 400, 120, 30, 30, "#ffc300", { rz: a });
            }
          }}
        />
      </Roof>
      <Sign text="SUNNYSIDE DAYCARE" position={[0, 420, hd + 391]} size={[1100, 150]} bg="#ffffff" fg="#e63946" border="#2a9d8f" />
      <Sign text="BUTTERFLY ROOM" position={[-2000, 300, 610]} size={[520, 80]} bg="#8e44ad" fg="#ffffff" />
      <Sign text="CATERPILLAR ROOM" position={[2000, 300, 610]} size={[560, 80]} bg="#3ddc97" fg="#1b4332" />
      <Sign text="STORAGE" position={[0, 300, -592]} size={[300, 60]} bg="#457b9d" fg="#ffffff" />
    </LandmarkGroup>
  );
}
