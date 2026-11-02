import type { InteriorId, Rect } from "./types";

export type FurnitureKind =
  | "desk"
  | "chair"
  | "counter"
  | "roundTable"
  | "table"
  | "shelf"
  | "bookshelf"
  | "coffeeMachine"
  | "pastryCase"
  | "register"
  | "whiteboard"
  | "cabinet"
  | "plant"
  | "lockers"
  | "fireTruck"
  | "pole"
  | "vault"
  | "tellerCounter"
  | "atm"
  | "checkout"
  | "fridge"
  | "cart"
  | "cell"
  | "sofa"
  | "bench"
  | "menuBoard"
  | "poster"
  | "flag"
  | "globe"
  | "produce"
  | "stanchion"
  | "alarmLight"
  | "column"
  | "hoseReel";

export interface FurnitureItem {
  kind: FurnitureKind;
  x: number;
  z: number;
  /** Rotation in radians around y. Furniture faces +z by default. */
  rot?: number;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  text?: string;
  /** Adds a computer on desks/counters. */
  computer?: boolean;
  solid?: boolean;
  /** Hotspot id this item reacts to. */
  toggle?: string;
}

export interface Hotspot {
  id: string;
  x: number;
  z: number;
  label: string;
  message: string;
  /** Persistent toggle (e.g. vault open) vs one-off message. */
  toggles?: boolean;
}

export interface InteriorDef {
  id: InteriorId;
  title: string;
  subtitle: string;
  size: { w: number; d: number; h: number };
  floor: "wood" | "tile" | "concrete" | "marble";
  wallColor: string;
  accent: string;
  doorX: number;
  items: FurnitureItem[];
  hotspots: Hotspot[];
}

const chairsAround = (x: number, z: number, n: number, r = 1.05, color?: string): FurnitureItem[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.PI / 4;
    return { kind: "chair" as const, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, rot: Math.atan2(-Math.cos(a), -Math.sin(a)), color };
  });

export const interiors: Record<InteriorId, InteriorDef> = {
  police: {
    id: "police",
    title: "Police Station",
    subtitle: "Front desk, open-plan office and a (very clean) holding cell",
    size: { w: 16, d: 12, h: 4.2 },
    floor: "tile",
    wallColor: "#dfe6ee",
    accent: "#1d4ed8",
    doorX: 0,
    items: [
      { kind: "counter", x: 0, z: 2.4, w: 5, d: 0.9, color: "#1e3a8a", computer: true, solid: true },
      { kind: "chair", x: 0.8, z: 1.4, rot: 0, color: "#111827" },
      { kind: "alarmLight", x: -1.6, z: 2.4, toggle: "alarm" },
      { kind: "chair", x: 6.9, z: 2.6, rot: -Math.PI / 2, color: "#2563eb" },
      { kind: "chair", x: 6.9, z: 3.6, rot: -Math.PI / 2, color: "#2563eb" },
      { kind: "chair", x: 6.9, z: 4.6, rot: -Math.PI / 2, color: "#2563eb" },
      { kind: "desk", x: -5.5, z: -1.6, computer: true, solid: true },
      { kind: "chair", x: -5.5, z: -0.8, rot: Math.PI, color: "#111827" },
      { kind: "desk", x: -2.5, z: -1.6, computer: true, solid: true },
      { kind: "chair", x: -2.5, z: -0.8, rot: Math.PI, color: "#111827" },
      { kind: "desk", x: 0.5, z: -1.6, computer: true, solid: true },
      { kind: "chair", x: 0.5, z: -0.8, rot: Math.PI, color: "#111827" },
      { kind: "desk", x: -4, z: -4.2, rot: Math.PI, computer: true, solid: true, color: "#6b4f3a" },
      { kind: "chair", x: -4, z: -5, rot: 0, color: "#7f1d1d" },
      { kind: "cabinet", x: -7.4, z: -2.5, rot: Math.PI / 2, solid: true },
      { kind: "cabinet", x: -7.4, z: -3.5, rot: Math.PI / 2, solid: true },
      { kind: "cell", x: 5.6, z: -4.4, w: 4, d: 3, solid: true },
      { kind: "flag", x: -7.2, z: -5.4 },
      { kind: "plant", x: 7.3, z: 5.3 },
      { kind: "plant", x: -7.3, z: 5.3 },
      { kind: "poster", x: 0, z: -5.95, w: 3, h: 1.6, text: "WANTED: LOST SOCK", color: "#fef3c7" },
      { kind: "poster", x: -7.95, z: 2, rot: Math.PI / 2, w: 2.2, h: 1.2, text: "CARPET POLICE", color: "#1d4ed8" },
    ],
    hotspots: [
      { id: "alarm", x: -1.6, z: 3.6, label: "sound the alarm", message: "Wee-woo! All units to the roundabout!", toggles: true },
      { id: "cell", x: 5.6, z: -2.2, label: "check the holding cell", message: "Empty. Carpet World is a peaceful place." },
    ],
  },
  fire: {
    id: "fire",
    title: "Fire Station",
    subtitle: "Engine bay, lockers and the famous brass pole",
    size: { w: 20, d: 14, h: 6 },
    floor: "concrete",
    wallColor: "#ece3d6",
    accent: "#dc2626",
    doorX: 0,
    items: [
      { kind: "fireTruck", x: -3, z: -1, solid: true, toggle: "siren" },
      { kind: "lockers", x: -9.5, z: -2, rot: Math.PI / 2, w: 6, solid: true },
      { kind: "pole", x: 6.5, z: -4.5, solid: true },
      { kind: "table", x: 6, z: 2, w: 3, d: 1.6, color: "#9a6b46", solid: true },
      ...chairsAround(6, 2, 4, 1.4, "#b91c1c"),
      { kind: "bench", x: 3, z: -6.4, w: 4, solid: true },
      { kind: "hoseReel", x: 9.9, z: -1.5, rot: -Math.PI / 2 },
      { kind: "poster", x: -2, z: -6.95, w: 4, h: 1.4, text: "STATION No. 1", color: "#b91c1c" },
      { kind: "plant", x: 9.2, z: 6.2 },
    ],
    hotspots: [
      { id: "siren", x: -3, z: 4.4, label: "switch on the engine lights", message: "Lights flashing! Ready to roll.", toggles: true },
      { id: "pole", x: 6.5, z: -3.2, label: "slide down the pole", message: "Whoosh! You slid down from the dormitory." },
    ],
  },
  school: {
    id: "school",
    title: "Carpet Primary School",
    subtitle: "Classroom 1B with desks, a whiteboard and a globe",
    size: { w: 14, d: 11, h: 4 },
    floor: "wood",
    wallColor: "#f4ead6",
    accent: "#ca8a04",
    doorX: -5,
    items: [
      { kind: "whiteboard", x: 0, z: -5.45, w: 5, h: 1.8, toggle: "board" },
      { kind: "desk", x: -3.8, z: -3.4, color: "#7c5a3c", solid: true },
      { kind: "chair", x: -3.8, z: -4.2, rot: 0, color: "#1f2937" },
      { kind: "globe", x: -3.3, z: -3.4 },
      ...[-3, 0, 3].flatMap((x) =>
        [-1.2, 0.8, 2.8].flatMap((z) => [
          { kind: "desk" as const, x, z, w: 1.3, d: 0.65, color: "#d6b98c", solid: true },
          { kind: "chair" as const, x, z: z + 0.65, rot: Math.PI, color: ["#ef4444", "#3b82f6", "#22c55e"][(x + 3) / 3] },
        ]),
      ),
      { kind: "bookshelf", x: 6.6, z: -2, rot: -Math.PI / 2, w: 3, solid: true },
      { kind: "bookshelf", x: 6.6, z: 1.4, rot: -Math.PI / 2, w: 3, solid: true },
      { kind: "poster", x: -6.95, z: -1, rot: Math.PI / 2, w: 4.5, h: 0.9, text: "A B C D E F G", color: "#fde68a" },
      { kind: "plant", x: 6.3, z: 4.8 },
    ],
    hotspots: [
      { id: "board", x: 0, z: -3.9, label: "write on the whiteboard", message: "Today's lesson: how to build a rug city.", toggles: true },
    ],
  },
  bank: {
    id: "bank",
    title: "Carpet Savings Bank",
    subtitle: "Marble hall, teller windows and the vault",
    size: { w: 16, d: 12, h: 5 },
    floor: "marble",
    wallColor: "#efe6d2",
    accent: "#047857",
    doorX: 0,
    items: [
      { kind: "tellerCounter", x: -1, z: -1.6, w: 9, solid: true },
      { kind: "chair", x: -4, z: -2.6, rot: 0, color: "#064e3b" },
      { kind: "chair", x: -1, z: -2.6, rot: 0, color: "#064e3b" },
      { kind: "chair", x: 2, z: -2.6, rot: 0, color: "#064e3b" },
      { kind: "vault", x: 5, z: -5.9, toggle: "vault" },
      { kind: "atm", x: 7.6, z: 2, rot: -Math.PI / 2, solid: true },
      { kind: "sofa", x: -6.2, z: 3.4, rot: Math.PI / 2, color: "#14532d", solid: true },
      { kind: "column", x: -4.5, z: 2.5, solid: true },
      { kind: "column", x: 4.5, z: 2.5, solid: true },
      { kind: "stanchion", x: -2.2, z: 1.2, w: 2 },
      { kind: "stanchion", x: -0.2, z: 1.2, w: 2 },
      { kind: "stanchion", x: 1.8, z: 1.2 },
      { kind: "plant", x: -7.3, z: -5.3 },
      { kind: "plant", x: 7.3, z: 5.3 },
      { kind: "poster", x: -3, z: -5.95, w: 3.2, h: 1, text: "CARPET SAVINGS", color: "#065f46" },
    ],
    hotspots: [
      { id: "vault", x: 5, z: -4.2, label: "open the vault", message: "The vault swings open. Thousands of shiny carpet coins!", toggles: true },
      { id: "atm", x: 6.6, z: 2, label: "use the ATM", message: "Balance: 1,000,000 carpet coins." },
    ],
  },
  coffee: {
    id: "coffee",
    title: "Rug & Mug Coffee",
    subtitle: "Counter, espresso machine and cosy tables",
    size: { w: 12, d: 10, h: 3.8 },
    floor: "wood",
    wallColor: "#e9d8c2",
    accent: "#92400e",
    doorX: 0,
    items: [
      { kind: "counter", x: -0.5, z: -3.2, w: 7, d: 0.9, color: "#5b3a29", solid: true },
      { kind: "coffeeMachine", x: -2.8, z: -3.25, toggle: "brew" },
      { kind: "register", x: 0.4, z: -3.0 },
      { kind: "pastryCase", x: 2, z: -3.2 },
      { kind: "menuBoard", x: -0.5, z: -4.95, w: 4, h: 1.4 },
      { kind: "roundTable", x: -3.4, z: 1, solid: true },
      ...chairsAround(-3.4, 1, 3, 1.0, "#78350f"),
      { kind: "roundTable", x: 0.4, z: 1.6, solid: true },
      ...chairsAround(0.4, 1.6, 2, 1.0, "#78350f"),
      { kind: "roundTable", x: 3.6, z: 0, solid: true },
      ...chairsAround(3.6, 0, 3, 1.0, "#78350f"),
      { kind: "sofa", x: 5.2, z: 3.2, rot: -Math.PI / 2, color: "#9a3412", solid: true },
      { kind: "plant", x: -5.3, z: 4.2 },
      { kind: "plant", x: 5.3, z: -4.2 },
    ],
    hotspots: [
      { id: "brew", x: -2.8, z: -2, label: "brew a coffee", message: "One tiny espresso, coming right up.", toggles: true },
      { id: "pastry", x: 2, z: -2, label: "buy a cinnamon roll", message: "Delicious. Crumbs all over the carpet." },
    ],
  },
  supermarket: {
    id: "supermarket",
    title: "FreshMart Supermarket",
    subtitle: "Aisles, fridges, produce and checkouts",
    size: { w: 22, d: 16, h: 5 },
    floor: "tile",
    wallColor: "#f2f2ec",
    accent: "#16a34a",
    doorX: 4,
    items: [
      ...[-8, -4, 0, 4].map((x) => ({ kind: "shelf" as const, x, z: -1.8, rot: Math.PI / 2, w: 7, solid: true })),
      ...[-8, -4, 0, 4].map((x) => ({ kind: "fridge" as const, x, z: -7.5, w: 3.6, solid: true })),
      { kind: "produce", x: 8.6, z: -2, solid: true },
      { kind: "produce", x: 8.6, z: 1.2, solid: true },
      { kind: "checkout", x: -6, z: 4.6, solid: true, toggle: "scan" },
      { kind: "checkout", x: -2, z: 4.6, solid: true },
      { kind: "cart", x: 9, z: 6.4, rot: Math.PI / 2 },
      { kind: "cart", x: 9, z: 5.4, rot: Math.PI / 2 },
      { kind: "plant", x: -10.2, z: 7.2 },
      { kind: "poster", x: 0, z: -7.95, w: 6, h: 1.1, text: "FRESHMART", color: "#16a34a" },
    ],
    hotspots: [
      { id: "scan", x: -6, z: 6, label: "scan your groceries", message: "Beep! Total: 3 carpet coins. Thank you!" },
      { id: "produce", x: 7.2, z: -0.4, label: "pick an apple", message: "A shiny red apple. Crunch!" },
    ],
  },
};

export function furnitureFootprint(it: FurnitureItem): Rect | null {
  if (!it.solid) return null;
  const size: Record<string, [number, number]> = {
    desk: [it.w ?? 1.6, it.d ?? 0.8],
    counter: [it.w ?? 3, it.d ?? 0.9],
    roundTable: [1.1, 1.1],
    table: [it.w ?? 2, it.d ?? 1],
    shelf: [it.w ?? 6, 1],
    bookshelf: [it.w ?? 3, 0.5],
    cabinet: [0.6, 0.7],
    lockers: [it.w ?? 6, 0.7],
    fireTruck: [2.8, 9],
    pole: [0.4, 0.4],
    tellerCounter: [it.w ?? 9, 1],
    atm: [0.9, 0.8],
    checkout: [1.2, 2.6],
    fridge: [it.w ?? 3.6, 1],
    cell: [it.w ?? 4, it.d ?? 3],
    sofa: [2.4, 1],
    bench: [it.w ?? 3, 0.6],
    produce: [1.6, 2.6],
    column: [0.9, 0.9],
  };
  const s = size[it.kind];
  if (!s) return null;
  const rotated = Math.abs(Math.sin(it.rot ?? 0)) > 0.7;
  const w = rotated ? s[1] : s[0];
  const d = rotated ? s[0] : s[1];
  return { minX: it.x - w / 2, maxX: it.x + w / 2, minZ: it.z - d / 2, maxZ: it.z + d / 2 };
}
