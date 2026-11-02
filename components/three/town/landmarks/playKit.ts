import type { Builder } from "../builder";

export function buildSwings(b: Builder, x: number, z: number, seats = 3, ry = 0) {
  const w = seats * 110 + 60;
  b.at(x, 0, z, ry, () => {
    for (const s of [-1, 1]) {
      b.use("metal").cbox((s * w) / 2, 120, -60, 8, 260, 8, "#e63946", { rx: 0.25 });
      b.use("metal").cbox((s * w) / 2, 120, 60, 8, 260, 8, "#e63946", { rx: -0.25 });
    }
    b.use("metal").rod(0, 245, 0, 6, w + 20, "#e63946");
    for (let i = 0; i < seats; i++) {
      const sx = -w / 2 + 85 + i * 110;
      b.use("metal").box(sx - 22, 60, 0, 2, 185, 2, "#9aa3ad").box(sx + 22, 60, 0, 2, 185, 2, "#9aa3ad");
      b.use("gloss").box(sx, 56, 0, 52, 5, 22, ["#ffc300", "#2a9d8f", "#457b9d"][i % 3]);
    }
  });
}

export function buildSlide(b: Builder, x: number, z: number, ry = 0, h = 180, color = "#ffc300") {
  b.at(x, 0, z, ry, () => {
    for (const [dx, dz] of [
      [-40, -40],
      [40, -40],
      [-40, 40],
      [40, 40],
    ])
      b.use("metal").box(dx, 0, dz, 8, h + 90, 8, "#2a9d8f");
    b.use("gloss").box(0, h, 0, 90, 8, 90, "#2a9d8f");
    b.use("gloss").box(0, h + 8, -44, 90, 70, 4, "#2a9d8f");
    const len = Math.hypot(h, 320);
    b.use("gloss").cbox(0, h / 2 + 6, 205, 70, 6, len, color, { rx: Math.atan2(h, 320) });
    b.use("gloss").cbox(-36, h / 2 + 20, 205, 4, 26, len, color, { rx: Math.atan2(h, 320) });
    b.use("gloss").cbox(36, h / 2 + 20, 205, 4, 26, len, color, { rx: Math.atan2(h, 320) });
    for (let i = 0; i < 6; i++) b.use("metal").box(0, (i * h) / 6 + 10, -60 - i * 14, 70, 5, 8, "#9aa3ad");
  });
}

export function buildSandbox(b: Builder, x: number, z: number, w = 400, d = 400) {
  b.use("wood").box(x, 0, z, w, 30, 18, "#a0703f").box(x, 0, z + d, w, 30, 18, "#a0703f");
  b.use("wood").box(x - w / 2, 0, z + d / 2, 18, 30, d, "#a0703f").box(x + w / 2, 0, z + d / 2, 18, 30, d, "#a0703f");
  b.use("concrete").box(x, 0, z + d / 2, w - 18, 18, d - 18, "#ecd9a8");
  b.use("gloss").box(x - 80, 18, z + 120, 34, 30, 34, "#e63946");
  b.use("gloss").cone(x + 100, 18, z + 260, 30, 50, "#ffc300", 10);
  b.use("gloss").box(x + 40, 18, z + 160, 60, 4, 14, "#2a9d8f");
}

/** Climbing frame shaped like a rocket. */
export function buildRocketClimber(b: Builder, x: number, z: number, h = 600) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.use("metal").box(x + Math.sin(a) * 120, 0, z + Math.cos(a) * 120, 8, h * 0.7, 8, "#e63946");
  }
  for (let y = 80; y < h * 0.7; y += 90) b.use("metal").torus(x, y, z, 120, 4, "#ffc300", { rx: Math.PI / 2 });
  b.use("gloss").cone(x, h * 0.7, z, 135, h * 0.3, "#e63946", 16);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    b.use("gloss").cbox(x + Math.sin(a) * 160, 90, z + Math.cos(a) * 160, 8, 180, 90, "#457b9d", { ry: a });
  }
}

export function buildBench(b: Builder, x: number, z: number, ry = 0) {
  b.at(x, 0, z, ry, () => {
    b.use("wood").box(0, 42, 0, 160, 5, 45, "#8a5a35");
    b.use("wood").cbox(0, 70, -24, 160, 35, 5, "#8a5a35", { rx: -0.15 });
    for (const s of [-1, 1]) b.use("metal").box(s * 70, 0, 0, 6, 42, 40, "#2b2f36");
  });
}

export function buildSeesaw(b: Builder, x: number, z: number, ry = 0) {
  b.at(x, 0, z, ry, () => {
    b.use("metal").box(0, 0, 0, 30, 50, 30, "#457b9d");
    b.use("gloss").cbox(0, 55, 0, 320, 8, 30, "#ffc300", { rz: 0.15 });
    b.use("metal").box(-140, 70, 0, 6, 30, 30, "#2b2f36").box(140, 30, 0, 6, 30, 30, "#2b2f36");
  });
}

/** Toddler-size block tower and loose blocks. */
export function buildBlocks(b: Builder, x: number, z: number, seed: number) {
  const colors = ["#e63946", "#ffc300", "#2a9d8f", "#457b9d", "#f4a261", "#8e44ad"];
  for (let i = 0; i < 6; i++) b.use("gloss").box(x + ((i * 7 + seed) % 3) * 4, i * 14, z, 14, 14, 14, colors[(i + seed) % 6]);
  for (let i = 0; i < 5; i++) b.use("gloss").box(x + 30 + i * 18, 0, z + ((i * 13 + seed) % 40) - 20, 14, 14, 14, colors[(i * 2 + seed) % 6], { ry: i * 0.5 });
}
