import type { Landmark } from "@/lib/town/config";
import type { Builder } from "./builder";

/**
 * Film-inspired interior set dressing. Look-alikes only: space ranger, cowboy, pink bear,
 * three-eyed aliens — never branded character copies.
 */

const RANGER = { suit: "#f4f4f0", lime: "#7ac943", purple: "#5b2d8a", visor: "#9be7ff" };

/** Little green three-eyed alien. */
export function buildAlien(b: Builder, x: number, y: number, z: number, s = 1, ry = 0) {
  b.at(x, y, z, ry, () => {
    b.use("gloss").cyl(0, 0, 0, 14 * s, 26 * s, "#3fbf3f", 12, 10 * s);
    b.use("gloss").sphere(0, 40 * s, 0, 18 * s, "#7ee36d", 1.15, 14);
    b.use("gloss").cyl(0, 58 * s, 0, 2 * s, 18 * s, "#7ee36d", 6);
    b.use("gloss").sphere(0, 78 * s, 0, 4 * s, "#7ee36d", 1, 8);
    for (const ex of [-8, 0, 8]) {
      b.use("paint").sphere(ex * s, 46 * s, 15 * s, 4.5 * s, "#ffffff", 1, 8);
      b.use("paint").sphere(ex * s, 46 * s, 19 * s, 2.2 * s, "#111111", 1, 6);
    }
  });
}
const COWBOY = { shirt: "#f2efe8", vest: "#c0392b", hat: "#8b5a2b", jeans: "#3d5a80" };
const BEAR = { fur: "#f4a4c0", nose: "#5b2a3a" };

/** Space-ranger action figure in a display window box, standing on y. */
export function boxedRanger(b: Builder, x: number, y: number, z: number, s = 1, ry = 0) {
  b.at(x, y, z, ry, () => {
    b.use("gloss").box(0, 0, 0, 42 * s, 78 * s, 16 * s, "#1b3a6e");
    b.use("glow").box(0, 70 * s, 1 * s, 38 * s, 8 * s, 2 * s, "#ffc300");
    b.use("glass").box(0, 8 * s, 8 * s, 34 * s, 58 * s, 2 * s, "#e8f4ff");
    b.use("gloss").box(0, 12 * s, 2 * s, 18 * s, 36 * s, 10 * s, RANGER.suit);
    b.use("gloss").box(0, 28 * s, 4 * s, 22 * s, 10 * s, 8 * s, RANGER.lime);
    b.use("paint").sphere(0, 52 * s, 2 * s, 8 * s, "#f1c27d", 1, 8);
    b.use("glass").sphere(0, 54 * s, 6 * s, 9 * s, RANGER.visor, 0.7, 8);
    b.use("gloss").box(0, 44 * s, 2 * s, 16 * s, 4 * s, 10 * s, RANGER.purple);
  });
}

/** Cowboy figure in a yellow window box. */
export function boxedCowboy(b: Builder, x: number, y: number, z: number, s = 1, ry = 0) {
  b.at(x, y, z, ry, () => {
    b.use("gloss").box(0, 0, 0, 40 * s, 74 * s, 16 * s, "#c9a227");
    b.use("paint").box(0, 66 * s, 1 * s, 36 * s, 8 * s, 2 * s, "#7a2e2e");
    b.use("glass").box(0, 8 * s, 8 * s, 32 * s, 54 * s, 2 * s, "#e8f4ff");
    b.use("paint").box(0, 10 * s, 2 * s, 16 * s, 22 * s, 10 * s, COWBOY.jeans);
    b.use("paint").box(0, 32 * s, 2 * s, 18 * s, 14 * s, 10 * s, COWBOY.shirt);
    b.use("paint").box(0, 32 * s, 4 * s, 14 * s, 14 * s, 6 * s, COWBOY.vest);
    b.use("paint").sphere(0, 50 * s, 2 * s, 7 * s, "#f1c27d", 1, 8);
    b.use("paint").cyl(0, 56 * s, 2 * s, 12 * s, 3 * s, COWBOY.hat, 10);
    b.use("paint").cyl(0, 59 * s, 2 * s, 6 * s, 8 * s, COWBOY.hat, 8);
  });
}

/** Purple emperor villain in a black window box. */
export function boxedVillain(b: Builder, x: number, y: number, z: number, s = 1, ry = 0) {
  b.at(x, y, z, ry, () => {
    b.use("gloss").box(0, 0, 0, 44 * s, 82 * s, 16 * s, "#1a1028");
    b.use("glow").box(0, 74 * s, 1 * s, 40 * s, 8 * s, 2 * s, "#7a2e8a");
    b.use("glass").box(0, 8 * s, 8 * s, 36 * s, 62 * s, 2 * s, "#e8f4ff");
    b.use("gloss").box(0, 12 * s, 2 * s, 22 * s, 40 * s, 12 * s, "#4a1a6e");
    b.use("paint").box(0, 40 * s, 6 * s, 28 * s, 8 * s, 6 * s, "#c9a227");
    b.use("gloss").sphere(0, 58 * s, 2 * s, 11 * s, "#6b2d8a", 1.1, 10);
    b.use("paint").cone(0, 68 * s, 2 * s, 8 * s, 14 * s, "#2b1240", 8);
  });
}

/** Green army figure, about 8 cm tall. */
export function armyMan(b: Builder, x: number, z: number, ry = 0) {
  b.at(x, 0, z, ry, () => {
    b.use("paint").cyl(0, 0, 0, 2.2, 10, "#3f7a34", 6);
    b.use("paint").sphere(0, 12, 0, 2.6, "#3f7a34", 1, 6);
    b.use("paint").box(0, 8, 1.5, 7, 2, 1.5, "#3f7a34");
    b.use("paint").box(0, 13, 0, 4, 1.2, 4, "#2f6a28");
  });
}

/** Round pink stuffed bear (the daycare's "boss toy"), sitting. */
export function pinkBear(b: Builder, x: number, z: number, s = 1, ry = 0) {
  b.at(x, 0, z, ry, () => {
    b.use("gloss").sphere(0, 28 * s, 0, 26 * s, BEAR.fur, 0.9, 14);
    b.use("gloss").sphere(0, 56 * s, 4 * s, 16 * s, BEAR.fur, 1, 12);
    b.use("gloss").sphere(-14 * s, 66 * s, 0, 7 * s, BEAR.fur, 1, 8).sphere(14 * s, 66 * s, 0, 7 * s, BEAR.fur, 1, 8);
    b.use("paint").sphere(-6 * s, 58 * s, 16 * s, 3 * s, "#111", 1, 6).sphere(6 * s, 58 * s, 16 * s, 3 * s, "#111", 1, 6);
    b.use("paint").sphere(0, 52 * s, 18 * s, 3.5 * s, BEAR.nose, 1, 6);
    b.use("gloss").sphere(-22 * s, 18 * s, 8 * s, 10 * s, BEAR.fur, 1, 8).sphere(22 * s, 18 * s, 8 * s, 10 * s, BEAR.fur, 1, 8);
  });
}

/** Watchful monkey perched on a shelf (daycare security). */
export function monkeyCam(b: Builder, x: number, y: number, z: number, s = 1) {
  b.use("gloss").sphere(x, y + 16 * s, z, 14 * s, "#6b3d1f", 1, 10);
  b.use("gloss").sphere(x, y + 4 * s, z, 12 * s, "#6b3d1f", 0.85, 10);
  b.use("paint").sphere(x - 5 * s, y + 18 * s, z + 10 * s, 3 * s, "#111", 1, 6).sphere(x + 5 * s, y + 18 * s, z + 10 * s, 3 * s, "#111", 1, 6);
  b.use("paint").sphere(x, y + 12 * s, z + 12 * s, 2.4 * s, "#1d1d1f", 1, 6);
  b.use("metal").box(x, y + 30 * s, z - 4 * s, 8 * s, 4 * s, 18 * s, "#9aa3ad");
}

/** Chicken mascot statue (the toy-barn owner's costume, standing by the doors). */
export function chickenMascot(b: Builder, x: number, z: number, s = 1) {
  b.at(x, 0, z, 0, () => {
    b.use("gloss").sphere(0, 90 * s, 0, 70 * s, "#f4f1ea", 1.05, 16);
    b.use("gloss").sphere(0, 170 * s, 10 * s, 40 * s, "#f4f1ea", 1, 14);
    b.use("gloss").cone(0, 200 * s, 18 * s, 16 * s, 36 * s, "#e63946", 8);
    b.use("paint").box(0, 175 * s, 46 * s, 18 * s, 8 * s, 10 * s, "#f2c14e");
    b.use("paint").sphere(-16 * s, 182 * s, 36 * s, 6 * s, "#111", 1, 6).sphere(16 * s, 182 * s, 36 * s, 6 * s, "#111", 1, 6);
    for (const sx of [-1, 1]) b.use("gloss").cbox(sx * 55 * s, 110 * s, 0, 18 * s, 70 * s, 8 * s, "#f4f1ea", { rz: sx * 0.5 });
    b.use("gloss").cyl(-18 * s, 0, 0, 12 * s, 40 * s, "#f2c14e", 8).cyl(18 * s, 0, 0, 12 * s, 40 * s, "#f2c14e", 8);
  });
}

function poster(b: Builder, x: number, y: number, z: number, w: number, h: number, bg: string, stripe = "#f4f1ea") {
  b.use("paint").box(x, y, z, w, h, 3, bg);
  b.use("paint").box(x, y + h * 0.35, z + 2, w * 0.7, h * 0.18, 2, stripe);
}

function checkerFloor(b: Builder, x: number, z: number, w: number, d: number, a = "#f2e8d5", c = "#d62828", tile = 140) {
  const x0 = x - w / 2;
  const z0 = z - d / 2;
  for (let i = 0; i < Math.ceil(w / tile); i++)
    for (let k = 0; k < Math.ceil(d / tile); k++) {
      if ((i + k) % 2) continue;
      b.use("paint").box(x0 + (i + 0.5) * tile, 1.2, z0 + (k + 0.5) * tile, tile - 4, 0.6, tile - 4, c === a ? c : i % 3 ? c : a);
    }
}

/** Sid's messy den: kitchen, workshop, dark posters, toy parts, a loft bed. */
export function dressSid(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  const hw = l.w / 2;
  // Dishes and a stove on the back-wall kitchen; tools on the workbench.
  b.use("metal").box(-480, 110, -hd + 40, 220, 16, 50, "#3b4148");
  b.use("paint").box(80, 110, -hd + 40, 70, 50, 50, "#2b2a28");
  b.use("paint").cyl(200, 110, -hd + 40, 16, 22, "#5b544c", 10);
  b.use("paint").cyl(240, 110, -hd + 50, 12, 18, "#6b4a2b", 8);
  for (let i = 0; i < 5; i++) b.use("paint").box(-500 + i * 40, 110, -hd + 70, 28, 4, 28, i % 2 ? "#7a2e2e" : "#4a5d3a");
  b.use("metal").box(-hw + 80, 90, -160, 50, 8, 30, "#9aa3ad");
  b.use("metal").box(-hw + 160, 90, -80, 90, 6, 40, "#c0c7cf");
  b.use("paint").box(-hw + 240, 90, -140, 20, 40, 8, "#3b4148");
  b.use("paint").sphere(-hw + 300, 108, -100, 12, "#f1d1b5", 1, 8);
  b.use("metal").box(-hw + 340, 90, -120, 40, 4, 70, "#9aa3ad");
  // CRT stack, tapes, a skateboard and scattered parts.
  b.use("paint").box(380, 0, 80, 50, 12, 140, "#c0392b", { rz: 0.2 });
  b.use("paint").torus(200, 8, 200, 22, 4, "#1d1d1f", { rx: Math.PI / 2 });
  for (let i = 0; i < 8; i++) b.use("paint").box(-300 + (i % 4) * 70, 0, 250 + Math.floor(i / 4) * 50, 28, 8, 18, ["#2b2d42", "#1b3a6e", "#7a2e2e", "#3f7a34"][i % 4]);
  for (const [x, z] of [
    [-500, 100],
    [100, -200],
    [300, 400],
    [-100, 350],
  ] as const)
    b.use("paint").box(x, 0, z, 16 + (x % 9), 6, 12, "#6b7280");
  poster(b, -hw + 8, 280, 0, 180, 240, "#1a1028", "#7a2e8a");
  poster(b, hw - 8, 300, 80, 160, 220, "#3a0d12", "#e63946");
  poster(b, 0, 360, -hd + 8, 260, 180, "#1b1b3a", "#57ff8f");
  // Loft bed over the back-right corner, reached by the existing stairs.
  b.use("wood").box(hw - 280, 380, -hd + 280, 520, 16, 520, "#3a2a22");
  b.use("paint").box(hw - 280, 396, -hd + 280, 480, 20, 400, "#4a3a3a");
  b.use("paint").box(hw - 280, 416, -hd + 120, 480, 50, 16, "#3a2a22");
  for (let i = 0; i < 4; i++) armyMan(b, hw - 400 + i * 40, -hd + 200, i);
}

/** Pizza Planet dining room: checker floor, rocket booths, The Claw court, aliens. */
export function dressPizza(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  const hw = l.w / 2;
  checkerFloor(b, 0, -200, l.w - 80, l.d - 400, "#f2e8d5", "#d62828", 160);
  // The Claw court: dais, ring lights, a crowd of aliens.
  b.use("gloss").cyl(1900, 0, 900, 280, 16, "#1b1b3a", 28);
  b.use("glow").torus(1900, 20, 900, 250, 8, "#ffc300", { rx: Math.PI / 2 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    buildAlien(b, 1900 + Math.sin(a) * 210, 16, 900 + Math.cos(a) * 210, 0.7, -a);
  }
  // Pizza oven glow behind the counter.
  b.use("metal").box(0, 110, -hd + 40, 600, 220, 80, "#2b2f36");
  b.use("glow").box(0, 150, -hd + 82, 420, 140, 4, "#ff7a3d");
  b.use("paint").box(800, 110, -hd + 80, 90, 8, 90, "#f2c14e");
  b.use("paint").cyl(800, 118, -hd + 80, 36, 4, "#d1495b", 16);
  // Ticket counter strip and a photo booth.
  b.use("gloss").box(-hw + 180, 0, 400, 140, 160, 140, "#3a0ca3");
  b.use("glow").box(-hw + 180, 120, 472, 80, 50, 2, "#ffd166");
}

/** Al's Toy Barn: a wall of identical ranger boxes, cowboy endcaps, chicken mascot. */
export function dressBarn(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  chickenMascot(b, -900, hd - 500, 1.15);
  // The famous identical-box wall along the back.
  for (let col = 0; col < 18; col++)
    for (let row = 0; row < 4; row++) boxedRanger(b, -2000 + col * 48, 20 + row * 82, -hd + 40, 1);
  for (let col = 0; col < 10; col++)
    for (let row = 0; row < 3; row++) boxedCowboy(b, 1600 + col * 46, 20 + row * 78, -hd + 40, 1);
  for (let col = 0; col < 6; col++) boxedVillain(b, 3200 + col * 50, 20, -hd + 40, 1.05);
  // Ceiling banners and floor arrows down the main aisle.
  for (let i = 0; i < 5; i++) {
    b.use("paint").box(-200, 1.4, -1800 + i * 700, 80, 0.8, 220, i % 2 ? "#2563eb" : "#ffc300");
    b.use("paint").cbox(-200, 2, -1680 + i * 700, 50, 0.8, 40, "#2563eb", { ry: 0 });
  }
  for (let i = 0; i < 12; i++) armyMan(b, 2700 + (i % 6) * 22, -400 + Math.floor(i / 6) * 24, i * 0.4);
}

/** 1950s Dinoco shop: cooler, maps, oil, a restroom door. */
export function dressDino(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  const hw = l.w / 2;
  b.use("gloss").box(hw - 180, 0, -hd + 80, 160, 160, 70, "#1f5fbf");
  b.use("glass").box(hw - 180, 30, -hd + 116, 140, 120, 2, "#9be7ff");
  for (let i = 0; i < 3; i++) b.use("glow").cyl(hw - 220 + i * 40, 40, -hd + 90, 10, 28, i % 2 ? "#e63946" : "#f2c14e", 8);
  b.use("paint").box(200, 80, -hd + 8, 120, 160, 3, "#1f5fbf");
  b.use("paint").box(200, 160, -hd + 10, 80, 40, 2, "#3aa655");
  b.use("paint").box(-hw + 8, 120, 200, 4, 180, 80, "#f7f5ef");
  b.use("paint").box(-hw + 12, 220, 200, 2, 20, 50, "#1f5fbf");
  for (let i = 0; i < 4; i++) b.use("metal").cyl(-hw + 80, i * 28, 80, 18, 26, "#c0392b", 10, 16);
  b.use("wood").cyl(600, 100, -80, 16, 70, "#8a5a35", 10);
}

/** Sunnyside: Butterfly is tidy, Caterpillar is chaos, a pink bear "rules" the west room. */
export function dressDaycare(b: Builder, _l: Landmark) {
  pinkBear(b, -1400, -1400, 2.2, 0.4);
  monkeyCam(b, 0, 480, -1780, 1.6);
  // Balls in the toddler-room pit.
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 40 + (i % 5) * 50;
    b.use("gloss").sphere(2200 + Math.cos(a) * r, 55 + (i % 3) * 8, -200 + Math.sin(a) * r, 16, ["#e63946", "#ffc300", "#2a9d8f", "#457b9d", "#8e44ad", "#3ddc97"][i % 6], 1, 8);
  }
  // Time-out stool and a broken toy pile.
  b.use("wood").cyl(1600, 0, 200, 28, 40, "#d9a35b", 12);
  for (let i = 0; i < 8; i++) b.use("paint").box(2400 + (i % 4) * 40, 0, 300 + Math.floor(i / 4) * 36, 20, 8 + (i % 3) * 6, 14, "#9aa3ad", { ry: i });
  // Butterfly reading pillows.
  b.use("gloss").sphere(-2400, 20, -1200, 40, "#c7b0f0", 0.5, 10);
  b.use("gloss").sphere(-2550, 18, -1100, 36, "#fff6dc", 0.5, 10);
}

/** Bonnie's crafty toy room and warm living room extras. */
export function dressBonnie(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  // Craft table: crayons, glue, googly eyes, a stick figure in progress.
  b.use("wood").box(-250, 0, 50, 260, 62, 140, "#e8d5b0");
  for (let i = 0; i < 8; i++) b.use("paint").cyl(-340 + i * 22, 62, 20, 2, 18, ["#e63946", "#457b9d", "#2a9d8f", "#f4a261", "#111", "#8e44ad", "#3ddc97", "#c0392b"][i], 6);
  b.use("paint").box(-200, 62, 80, 30, 8, 18, "#f8fafc");
  b.use("paint").sphere(-180, 72, 80, 4, "#111", 1, 6).sphere(-160, 72, 80, 4, "#111", 1, 6);
  b.use("wood").box(-140, 62, 40, 8, 28, 4, "#c8a165");
  b.use("paint").sphere(-140, 94, 40, 7, "#f1c27d", 1, 8);
  // Kid drawings already on the wall; add a felt board.
  b.use("paint").box(-850, 240, -hd + 10, 200, 160, 3, "#2a9d8f");
  for (let i = 0; i < 6; i++) b.use("gloss").box(-920 + (i % 3) * 50, 280 + Math.floor(i / 3) * 50, -hd + 14, 30, 30, 2, ["#ff6fb5", "#ffd166", "#ef476f"][i % 3]);
  // Kitchen nook on the living-room side.
  b.use("paint").box(750, 0, -200, 280, 90, 70, "#fff6dc");
  b.use("paint").box(750, 90, -200, 290, 4, 80, "#ffffff");
  b.use("metal").box(860, 94, -210, 70, 50, 50, "#c0c7cf");
  pinkBear(b, -500, -80, 0.9, 1.2);
}

/** Airport: Tokyo board, toy crates, security trays. */
export function dressAirport(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  // Toy-barn shipping crates near baggage.
  for (let i = 0; i < 4; i++) {
    b.use("gloss").box(1800 + (i % 2) * 220, 0, 700 + Math.floor(i / 2) * 180, 180, 110, 140, i % 2 ? "#b3261e" : "#2563eb");
    b.use("paint").box(1800 + (i % 2) * 220, 80, 700 + Math.floor(i / 2) * 180, 160, 20, 4, "#ffc300");
  }
  for (let i = 0; i < 6; i++) b.use("metal").box(-800 + i * 90, 90, hd - 400, 70, 8, 50, "#c0c7cf");
  b.use("paint").box(-2000, 200, -hd + 16, 400, 120, 3, "#1d3557");
}

export function dressPlane(b: Builder, l: Landmark) {
  for (let x = -l.w / 2 + 200; x < l.w / 2 - 200; x += 220) {
    if (Math.abs(x - (l.door?.offset ?? 0)) < 140) continue;
    b.use("paint").box(x, 140, 160, 180, 24, 70, "#e8e4da");
    b.use("paint").box(x, 140, -160, 180, 24, 70, "#e8e4da");
  }
  // Cargo of boxed toys in the tail.
  for (let i = 0; i < 5; i++) boxedRanger(b, -1500 + i * 50, 4, 0, 0.85, Math.PI / 2);
}

/** Civic and western interiors that share GenericBuilding. */
export function dressCivic(b: Builder, l: Landmark) {
  const hd = l.d / 2;
  const hw = l.w / 2;
  switch (l.kind) {
    case "grocery":
      b.use("gloss").box(hw - 200, 0, 400, 180, 160, 80, "#e63946");
      for (let i = 0; i < 10; i++) b.use("paint").box(-1600 + i * 80, 0, 500, 50, 90, 40, ["#f4a261", "#2a9d8f", "#e63946"][i % 3]);
      break;
    case "cinema":
      poster(b, -hw + 10, 280, 200, 200, 280, "#e63946", "#ffd166");
      poster(b, hw - 10, 280, 200, 200, 280, "#457b9d", "#9be7ff");
      b.use("paint").box(0, 1.2, 200, 900, 1, 400, "#1b1b3a");
      break;
    case "mall":
      for (let i = 0; i < 4; i++) boxedRanger(b, -600 + i * 80, 70, -200, 1.1);
      b.use("gloss").box(1800, 0, 400, 400, 90, 400, "#e63946");
      for (let i = 0; i < 6; i++) b.use("gloss").cyl(1600 + (i % 3) * 140, 90, 280 + Math.floor(i / 3) * 160, 28, 4, "#f2efe8", 12);
      break;
    case "bowling":
      b.use("gloss").box(0, 0, hd - 200, 800, 100, 120, "#e63946");
      b.use("paint").box(0, 100, hd - 200, 810, 6, 130, "#ffd166");
      for (let i = 0; i < 8; i++) b.use("gloss").cyl(-200 + i * 50, 106, hd - 200, 10, 28, "#f8fafc", 8, 6);
      break;
    case "museum":
      boxedRanger(b, -1200, 82, -700, 1.4);
      boxedCowboy(b, 0, 82, -700, 1.4);
      boxedVillain(b, 1200, 82, -700, 1.4);
      for (let i = 0; i < 10; i++) armyMan(b, -200 + i * 18, 300, 0);
      poster(b, 0, 400, -hd + 8, 320, 180, "#7a2e2e", "#f6e7c1");
      break;
    case "warehouse":
      for (let i = 0; i < 8; i++) {
        boxedRanger(b, -1400 + (i % 4) * 50, 20 + Math.floor(i / 4) * 82, 800, 1);
        boxedCowboy(b, 400 + (i % 4) * 48, 20 + Math.floor(i / 4) * 78, 800, 1);
      }
      chickenMascot(b, hw - 300, -200, 0.8);
      break;
    case "recycling": {
      b.use("metal").cyl(0, 200, -200, 40, 20, "#9aa3ad", 12);
      for (const s of [-1, 1]) b.use("metal").cbox(s * 30, 160, -200, 8, 80, 8, "#c0c7cf", { rz: s * 0.4 });
      for (let i = 0; i < 12; i++) b.use("paint").box(-800 + (i % 6) * 90, 160, -400 + Math.floor(i / 6) * 80, 40 + (i % 3) * 20, 20, 30, ["#3a86ff", "#8ecae6", "#80ed99", "#adb5bd"][i % 4]);
      break;
    }
    case "cityhall":
      b.use("paint").box(0, 200, -hd + 8, 400, 280, 4, "#1d3557");
      b.use("paint").box(0, 300, -hd + 10, 200, 40, 2, "#c81d25");
      break;
    case "police":
      poster(b, -hw + 8, 240, 0, 140, 180, "#1d3f8a", "#ffffff");
      b.use("paint").box(hw - 200, 0, -400, 280, 220, 200, "#c7ccd3");
      for (let t = -80; t <= 80; t += 20) b.use("metal").cyl(hw - 100 + t, 0, -300, 2.5, 200, "#2b2f36", 6);
      break;
    case "fire":
      b.use("paint").box(-hw + 10, 200, 0, 4, 200, 160, "#c81d25");
      b.use("metal").cyl(hw - 200, 0, 400, 20, 180, "#c0c7cf", 10);
      break;
    case "hospital":
      for (let i = 0; i < 4; i++) b.use("paint").box(-800 + i * 500, 0, -800, 280, 80, 160, "#ffffff");
      b.use("gloss").box(1600, 0, 400, 200, 90, 200, "#8e44ad");
      for (let i = 0; i < 6; i++) b.use("gloss").sphere(1520 + (i % 3) * 50, 100, 340 + Math.floor(i / 3) * 50, 16, ["#e63946", "#ffc300", "#2a9d8f"][i % 3], 1, 8);
      break;
    case "school":
      poster(b, -hw + 8, 280, -200, 180, 220, "#457b9d", "#ffffff");
      b.use("paint").cyl(800, 0, 200, 40, 4, "#2a9d8f", 24);
      b.use("paint").sphere(800, 90, 200, 36, "#4cc9f0", 1, 12);
      for (let i = 0; i < 8; i++) b.use("paint").box(-600 + i * 40, 80, -hd + 40, 8, 28, 4, ["#e63946", "#2a9d8f", "#457b9d"][i % 3]);
      break;
    case "library":
      b.use("paint").cyl(0, 1, 400, 280, 1, "#c0392b", 28);
      for (let i = 0; i < 6; i++) b.use("wood").box(-200, 0, 200 + i * 20, 40, 8, 16, BRIGHT_PAGE[i % 4]);
      boxedCowboy(b, hw - 200, 0, -200, 1.2);
      break;
    case "sheriff":
      poster(b, -hw + 8, 260, 0, 140, 180, "#5b3417", "#f6e7c1");
      poster(b, hw - 8, 260, 80, 140, 180, "#7a2e2e", "#f2c14e");
      b.use("metal").box(-200, 0, 200, 80, 90, 80, "#4a4642");
      b.use("metal").cyl(-200, 90, 200, 30, 20, "#3b4148", 12);
      boxedCowboy(b, 200, 0, 400, 1.3);
      break;
    case "saloon":
      b.use("wood").box(-800, 0, 200, 200, 90, 80, "#6b3d1f");
      b.use("paint").box(-800, 90, 200, 180, 70, 40, "#f4ead2");
      for (let i = 0; i < 8; i++) b.use("paint").box(-860 + i * 16, 100, 210, 8, 40, 4, "#2d1a0e");
      poster(b, 0, 320, -hd + 8, 220, 160, "#2d1a0e", "#f2c14e");
      break;
    case "general":
      for (let i = 0; i < 6; i++) b.use("wood").cyl(-600 + i * 180, 0, 300, 35, 90, "#8a5a35", 12, 30);
      b.use("paint").box(400, 0, 200, 90, 70, 90, "#c8a165");
      boxedCowboy(b, hw - 150, 0, -200, 1);
      break;
    case "station":
      b.use("wood").box(-400, 0, -200, 200, 80, 60, "#6b3d1f");
      for (let i = 0; i < 4; i++) b.use("paint").box(-200 + i * 80, 0, 200, 60, 50, 90, ["#7a2e2e", "#c08a3e", "#2d1a0e", "#f6e7c1"][i]);
      poster(b, 0, 280, -hd + 8, 260, 120, "#7a2e2e", "#f6e7c1");
      break;
    default:
      break;
  }
}

const BRIGHT_PAGE = ["#e63946", "#457b9d", "#2a9d8f", "#f4a261"];
