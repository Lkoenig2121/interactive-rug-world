"use client";

import type { Landmark } from "@/lib/town/config";
import { INTERIOR_SOLIDS, TOY_AISLES } from "@/lib/town/interiors";
import type { Builder } from "../builder";
import { dressBarn } from "../filmSet";
import { buildProps } from "../interiorProps";
import { buildCars, buildLamp, buildParking, buildShell, Built, LandmarkGroup, Roof, Sign } from "../parts";

const BARN = "#b3261e";
const TRIM = "#f6f1e7";
const ROOF = "#4a4642";

/** White X-braced barn door panel on the front wall. */
function barnDoor(b: Builder, x: number, z: number, w: number, h: number) {
  b.use("planks").box(x, 0, z, w, h, 4, "#9c2119");
  b.use("paint").box(x, 0, z + 3, w, 14, 3, TRIM).box(x, h - 14, z + 3, w, 14, 3, TRIM);
  b.use("paint").box(x - w / 2 + 7, 0, z + 3, 14, h, 3, TRIM).box(x + w / 2 - 7, 0, z + 3, 14, h, 3, TRIM);
  const diag = Math.hypot(w, h);
  const a = Math.atan2(w, h);
  b.use("paint").cbox(x, h / 2, z + 4, 14, diag - 20, 3, TRIM, { rz: a }).cbox(x, h / 2, z + 4, 14, diag - 20, 3, TRIM, { rz: -a });
}

/** Gambrel profile: wall top -> knee -> ridge, as (x, y) for the right half. */
function gambrel(l: Landmark) {
  const hw = l.w / 2 + 60;
  const knee = { x: hw * 0.62, y: l.h + 620 };
  const ridge = { x: 0, y: knee.y + 380 };
  return { hw, knee, ridge };
}

function buildRoof(b: Builder, l: Landmark) {
  const { hw, knee, ridge } = gambrel(l);
  const len = l.d + 160;
  b.use("paint").box(0, l.h - 4, 0, l.w, 4, l.d, "#e9dfd0");
  for (const s of [-1, 1]) {
    const seg = (ax: number, ay: number, bx: number, by: number) => {
      const L = Math.hypot(bx - ax, by - ay);
      const rz = Math.atan2(by - ay, bx - ax);
      b.use("shingle").cbox((ax + bx) / 2, (ay + by) / 2, 0, L + 10, 16, len, ROOF, { rz });
    };
    seg(s * hw, l.h, s * knee.x, knee.y);
    seg(s * knee.x, knee.y, 0, ridge.y);
  }
  // Gable ends: rectangle under the knees, the upper triangle and the two side triangles.
  for (const z of [l.d / 2 + 2, -l.d / 2 - 2]) {
    b.use("planks").box(0, l.h, z, knee.x * 2, knee.y - l.h, 14, BARN);
    b.use("planks").gable(0, knee.y, z, knee.x * 2, ridge.y - knee.y, 14, BARN);
    b.use("planks").wedge(-(hw + knee.x) / 2 + 30, l.h, z, hw - knee.x - 60, knee.y - l.h, 14, BARN, Math.PI);
    b.use("planks").wedge((hw + knee.x) / 2 - 30, l.h, z, hw - knee.x - 60, knee.y - l.h, 14, BARN);
  }
  // Hay-loft door and cupola.
  b.use("planks").box(0, l.h + 120, l.d / 2 + 10, 700, 520, 6, "#9c2119");
  b.use("paint").box(0, l.h + 120, l.d / 2 + 14, 740, 16, 4, TRIM).box(0, l.h + 640, l.d / 2 + 14, 740, 16, 4, TRIM);
  b.use("planks").box(0, ridge.y - 60, 0, 600, 400, 600, BARN);
  b.use("shingle").gable(0, ridge.y + 340, 0, 760, 260, 760, ROOF);
  b.use("metal").cyl(0, ridge.y + 600, 0, 6, 260, "#3b4148", 6);
  b.use("metal").box(60, ridge.y + 820, 0, 180, 30, 6, "#3b4148");
}

function buildExterior(b: Builder, l: Landmark) {
  const hw = l.w / 2;
  const hd = l.d / 2;
  buildShell(b, l, { h: l.h, ext: { slot: "planks", color: BARN }, int: "#f4ede2", floor: { slot: "tile", color: "#efe9dc" }, trim: TRIM, doorH: 380 });
  // Corner trim boards, big X doors either side of the entrance and a canopy.
  for (const x of [-hw, hw]) for (const z of [-hd, hd]) b.use("paint").box(x, 0, z, 30, l.h, 30, TRIM);
  barnDoor(b, -1200, hd + 10, 1000, 820);
  barnDoor(b, 1200, hd + 10, 1000, 820);
  b.use("glass").box(0, 0, hd + 9, l.door!.width - 20, 380, 3, "#bfe3f7");
  b.use("paint").cbox(0, 470, hd + 260, 1600, 20, 560, ROOF, { rx: 0.18 });
  for (const x of [-760, 760]) b.use("wood").box(x, 0, hd + 500, 40, 450, 40, "#7a4a24");
  // Silo
  b.use("brick").cyl(hw + 900, 0, -hd + 1400, 700, 2600, "#9e9a91", 28);
  b.use("metal").dome(hw + 900, 2600, -hd + 1400, 720, "#b8bec6", 0.55);
  for (let y = 300; y < 2600; y += 400) b.use("metal").torus(hw + 900, y, -hd + 1400, 705, 8, "#6b7280", { rx: Math.PI / 2 });
  b.use("paint").box(hw + 900, 1300, -hd + 1400 + 700, 600, 260, 20, TRIM);
  // Loading dock and delivery trucks on the side.
  b.use("concrete").box(-hw - 500, 0, -hd + 1600, 1000, 120, 2600, "#bdb8ae");
  for (const [z, color] of [
    [-hd + 900, "#f1f1f1"],
    [-hd + 2300, "#ffc300"],
  ] as const) {
    b.at(-hw - 1700, 0, z, Math.PI / 2, () => {
      b.use("gloss").box(0, 60, -200, 260, 340, 1100, color);
      b.use("gloss").box(0, 60, 500, 250, 260, 300, BARN);
      b.use("glass").box(0, 220, 651, 220, 90, 2, "#26323d");
      b.use("paint").box(0, 200, -200, 262, 120, 900, BARN);
      for (const zz of [-600, 0, 520]) for (const s of [-1, 1]) b.use("paint").rod(s * 125, 52, zz, 52, 34, "#1d1d1f", 0, 12);
    });
  }
  // Parking lot with carts and cart corrals.
  const lotZ = hd + 2300;
  buildParking(b, -hw + 500, lotZ, 31, 280, 520);
  buildCars(b, -hw + 500, lotZ, 31, 280, Math.PI, 9);
  for (const x of [-2500, 2600]) {
    b.use("metal").box(x, 0, lotZ + 900, 800, 90, 6, "#c0c7cf").box(x, 0, lotZ + 1100, 800, 90, 6, "#c0c7cf");
    for (let i = 0; i < 6; i++) buildCart(b, x - 300 + i * 110, lotZ + 1000);
  }
  for (let i = 0; i < 4; i++) buildCart(b, -400 + i * 260, hd + 700 + (i % 2) * 80);
  for (const x of [-hw + 400, 0, hw - 400]) buildLamp(b, x, lotZ + 1500, 0);
  // Hay bales, a giant toy horse, and a pasture of cows beside the lot.
  for (let i = 0; i < 8; i++) b.use("paint").cyl(-hw + 200 + (i % 4) * 240, 0, hd + 350 + Math.floor(i / 4) * 180, 110, 140, "#e2c275", 16, 110, { rx: Math.PI / 2 });
  buildToyHorse(b, hw - 700, hd + 600, 3);
  b.use("grass").box(hw + 2200, 0, 400, 4200, 4, 5200, "#7cb35a");
  for (let i = 0; i < 18; i++) {
    const x = hw + 800 + (i % 6) * 620 + (i % 2) * 80;
    const z = -hd + 400 + Math.floor(i / 6) * 900;
    buildCow(b, x, z, (i % 5) * 0.7);
  }
  for (let i = 0; i < 10; i++) b.use("paint").sphere(hw + 600 + (i % 5) * 700, 80 + (i % 3) * 40, -hd - 400 + Math.floor(i / 5) * 500, 280 + (i % 3) * 80, "#6aa34a", 0.55, 10);
}

/** Holstein cow, about 180 cm tall, facing local +z. */
function buildCow(b: Builder, x: number, z: number, ry: number) {
  b.at(x, 0, z, ry, () => {
    b.use("paint").box(0, 70, 0, 70, 80, 160, "#f4f1ea");
    b.use("paint").box(-10, 90, 10, 40, 40, 50, "#1d1d1f");
    b.use("paint").box(18, 75, -30, 30, 35, 40, "#1d1d1f");
    b.use("paint").box(0, 110, 90, 50, 50, 50, "#f4f1ea");
    b.use("paint").box(0, 95, 130, 36, 28, 40, "#f4f1ea");
    b.use("paint").sphere(-14, 118, 108, 6, "#1d1d1f", 1, 6);
    b.use("paint").sphere(14, 118, 108, 6, "#1d1d1f", 1, 6);
    for (const [lx, lz] of [
      [-22, 50],
      [22, 50],
      [-22, -50],
      [22, -50],
    ])
      b.use("paint").cyl(lx, 0, lz, 10, 70, "#f4f1ea", 8);
    b.use("paint").cbox(0, 90, -90, 8, 50, 8, "#1d1d1f", { rx: 0.5 });
  });
}

/** Shopping cart facing +z. */
export function buildCart(b: Builder, x: number, z: number) {
  b.at(x, 0, z, 0, () => {
    b.use("metal").box(0, 40, 0, 50, 45, 85, "#c0c7cf");
    b.use("gloss").box(0, 84, -46, 52, 6, 6, "#e63946");
    for (const [dx, dz] of [
      [-20, -35],
      [20, -35],
      [-20, 35],
      [20, 35],
    ])
      b.use("paint").sphere(dx, 6, dz, 6, "#1d1d1f", 1, 6);
    b.use("metal").box(0, 10, 0, 40, 4, 80, "#9aa3ad");
  });
}

/** Spring-legged rocking horse (generic, red with a yellow mane). */
export function buildToyHorse(b: Builder, x: number, z: number, s = 1, color = "#8b5a2b") {
  b.at(x, 0, z, Math.PI / 2, () => {
    b.use("gloss").box(0, 60 * s, 0, 34 * s, 36 * s, 80 * s, color);
    b.use("gloss").cbox(0, 112 * s, 44 * s, 24 * s, 50 * s, 26 * s, color, { rx: 0.5 });
    b.use("gloss").box(0, 118 * s, 60 * s, 22 * s, 22 * s, 40 * s, color);
    b.use("paint").box(0, 120 * s, 30 * s, 6 * s, 30 * s, 30 * s, "#f2c14e");
    b.use("paint").box(0, 92 * s, 0, 36 * s, 6 * s, 30 * s, "#c0392b");
    for (const [dx, dz] of [
      [-12, -30],
      [12, -30],
      [-12, 30],
      [12, 30],
    ])
      b.use("gloss").box(dx * s, 0, dz * s, 8 * s, 62 * s, 8 * s, color);
    b.use("paint").cbox(0, 70 * s, -46 * s, 6 * s, 30 * s, 6 * s, "#2d1a0e", { rx: -0.6 });
  });
}

function buildInterior(b: Builder, l: Landmark) {
  buildProps(b, INTERIOR_SOLIDS.toybarn, 21);
  dressBarn(b, l);
  // Giant toys on top of the gondolas and hanging banners.
  b.use("gloss").sphere(-2700, 430, -700, 70, "#8b5a2b", 1.1, 14);
  b.use("gloss").sphere(-2700, 520, -700, 48, "#8b5a2b", 1, 14);
  b.use("gloss").sphere(-2740, 555, -700, 16, "#8b5a2b", 1, 8).sphere(-2660, 555, -700, 16, "#8b5a2b", 1, 8);
  b.use("gloss").cyl(1500, 430, -700, 40, 240, "#f4f4f4", 16);
  b.use("gloss").cone(1500, 670, -700, 40, 90, "#e63946", 16);
  b.use("gloss").sphere(3900, 470, -700, 60, "#3ddc97", 1.4, 14);
  b.use("gloss").sphere(3960, 560, -700, 30, "#3ddc97", 1, 12);
  const banners = ["#e63946", "#ffc300", "#2a9d8f", "#457b9d", "#8e44ad"];
  for (let i = 0; i < 9; i++) b.use("paint").box(-4000 + i * 1000, 900, -1500 + (i % 2) * 900, 300, 220, 4, banners[i % banners.length]);
  // Checkout lane floor stripe and an entrance mat.
  b.use("paint").box(0, 1, 2400, 8000, 1, 160, "#c0392b");
  b.use("paint").box(0, 1, l.d / 2 - 250, 900, 1, 400, "#2b2f36");
}

export function BigBarnToys({ l }: { l: Landmark }) {
  const hd = l.d / 2;
  const { ridge } = gambrel(l);
  return (
    <LandmarkGroup l={l}>
      <Built deps={[l.id]} build={(b) => buildExterior(b, l)} />
      <Built deps={[l.id]} build={(b) => buildInterior(b, l)} castShadow={false} />
      <Roof l={l}>
        <Built deps={[l.id]} build={(b) => buildRoof(b, l)} />
        <Sign text={"AL'S TOY BARN"} position={[0, ridge.y - 180, hd + 28]} size={[2800, 520]} bg="#2563eb" fg="#ffc300" border="#f6f1e7" />
      </Roof>
      <Sign text="TOYS · GAMES · COLLECTIBLES" position={[0, 600, hd + 545]} size={[1500, 140]} bg="#2d1a0e" fg="#ffc300" glow />
      {INTERIOR_SOLIDS.toybarn
        .filter((p) => p.kind === "toyshelf")
        .map((p, i) => (
          <Sign key={p.x} text={TOY_AISLES[i]} position={[p.x, 470, p.z + p.d / 2 + 4]} size={[520, 90]} bg={["#e63946", "#457b9d", "#1b1b3a", "#8b5a2b", "#2a9d8f", "#8e44ad"][i]} fg="#ffffff" glow />
        ))}
      <Sign text="ROUNDUP COLLECTION" position={[0, 300, -1700 + 260]} size={[800, 110]} bg="#8b5a2b" fg="#ffc300" border="#ffc300" glow />
      <Sign text="SPACE RANGERS" position={[-1600, 360, -hd + 50]} size={[700, 80]} bg="#1b3a6e" fg="#ffc300" glow />
      <Sign text="COWBOY CORRAL" position={[1800, 280, -hd + 50]} size={[520, 70]} bg="#8b5a2b" fg="#f6e7c1" />
    </LandmarkGroup>
  );
}
