"use client";

import { drainpipe, PIPE_HOUSES, RIDGE_Y, ROOF_BRIDGES, ROOF_ROW, ZIPLINE } from "@/lib/explore/rooftops";
import { EXT_Y } from "@/lib/house/layout";
import { HOUSE_H } from "@/lib/house/neighbors";
import type { Builder } from "../town/builder";
import { Built } from "../town/parts";

/** Telephone wires and yardstick bridges from ridge to ridge (solid, so you can walk them). */
function buildBridges(b: Builder) {
  for (const br of ROOF_BRIDGES) {
    const dx = br.bx - br.ax;
    const dz = br.bz - br.az;
    const len = Math.hypot(dx, dz);
    const ry = Math.atan2(-dz, dx);
    b.at((br.ax + br.bx) / 2, 0, (br.az + br.bz) / 2, ry, () => {
      if (br.kind === "wire") {
        b.use("paint").rod(0, RIDGE_Y - 4, 0, 4, len, "#1d1d1f");
        for (const s of [-1, 1]) {
          b.use("metal").cyl(s * (len / 2 - 10), RIDGE_Y - 40, 0, 4, 46, "#6b7280", 8);
          b.use("gloss").cyl(s * (len / 2 - 10), RIDGE_Y - 2, 0, 6, 8, "#3a86ff", 10);
        }
      } else {
        b.use("wood").box(0, RIDGE_Y - 4, 0, len, 4, br.width, "#f4c430");
        for (let i = 1; i * 10 < len; i++) b.use("paint").box(-len / 2 + i * 10, RIDGE_Y, -br.width / 2 + 4, 1, 0.4, i % 5 === 0 ? 8 : 5, "#1d1d1f");
        b.use("paint").box(0, RIDGE_Y, 4, 60, 0.4, 6, "#c0392b");
      }
      b.solid(0, 0, len, br.width, RIDGE_Y - 14, RIDGE_Y);
    });
  }
}

/** Drainpipes up the front of a few houses, and the clothesline zipline at the end of the row. */
function buildPipes(b: Builder) {
  for (const i of PIPE_HOUSES) {
    const p = drainpipe(i);
    const r = ROOF_ROW[i];
    b.use("paint").box(p.x, EXT_Y + 20, p.z, 10, HOUSE_H - 40, 10, "#f4f4f0");
    b.use("paint").box(p.x, EXT_Y, p.z - 10, 26, 16, 30, "#f4f4f0");
    b.use("paint").box(r.bodyX, EXT_Y + HOUSE_H - 24, p.z + 6, r.spec.w, 14, 16, "#f4f4f0");
    for (let y = EXT_Y + 120; y < EXT_Y + HOUSE_H - 60; y += 200) b.use("metal").box(p.x, y, p.z + 6, 14, 4, 4, "#9aa3ad");
  }
  const { top, bottom } = ZIPLINE;
  const poleTop = bottom.y + 180;
  b.use("metal").cyl(bottom.x, bottom.y, bottom.z, 6, 180, "#8a929c", 10);
  b.use("metal").cyl(top.x, top.y, top.z, 4, 40, "#8a929c", 8);
  const dx = bottom.x - top.x;
  const dz = bottom.z - top.z;
  const flat = Math.hypot(dx, dz);
  const drop = top.y + 36 - poleTop;
  const len = Math.hypot(flat, drop);
  b.at((top.x + bottom.x) / 2, 0, (top.z + bottom.z) / 2, Math.atan2(-dz, dx), () => {
    b.use("paint").cbox(0, (top.y + 36 + poleTop) / 2, 0, len, 2, 2, "#f8f9fa", { rz: -Math.atan2(drop, flat) });
    // A clothes peg handle waiting at the top, with a sock still pinned on.
    b.use("wood").cbox(-flat / 2 + 30, top.y + 26, 0, 8, 22, 6, "#c8a165");
    b.use("paint").cbox(-flat / 2 + 80, top.y + 10, 0, 18, 30, 4, "#e63946", { rz: 0.2 });
  });
}

export function Rooftops() {
  return (
    <group>
      <Built deps={["roof-bridges"]} build={buildBridges} />
      <Built deps={["roof-pipes"]} build={buildPipes} />
    </group>
  );
}
