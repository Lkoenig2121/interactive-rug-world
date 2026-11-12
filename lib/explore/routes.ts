import { EAVE_Y, EXT_Y, UPPER_Y } from "../house/layout";
import { BARN_DUCT_Y, landmarkById, SID_UPSTAIRS_Y, toWorld } from "../town/config";

/** Toy-sized secret passages: press E at `from` to pop out at `to`. */
export interface Passage {
  id: string;
  kind: "vent" | "ladder";
  label: string;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  /** Facing on arrival. */
  yaw: number;
  /** Draw a grille here (vents in walls/floors) or a ladder. */
  draw: boolean;
}

function local(id: string, lx: number, lz: number, y: number) {
  const p = toWorld(landmarkById[id], lx, lz);
  return { x: p.x, y, z: p.z };
}

const sid = landmarkById.sid;
const barn = landmarkById.toybarn;

export const PASSAGES: Passage[] = [
  // Andy's room <-> attic
  { id: "andy-vent", kind: "vent", label: "Crawl into the air vent", from: { x: -420, y: UPPER_Y, z: 470 }, to: { x: -300, y: EAVE_Y, z: 200 }, yaw: Math.PI, draw: true },
  { id: "attic-vent", kind: "vent", label: "Drop back into Andy's room", from: { x: -420, y: EAVE_Y, z: 300 }, to: { x: -360, y: UPPER_Y, z: 420 }, yaw: 0, draw: true },

  // Sid's house: ladder up to the loft and back
  { id: "sid-up", kind: "ladder", label: "Climb up to Sid's loft", from: local("sid", 600, 30, EXT_Y), to: local("sid", 600, -260, SID_UPSTAIRS_Y), yaw: sid.rot + Math.PI, draw: true },
  { id: "sid-down", kind: "ladder", label: "Climb down", from: local("sid", 600, -150, SID_UPSTAIRS_Y), to: local("sid", 600, 80, EXT_Y), yaw: sid.rot, draw: false },

  // Toy Barn: vent into the locked storeroom, ladder up to the ceiling duct, and back down
  { id: "barn-vent", kind: "vent", label: "Squeeze through the vent", from: local("toybarn", 1800, -2420, EXT_Y), to: local("toybarn", 3000, -2780, EXT_Y), yaw: barn.rot - Math.PI / 2, draw: true },
  { id: "store-vent", kind: "vent", label: "Vent back to the shop floor", from: local("toybarn", 4300, -2680, EXT_Y), to: local("toybarn", 1800, -2330, EXT_Y), yaw: barn.rot, draw: true },
  { id: "store-ladder", kind: "ladder", label: "Climb into the ceiling duct", from: local("toybarn", 2150, -2780, EXT_Y), to: local("toybarn", 1650, -2800, BARN_DUCT_Y), yaw: barn.rot + Math.PI / 2, draw: true },
  { id: "duct-east", kind: "ladder", label: "Climb down to the storeroom", from: local("toybarn", 1820, -2800, BARN_DUCT_Y), to: local("toybarn", 2450, -2780, EXT_Y), yaw: barn.rot - Math.PI / 2, draw: false },
  { id: "duct-west", kind: "vent", label: "Drop down to the shop floor", from: local("toybarn", -4180, -2800, BARN_DUCT_Y), to: local("toybarn", -4150, -2330, EXT_Y), yaw: barn.rot, draw: true },
];

export const PASSAGE_REACH = 70;
