import { seededRandom } from "@/lib/world/geometry";
import type { PropBox } from "@/lib/town/interiors";
import type { Builder } from "./builder";

const BRIGHT = ["#e63946", "#f4a261", "#2a9d8f", "#457b9d", "#e9c46a", "#8e44ad", "#ff6fb5", "#3ddc97", "#1d4ed8", "#f97316"];

/** Small merchandise for a toy-store aisle, sitting on a shelf at height `y`, facing +z. */
function merch(b: Builder, category: string | undefined, x: number, y: number, z: number, r: () => number) {
  const c = BRIGHT[Math.floor(r() * BRIGHT.length)];
  switch (category) {
    case "Action Figures":
      b.use("gloss").box(x, y, z, 26, 44, 8, c);
      b.use("glass").box(x, y + 8, z + 5, 18, 30, 2, "#e8f4ff");
      b.use("paint").sphere(x, y + 32, z + 2, 5, "#f1c27d", 1, 8);
      break;
    case "Toy Cars":
      b.use("gloss").box(x, y + 2, z, 30, 10, 16, c);
      b.use("gloss").box(x - 2, y + 12, z, 16, 7, 14, c);
      b.use("paint").box(x, y, z, 32, 4, 17, "#1f2933");
      break;
    case "Space Toys":
      b.use("gloss").cyl(x, y, z, 7, 34, "#f4f4f4", 8);
      b.use("gloss").cone(x, y + 34, z, 7, 14, "#e63946", 8);
      b.use("paint").box(x, y, z, 26, 10, 3, "#7ac943");
      break;
    case "Cowboy Toys":
      b.use("paint").cyl(x, y, z, 15, 3, "#8b5a2b", 12);
      b.use("paint").cyl(x, y + 3, z, 8, 11, "#9c6a35", 10, 7);
      b.use("paint").box(x, y + 4, z, 16, 2, 16, "#c0392b");
      break;
    case "Dinosaurs":
      b.use("gloss").sphere(x, y + 14, z, 13, ["#3ddc97", "#2a9d8f", "#7cb342"][Math.floor(r() * 3)], 0.7, 8);
      b.use("gloss").sphere(x + 12, y + 26, z, 6, "#3ddc97", 1, 8);
      b.use("gloss").box(x - 16, y + 10, z, 14, 5, 5, "#2a9d8f");
      break;
    case "Board Games":
      b.use("gloss").box(x, y, z, 40, 7, 28, c);
      b.use("gloss").box(x, y + 7, z, 40, 7, 28, BRIGHT[Math.floor(r() * BRIGHT.length)]);
      break;
    default:
      b.use("gloss").box(x, y, z, 22 + r() * 14, 16 + r() * 22, 14, c);
  }
}

/** Double-sided store gondola running along local z: uprights, shelves, back panel and header. */
function gondola(b: Builder, p: PropBox, levels: number, fill: (x: number, y: number, z: number, side: number) => void, header?: string) {
  const { x, z, w, d, h } = p;
  b.use("metal").box(x, 0, z, w - 4, 14, d, "#3d4450");
  b.use("paint").box(x, 14, z, 6, h - 14, d, "#e7e3da");
  for (let i = 0; i <= Math.round(d / 150); i++) b.use("metal").box(x, 0, z - d / 2 + (i * d) / Math.round(d / 150), w, h, 6, "#9aa3ad");
  for (let k = 0; k < levels; k++) {
    const y = 20 + (k * (h - 50)) / levels;
    b.use("metal").box(x, y, z, w, 4, d, "#c9ced4");
    b.use("paint").box(x - w / 2 - 1, y + 4, z, 2, 8, d, header ?? "#f4d35e").box(x + w / 2 + 1, y + 4, z, 2, 8, d, header ?? "#f4d35e");
    for (const side of [-1, 1]) for (let t = -d / 2 + 40; t < d / 2 - 20; t += 70) fill(x + side * (w / 4 + 6), y + 4, z + t, side);
  }
  if (header) b.use("paint").box(x, h, z, 10, 50, Math.min(d, 900), header);
}

export function buildProps(b: Builder, props: PropBox[], seed = 1) {
  const r = seededRandom(seed);
  for (const p of props) {
    const { x, z, w, d, h } = p;
    switch (p.kind) {
      case "toyshelf":
        gondola(b, p, 4, (sx, sy, sz) => merch(b, p.label, sx, sy, sz, r), ["#e63946", "#2a9d8f", "#457b9d", "#c0392b", "#7cb342", "#8e44ad"][Math.floor(r() * 6)]);
        break;
      case "groceryshelf":
        gondola(b, p, 4, (sx, sy, sz) => {
          b.use("gloss").box(sx, sy, sz, 24, 18 + r() * 14, 40, BRIGHT[Math.floor(r() * BRIGHT.length)]);
        });
        break;
      case "storeshelf":
      case "bookshelf": {
        const bookish = p.kind === "bookshelf";
        b.use("wood").box(x, 0, z, w, h, d, bookish ? "#8a5a35" : "#a0703f");
        for (let k = 0; k < 5; k++) {
          const y = 12 + k * (h / 5);
          for (const side of [-1, 1])
            for (let t = -w / 2 + 12; t < w / 2 - 12; t += bookish ? 9 : 40)
              b.use("paint").box(x + t, y, z + side * (d / 2 + 1), bookish ? 7 : 30, (bookish ? 30 : 20) + r() * 10, 6, bookish ? BRIGHT[Math.floor(r() * BRIGHT.length)] : ["#c8a165", "#8b6b4a", "#d9c7a3"][Math.floor(r() * 3)]);
        }
        break;
      }
      case "checkout":
      case "reception":
      case "concession":
      case "ticket":
      case "checkin":
        b.use("gloss").box(x, 0, z, w, h - 6, d, p.kind === "checkin" ? "#2b4c7e" : p.kind === "concession" ? "#b5172b" : "#3a6ea5");
        b.use("paint").box(x, h - 6, z, w + 10, 6, d + 10, "#f2efe8");
        for (let t = -w / 2 + 60; t < w / 2; t += 260) {
          b.use("metal").box(x + t, h, z, 40, 34, 4, "#20252b");
          b.use("glow").box(x + t, h + 8, z + 3, 34, 24, 1, "#7cc7ff");
        }
        if (p.kind === "checkout") b.use("metal").box(x - w / 2 + 120, h - 6, z, 180, 2, d - 30, "#2b2f36");
        break;
      case "produce":
        b.use("wood").box(x, 0, z, w, h, d, "#8a5a35");
        for (let t = -d / 2 + 30; t < d / 2; t += 40)
          for (let s = -w / 2 + 25; s < w / 2; s += 45) b.use("gloss").sphere(x + s, h + 10, z + t, 12, ["#e63946", "#f4a261", "#7cb342", "#f1c40f"][Math.floor(r() * 4)], 1, 8);
        break;
      case "desk":
        b.use("wood").box(x, 0, z, w, h, d, "#8a5a35");
        break;
      case "rack":
        for (let k = 0; k < 4; k++) {
          b.use("metal").box(x, k * 150 + 10, z, w, 8, d, "#e58e26");
          for (let t = -d / 2 + 80; t < d / 2 - 60; t += 160) {
            b.use("planks").box(x, k * 150 + 18, z + t, w - 30, 12, 120, "#b08d57");
            b.use("paint").box(x, k * 150 + 30, z + t, w - 40, 60 + r() * 50, 110, ["#c8a165", "#b48a55", "#e9c46a", "#d2b48c"][Math.floor(r() * 4)]);
          }
        }
        for (let t = -d / 2; t <= d / 2; t += d / Math.round(d / 400)) for (const s of [-1, 1]) b.use("metal").box(x + (s * w) / 2, 0, z + t, 8, h, 8, "#1f5fa8");
        break;
      case "pizzacounter":
        b.use("gloss").box(x, 0, z, w, h - 8, d, "#d62828");
        b.use("paint").box(x, h - 8, z, w + 12, 8, d + 12, "#f1f1f1");
        for (let t = -w / 2 + 120; t < w / 2; t += 260) {
          b.use("paint").cyl(x + t, h, z, 26, 3, "#f2c14e", 16);
          b.use("paint").cyl(x + t, h + 3, z, 22, 1, "#d1495b", 16);
        }
        b.use("metal").box(x, h + 140, z - 60, w, 60, 40, "#202833");
        break;
      case "arcade": {
        const face = p.label === "west" ? 1 : -1;
        b.use("gloss").box(x, 0, z, w, h, d, ["#2b2d42", "#3a0ca3", "#7209b7", "#0b525b"][Math.floor(r() * 4)]);
        b.use("glow").box(x + face * (w / 2 + 1), h * 0.5, z, 2, 55, d * 0.7, ["#57ff8f", "#4cc9f0", "#ffd166", "#f72585"][Math.floor(r() * 4)]);
        b.use("glow").box(x + face * (w / 2 + 1), h - 34, z, 2, 26, d * 0.85, "#ffcf33");
        b.use("paint").box(x + face * (w / 2 + 12), h * 0.42, z, 26, 6, d * 0.8, "#111827");
        b.use("gloss").sphere(x + face * (w / 2 + 14), h * 0.42 + 12, z - 25, 4, "#e63946", 1, 8);
        b.use("gloss").sphere(x + face * (w / 2 + 14), h * 0.42 + 10, z + 15, 3.5, "#ffd166", 1, 8).sphere(x + face * (w / 2 + 14), h * 0.42 + 10, z + 30, 3.5, "#4cc9f0", 1, 8);
        break;
      }
      case "claw":
        b.use("gloss").box(x, 0, z, w, 100, d, "#e63946");
        b.use("glass").box(x, 100, z, w - 10, 110, d - 10, "#e6f7ff");
        b.use("gloss").box(x, 210, z, w, 20, d, "#ffd166");
        b.use("glow").box(x, 228, z, w * 0.8, 18, d * 0.8, "#4cc9f0");
        for (let i = 0; i < 14; i++) {
          const ax = x + (r() - 0.5) * (w - 50);
          const az = z + (r() - 0.5) * (d - 50);
          b.use("gloss").sphere(ax, 112, az, 11, "#7ee36d", 1.1, 10);
          b.use("gloss").sphere(ax - 7, 120, az + 9, 2.6, "#111", 1, 6).sphere(ax + 7, 120, az + 9, 2.6, "#111", 1, 6);
        }
        b.use("metal").rod(x, 200, z, 2, w - 20, "#c0c7cf");
        break;
      case "prizes":
        b.use("glass").box(x, 0, z, w, h, d, "#e6f7ff");
        b.use("paint").box(x, 0, z, w, 30, d, "#3a0ca3");
        for (let t = -w / 2 + 30; t < w / 2; t += 40) b.use("gloss").box(x + t, 50 + r() * 30, z, 24, 24, 24, BRIGHT[Math.floor(r() * BRIGHT.length)]);
        b.use("glow").box(x, h + 20, z, w, 40, 6, "#ffd166");
        break;
      case "collectibles":
        b.use("wood").box(x, 0, z, w, 60, d, "#7a4a24");
        for (let k = 0; k < 3; k++) b.use("glass").box(x, 60 + k * 55, z, w - 40 - k * 120, 55, d - 40 - k * 80, "#e6f7ff");
        for (let i = 0; i < 4; i++) {
          // Western figurines on the display tiers: hats and saddle colors.
          b.use("gloss").cyl(x - 250 + i * 165, 65, z, 9, 40, ["#2b6cb0", "#d1495b", "#f2c14e", "#8b5a2b"][i], 10);
          b.use("paint").sphere(x - 250 + i * 165, 112, z, 9, "#f1c27d", 1, 8);
          b.use("paint").cyl(x - 250 + i * 165, 119, z, 13, 2, "#8b5a2b", 12).cyl(x - 250 + i * 165, 121, z, 7, 8, "#9c6a35", 10);
        }
        b.use("glow").box(x, h + 10, z, w, 50, 8, "#f2c14e");
        break;
      case "screen":
        b.use("glow").box(x, 60, z, w, h - 60, d / 2, "#cfe7ff");
        b.use("paint").box(x, 0, z - 10, w + 200, h + 40, 10, "#5b0e14");
        for (let row = 0; row < 7; row++)
          for (let t = -w / 2 + 60; t < w / 2 - 40; t += 75) {
            b.use("paint").box(x + t, 0, z + 500 + row * 130, 60, 45, 60, "#9b1d20");
            b.use("paint").box(x + t, 45, z + 525 + row * 130, 60, 50, 12, "#9b1d20");
          }
        break;
      case "lane":
        b.use("wood").box(x, 0, z, w, h, d, "#d9a35b");
        b.use("paint").box(x - w / 2 - 20, 0, z, 40, 4, d, "#2b2f36").box(x + w / 2 + 20, 0, z, 40, 4, d, "#2b2f36");
        for (let i = 0; i < 10; i++) {
          const row = i < 1 ? 0 : i < 3 ? 1 : i < 6 ? 2 : 3;
          const col = i - [0, 1, 3, 6][row];
          b.use("gloss").cyl(x + (col - row / 2) * 22, h, z - d / 2 + 80 - row * 20, 5, 38, "#f8fafc", 10, 3);
        }
        b.use("gloss").sphere(x, h + 11, z + d / 2 - 100, 11, ["#1d4ed8", "#e63946", "#16a34a", "#7209b7"][Math.floor(r() * 4)], 1, 12);
        break;
      case "case":
        b.use("wood").box(x, 0, z, w, 80, d, "#6b4423");
        b.use("glass").box(x, 80, z, w - 10, h - 80, d - 10, "#e6f7ff");
        for (let i = 0; i < 5; i++) b.use("gloss").box(x - w / 2 + 70 + i * ((w - 140) / 4), 82, z, 30, 25 + r() * 30, 30, BRIGHT[Math.floor(r() * BRIGHT.length)]);
        break;
      case "fountain":
        b.use("concrete").cyl(x, 0, z, w / 2, h, "#d9d4c8", 32);
        b.use("glass").cyl(x, h - 10, z, w / 2 - 25, 6, "#5fc6f0", 32);
        b.use("concrete").cyl(x, 0, z, 60, h + 120, "#d9d4c8", 16);
        b.use("glass").cyl(x, h + 120, z, 20, 90, "#bfe9ff", 12, 4);
        break;
      case "dais":
        b.use("wood").box(x, 0, z, w, h, d, "#7a4a24");
        b.use("wood").box(x, h, z - d / 2 + 30, w * 0.7, 90, 40, "#5b3417");
        for (let t = -w / 2; t <= w / 2; t += w / 6) b.use("paint").cyl(x + t, 0, z + d / 2 + 400, 20, 100, "#4a2e1a", 10);
        break;
      case "firetruck":
        b.use("gloss").box(x, 40, z, w * 0.9, 220, d * 0.65, "#c81d25");
        b.use("gloss").box(x, 40, z + d * 0.38, w * 0.9, 260, d * 0.22, "#c81d25");
        b.use("glass").box(x, 170, z + d * 0.49, w * 0.8, 90, 4, "#26323d");
        b.use("metal").box(x, 260, z - 60, w * 0.5, 30, d * 0.7, "#d0d5db");
        b.use("glow").box(x - w * 0.3, 300, z + d * 0.4, 50, 20, 30, "#ff3b30").box(x + w * 0.3, 300, z + d * 0.4, 50, 20, 30, "#ff3b30");
        for (const t of [-0.3, 0.32]) for (const s of [-1, 1]) b.use("paint").rod(x + (s * w * 0.45), 50, z + t * d, 50, 40, "#1d1d1f", 0, 14);
        break;
      case "chalkboard":
        b.use("paint").box(x, 80, z, w, h, d / 2, "#2f4f3a");
        b.use("wood").box(x, 70, z, w + 20, 10, d, "#8a5a35");
        for (let row = 0; row < 4; row++)
          for (let col = 0; col < 5; col++) {
            const dx = x - 800 + col * 400;
            const dz = z + 400 + row * 350;
            b.use("wood").box(dx, 0, dz, 120, 70, 80, "#d9a35b");
            b.use("metal").box(dx, 0, dz + 80, 50, 45, 45, "#3a6ea5");
          }
        break;
      case "conveyor":
        b.use("metal").box(x, 0, z, w, h - 20, d, "#4f5b66");
        b.use("paint").box(x, h - 20, z, w, 20, d - 40, "#1d1d1f");
        for (let t = -w / 2 + 80; t < w / 2; t += 140) b.use("gloss").box(x + t, h, z + (r() - 0.5) * 120, 40 + r() * 40, 30, 40 + r() * 30, ["#3a86ff", "#8ecae6", "#bdb2ff", "#80ed99", "#adb5bd"][Math.floor(r() * 5)]);
        break;
      case "carousel":
        b.use("metal").box(x, 0, z, w, h, d, "#5c6773");
        b.use("paint").box(x, h, z, w - 60, 4, d - 60, "#2b2f36");
        for (let i = 0; i < 9; i++) b.use("gloss").box(x - w / 2 + 120 + i * 150, h + 4, z + (i % 2 ? 160 : -160), 100, 55, 70, ["#2b4c7e", "#e63946", "#2a9d8f", "#6d597a"][i % 4]);
        break;
      case "seats":
        for (let t = -w / 2 + 40; t < w / 2; t += 80) {
          b.use("metal").box(x + t, 0, z, 6, 40, 6, "#8a929c");
          b.use("gloss").box(x + t, 40, z, 70, 8, 60, "#2b4c7e");
          b.use("gloss").box(x + t, 48, z - 30, 70, 60, 8, "#2b4c7e");
        }
        break;
      case "seatbank":
        for (let t = -w / 2 + 40; t < w / 2; t += 85) {
          b.use("gloss").box(x + t, 40, z, 70, 22, d, "#3a4a7a");
          b.use("gloss").box(x + t - 30, 62, z, 10, 80, d, "#3a4a7a");
          b.use("paint").box(x + t - 35, 135, z, 8, 18, d * 0.6, "#e8e4da");
        }
        break;
      case "bar":
        b.use("wood").box(x, 0, z, w, h - 8, d, "#6b3d1f");
        b.use("wood").box(x, h - 8, z, w + 20, 8, d + 20, "#8a5a35");
        b.use("wood").box(x, 0, z - 300, w, 260, 40, "#5b3417");
        for (let t = -w / 2 + 40; t < w / 2; t += 30) b.use("glass").cyl(x + t, 130, z - 285, 6, 28, ["#7a3f12", "#2f6b3a", "#c08a2b"][Math.floor(r() * 3)], 8);
        for (let t = -w / 2 + 120; t < w / 2; t += 200) b.use("wood").cyl(x + t, 0, z + d / 2 + 70, 24, 75, "#7a4a24", 12);
        break;
      case "cell":
        b.use("paint").box(x, 0, z, w, 4, d, "#77736b");
        for (let t = -w / 2; t <= w / 2; t += 18) b.use("metal").cyl(x + t, 0, z + d / 2, 2.5, h, "#2b2f36", 6);
        for (let t = -d / 2; t <= d / 2; t += 18) b.use("metal").cyl(x - w / 2, 0, z + t, 2.5, h, "#2b2f36", 6);
        b.use("metal").box(x, h - 6, z, w, 6, d, "#2b2f36");
        b.use("wood").box(x + w / 4, 0, z - d / 4, w / 3, 45, d / 3, "#8a5a35");
        break;
      case "toybox":
        b.use("gloss").box(x, 0, z, w, h, d, "#e76f51");
        b.use("gloss").box(x, h, z - d / 2 + 10, w, 60, 8, "#f4a261", { rx: -0.5 });
        for (let i = 0; i < 6; i++) b.use("gloss").sphere(x - w / 2 + 40 + i * 60, h + 10, z + (r() - 0.5) * 60, 18, BRIGHT[i], 1, 10);
        break;
      case "cubbies":
        b.use("wood").box(x, 0, z, w, h, d, "#d9a35b");
        for (let k = 0; k < 3; k++)
          for (let t = -d / 2 + 70; t < d / 2; t += 140) b.use("gloss").box(x + w / 2 - 20, 15 + k * 45, z + t, 40, 30, 110, BRIGHT[Math.floor(r() * BRIGHT.length)]);
        break;
      default:
        b.use("paint").box(x, 0, z, w, h, d, "#a0a0a0");
    }
  }
}

/** Table with four chairs. */
export function buildTableSet(b: Builder, x: number, z: number, top = "#f2efe8", chair = "#d62828", round = true) {
  if (round) b.use("gloss").cyl(x, 72, z, 55, 4, top, 20);
  else b.use("gloss").box(x, 72, z, 120, 4, 80, top);
  b.use("metal").cyl(x, 0, z, 5, 72, "#5b6470", 8);
  b.use("metal").cyl(x, 0, z, 26, 3, "#5b6470", 12);
  for (const [dx, dz] of [
    [0, 85],
    [0, -85],
    [85, 0],
    [-85, 0],
  ]) {
    b.use("gloss").box(x + dx, 44, z + dz, 42, 5, 42, chair);
    b.use("metal").cyl(x + dx, 0, z + dz, 3, 44, "#5b6470", 6);
    const back = Math.atan2(dx, dz);
    b.use("gloss").cbox(x + dx * 1.24, 70, z + dz * 1.24, 42, 46, 5, chair, { ry: back });
  }
}
