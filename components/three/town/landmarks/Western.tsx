"use client";

import { landmarkById, type Landmark } from "@/lib/town/config";
import { seededRandom } from "@/lib/world/geometry";
import type { Builder } from "../builder";
import { buildFence, Built, LandmarkGroup, Sign } from "../parts";

const SAND = "#dcb97f";
const ROCK = ["#b8643a", "#a8552f", "#c47a48"];

/** Horse standing on all fours, facing local +z, about 160 cm at the shoulder when s = 1. */
export function buildHorse(b: Builder, x: number, z: number, ry: number, s = 1, coat = "#7a4a24", mane = "#2d1a0e") {
  b.at(x, 0, z, ry, () => {
    b.use("gloss").sphere(0, 130 * s, 0, 48 * s, coat, 0.75, 16);
    b.use("gloss").cbox(0, 120 * s, 0, 70 * s, 62 * s, 150 * s, coat);
    b.use("gloss").cbox(0, 175 * s, 80 * s, 34 * s, 80 * s, 36 * s, coat, { rx: 0.6 });
    b.use("gloss").cbox(0, 205 * s, 115 * s, 28 * s, 30 * s, 62 * s, coat, { rx: 0.25 });
    b.use("paint").box(0, 205 * s, 135 * s, 8 * s, 14 * s, 30 * s, "#f4f1ea");
    b.use("paint").cbox(0, 190 * s, 70 * s, 8 * s, 70 * s, 30 * s, mane, { rx: 0.6 });
    for (const sx of [-1, 1]) b.use("gloss").cone(sx * 10 * s, 222 * s, 95 * s, 6 * s, 16 * s, coat, 6);
    for (const [lx, lz] of [
      [-22, 55],
      [22, 55],
      [-22, -55],
      [22, -55],
    ]) {
      b.use("gloss").cyl(lx * s, 10 * s, lz * s, 9 * s, 90 * s, coat, 8);
      b.use("paint").cyl(lx * s, 0, lz * s, 10 * s, 12 * s, "#2d1a0e", 8);
    }
    b.use("paint").cbox(0, 110 * s, -88 * s, 12 * s, 80 * s, 12 * s, mane, { rx: -0.4 });
  });
}

function cactus(b: Builder, x: number, z: number, h: number) {
  const g = "#4f8a3a";
  b.use("gloss").cyl(x, 0, z, h * 0.09, h, g, 10);
  b.use("gloss").sphere(x, h, z, h * 0.09, g, 1, 10);
  for (const s of [-1, 1]) {
    const ay = h * (0.35 + (s > 0 ? 0.1 : 0));
    b.use("gloss").rod(x + s * h * 0.12, ay, z, h * 0.06, h * 0.22, g);
    b.use("gloss").cyl(x + s * h * 0.22, ay, z, h * 0.06, h * 0.3, g, 8);
    b.use("gloss").sphere(x + s * h * 0.22, ay + h * 0.3, z, h * 0.06, g, 1, 8);
  }
}

function mesa(b: Builder, x: number, z: number, w: number, h: number, seed: number) {
  const r = seededRandom(seed);
  for (let i = 0; i < 4; i++) {
    const tw = w * (1 - i * 0.18);
    b.use("paint").cyl(x + (r() - 0.5) * 300, (i * h) / 4, z + (r() - 0.5) * 300, tw / 2, h / 4 + 2, ROCK[i % 3], 9, tw / 2 - 60);
  }
}

/** Railroad line along the back of town (local z). */
export const TRAIN_Z = 4650;
/** Height of the first carriage roof above the lawn, where riders sit. */
export const TRAIN_ROOF = 410;

/** Steam locomotive and two carriages at the origin, facing local +z, wheels on the rails. */
export function buildTrain(b: Builder) {
  b.use("metal").cyl(0, 230, 200, 110, 600, "#2b2f36", 16, 110, { rx: Math.PI / 2 });
  b.use("gloss").box(0, 120, -250, 260, 380, 300, "#7a2e2e");
  b.use("gloss").box(0, 500, -250, 300, 20, 340, "#2b2f36");
  b.use("metal").cyl(0, 340, 420, 40, 200, "#2b2f36", 12, 70);
  b.use("metal").cone(0, 330, 560, 120, 60, "#c0392b", 4);
  b.use("glow").sphere(0, 300, 505, 26, "#fff3b0", 1, 10);
  b.use("metal").box(0, 40, 100, 220, 60, 800, "#1d1d1f");
  for (const z of [-200, 0, 250, 450]) for (const s of [-1, 1]) b.use("gloss").rod(s * 115, 70, z, z === 0 || z === 250 ? 80 : 50, 14, "#c0392b", 0, 16);
  for (let k = 0; k < 2; k++) {
    const cz = -900 - k * 1000;
    b.use("planks").box(0, 60, cz, 280, 300, 860, k ? "#c08a3e" : "#7a2e2e");
    b.use("wood").box(0, 360, cz, 320, 20, 900, "#3b2412");
    for (let w = -300; w <= 300; w += 150) b.use("glass").box(141, 200, cz + w, 3, 90, 90, "#f6e7c1").box(-141, 200, cz + w, 3, 90, 90, "#f6e7c1");
    for (const z of [-300, 300]) for (const s of [-1, 1]) b.use("paint").rod(s * 115, 50, cz + z, 45, 14, "#2b2f36", 0, 14);
  }
}

function buildWestern(b: Builder, l: Landmark) {
  const r = seededRandom(1958);
  b.use("dirt").box(0, 0, 0, l.w, 1, l.d, SAND);
  // Mesas and boulders around the edge of town.
  for (let i = 0; i < 9; i++) mesa(b, -l.w / 2 + 1500 + i * 3200, -l.d / 2 - 1600 - r() * 1500, 2600 + r() * 1800, 1800 + r() * 1600, i + 1);
  for (let i = 0; i < 4; i++) mesa(b, -l.w / 2 - 2500, -3000 + i * 3000, 3000, 2200 + r() * 1200, i + 20);
  for (let i = 0; i < 40; i++) b.use("paint").sphere(-l.w / 2 + r() * l.w, 20, -l.d / 2 + r() * l.d, 30 + r() * 60, ROCK[i % 3], 0.6, 8);
  for (let i = 0; i < 70; i++) {
    const x = -l.w / 2 + r() * l.w;
    const z = -l.d / 2 + r() * l.d;
    if (Math.abs(z - (17590 - l.z)) < 900 || (Math.abs(z) < 4200 && Math.abs(x) < 9000)) continue;
    cactus(b, x, z, 180 + r() * 260);
  }
  // Tumbleweeds
  for (let i = 0; i < 18; i++) b.use("paint").sphere(-l.w / 2 + r() * l.w, 25, -l.d / 2 + r() * l.d, 25 + r() * 15, "#b08d57", 1, 6);

  // Water tower and windmill.
  b.at(4200, 0, -3300, 0, () => {
    for (const [dx, dz] of [
      [-180, -180],
      [180, -180],
      [-180, 180],
      [180, 180],
    ])
      b.use("wood").box(dx, 0, dz, 26, 900, 26, "#6b3d1f");
    for (const y of [300, 600]) {
      b.use("wood").box(0, y, -180, 380, 14, 14, "#6b3d1f").box(0, y, 180, 380, 14, 14, "#6b3d1f");
      b.use("wood").box(-180, y, 0, 14, 14, 380, "#6b3d1f").box(180, y, 0, 14, 14, 380, "#6b3d1f");
    }
    b.use("planks").cyl(0, 900, 0, 300, 420, "#8a5a35", 20);
    for (const y of [960, 1120, 1260]) b.use("metal").torus(0, y, 0, 302, 6, "#3b4148", { rx: Math.PI / 2 });
    b.use("shingle").cone(0, 1320, 0, 330, 220, "#5b3417", 20);
    b.use("metal").rod(0, 1000, 330, 6, 280, "#3b4148", Math.PI / 2, 8);
  });
  b.at(-9000, 0, -3200, 0, () => {
    for (const s of [-1, 1]) b.use("metal").cbox(s * 80, 450, 0, 10, 920, 10, "#8a929c", { rz: s * 0.08 });
    b.use("metal").box(0, 900, 0, 60, 60, 60, "#8a929c");
    for (let i = 0; i < 12; i++) b.use("metal").cbox(0, 930, 40, 18, 220, 3, "#c0c7cf", { rz: (i / 12) * Math.PI * 2, rx: 0 });
    b.use("metal").box(0, 920, -100, 6, 60, 160, "#c0392b");
  });

  // Railroad along the back; the train itself runs up and down it (see Rides).
  const tz = TRAIN_Z;
  b.use("dirt").box(0, 0, tz, l.w, 12, 380, "#9c8a6a");
  for (let x = -l.w / 2; x < l.w / 2; x += 90) b.use("wood").box(x, 12, tz, 30, 8, 300, "#5b3417");
  for (const s of [-1, 1]) b.use("metal").box(0, 20, tz + s * 72, l.w, 10, 8, "#5c6773");

  // Corral with a trough, hay and two horses.
  const corral = landmarkById.corral;
  const cx = corral.x - l.x;
  const cz = corral.z - l.z;
  const hw = corral.w / 2;
  const hd = corral.d / 2;
  const rail = (ax: number, az: number, bx: number, bz: number) => buildFence(b, ax, az, bx, bz, "#8a5a35", 140, 260);
  rail(cx - hw, cz - hd, cx + hw, cz - hd);
  rail(cx + hw, cz - hd, cx + hw, cz + hd);
  rail(cx - hw, cz + hd, cx + hw, cz + hd);
  rail(cx - hw, cz - hd, cx - hw, cz - 300);
  rail(cx - hw, cz + 300, cx - hw, cz + hd);
  b.use("planks").box(cx + hw - 400, 0, cz, 120, 70, 500, "#6b3d1f");
  b.use("glass").box(cx + hw - 400, 60, cz, 100, 6, 480, "#5fa8d3");
  for (let i = 0; i < 4; i++) b.use("paint").box(cx - 600 + (i % 2) * 140, Math.floor(i / 2) * 70, cz - hd + 200, 130, 70, 90, "#e2c275");
  buildHorse(b, cx + 300, cz - 300, 0.8, 1, "#f4f1ea", "#9aa3ad");
  buildHorse(b, cx - 400, cz + 500, 2.6, 1, "#4a2e1a", "#1d1d1f");

  // Welcome arch over the trail at the east end of town.
  const roadZ = 17590 - l.z;
  b.at(13000, 0, roadZ, 0, () => {
    for (const s of [-1, 1]) b.use("wood").box(0, 0, s * 600, 60, 800, 60, "#6b3d1f");
    b.use("wood").box(0, 760, 0, 80, 60, 1340, "#6b3d1f");
    b.use("planks").box(0, 620, 0, 30, 140, 1000, "#c08a3e");
    b.use("paint").torus(0, 900, 0, 70, 10, "#c9a227", { ry: Math.PI / 2 });
  });
  // Barrels, a wagon and wanted-poster boards along the main street.
  for (let i = 0; i < 8; i++) b.use("wood").cyl(-8000 + i * 2100, 0, roadZ + 700, 38, 95, "#8a5a35", 12, 33);
  b.at(-11000, 0, roadZ - 1100, 0.3, () => {
    b.use("planks").box(0, 60, 0, 220, 70, 420, "#a0703f");
    for (const z of [-140, 140]) for (const s of [-1, 1]) b.use("paint").torus(s * 120, 70, z, 65, 6, "#5b3417", { ry: Math.PI / 2 });
    b.use("paint").cyl(0, 130, 0, 120, 220, "#f4ead2", 16, 115, { rx: Math.PI / 2 });
  });
}

export function Western({ l }: { l: Landmark }) {
  const roadZ = 17590 - l.z;
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildWestern(b, l)} />
      <Sign text="WOODY'S ROUNDUP" position={[13045, 690, roadZ]} rotationY={Math.PI / 2} size={[980, 130]} bg="#c08a3e" fg="#3b2412" font="'Rockwell', 'Georgia', serif" />
      <Sign text="WOODY'S ROUNDUP" position={[12955, 690, roadZ]} rotationY={-Math.PI / 2} size={[980, 130]} bg="#c08a3e" fg="#3b2412" font="'Rockwell', 'Georgia', serif" />
      <Sign text="WATER" position={[4200, 1120, -3300 + 304]} size={[300, 80]} bg="transparent" fg="#f4ead2" />
    </LandmarkGroup>
  );
}
