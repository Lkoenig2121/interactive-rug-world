"use client";

import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS, PARTITIONS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { dressBonnie } from "../filmSet";
import { buildProps } from "../interiorProps";
import { buildCar, buildFence, buildShell, buildTree, Built, LandmarkGroup, Roof, Sign } from "../parts";
import { buildToyHorse } from "./BigBarnToys";
import { buildSandbox, buildSwings } from "./playKit";

const SIDING = "#ffe8a3";
const TRIM = "#5aa9e6";
const ROOF = "#3d8b8b";
const FLOWERS = ["#ff6fb5", "#ffd166", "#ef476f", "#9b5de5", "#ffffff"];

function flowerBed(b: Builder, x: number, z: number, w: number, d: number, seed: number) {
  b.use("dirt").box(x, 0, z, w, 6, d, "#6b4a2b");
  for (let i = 0; i < Math.floor((w * d) / 2400); i++) {
    const fx = x - w / 2 + 15 + ((i * 37 + seed * 11) % Math.max(1, w - 30));
    const fz = z - d / 2 + 10 + ((i * 53 + seed * 7) % Math.max(1, d - 20));
    b.use("paint").cyl(fx, 6, fz, 1.5, 22, "#2f7a34", 4);
    b.use("gloss").sphere(fx, 30, fz, 6, FLOWERS[(i + seed) % FLOWERS.length], 0.8, 8);
  }
}

function buildHouse(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "siding", color: SIDING }, int: "#fdf3e1", floor: { slot: "wood", color: "#c99a5b" }, trim: "#ffffff", doorH: 220, windows: { y: 110, h: 150, every: 450, w: 140 } });
  // Front door, porch, shutters and window boxes.
  b.use("gloss").box(l.door!.offset, 0, hd + 18, l.door!.width, 6, 160, "#d9d4c8");
  b.use("concrete").box(l.door!.offset, 0, hd + 120, 300, 18, 200, "#d9d4c8");
  b.use("gloss").box(l.door!.offset, 240, hd + 110, 360, 12, 220, ROOF);
  for (const s of [-1, 1]) b.use("paint").box(l.door!.offset + s * 160, 0, hd + 210, 12, 240, 12, "#ffffff");
  for (const x of [-560, -150]) {
    b.use("gloss").box(x, 120, hd + 12, 220, 160, 4, "#bfe3f7");
    b.use("paint").box(x - 130, 110, hd + 12, 34, 180, 6, TRIM).box(x + 130, 110, hd + 12, 34, 180, 6, TRIM);
    b.use("planks").box(x, 90, hd + 24, 220, 26, 26, "#c0392b");
    for (let i = 0; i < 6; i++) b.use("gloss").sphere(x - 90 + i * 36, 122, hd + 24, 11, FLOWERS[i % FLOWERS.length], 1, 8);
  }
  // Garage on the right with a driveway out to the street.
  b.use("siding").box(hw + 330, 0, 120, 660, 330, 760, SIDING);
  b.use("shingle").gable(hw + 330, 330, 120, 760, 170, 860, ROOF);
  b.use("paint").box(hw + 330, 0, 120 + 382, 520, 260, 4, "#f8f6f0");
  for (let y = 60; y < 260; y += 65) b.use("paint").box(hw + 330, y, 120 + 385, 520, 4, 2, "#d0ccc2");
  b.use("concrete").box(hw + 330, 0, hd + 360, 520, 3, 720, "#d9d4c8");
  b.at(hw + 330, 3, hd + 330, 0, () => buildCar(b, "#7fb7e6"));
  // Front walk, mailbox and flower beds.
  b.use("concrete").box(l.door!.offset, 0, hd + 450, 110, 2, 500, "#d9d4c8");
  b.use("wood").box(-hw + 100, 0, hd + 650, 12, 100, 12, "#ffffff");
  b.use("gloss").box(-hw + 100, 100, hd + 650, 30, 30, 50, "#5aa9e6");
  flowerBed(b, -400, hd + 60, 800, 80, 1);
  // Back yard: fence, garden rows, a swing set, sandbox, a play tent and toys.
  const by = -hd - 1600;
  b.use("grass").box(0, 0, -hd - 800, l.w + 1400, 1, 1600, "#86c46d");
  buildFence(b, -hw - 300, -hd, -hw - 300, by, "#ffffff", 120);
  buildFence(b, hw + 700, -hd, hw + 700, by, "#ffffff", 120);
  buildFence(b, -hw - 300, by, hw + 700, by, "#ffffff", 120);
  for (let i = 0; i < 4; i++) flowerBed(b, -hw + 100, -hd - 300 - i * 260, 500, 120, i + 3);
  for (let i = 0; i < 3; i++) {
    b.use("dirt").box(500 + i * 180, 0, -hd - 1000, 120, 12, 700, "#5b3a22");
    for (let k = 0; k < 6; k++) b.use("gloss").sphere(500 + i * 180, 30, -hd - 700 - k * 110, 20, ["#3a9d23", "#e63946", "#f4a261"][i], 1, 8);
  }
  buildSwings(b, 0, -hd - 1300, 2);
  buildSandbox(b, -500, -hd - 1500, 300, 300);
  b.use("gloss").cone(1100, 0, -hd - 500, 160, 260, "#ff6fb5", 6);
  buildToyHorse(b, 900, -hd - 1200, 0.8, "#c0392b");
  b.use("gloss").sphere(-200, 20, -hd - 600, 20, "#e63946", 1, 12);
  buildTree(b, hw + 400, -hd - 1300, 1.1, "#4a8f3a");
}

function buildToyRoom(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  for (const p of PARTITIONS.bonnie) {
    const len = Math.hypot(p.bx - p.ax, p.bz - p.az);
    b.use("paint").cbox((p.ax + p.bx) / 2, l.h / 2, (p.az + p.bz) / 2, 12, l.h, len, "#fdf3e1");
  }
  buildProps(b, INTERIOR_SOLIDS.bonnie, 3);
  dressBonnie(b, l);
  // Toy room: bright rug, bed, shelves full of toys, a tea party table and drawings on the wall.
  b.use("paint").cyl(-400, 1, 50, 300, 1, "#ff8fab", 32);
  b.use("wood").box(-700, 0, 300, 300, 50, 500, "#f4a261");
  b.use("paint").box(-700, 50, 300, 290, 20, 490, "#ffffff");
  b.use("paint").box(-700, 70, 380, 290, 6, 330, "#9b5de5");
  b.use("wood").box(-700, 0, 545, 300, 140, 12, "#f4a261");
  for (let k = 0; k < 3; k++) {
    b.use("wood").box(-200, 20 + k * 70, -620, 500, 6, 50, "#ffffff");
    for (let i = 0; i < 6; i++) b.use("gloss").box(-420 + i * 85, 26 + k * 70, -620, 34, 34 + (i % 3) * 8, 30, FLOWERS[(i + k) % FLOWERS.length]);
  }
  b.use("gloss").cyl(-350, 0, -100, 60, 50, "#ffffff", 16);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    b.use("gloss").cyl(-350 + Math.sin(a) * 30, 50, -100 + Math.cos(a) * 30, 6, 10, "#ff6fb5", 8);
    b.use("gloss").cyl(-350 + Math.sin(a) * 90, 0, -100 + Math.cos(a) * 90, 18, 30, FLOWERS[i], 10);
  }
  for (let i = 0; i < 5; i++) b.use("paint").box(-850 + i * 150, 280, -hd + 16, 100, 80, 2, FLOWERS[i]);
  // Living room: sofa, TV and coffee table.
  b.use("gloss").box(600, 0, 300, 500, 60, 160, "#5aa9e6");
  b.use("gloss").box(600, 60, 370, 500, 60, 30, "#5aa9e6");
  b.use("wood").box(600, 0, -50, 300, 40, 140, "#8a5a35");
  b.use("wood").box(600, 0, -560, 400, 70, 80, "#6b4423");
  b.use("paint").box(600, 70, -560, 320, 190, 12, "#1f2933");
  b.use("glow").box(600, 85, -553, 300, 160, 1, "#5aa9e6");
}

export function BonnieHouse({ l }: { l: Landmark }) {
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildHouse(b, l)} />
      <Built deps={[l.id]} build={(b) => buildToyRoom(b, l)} castShadow={false} />
      <Roof l={l}>
        <Built
          deps={[l.id]}
          build={(b) => {
            b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#fdf3e1");
            b.use("shingle").gable(0, l.h, 0, l.d + 120, 520, l.w + 120, ROOF, Math.PI / 2);
            b.use("siding").box(-300, l.h, l.d / 2 - 200, 360, 260, 300, SIDING);
            b.use("shingle").gable(-300, l.h + 260, l.d / 2 - 200, 440, 160, 380, ROOF);
            b.use("glass").box(-300, l.h + 60, l.d / 2 - 49, 200, 150, 3, "#bfe3f7");
            b.use("brick").box(l.w / 2 - 200, l.h - 100, -200, 120, 700, 120, "#a65a42");
          }}
        />
      </Roof>
      <Sign text="BONNIE" position={[-l.w / 2 + 100, 150, l.d / 2 + 676]} size={[60, 18]} bg="#5aa9e6" fg="#ffffff" radius={4} />
    </LandmarkGroup>
  );
}
