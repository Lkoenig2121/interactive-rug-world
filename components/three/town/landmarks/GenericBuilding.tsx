"use client";

import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { buildProps } from "../interiorProps";
import { buildCars, buildFlatRoof, buildLamp, buildParking, buildShell, Built, LandmarkGroup, Roof, Sign, type ShellStyle } from "../parts";

interface Style {
  shell: ShellStyle;
  sign: { text: string; bg: string; fg: string; border?: string; glow?: boolean; font?: string; w?: number; h?: number; y?: number };
  /** Facade details on the front (+z) and around the building. */
  facade?: (b: Builder, l: Landmark) => void;
  roof?: (b: Builder, l: Landmark) => void;
  /** Parking lot depth in front of the building. */
  lot?: number;
}

const WESTERN_FONT = "'Rockwell', 'Georgia', serif";

const columns = (b: Builder, l: Landmark, n: number, h: number, color = "#f4f1ea") => {
  const span = Math.min(l.w * 0.7, n * 300);
  b.use("concrete").box(0, 0, l.d / 2 + 160, span + 200, 30, 320, "#e3ddcf");
  for (let i = 0; i < n; i++) {
    const x = -span / 2 + (i * span) / (n - 1);
    b.use("concrete").cyl(x, 30, l.d / 2 + 220, 32, h - 30, color, 16);
    b.use("concrete").box(x, h - 10, l.d / 2 + 220, 90, 20, 90, color);
  }
  b.use("concrete").box(0, h + 10, l.d / 2 + 160, span + 200, 60, 340, color);
  b.use("concrete").gable(0, h + 70, l.d / 2 + 160, span + 220, 220, 340, color, Math.PI / 2);
};

const awning = (b: Builder, l: Landmark, color: string, y = 300, depth = 180) => {
  for (let x = -l.w / 2 + 30; x < l.w / 2 - 60; x += 120) b.use("paint").cbox(x + 60, y, l.d / 2 + depth / 2, 118, 6, depth + 20, (Math.round(x / 120) % 2 ? color : "#f8f5ee"), { rx: 0.35 });
};

const storefront = (b: Builder, l: Landmark, h = 300, color = "#2b2f36") => {
  const door = l.door!;
  for (let x = -l.w / 2 + 100; x < l.w / 2 - 100; x += 260) {
    if (Math.abs(x + 130 - door.offset) < door.width / 2 + 140) continue;
    b.use("glass").box(x + 130, 20, l.d / 2 + 8, 240, h, 3, "#9cc8e6");
    b.use("metal").box(x + 130, 20 + h, l.d / 2 + 9, 250, 10, 4, color);
    b.use("metal").box(x + 5, 20, l.d / 2 + 9, 10, h, 4, color);
  }
};

const wideDoors = (b: Builder, l: Landmark, n: number, w: number, h: number, color: string) => {
  for (let i = 0; i < n; i++) {
    const x = -l.w / 2 + (l.w / n) * (i + 0.5);
    if (l.door && Math.abs(x - l.door.offset) < l.door.width / 2 + w / 2) continue;
    b.use("paint").box(x, 0, l.d / 2 + 9, w, h, 4, color);
    for (let y = 40; y < h; y += 50) b.use("paint").box(x, y, l.d / 2 + 11, w, 3, 2, "#9aa1a8");
  }
};

const falseFront = (b: Builder, l: Landmark, color: string, porch = "#7a4a24") => {
  const top = l.h + 220;
  b.use("planks").box(0, l.h - 10, l.d / 2 + 4, l.w + 20, top - l.h + 10, 16, color);
  b.use("wood").box(0, top, l.d / 2 + 4, l.w + 60, 20, 26, porch);
  b.use("wood").box(0, 0, l.d / 2 + 160, l.w + 40, 24, 300, porch);
  for (let x = -l.w / 2; x <= l.w / 2 + 1; x += l.w / 4) b.use("wood").box(x, 24, l.d / 2 + 290, 18, 300, 18, porch);
  b.use("wood").box(0, 324, l.d / 2 + 160, l.w + 60, 14, 320, porch);
  b.use("wood").box(0, 200, l.d / 2 + 300, l.w + 40, 10, 10, porch);
  b.use("wood").box(0, 0, l.d / 2 + 340, l.w + 40, 12, 60, porch);
  // Hitching rail and a barrel or two.
  b.use("wood").box(0, 90, l.d / 2 + 520, 300, 10, 10, porch);
  for (const x of [-150, 150]) b.use("wood").box(x, 0, l.d / 2 + 520, 12, 95, 12, porch);
  b.use("wood").cyl(-l.w / 2 + 60, 24, l.d / 2 + 120, 35, 90, "#8a5a35", 14, 32);
};

const flag = (b: Builder, x: number, z: number, colors: [string, string]) => {
  b.use("metal").cyl(x, 0, z, 8, 1100, "#d0d5db", 10, 5);
  b.use("gloss").box(x + 110, 900, z, 200, 120, 3, colors[0]);
  b.use("gloss").box(x + 110, 960, z, 200, 30, 3.5, colors[1]);
};

const flat = (color: string, parapet = 60) => (b: Builder, l: Landmark) => buildFlatRoof(b, l, l.h, color, parapet);
const pitched = (color: string, rise = 0.35) => (b: Builder, l: Landmark) => {
  b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#efe9df");
  b.use("shingle").gable(0, l.h, 0, l.w + 80, l.d * rise, l.d + 80, color, Math.PI / 2);
};

export const STYLES: Partial<Record<Landmark["kind"], Style>> = {
  grocery: {
    shell: { h: 650, ext: { slot: "concrete", color: "#efe8da" }, int: "#f6f3ec", floor: { slot: "tile", color: "#f4f1ea" }, trim: "#2f9e44" },
    sign: { text: "FRESH MART", bg: "#2f9e44", fg: "#ffffff", border: "#f6f3ec", glow: true, w: 1400, h: 220 },
    facade: (b, l) => {
      storefront(b, l, 300, "#1f6f43");
      awning(b, l, "#2f9e44", 340);
      for (let i = 0; i < 4; i++) b.use("metal").box(l.door!.offset + 400 + i * 70, 0, l.d / 2 + 260, 60, 90, 110, "#c0c7cf");
    },
    roof: flat("#a7a39b"),
    lot: 1500,
  },
  cinema: {
    shell: { h: 900, ext: { slot: "brick", color: "#a34a3a" }, int: "#3a0d12", floor: { slot: "paint", color: "#5b0e14" }, trim: "#f2c14e", doorH: 300 },
    sign: { text: "GALAXY CINEMA", bg: "#1b1b3a", fg: "#ffd166", border: "#ffd166", glow: true, w: 1500, h: 220, y: 680 },
    facade: (b, l) => {
      b.use("gloss").box(0, 400, l.d / 2 + 160, l.w * 0.8, 160, 300, "#1b1b3a");
      for (let x = -l.w * 0.4 + 30; x < l.w * 0.4; x += 60) {
        b.use("glow").sphere(x, 400, l.d / 2 + 312, 8, "#fff3b0", 1, 8).sphere(x, 560, l.d / 2 + 312, 8, "#fff3b0", 1, 8);
      }
      b.use("gloss").box(l.w / 2 - 200, 500, l.d / 2 + 60, 30, 700, 160, "#1b1b3a");
      for (let y = 560; y < 1150; y += 90) b.use("glow").box(l.w / 2 - 200, y, l.d / 2 + 142, 34, 60, 4, "#ff5d8f");
      b.use("glass").box(-600, 300, l.d / 2 + 9, 150, 220, 3, "#ffd166").box(600, 300, l.d / 2 + 9, 150, 220, 3, "#ffd166");
      b.use("paint").box(-600, 300, l.d / 2 + 11, 120, 190, 2, "#e63946").box(600, 300, l.d / 2 + 11, 120, 190, 2, "#457b9d");
    },
    roof: flat("#6e6a63"),
  },
  mall: {
    shell: { h: 1000, ext: { slot: "concrete", color: "#e8e0cc" }, int: "#f7f3ea", floor: { slot: "tile", color: "#f1ece2" }, trim: "#c08a5b", windows: { y: 600, h: 220, every: 600, w: 420 } },
    sign: { text: "TRI-COUNTY MALL", bg: "#c08a5b", fg: "#ffffff", glow: true, w: 1700, h: 240, y: 760 },
    facade: (b, l) => {
      b.use("glass").box(0, 0, l.d / 2 + 120, 1400, 820, 240, "#bfe3f7");
      b.use("metal").box(0, 820, l.d / 2 + 120, 1440, 20, 260, "#6b7280");
      storefront(b, l, 320, "#6b7280");
      const shops = ["#e63946", "#457b9d", "#2a9d8f", "#f4a261", "#8e44ad", "#1d3557"];
      for (let i = 0; i < 6; i++) {
        const x = -l.w / 2 + 600 + i * ((l.w - 1200) / 5);
        if (Math.abs(x) < 900) continue;
        b.use("gloss").box(x, 360, l.d / 2 + 10, 500, 70, 6, shops[i]);
      }
      // Food court tables and storefronts inside.
      for (let i = 0; i < 5; i++) b.use("gloss").box(-l.w / 2 + 900 + i * 1700, 0, -l.d / 2 + 80, 1200, 340, 100, shops[i]);
    },
    roof: (b, l) => {
      buildFlatRoof(b, l, l.h, "#a7a39b");
      b.use("glass").gable(0, l.h + 16, 0, 1400, 300, l.d * 0.6, "#bfe3f7");
    },
    lot: 2200,
  },
  bowling: {
    shell: { h: 700, ext: { slot: "gloss", color: "#2b4c7e" }, int: "#1b2a44", floor: { slot: "wood", color: "#c99a5b" }, trim: "#ffd166" },
    sign: { text: "STRIKE ZONE LANES", bg: "#e63946", fg: "#ffffff", border: "#ffd166", glow: true, w: 1500, h: 220, y: 480 },
    roof: (b, l) => {
      buildFlatRoof(b, l, l.h, "#6e6a63", 40);
      b.use("gloss").cyl(0, l.h + 16, 0, 120, 160, "#f8fafc", 16, 90);
      b.use("gloss").sphere(0, l.h + 260, 0, 130, "#f8fafc", 1.2);
      b.use("gloss").cyl(0, l.h + 360, 0, 70, 120, "#f8fafc", 16, 85);
      b.use("gloss").sphere(0, l.h + 520, 0, 90, "#f8fafc", 1.1);
      b.use("gloss").torus(0, l.h + 420, 0, 74, 12, "#e63946", { rx: Math.PI / 2 });
    },
    facade: (b, l) => {
      b.use("gloss").wedge(0, l.h - 60, l.d / 2 + 140, l.w + 200, 120, 280, "#ffd166", -Math.PI / 2);
      storefront(b, l, 260, "#1b2a44");
    },
  },
  museum: {
    shell: { h: 900, ext: { slot: "concrete", color: "#efe8d8" }, int: "#f6f1e6", floor: { slot: "tile", color: "#ede7db" }, trim: "#d7cdb8", doorH: 330 },
    sign: { text: "TOY MUSEUM", bg: "#7a2e2e", fg: "#f6e7c1", border: "#f6e7c1", w: 1100, h: 160, y: 1010 },
    facade: (b, l) => columns(b, l, 6, 850),
    roof: pitched("#6b5b4f", 0.25),
  },
  warehouse: {
    shell: { h: 900, ext: { slot: "siding", color: "#9aa7b4" }, int: "#d6d9dc", floor: { slot: "concrete", color: "#c9c5bc" }, trim: "#3b5b7a", doorH: 420 },
    sign: { text: "TOY WAREHOUSE", bg: "#3b5b7a", fg: "#ffffff", w: 1400, h: 200, y: 680 },
    facade: (b, l) => {
      wideDoors(b, l, 5, 380, 420, "#cfd5db");
      for (let i = 0; i < 4; i++) b.use("concrete").box(-l.w / 2 + 600 + i * 900, 0, l.d / 2 + 120, 400, 110, 220, "#bdb8ae");
      b.use("gloss").at(l.w / 2 + 900, 0, l.d / 2 + 900, 0.3, () => {
        b.use("gloss").box(0, 60, 0, 250, 280, 900, "#f1f1f1");
        b.use("gloss").box(0, 60, 560, 240, 240, 220, "#e63946");
        b.use("glass").box(0, 200, 671, 200, 80, 2, "#26323d");
        for (const z of [-300, 300, 560]) for (const s of [-1, 1]) b.use("paint").rod(s * 120, 50, z, 50, 30, "#1d1d1f", 0, 12);
      });
    },
    roof: (b, l) => {
      b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#e6e6e6");
      b.use("metal").gable(0, l.h, 0, l.w + 60, 260, l.d + 60, "#8f9aa5", 0);
    },
    lot: 900,
  },
  recycling: {
    shell: { h: 1300, ext: { slot: "siding", color: "#5f8f6b" }, int: "#cfd8d0", floor: { slot: "concrete", color: "#a8a49b" }, trim: "#2d4a36", doorH: 500 },
    sign: { text: "RECYCLING PLANT", bg: "#2d4a36", fg: "#d8f3dc", w: 1400, h: 200, y: 900 },
    facade: (b, l) => {
      wideDoors(b, l, 3, 520, 520, "#cfd5db");
      b.use("metal").cyl(-l.w / 2 + 400, 0, -l.d / 2 + 400, 160, 2600, "#9aa3ad", 16, 130);
      b.use("metal").cyl(-l.w / 2 + 800, 0, -l.d / 2 + 400, 120, 2200, "#9aa3ad", 16, 100);
      b.use("paint").box(-l.w / 2 + 400, 2400, -l.d / 2 + 400, 330, 60, 330, "#e63946");
      b.use("metal").box(l.w / 2 + 600, 0, 0, 1000, 600, 1200, "#8f9aa5");
      b.use("metal").box(l.w / 2 + 300, 500, 0, 700, 60, 200, "#5c6773", { rz: -0.4 });
    },
    roof: (b, l) => {
      b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#e6e6e6");
      b.use("metal").gable(0, l.h, 0, l.w + 60, 300, l.d + 60, "#6f7c86", 0);
    },
  },
  cityhall: {
    shell: { h: 1100, ext: { slot: "concrete", color: "#ece6d6" }, int: "#f4efe3", floor: { slot: "tile", color: "#e9e2d2" }, trim: "#cfc4ad", doorH: 360, windows: { y: 350, h: 380, every: 500, w: 200 } },
    sign: { text: "CITY HALL", bg: "#ece6d6", fg: "#4a3b2a", w: 1000, h: 150, y: 1220 },
    facade: (b, l) => {
      columns(b, l, 6, 1060);
      for (let i = 0; i < 4; i++) b.use("concrete").box(0, i * 8, l.d / 2 + 380 + i * 50, 1800 - i * 100, 8, 60, "#ddd6c6");
      flag(b, -1400, l.d / 2 + 700, ["#c81d25", "#1d3557"]);
    },
    roof: (b, l) => {
      buildFlatRoof(b, l, l.h, "#8b8378", 80);
      b.use("concrete").box(0, l.h + 16, 0, 700, 900, 700, "#ece6d6");
      b.use("glow").cyl(0, l.h + 600, 352, 180, 6, "#fff8e1", 32, 180, { rx: Math.PI / 2 });
      b.use("paint").box(0, l.h + 600, 356, 10, 140, 4, "#1f2933").box(40, l.h + 640, 356, 90, 10, 4, "#1f2933");
      b.use("gloss").dome(0, l.h + 916, 0, 380, "#4f8a7b", 1);
      b.use("metal").cyl(0, l.h + 1290, 0, 14, 200, "#c9a227", 8, 4);
    },
    lot: 1200,
  },
  police: {
    shell: { h: 700, ext: { slot: "brick", color: "#c7ccd3" }, int: "#eef1f4", floor: { slot: "tile", color: "#dfe4ea" }, trim: "#1d3f8a", windows: { y: 260, h: 220, every: 420, w: 200 } },
    sign: { text: "POLICE", bg: "#1d3f8a", fg: "#ffffff", border: "#ffffff", glow: true, w: 900, h: 180, y: 500 },
    facade: (b, l) => {
      b.use("gloss").box(0, 320, l.d / 2 + 10, l.w, 40, 6, "#1d3f8a");
      flag(b, l.w / 2 - 200, l.d / 2 + 500, ["#1d3557", "#c81d25"]);
      b.at(-l.w / 2 + 600, 0, l.d / 2 + 900, Math.PI / 2, () => {
        b.use("gloss").box(0, 30, 0, 180, 70, 460, "#f8fafc");
        b.use("gloss").box(0, 30, 0, 182, 40, 300, "#1d3f8a");
        b.use("gloss").box(0, 100, -30, 165, 55, 240, "#1f2933");
        b.use("glow").box(-30, 158, -30, 50, 14, 30, "#ff3b30").box(30, 158, -30, 50, 14, 30, "#3b82f6");
        for (const z of [-150, 140]) for (const s of [-1, 1]) b.use("paint").rod(s * 84, 34, z, 33, 24, "#1d1d1f", 0, 12);
      });
    },
    roof: flat("#8b8378"),
  },
  fire: {
    shell: { h: 800, ext: { slot: "brick", color: "#b5523b" }, int: "#f1e6dc", floor: { slot: "concrete", color: "#c9c5bc" }, trim: "#f4f1ea", doorH: 260 },
    sign: { text: "FIRE STATION No. 1", bg: "#f4f1ea", fg: "#a61e1e", border: "#a61e1e", w: 1300, h: 180, y: 600 },
    facade: (b, l) => {
      for (const x of [-1100, -200]) {
        b.use("paint").box(x, 0, l.d / 2 + 9, 700, 500, 4, "#c81d25");
        for (let y = 60; y < 500; y += 70) b.use("glass").box(x, y, l.d / 2 + 11, 640, 30, 2, "#cfe8f7");
      }
      b.use("brick").box(l.w / 2 - 300, 0, -l.d / 2 + 300, 500, 1400, 500, "#b5523b");
      b.use("paint").box(l.w / 2 - 300, 1400, -l.d / 2 + 300, 560, 30, 560, "#f4f1ea");
    },
    roof: flat("#6e6a63"),
  },
  hospital: {
    shell: { h: 1500, ext: { slot: "concrete", color: "#f3f4f6" }, int: "#f5f8fa", floor: { slot: "tile", color: "#e9eef2" }, trim: "#2b7a9e", windows: { y: 300, h: 260, every: 380, w: 260 } },
    sign: { text: "TRI-COUNTY HOSPITAL", bg: "#2b7a9e", fg: "#ffffff", glow: true, w: 1800, h: 200, y: 1150 },
    facade: (b, l) => {
      for (let y = 700; y < 1400; y += 380) for (let x = -l.w / 2 + 300; x < l.w / 2 - 200; x += 380) b.use("glass").box(x, y, l.d / 2 + 8, 260, 240, 3, "#9cc8e6");
      b.use("concrete").box(0, 300, l.d / 2 + 450, 1600, 30, 900, "#f3f4f6");
      for (const x of [-750, 750]) b.use("concrete").box(x, 0, l.d / 2 + 850, 40, 300, 40, "#f3f4f6");
      b.use("glow").box(0, 1300, l.d / 2 + 10, 300, 100, 4, "#e63946").box(0, 1200, l.d / 2 + 10, 100, 300, 4, "#e63946");
    },
    roof: (b, l) => {
      buildFlatRoof(b, l, l.h, "#8b8378");
      b.use("paint").cyl(l.w / 4, l.h + 16, 0, 500, 4, "#2f3a45", 32);
      b.use("glow").box(l.w / 4, l.h + 20, 0, 400, 2, 80, "#f2c14e").box(l.w / 4, l.h + 20, 0, 80, 2, 400, "#f2c14e");
    },
    lot: 1400,
  },
  school: {
    shell: { h: 700, ext: { slot: "brick", color: "#b5523b" }, int: "#f4ead8", floor: { slot: "tile", color: "#ece4d4" }, trim: "#f4f1ea", windows: { y: 160, h: 300, every: 450, w: 320 } },
    sign: { text: "TRI-COUNTY ELEMENTARY", bg: "#f4f1ea", fg: "#1d3557", w: 1600, h: 160, y: 560 },
    facade: (b, l) => {
      flag(b, -l.w / 2 + 300, l.d / 2 + 700, ["#1d3557", "#c81d25"]);
      b.use("paint").box(0, 0, l.d / 2 + 600, 1600, 4, 900, "#4f6fa8");
      b.use("paint").box(0, 4, l.d / 2 + 600, 1500, 1, 20, "#f4f1ea");
    },
    roof: (b, l) => {
      pitched("#3f3b38", 0.25)(b, l);
      b.use("brick").box(0, l.h, l.d / 2 - 250, 300, 900, 300, "#b5523b");
      b.use("paint").box(0, l.h + 600, l.d / 2 - 250, 330, 260, 330, "#f4f1ea");
      b.use("metal").sphere(0, l.h + 700, l.d / 2 - 250, 60, "#c9a227", 1);
      b.use("shingle").cone(0, l.h + 860, l.d / 2 - 250, 260, 300, "#3f3b38", 4);
    },
    lot: 900,
  },
  library: {
    shell: { h: 800, ext: { slot: "brick", color: "#9c6b4e" }, int: "#f3ead9", floor: { slot: "wood", color: "#b07d4f" }, trim: "#efe6d4", windows: { y: 200, h: 400, every: 420, w: 200 } },
    sign: { text: "PUBLIC LIBRARY", bg: "#efe6d4", fg: "#5b3417", w: 1100, h: 150, y: 920 },
    facade: (b, l) => columns(b, l, 4, 760, "#efe6d4"),
    roof: pitched("#4b5a4a", 0.3),
  },
  sheriff: {
    shell: { h: 620, ext: { slot: "planks", color: "#c9a27a" }, int: "#d9b98f", floor: { slot: "wood", color: "#a0703f" } },
    sign: { text: "SHERIFF", bg: "#5b3417", fg: "#f6e7c1", font: WESTERN_FONT, w: 900, h: 170, y: 720 },
    facade: (b, l) => {
      falseFront(b, l, "#c9a27a");
      b.use("paint").box(-500, 260, l.d / 2 + 13, 120, 160, 2, "#f6e7c1").box(500, 260, l.d / 2 + 13, 120, 160, 2, "#f6e7c1");
    },
    roof: flat("#7a5a3a", 0),
  },
  saloon: {
    shell: { h: 820, ext: { slot: "planks", color: "#a8653a" }, int: "#c8925f", floor: { slot: "wood", color: "#8a5a35" } },
    sign: { text: "SALOON", bg: "#2d1a0e", fg: "#f2c14e", font: WESTERN_FONT, w: 1200, h: 200, y: 930 },
    facade: (b, l) => {
      falseFront(b, l, "#a8653a");
      b.use("wood").box(0, 500, l.d / 2 + 160, l.w, 12, 300, "#6b3d1f");
      for (let x = -l.w / 2; x <= l.w / 2; x += 40) b.use("wood").box(x, 512, l.d / 2 + 305, 6, 80, 6, "#6b3d1f");
      for (const s of [-1, 1]) b.use("wood").box((s * l.door!.width) / 4, 80, l.d / 2 + 14, l.door!.width / 2 - 6, 120, 4, "#8a5a35");
    },
    roof: flat("#6b4a2a", 0),
  },
  general: {
    shell: { h: 660, ext: { slot: "planks", color: "#7c9a7a" }, int: "#d9c7a3", floor: { slot: "wood", color: "#a0703f" } },
    sign: { text: "GENERAL STORE", bg: "#f6e7c1", fg: "#7a2e2e", font: WESTERN_FONT, w: 1100, h: 170, y: 760 },
    facade: (b, l) => {
      falseFront(b, l, "#7c9a7a");
      for (let i = 0; i < 5; i++) b.use("planks").box(-l.w / 2 + 200 + i * 120, 24, l.d / 2 + 220, 90, 80, 70, "#c8a165");
      for (let i = 0; i < 3; i++) b.use("wood").cyl(l.w / 2 - 300 + i * 90, 24, l.d / 2 + 220, 35, 95, "#8a5a35", 14, 30);
    },
    roof: flat("#5f5040", 0),
  },
  station: {
    shell: { h: 600, ext: { slot: "planks", color: "#d6b98c" }, int: "#e8d6b5", floor: { slot: "wood", color: "#a0703f" }, trim: "#7a2e2e", windows: { y: 180, h: 200, every: 400, w: 150 } },
    sign: { text: "ROUNDUP STATION", bg: "#7a2e2e", fg: "#f6e7c1", font: WESTERN_FONT, w: 1300, h: 180, y: 640 },
    facade: (b, l) => {
      // Platform and tracks behind the station.
      b.use("wood").box(0, 0, -l.d / 2 - 400, l.w + 2000, 60, 700, "#8a5a35");
      for (let x = -l.w / 2 - 800; x < l.w / 2 + 800; x += 600) b.use("wood").box(x, 60, -l.d / 2 - 700, 14, 320, 14, "#6b3d1f");
      b.use("wood").box(0, 380, -l.d / 2 - 450, l.w + 1800, 14, 640, "#7a2e2e");
    },
    roof: (b, l) => {
      b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#efe9df");
      b.use("shingle").gable(0, l.h, 0, l.w + 400, 300, l.d + 400, "#7a2e2e", Math.PI / 2);
    },
  },
};
export function GenericBuilding({ l }: { l: Landmark }) {
  const style = STYLES[l.kind];
  if (!style) return null;
  const signText = l.id === "depot" ? "SHIPPING DEPOT" : style.sign.text;
  const signW = style.sign.w ?? 1000;
  const signH = style.sign.h ?? 180;
  const signY = style.sign.y ?? style.shell.h - 40 - signH / 2;
  return (
    <LandmarkGroup l={l}>
      <Built
        deps={[l.id]}
        build={(b) => {
          buildShell(b, l, style.shell);
          style.facade?.(b, l);
          buildProps(b, INTERIOR_SOLIDS[l.id] ?? INTERIOR_SOLIDS[l.kind] ?? [], l.x);
          if (style.lot) {
            const z = l.d / 2 + 200 + style.lot / 2;
            const count = Math.floor((l.w - 400) / 280);
            buildParking(b, -l.w / 2 + 340, z, count, 280, Math.min(520, style.lot - 300));
            buildCars(b, -l.w / 2 + 340, z, count, 280, Math.PI, Math.round(l.x));
            buildLamp(b, -l.w / 2 + 100, z, Math.PI / 2);
            buildLamp(b, l.w / 2 - 100, z, -Math.PI / 2);
          }
        }}
      />
      <Roof l={l}>
        <Built deps={[l.id]} build={(b) => (style.roof ?? flat("#8b8378"))(b, l)} />
      </Roof>
      {signText && (
        <Sign
          text={signText}
          position={[0, signY, l.d / 2 + (l.kind === "sheriff" || l.kind === "saloon" || l.kind === "general" ? 16 : l.kind === "museum" || l.kind === "cityhall" || l.kind === "library" ? 350 : 12)]}
          size={[signW, signH]}
          bg={style.sign.bg}
          fg={style.sign.fg}
          border={style.sign.border}
          font={style.sign.font}
          glow={style.sign.glow}
        />
      )}
    </LandmarkGroup>
  );
}
