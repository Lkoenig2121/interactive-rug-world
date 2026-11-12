import { EAVE_Y, EXT_Y, HOUSE, SHELL } from "../house/layout";
import { GARAGE, HOUSE_H, NEIGHBOR_HOUSES, neighborLayout, ROOF_RISE } from "../house/neighbors";
import type { WallSegment } from "../house/walkable";
import { LANDMARKS, landmarkById, toLocal, toWorld } from "./config";

/**
 * Solid things you can bump into, stand on and land on: buildings, neighbor houses and tall props.
 * Each is a box (or a round tower) in its own frame, with walls up to `wallTop` and a roof on top
 * that is either flat or a gable rising toward a ridge.
 */
export interface Block {
  frame: { x: number; z: number; rot: number };
  /** Half extents in the frame (box), or a radius (round). */
  hw: number;
  hd: number;
  round?: boolean;
  wallTop: number;
  /** Where the walls start (defaults to just below the lawn), for parts sitting on something else. */
  wallBottom?: number;
  /** Gable roof: height rises by `rise` toward the ridge, measured across local `across`. */
  ridge?: { across: "x" | "z"; half: number; rise: number };
  /** Walls are already covered elsewhere (landmark shells, Andy's house). */
  noWalls?: boolean;
  /** Over this inner area the roof only counts once you're above its surface (Andy's attic sits under it). */
  strictInner?: { hw: number; hd: number };
}

const block = (x: number, z: number, rot: number, w: number, d: number, wallTop: number, extra: Partial<Block> = {}): Block => ({
  frame: { x, z, rot },
  hw: w / 2,
  hd: d / 2,
  wallTop,
  ...extra,
});

const tower = (x: number, z: number, r: number, wallTop: number): Block => ({ frame: { x, z, rot: 0 }, hw: r, hd: r, round: true, wallTop });

function landmarkBlocks(): Block[] {
  const out: Block[] = [];
  for (const l of LANDMARKS) {
    if (!l.solid || l.kind === "plane") continue;
    const top = EXT_Y + Math.max(l.h, 300);
    // The Toy Barn's tall gambrel roof peaks along its length.
    const ridge = l.kind === "toybarn" ? { across: "x" as const, half: l.w / 2 + 60, rise: 1000 } : undefined;
    out.push(block(l.x, l.z, l.rot, l.w, l.d, top, { ridge, noWalls: true }));
  }
  return out;
}

function propBlocks(): Block[] {
  const out: Block[] = [];
  const at = (id: string, lx: number, lz: number) => toWorld(landmarkById[id], lx, lz);
  const pizza = landmarkById.pizza;
  const rocket = at("pizza", -pizza.w / 2 - 900, pizza.d / 2 + 200);
  out.push(tower(rocket.x, rocket.z, 300, EXT_Y + 2560));
  const gantry = at("pizza", -pizza.w / 2 - 1420, pizza.d / 2 + 200);
  out.push(block(gantry.x, gantry.z, pizza.rot, 560, 560, EXT_Y + 2400));
  const barn = landmarkById.toybarn;
  const silo = at("toybarn", barn.w / 2 + 900, -barn.d / 2 + 1400);
  out.push(tower(silo.x, silo.z, 710, EXT_Y + 2950));
  const term = landmarkById.terminal;
  const ctower = at("terminal", -term.w / 2 - 1500, -500);
  out.push(tower(ctower.x, ctower.z, 560, EXT_Y + 3700));
  const water = at("western", 4200, -3300);
  out.push(tower(water.x, water.z, 330, EXT_Y + 1540));
  return out;
}

function neighborBlocks(): Block[] {
  const out: Block[] = [];
  for (const h of NEIGHBOR_HOUSES) {
    const { cz, bodyX, garage } = neighborLayout(h);
    out.push(block(bodyX, cz, 0, h.w, h.d, EXT_Y + HOUSE_H, { ridge: { across: "z", half: h.d / 2 + 50, rise: ROOF_RISE } }));
    out.push(block(garage.x, garage.z, 0, GARAGE.w, GARAGE.d, EXT_Y + GARAGE.h, { ridge: { across: "z", half: GARAGE.d / 2 + 40, rise: GARAGE.rise } }));
  }
  return out;
}

/** Andy's main roof (ridge along x); the inside of the house keeps its own floors and attic. */
function andyRoof(): Block {
  const w = HOUSE.x1 - HOUSE.x0 + 2 * SHELL + 100;
  const d = HOUSE.z1 - HOUSE.z0 + 2 * SHELL + 100;
  const strictInner = { hw: (HOUSE.x1 - HOUSE.x0) / 2 - 80, hd: (HOUSE.z1 - HOUSE.z0) / 2 - 120 };
  return block((HOUSE.x0 + HOUSE.x1) / 2, (HOUSE.z0 + HOUSE.z1) / 2, 0, w, d, EAVE_Y, { ridge: { across: "z", half: d / 2, rise: 380 }, noWalls: true, strictInner });
}

export const BLOCKS: Block[] = [andyRoof(), ...landmarkBlocks(), ...propBlocks(), ...neighborBlocks()];

/** Local position inside a block's frame, or null when outside its footprint. */
function local(b: Block, x: number, z: number) {
  const p = toLocal(b.frame, { x, z });
  if (b.round) return Math.hypot(p.x, p.z) <= b.hw ? p : null;
  return Math.abs(p.x) <= b.hw && Math.abs(p.z) <= b.hd ? p : null;
}

/** Roof surface height at a local point. */
function roofAt(b: Block, p: { x: number; z: number }) {
  if (!b.ridge) return b.wallTop;
  const d = Math.abs(b.ridge.across === "x" ? p.x : p.z);
  return b.wallTop + b.ridge.rise * Math.max(0, 1 - d / b.ridge.half);
}

const CELL = 3000;
const grid = new Map<string, Block[]>();

function cellsOf(b: Block) {
  const r = b.round ? b.hw : Math.hypot(b.hw, b.hd);
  const keys: string[] = [];
  for (let i = Math.floor((b.frame.x - r) / CELL); i <= Math.floor((b.frame.x + r) / CELL); i++)
    for (let j = Math.floor((b.frame.z - r) / CELL); j <= Math.floor((b.frame.z + r) / CELL); j++) keys.push(`${i},${j}`);
  return keys;
}

function insert(b: Block) {
  for (const key of cellsOf(b)) {
    const list = grid.get(key);
    if (list) list.push(b);
    else grid.set(key, [b]);
  }
}
BLOCKS.forEach(insert);

/** Adds blocks found at runtime (parked cars, poles); returns a function that removes them again. */
export function addBlocks(list: Block[]) {
  list.forEach(insert);
  return () => {
    const gone = new Set(list);
    const keys = new Set(list.flatMap(cellsOf));
    for (const key of keys) {
      const cell = grid.get(key);
      if (cell) grid.set(key, cell.filter((b) => !gone.has(b)));
    }
  };
}

/**
 * Roof height under (x, z) for something at height `y`, or null when it's not on a roof.
 * Anything above a block's walls is on its roof, so flying into a pitched roof from the side lands you on it.
 */
export function roofHeight(x: number, z: number, y: number): number | null {
  const list = grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
  if (!list) return null;
  let best: number | null = null;
  for (const b of list) {
    const p = local(b, x, z);
    if (!p) continue;
    const top = roofAt(b, p);
    const s = b.strictInner;
    const strict = s && Math.abs(p.x) <= s.hw && Math.abs(p.z) <= s.hd;
    const on = strict ? y > top - 40 : y >= b.wallTop - 20;
    if (on && (best === null || top > best)) best = top;
  }
  return best;
}

/** Wall segments around every block that doesn't already have walls. */
export function blockWalls(blocks: Block[] = BLOCKS): WallSegment[] {
  const out: WallSegment[] = [];
  for (const b of blocks) {
    if (b.noWalls) continue;
    const pts: { x: number; z: number }[] = [];
    if (b.round) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        pts.push({ x: b.frame.x + Math.sin(a) * b.hw, z: b.frame.z + Math.cos(a) * b.hw });
      }
    } else {
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ])
        pts.push(toWorld(b.frame, sx * b.hw, sz * b.hd));
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % pts.length];
      out.push({ ax: a.x, az: a.z, bx: c.x, bz: c.z, y0: b.wallBottom ?? EXT_Y - 20, y1: b.wallTop });
    }
  }
  return out;
}
