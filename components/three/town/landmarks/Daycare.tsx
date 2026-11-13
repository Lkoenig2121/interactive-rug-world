"use client";

import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS, PARTITIONS, SUNNY_DUCT, SUNNY_FURNITURE, type SunnyFurniture } from "@/lib/town/interiors";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../builder";
import { dressDaycare } from "../filmSet";
import { buildProps } from "../interiorProps";
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

/** Sheet-metal duct along the back wall: floor, low sides, hanger straps and a few grilles in its belly. */
function buildDuct(b: Builder) {
  const { x0, x1, z0, z1, h } = SUNNY_DUCT;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  b.use("metal").box(cx, h - 8, cz, x1 - x0, 8, z1 - z0, "#b8c0c8");
  for (const z of [z0, z1]) b.use("metal").box(cx, h, z, x1 - x0, 60, 4, "#9aa3ad");
  for (const x of [x0, x1]) b.use("metal").box(x, h, cz, 4, 60, z1 - z0, "#9aa3ad");
  for (let x = x0 + 50; x < x1; x += 250) for (const z of [z0, z1]) b.use("metal").box(x, h - 9, z, 6, 70, 8, "#8a929c");
  for (let x = x0 + 300; x < x1; x += 900) b.use("metal").box(x, 620 - 140 + 60, cz, 3, 80, 3, "#5c6773");
}

const BIN_COLORS = ["#f77f00", "#f8f9fa", "#57cc99", "#e63946", "#ffd166", "#4cc9f0"];

/** Blue cubby shelving full of wire-mesh bins (front faces +z). */
function binShelf(b: Builder, x: number, z: number, cols: number, rows: number, seed: number) {
  const cw = 110;
  const ch = 80;
  const w = cols * cw + 16;
  b.use("gloss").box(x, 0, z, w, rows * ch + 16, 60, "#3a56c5");
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const bx = x - w / 2 + 8 + cw / 2 + c * cw;
      const by = 8 + r * ch;
      const color = BIN_COLORS[(r * cols + c + seed) % BIN_COLORS.length];
      b.use("gloss").box(bx, by + 4, z + 18, cw - 18, ch - 18, 34, color);
      for (let k = -2; k <= 2; k++) b.use("paint").box(bx + k * 16, by + 12, z + 35.5, 2, ch - 34, 1, "#2b2d42");
      for (let k = 0; k < 3; k++) b.use("paint").box(bx, by + 16 + k * 14, z + 35.5, cw - 34, 2, 1, "#2b2d42");
    }
  // Toys on top: a ring stacker and a little abacus.
  const top = rows * ch + 16;
  for (let i = 0; i < 5; i++) b.use("gloss").cyl(x - w / 2 + 70, top + i * 9, z, 26 - i * 4, 8, BIN_COLORS[i], 16, 24 - i * 4);
  b.use("gloss").cone(x - w / 2 + 70, top + 45, z, 6, 14, "#e63946", 10);
  b.use("wood").box(x + w / 2 - 70, top, z, 80, 50, 16, "#8a5a35");
  for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) b.use("gloss").sphere(x + w / 2 - 96 + k * 13, top + 12 + i * 10, z, 4, BIN_COLORS[(i + k) % 6], 1, 6);
}

/** A grid of kids' drawings in white frames on a wall facing +z. */
function drawingWall(b: Builder, x: number, y: number, z: number, cols: number, rows: number, seed: number) {
  b.use("paint").box(x, y - 10, z, cols * 64 + 20, rows * 80 + 20, 4, "#c8553d");
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const px = x - (cols * 64) / 2 + 32 + c * 64;
      const py = y + r * 80;
      b.use("paint").box(px, py, z + 3, 56, 70, 2, "#fdfcf7");
      const k = (r * cols + c + seed) * 7;
      b.use("paint").box(px - 8 + (k % 13), py + 18 + (k % 21), z + 4.5, 18, 18, 1, ACCENTS[k % ACCENTS.length]);
      b.use("paint").box(px + 6 - (k % 9), py + 8 + (k % 17), z + 4.5, 24, 4, 1, ACCENTS[(k + 2) % ACCENTS.length]);
      b.use("paint").box(px, py + 46, z + 4.5, 6, 14, 1, ACCENTS[(k + 4) % ACCENTS.length]);
    }
}

/** Triangle bunting strung along local x at height y. */
function bunting(b: Builder, x0: number, x1: number, y: number, z: number) {
  b.use("paint").box((x0 + x1) / 2, y + 2, z, x1 - x0, 1.5, 1.5, "#f8f9fa");
  for (let x = x0 + 30, i = 0; x < x1 - 20; x += 55, i++) b.use("gloss").cbox(x, y - 18, z, 32, 32, 1.5, ACCENTS[i % ACCENTS.length], { rz: Math.PI / 4 });
}

/** Paper butterfly on a string hanging from the ceiling. */
function butterfly(b: Builder, x: number, z: number, y: number, c: string) {
  b.use("paint").box(x, y + 20, z, 1, 620 - y - 20, 1, "#f8f9fa");
  b.use("gloss").cbox(x - 13, y + 14, z, 24, 2, 20, c, { rz: 0.35 });
  b.use("gloss").cbox(x + 13, y + 14, z, 24, 2, 20, c, { rz: -0.35 });
  b.use("paint").box(x, y + 8, z, 4, 14, 4, "#2b2d42");
}

/** Painted palm tree on a wall facing +x (trunk on the wall, fronds fanning out). */
function palmMural(b: Builder, x: number, z: number) {
  for (let i = 0; i < 8; i++) b.use("paint").cbox(x, 40 + i * 40, z + Math.sin(i * 0.5) * 12, 2, 38, 30 - i, "#8d5a3b", { rx: 0.05 });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI;
    b.use("paint").cbox(x, 360 + Math.sin(a + Math.PI / 2) * 20, z + Math.cos(a + Math.PI / 2) * 60, 2, 18, 120, "#52b788", { rx: a });
  }
}

/** Movie-style set dressing: bin shelving, art walls, bunting, butterflies, lights. */
function dressFilmRooms(b: Builder, l: Landmark) {
  // Butterfly Room: blue bin shelving under a wall of drawings, bunting and paper butterflies.
  // The hall wall is at z = 600, so these face back into the room (-z).
  b.at(-2350, 0, 520, Math.PI, () => binShelf(b, 0, 0, 5, 2, 0));
  b.at(-2350, 0, 590, Math.PI, () => drawingWall(b, 0, 230, 0, 8, 3, 1));
  bunting(b, -2950, -1050, 520, -400);
  bunting(b, -2950, -1050, 520, 100);
  for (let i = 0; i < 6; i++) butterfly(b, -2700 + i * 300, -700 + (i % 2) * 500, 430 + (i % 3) * 30, ACCENTS[i]);
  palmMural(b, -1007, 200);
  palmMural(b, -1007, -1100);
  b.use("gloss").sphere(-1250, 45, 300, 45, "#ff9f1c", 1, 18);
  b.use("gloss").torus(-1250, 45, 300, 45, 5, "#3a86ff", { rx: Math.PI / 2 });
  b.use("gloss").torus(-1250, 45, 300, 45, 4, "#f8f9fa");
  // Caterpillar Room: the same shelving, a "Sunnyside" box of toys and more art.
  b.at(2450, 0, 520, Math.PI, () => binShelf(b, 0, 0, 4, 3, 2));
  b.at(1600, 0, 590, Math.PI, () => drawingWall(b, 0, 250, 0, 6, 3, 4));
  bunting(b, 1050, 2950, 520, -500);
  b.use("planks").box(1450, 0, 300, 220, 110, 150, "#f4a5a5");
  b.use("planks").cbox(1450, 130, 220, 220, 40, 4, "#e58b8b", { rx: 0.7 });
  // Hall: corkboard of drawings, ceiling light panels everywhere.
  b.use("paint").box(2400, 220, 1790, 600, 220, 4, "#c8a165");
  for (let i = 0; i < 8; i++) b.use("paint").box(2160 + (i % 4) * 160, 250 + Math.floor(i / 4) * 100, 1786, 110, 80, 2, ACCENTS[(i + 3) % 6]);
  for (let x = -2600; x <= 2600; x += 800)
    for (const z of [-1100, -100, 1200]) b.use("glow").box(x, l.h - 12, z, 240, 6, 70, "#fff8e1");
}

/** Warm movie palette: tangerine walls, glossy honey linoleum, light wood furniture. */
const WARM = { wall: "#f3a04e", partition: "#f08a3c", floor: "#f6cf7e", tile: "#eebb5f", wood: "#dcae6e", woodDark: "#b57b3e" };
const KID = ["#7ac943", "#f77f00", "#3a86ff", "#ffbe0b", "#e63946", "#9b5de5"];
const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#ffdbac"];

/** Big two-tone linoleum squares over the whole floor (rugs sit just above them). */
function linoleum(b: Builder, hw: number, hd: number, tile: number) {
  for (let i = 0; i * tile < hw * 2; i++)
    for (let k = 0; k * tile < hd * 2; k++) {
      if ((i + k) % 2 === 0) continue;
      const w = Math.min(tile, hw * 2 - i * tile);
      const d = Math.min(tile, hd * 2 - k * tile);
      b.use("gloss").box(-hw + i * tile + w / 2, 1, -hd + k * tile + d / 2, w - 2, 0.4, d - 2, WARM.tile);
    }
}

/** Round rug in orange rings, like the one under the toddler table. */
function roundRug(b: Builder, x: number, z: number, r: number) {
  b.use("paint").cyl(x, 1.6, z, r, 1, "#e8590c", 40);
  b.use("paint").cyl(x, 2, z, r * 0.84, 1, "#f59f00", 40);
  b.use("paint").cyl(x, 2.4, z, r * 0.66, 1, "#f76707", 40);
}

/** Cubby lockers along local x (front +z): colored backs, name tags, backpacks, jackets and shoes. */
function lockers(b: Builder, len: number, seed: number) {
  const n = Math.floor(len / 100);
  const cw = len / n;
  b.use("wood").box(0, 0, 0, len, 200, 60, WARM.wood);
  b.use("wood").box(0, 200, 0, len + 10, 8, 66, WARM.woodDark);
  for (let i = 0; i < n; i++) {
    const px = -len / 2 + cw * (i + 0.5);
    const c = KID[(i + seed) % KID.length];
    b.use("paint").box(px, 66, 29, cw - 14, 120, 3, c);
    b.use("wood").box(px, 8, 29, cw - 14, 50, 3, WARM.woodDark);
    b.use("paint").box(px, 186, 31, 50, 10, 1, "#fdfcf7");
    b.use("metal").cyl(px, 160, 34, 2, 4, "#adb5bd", 6);
    if ((i + seed) % 3 !== 1) {
      const bag = KID[(i + seed + 3) % KID.length];
      b.use("gloss").box(px, 82, 40, 44, 56, 20, bag);
      b.use("gloss").box(px, 118, 41, 44, 14, 22, bag);
      b.use("paint").box(px, 92, 51, 26, 20, 2, KID[(i + seed + 1) % KID.length]);
    } else {
      b.use("paint").cbox(px, 120, 37, 50, 70, 10, KID[(i + seed + 4) % KID.length], { rz: 0.06 });
    }
    for (const sx of [-1, 1]) b.use("gloss").box(px + sx * 12, 10, 38, 18, 10, 30, ["#e63946", "#3a86ff", "#ffbe0b"][(i + seed) % 3]);
  }
}

/** Grey steel storage rack along local x, loaded with cardboard boxes and plastic tubs. */
function steelShelf(b: Builder, len: number, seed: number) {
  const r = seededRandom(seed);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("metal").box(sx * (len / 2 - 3), 0, sz * 27, 6, 230, 6, "#8a929c");
  for (const y of [8, 78, 148, 218]) {
    b.use("metal").box(0, y, 0, len, 4, 60, "#adb5bd");
    if (y > 200) continue;
    for (let x = -len / 2 + 20; x < len / 2 - 60; ) {
      const w = 50 + r() * 70;
      const h = 30 + r() * 30;
      if (r() < 0.65) b.use("planks").box(x + w / 2, y + 4, 0, w - 6, h, 46, ["#c8a165", "#b48a55", "#d9b77e"][Math.floor(r() * 3)]);
      else b.use("gloss").box(x + w / 2, y + 4, 0, w - 6, h * 0.8, 48, KID[Math.floor(r() * KID.length)]);
      x += w;
    }
  }
}

/** Movie-style daycare furniture placed from the shared layout (each built facing local +z). */
function buildFurniture(b: Builder) {
  SUNNY_FURNITURE.forEach((f, idx) =>
    b.at(f.x, 0, f.z, f.face, () => {
      switch (f.kind) {
        case "binshelf":
          binShelf(b, 0, 0, f.cols ?? 4, f.rows ?? 2, idx);
          break;
        case "lockers":
          lockers(b, f.len, idx);
          break;
        case "steelshelf":
          steelShelf(b, f.len, idx + 3);
          break;
        case "counter":
          b.use("gloss").box(0, 0, 0, f.len, 86, f.depth, "#3a86ff");
          for (let i = 0; i < 4; i++) b.use("paint").box(-150 + i * 100, 20, f.depth / 2 + 0.5, 70, 50, 1, KID[i]);
          b.use("wood").box(0, 86, 0, f.len + 10, 4, f.depth + 6, WARM.wood);
          b.use("paint").box(-120, 90, 0, 40, 1, 50, "#fdfcf7");
          b.use("metal").box(-120, 91, -22, 20, 3, 4, "#adb5bd");
          b.use("gloss").cyl(-40, 90, 0, 8, 16, "#ff8fab", 10);
          for (let i = 0; i < 4; i++) b.use("paint").cyl(-44 + i * 3, 106, 0, 1.2, 10, KID[i], 6);
          b.use("metal").sphere(60, 92, 0, 8, "#ffd166", 0.6, 12);
          b.use("gloss").sphere(150, 104, 0, 16, "#e63946", 1, 14);
          b.use("paint").box(150, 120, 0, 2, 6, 2, "#5c4033");
          break;
        case "plant":
          b.use("gloss").cyl(0, 0, 0, 24, 40, "#e76f51", 14, 30);
          b.use("paint").cyl(0, 38, 0, 27, 3, "#5c4033", 14);
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2;
            b.use("gloss").sphere(Math.cos(a) * 18, 70 + (i % 3) * 18, Math.sin(a) * 18, 22, i % 2 ? "#2d6a4f" : "#40916c", 1.3, 10);
          }
          break;
        case "fishtank":
          b.use("wood").box(0, 0, 0, f.len, 80, f.depth, "#8e3b6e");
          b.use("paint").box(0, 80, 0, f.len - 10, 6, f.depth - 6, "#f4a261");
          b.use("glass").box(0, 86, 0, f.len - 10, 58, f.depth - 6, "#7fd3ff");
          b.use("paint").box(0, 144, 0, f.len - 6, 6, f.depth - 2, "#2b2d42");
          for (let i = 0; i < 5; i++) b.use("gloss").sphere(-60 + i * 30, 105 + (i % 3) * 10, (i % 2) * 10 - 5, 5, i % 2 ? "#f77f00" : "#ffbe0b", 0.7, 8);
          for (const x of [-55, 40, 65]) b.use("gloss").cone(x, 86, -10, 6, 34, "#2d6a4f", 6);
          break;
        case "bookrack":
          b.use("wood").box(0, 0, 0, f.len, f.h, f.depth, WARM.wood);
          for (let r = 0; r < 3; r++)
            for (let i = 0; i < 6; i++) b.use("paint").cbox(-f.len / 2 + 18 + i * 33, 20 + r * 28, f.depth / 2 + 3, 28, 30, 3, KID[(i + r * 2) % KID.length], { rx: -0.2 });
          break;
        case "kitchen":
          b.use("gloss").box(0, 0, 0, f.len, 100, f.depth, "#ff8fab");
          b.use("paint").box(0, 100, 0, f.len + 4, 6, f.depth + 4, "#fdfcf7");
          b.use("gloss").box(0, 106, -f.depth / 2 + 3, f.len, 70, 6, "#ff8fab");
          for (const x of [-80, -30]) b.use("paint").cyl(x, 106, 0, 16, 2, "#2b2d42", 14);
          b.use("paint").box(-55, 20, f.depth / 2 + 0.5, 100, 64, 1, "#fdfcf7");
          b.use("glass").box(-55, 34, f.depth / 2 + 1, 70, 36, 1, "#2b2d42");
          b.use("metal").box(60, 104, 0, 70, 3, 40, "#adb5bd");
          b.use("metal").cyl(60, 106, -18, 3, 30, "#adb5bd", 8);
          b.use("gloss").cyl(-80, 108, 0, 12, 12, "#e63946", 12);
          for (let i = 0; i < 3; i++) b.use("metal").sphere(-40 + i * 40, 160, -f.depth / 2 + 8, 7, "#ced4da", 1, 8);
          break;
      }
    }),
  );
}

/** Square foam play mats in alternating colors. */
function foamMats(b: Builder, x: number, z: number, cols: number, rows: number, size: number) {
  for (let i = 0; i < cols; i++)
    for (let k = 0; k < rows; k++)
      b.use("paint").box(x + (i - (cols - 1) / 2) * size, 1.6, z + (k - (rows - 1) / 2) * size, size - 2, 1.5, size - 2, KID[(i * 2 + k) % KID.length]);
}

/** Squashy beanbag. */
function beanbag(b: Builder, x: number, z: number, c: string) {
  b.use("paint").sphere(x, 22, z, 45, c, 0.5, 14);
  b.use("paint").sphere(x, 38, z - 12, 30, c, 0.6, 12);
}

/** Little red pull wagon. */
function wagon(b: Builder, x: number, z: number, ry: number) {
  b.at(x, 0, z, ry, () => {
    b.use("gloss").box(0, 12, 0, 90, 22, 50, "#d62828");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("paint").cyl(sx * 32, 9, sz * 27, 9, 5, "#1d1d1f", 12, 9, { rx: Math.PI / 2 });
    b.use("metal").cbox(-70, 20, 0, 60, 3, 3, "#adb5bd", { rz: 0.3 });
    b.use("gloss").box(10, 34, 0, 30, 20, 30, "#ffbe0b");
  });
}

/** Kid-sized chair facing local +z (its back on the -z side). */
function kidChair(b: Builder, x: number, z: number, ry: number, c: string) {
  b.at(x, 0, z, ry, () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("wood").box(sx * 13, 0, sz * 13, 4, 30, 4, WARM.woodDark);
    b.use("gloss").box(0, 30, 0, 34, 4, 34, c);
    b.use("gloss").box(0, 34, -15, 34, 30, 4, c);
    b.use("wood").box(0, 52, -15, 30, 6, 5, WARM.wood);
  });
}

function stool(b: Builder, x: number, z: number, c: string) {
  b.use("gloss").cyl(x, 0, z, 12, 30, c, 14, 15);
  b.use("gloss").cyl(x, 30, z, 16, 4, c, 16);
}

/** Low wooden kid table (kidney or rectangle) with chairs and stools around it. */
function kidTable(b: Builder, x: number, z: number, kidney: boolean, seed: number, top = WARM.wood) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("wood").cyl(x + sx * 55, 0, z + sz * 25, 3.5, 48, WARM.woodDark, 8);
  if (kidney) {
    b.use("wood").cyl(x - 45, 48, z, 48, 5, top, 28);
    b.use("wood").cyl(x + 45, 48, z + 10, 42, 5, top, 28);
    b.use("wood").box(x, 48, z + 15, 80, 5, 60, top);
  } else {
    b.use("gloss").box(x, 48, z, 170, 5, 90, top);
    b.use("gloss").box(x, 44, z, 160, 4, 80, WARM.woodDark);
  }
  const seats: [number, number][] = [
    [-60, 85],
    [60, 85],
    [-60, -85],
    [60, -85],
    [-130, 0],
    [130, 0],
  ];
  seats.forEach(([dx, dz], i) => {
    const c = KID[(i + seed) % KID.length];
    if ((i + seed) % 3 === 2) stool(b, x + dx, z + dz, c);
    else kidChair(b, x + dx, z + dz, Math.atan2(-dx, -dz), c);
  });
  // Crayons, paper and a cup of markers on top.
  b.use("paint").box(x - 30, 53, z - 5, 40, 0.6, 30, "#fdfcf7");
  for (let i = 0; i < 5; i++) b.use("paint").cyl(x + 20 + i * 6, 53, z + 10, 1.5, 12, KID[(i + seed) % KID.length], 6);
  b.use("gloss").cyl(x + 40, 53, z - 15, 7, 14, "#4cc9f0", 10);
}

/** Wooden train table: yellow frame, painted board, an oval of track and a little train. */
function trainTable(b: Builder, x: number, z: number) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.use("gloss").box(x + sx * 82, 0, z + sz * 52, 12, 36, 12, "#f4b942");
  b.use("gloss").box(x, 36, z, 190, 10, 130, "#f4b942");
  b.use("wood").box(x, 46, z, 170, 2, 110, "#c98b4a");
  b.use("paint").box(x - 30, 48, z + 10, 50, 1, 40, "#74c69d");
  b.use("wood").torus(x, 49, z, 45, 3, "#7f5539", { rx: Math.PI / 2 });
  b.use("wood").torus(x, 49, z, 33, 2, "#7f5539", { rx: Math.PI / 2 });
  ["#e63946", "#3a86ff", "#ffbe0b"].forEach((c, i) => b.use("gloss").box(x - 14 + i * 14, 50, z + 39, 12, 9, 8, c));
}

/** Little play figures standing around in a loose crowd, roughly facing +z. */
function toyCrowd(b: Builder, x: number, z: number, n: number, seed: number) {
  const r = seededRandom(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 130;
    const px = x + Math.cos(a) * d;
    const pz = z + Math.sin(a) * d;
    const c = KID[Math.floor(r() * KID.length)];
    const kind = Math.floor(r() * 5);
    const s = 0.8 + r() * 0.5;
    b.at(px, 0, pz, (r() - 0.5) * 1.2, () => {
      if (kind === 0) {
        // Doll in a dress.
        b.use("gloss").cone(0, 0, 0, 7 * s, 14 * s, c, 10);
        b.use("paint").sphere(0, 18 * s, 0, 4.5 * s, SKIN[i % SKIN.length], 1, 10);
        b.use("paint").sphere(0, 20 * s, -1, 4.8 * s, ["#6b3d1f", "#f6d365", "#1d1d1f"][i % 3], 0.8, 10);
      } else if (kind === 1) {
        // Wind-up robot.
        b.use("metal").box(0, 0, 0, 10 * s, 14 * s, 8 * s, "#adb5bd");
        b.use("metal").box(0, 14 * s, 0, 8 * s, 7 * s, 7 * s, c);
        b.use("glow").sphere(0, 18 * s, 3.6 * s, 1.2 * s, "#57ff8f", 1, 6);
      } else if (kind === 2) {
        // Tiny dino.
        b.use("gloss").sphere(0, 7 * s, 0, 7 * s, c, 0.9, 10);
        b.use("gloss").sphere(0, 15 * s, 5 * s, 4 * s, c, 1, 8);
        b.use("gloss").cone(0, 4 * s, -9 * s, 3 * s, 8 * s, c, 6);
      } else if (kind === 3) {
        // Plush animal.
        b.use("paint").sphere(0, 7 * s, 0, 7 * s, ["#a0673c", "#f8edeb", "#ffafcc"][i % 3], 1, 10);
        b.use("paint").sphere(0, 16 * s, 0, 5 * s, ["#a0673c", "#f8edeb", "#ffafcc"][i % 3], 1, 10);
        for (const sx of [-1, 1]) b.use("paint").sphere(sx * 3.5 * s, 20.5 * s, 0, 1.8 * s, ["#a0673c", "#f8edeb", "#ffafcc"][i % 3], 1, 6);
      } else {
        // Action figure.
        b.use("paint").box(0, 0, 0, 6 * s, 10 * s, 4 * s, "#3d5a80");
        b.use("gloss").box(0, 10 * s, 0, 8 * s, 9 * s, 5 * s, c);
        b.use("paint").sphere(0, 22 * s, 0, 3.6 * s, SKIN[i % SKIN.length], 1, 8);
      }
    });
  }
}

/** Toys strewn across a floor area: blocks, balls, cars, rings and crayons. */
function toyClutter(b: Builder, x0: number, z0: number, x1: number, z1: number, n: number, seed: number) {
  const r = seededRandom(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const z = z0 + r() * (z1 - z0);
    const c = KID[Math.floor(r() * KID.length)];
    const ry = r() * Math.PI;
    switch (Math.floor(r() * 5)) {
      case 0:
        b.use("gloss").box(x, 0, z, 12, 12, 12, c, { ry });
        break;
      case 1:
        b.use("gloss").sphere(x, 9, z, 9, c, 1, 12);
        break;
      case 2:
        b.use("gloss").box(x, 2, z, 18, 6, 10, c, { ry });
        b.use("paint").box(x, 0, z, 16, 3, 11, "#1d1d1f", { ry });
        break;
      case 3:
        b.use("gloss").torus(x, 2, z, 8, 2.4, c, { rx: Math.PI / 2 });
        break;
      default:
        b.use("paint").box(x, 0, z, 12, 2, 2, c, { ry });
    }
  }
}

/** Paper lantern hanging on a string. */
function lantern(b: Builder, x: number, z: number, y: number, c: string, ceiling: number) {
  b.use("paint").box(x, y + 30, z, 1, ceiling - y - 30, 1, "#f8f9fa");
  b.use("gloss").sphere(x, y, z, 32, c, 1.05, 16);
  for (const k of [-1, 1]) b.use("paint").cyl(x, y + k * 30 - (k < 0 ? 4 : 0), z, 12, 4, "#f8f9fa", 12);
}

/** Lollipop swirl cut-out on a wall (normal along +x or +z). */
function swirl(b: Builder, x: number, y: number, z: number, c: string, alongZ: boolean) {
  const rot = alongZ ? { ry: Math.PI / 2 } : undefined;
  [30, 22, 14, 6].forEach((r, i) => b.use("gloss").torus(x, y, z, r, 3, i % 2 ? "#fdfcf7" : c, rot));
}

/** Big colored wall panel; `alongZ` panels sit on walls that run along z (constant x). */
function panel(b: Builder, x: number, z: number, w: number, h: number, c: string, alongZ: boolean, y = 0) {
  if (alongZ) b.use("paint").box(x, y, z, 3, h, w, c);
  else b.use("paint").box(x, y, z, w, h, 3, c);
}

/** Roadside sign (local, facing the street at +z). */
const SIGN = { x: -1700, z: 2500 };
const RAINBOW = ["#e63946", "#f77f00", "#ffd166", "#57cc99", "#3a86ff", "#7b2cbf"];

/** Wooden-framed roadside sign on a brick base: teal panel, rainbow, smiling sun and clouds. */
function buildStreetSign(b: Builder, x: number, z: number) {
  b.use("concrete").box(x, 0, z, 540, 70, 80, "#b5523b");
  for (let i = 0; i < 6; i++) b.use("paint").box(x, 14 + i * 9, z + 40.5, 540, 1.2, 1, "#e9d8c4");
  for (const s of [-1, 1]) b.use("wood").box(x + s * 262, 70, z, 26, 310, 26, "#f4f1ea");
  b.use("wood").box(x, 90, z, 500, 280, 14, "#f4f1ea");
  b.use("paint").box(x, 102, z + 7.5, 470, 256, 1, "#48bfe3");
  b.use("wood").box(x, 380, z, 600, 18, 110, "#2a9d8f");
  b.use("wood").box(x, 372, z, 560, 10, 90, "#f4f1ea");
  RAINBOW.forEach((c, i) => {
    const r = 118 - i * 13;
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI;
      b.use("gloss").cbox(x + Math.cos(a) * r, 122 + Math.sin(a) * r, z + 9, 13, 33, 1.5, c, { rz: a });
    }
  });
  b.use("gloss").sphere(x, 122, z + 10, 32, "#ffc300", 1, 18);
  for (let k = 0; k < 9; k++) {
    const a = (k / 8) * Math.PI;
    b.use("gloss").cbox(x + Math.cos(a) * 42, 122 + Math.sin(a) * 42, z + 10, 12, 5, 2, "#ffc300", { rz: a });
  }
  for (const s of [-1, 1]) b.use("paint").sphere(x + s * 11, 131, z + 39, 3.5, "#1d1d1f", 1, 8);
  for (let k = 0; k <= 6; k++) {
    const a = Math.PI + 0.6 + (k / 6) * (Math.PI - 1.2);
    b.use("paint").sphere(x + Math.cos(a) * 13, 122 + Math.sin(a) * 13, z + 38, 2, "#1d1d1f", 1, 6);
  }
  for (const [cx, r] of [
    [-180, 34],
    [-140, 26],
    [150, 30],
    [190, 36],
  ] as const)
    b.use("paint").sphere(x + cx, 128, z + 10, r, "#ffffff", 0.7, 12);
}

function buildDaycare(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "siding", color: WALL }, int: WARM.wall, floor: { slot: "gloss", color: WARM.floor }, trim: "#2a9d8f", doorH: 260, windows: { y: 120, h: 220, every: 520, w: 300 } });
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
    const h = p.h ?? l.h;
    b.use("paint").cbox((p.ax + p.bx) / 2, h / 2, (p.az + p.bz) / 2, 12, h, len, WARM.partition, { ry });
    // Above a duct the wall carries on up to the ceiling.
    if (p.h) b.use("paint").cbox((p.ax + p.bx) / 2, (SUNNY_DUCT.h + 75 + l.h) / 2, (p.az + p.bz) / 2, 12, l.h - SUNNY_DUCT.h - 75, len, WARM.partition, { ry });
  }
  linoleum(b, hw - 1, hd - 1, 200);
  buildDuct(b);
  dressFilmRooms(b, l);
  for (const x of [-2000, 2000]) b.use("gloss").box(x, 200, 607, 200, 20, 4, x < 0 ? "#8e44ad" : "#3ddc97");
  buildProps(
    b,
    INTERIOR_SOLIDS.daycare.filter((p) => !SUNNY_FURNITURE.includes(p as SunnyFurniture)),
    5,
  );
  buildFurniture(b);
  dressDaycare(b, l);

  // Butterfly Room (west): orange rug and kidney table, a red craft table, a train table and a crowd of toys.
  panel(b, -2650, -1792, 280, 430, "#e2483d", false);
  panel(b, -1250, -1792, 240, 430, "#2f7fd1", false);
  panel(b, -1007, -300, 320, 470, "#8e3b6e", true);
  panel(b, -2993, -100, 420, 470, "#e2483d", true);
  swirl(b, -2650, 330, -1789, "#ff8fab", false);
  swirl(b, -1004, 320, -300, "#ffd166", true);
  swirl(b, -2990, 300, -100, "#ff8fab", true);
  b.use("paint").box(-1950, 180, -1792, 320, 170, 3, "#264d3b");
  b.use("wood").box(-1950, 170, -1790, 336, 10, 6, WARM.wood);
  roundRug(b, -1900, -250, 360);
  kidTable(b, -1900, -250, true, 0);
  kidTable(b, -2350, -650, false, 3, "#d64545");
  trainTable(b, -2400, 330);
  toyCrowd(b, -1650, 200, 26, 11);
  toyClutter(b, -2900, -1500, -1100, 500, 70, 21);
  lowShelf(b, -2000, -1760, 1600, 1);
  b.use("gloss").sphere(-1300, 30, -1300, 70, "#ff8fab", 0.5, 14).sphere(-1500, 30, -1350, 70, "#9bf6ff", 0.5, 14);
  for (let i = 0; i < 6; i++) lantern(b, -2700 + i * 330, -900 + (i % 2) * 900, 420, ["#9ef01a", "#ffd166", "#ff8fab"][i % 3], l.h);

  // Caterpillar Room (east): the toddler room, a bit of a mess.
  panel(b, 1300, -1792, 300, 430, "#e2483d", false);
  panel(b, 2750, -1792, 260, 430, "#2f7fd1", false);
  panel(b, 2993, -500, 420, 470, "#8e3b6e", true);
  panel(b, 1007, -700, 360, 470, "#2a9d8f", true);
  swirl(b, 1300, 330, -1789, "#ffd166", false);
  swirl(b, 1004, 320, -700, "#ff8fab", true);
  roundRug(b, 1650, -1050, 330);
  kidTable(b, 1650, -1050, true, 2);
  kidTable(b, 2600, -1100, false, 4, "#d64545");
  trainTable(b, 2780, 330);
  toyCrowd(b, 1500, -150, 14, 7);
  toyClutter(b, 1100, -1500, 2900, 450, 110, 9);
  lowShelf(b, 2000, -1760, 1900, 2);
  lowShelf(b, 1550, 520, 660, 4);
  for (let i = 0; i < 5; i++) lantern(b, 1300 + i * 380, -400 + (i % 2) * 700, 430, ["#ffd166", "#9ef01a", "#4cc9f0"][i % 3], l.h);
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
  roundRug(b, 0, 0, 480);
  panel(b, -500, -593, 300, 430, "#2f7fd1", false);
  panel(b, 500, -593, 300, 430, "#e2483d", false);
  swirl(b, 500, 320, -590, "#ffd166", false);
  toyCrowd(b, 150, -250, 10, 31);
  toyClutter(b, -900, -500, 900, 500, 40, 41);
  kidTable(b, -550, 300, false, 1, "#7ac943");
  buildSlide(b, -300, -200, Math.PI / 2, 110, "#e63946");
  buildBlocks(b, 300, 200, 2);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) b.use("planks").box(-700 + i * 450, k * 80, -1700, 300, 70, 160, ["#c8a165", "#b48a55", "#e9c46a"][(i + k) % 3]);
  b.use("gloss").box(600, 0, -1200, 200, 120, 120, "#457b9d");
  b.use("planks").box(900, 0, 200, 180, 140, 160, "#c8a165");
  b.use("planks").box(900, 140, 200, 188, 16, 168, "#b48a55");
  b.use("gloss").sphere(400, 40, 400, 38, "#65a30d", 1.3, 12);
  b.use("gloss").sphere(430, 70, 400, 22, "#65a30d", 1, 10);

  // Hall: colored panels, cubby benches, coat hooks and lanterns.
  [
    [-2300, "#2f7fd1"],
    [-1350, "#e2483d"],
    [1050, "#8e3b6e"],
  ].forEach(([x, c]) => panel(b, x as number, 1792, 420, 420, c as string, false, 160));
  panel(b, 0, 607, 1800, 120, "#ffd166", false, 470);
  for (const x of [-2600, -1300, 1300, 2600]) {
    b.use("wood").box(x, 0, 1650, 500, 40, 80, WARM.wood);
    for (let k = 0; k < 4; k++) b.use("gloss").box(x - 180 + k * 120, 4, 1650, 90, 30, 60, KID[(k + Math.abs(x) / 100) % KID.length]);
  }
  for (let i = 0; i < 6; i++) lantern(b, -2500 + i * 1000, 1200, 470, ["#9ef01a", "#ffd166", "#ff8fab"][i % 3], l.h);
  toyClutter(b, -2800, 700, 2800, 1500, 30, 51);
  // Reading corner: rug, beanbags and a few books on the floor.
  roundRug(b, -1950, 1200, 260);
  ["#9b5de5", "#3a86ff", "#7ac943", "#ff8fab"].forEach((c, i) => beanbag(b, -2120 + i * 115, 1260 + (i % 2) * 70, c));
  for (let i = 0; i < 5; i++) b.use("paint").box(-1800 + i * 25, 3.4, 1120 + (i % 2) * 30, 22, 3, 28, KID[i], { ry: i * 0.5 });
  // Play-kitchen corner with a little table, plus foam mats and a wagon by the door.
  kidTable(b, 1950, 1230, false, 5, "#7ac943");
  foamMats(b, 0, 1150, 8, 5, 70);
  wagon(b, 1150, 1250, 0.4);
  wagon(b, -1150, 900, -0.8);
  toyCrowd(b, 600, 1050, 8, 61);
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

  buildStreetSign(b, SIGN.x, SIGN.z);

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
      <Sign text="SUNNYSIDE" position={[SIGN.x, 318, SIGN.z + 8.5]} size={[400, 56]} bg="#48bfe3" fg="#ffc300" />
      <Sign text="DAYCARE" position={[SIGN.x, 270, SIGN.z + 8.5]} size={[220, 34]} bg="#48bfe3" fg="#ffffff" />
      <Sign text="Sunnyside" position={[1450, 60, 376]} size={[180, 40]} bg="#f4a5a5" fg="#7a2e2e" />
    </LandmarkGroup>
  );
}
