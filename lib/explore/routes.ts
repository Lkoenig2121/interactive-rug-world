import { EAVE_Y, EXT_Y, GROUND_Y, HOUSE, SHELL, UPPER_Y } from "../house/layout";
import { roofHeight } from "../town/blocks";
import { BARN_DUCT_Y, landmarkById, toWorld } from "../town/config";
import { SUNNY_DUCT } from "../town/interiors";

/** Toy-sized secret passages: press E at `from` to pop out at `to`. */
export interface Passage {
  id: string;
  kind: "vent" | "ladder" | "slot" | "petdoor" | "dryer" | "gutter" | "door";
  label: string;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  /** Facing on arrival. */
  yaw: number;
  /** Draw a grille here (vents in walls/floors) or a ladder. Shortcuts through walls are drawn separately. */
  draw: boolean;
  /** Shown on arrival. */
  toast?: string;
  /** How close you need to be (defaults to PASSAGE_REACH); smaller where two passages share a doorway. */
  reach?: number;
}

/** Facing yaws (the toy looks along (-sin, -cos) of its yaw). */
const FACE_N = 0;
const FACE_S = Math.PI;
const FACE_E = -Math.PI / 2;
const FACE_W = Math.PI / 2;

/** Where the toy-scale shortcuts on Andy's house sit, shared with the drawings. */
export const SHORTCUTS = {
  /** Mail slot in the front door (front wall at z = HOUSE.z1). */
  mailX: -800,
  /** Where to stand to open the front door (by its handle) and the back slider. */
  frontDoorX: -735,
  backDoorX: 120,
  /** Pet door in the kitchen's back wall (z = HOUSE.z0), onto the patio. */
  petX: -300,
  /** Dryer vent low in the kitchen's east wall (x = HOUSE.x1). */
  dryerZ: -400,
  /** Drainpipe at the front-right corner, and the gutter along the front eave. */
  spout: { x: HOUSE.x1 + SHELL + 10, z: HOUSE.z1 + SHELL + 10 },
  gutterZ: HOUSE.z1 + SHELL + 56,
  /** Dog flap in Sid's back wall, in Sid's local space. */
  sidPetX: 250,
};

const ROOF_EDGE_Z = HOUSE.z1 - 50;

/** A spot on Andy's roof (main roof or the front cross gable, whichever is higher there). */
function roof(x: number, lift = 0) {
  return { x, y: (roofHeight(x, ROOF_EDGE_Z, Infinity) ?? EAVE_Y + 50) + lift, z: ROOF_EDGE_Z };
}

function local(id: string, lx: number, lz: number, y: number) {
  const p = toWorld(landmarkById[id], lx, lz);
  return { x: p.x, y, z: p.z };
}

const sid = landmarkById.sid;
const barn = landmarkById.toybarn;

/** Floor vent in a room, the duct spot it leads to, and the hatch back down from the duct. */
const SUNNY_ROOMS = [
  { id: "butterfly", room: "the Butterfly Room", vent: -1900, up: -2450, hatch: -2650, down: { x: -2300, z: -1400 } },
  { id: "storage", room: "the storage room", vent: 400, up: 250, hatch: 0, down: { x: -150, z: -1350 } },
  { id: "caterpillar", room: "the Caterpillar Room", vent: 2350, up: 2450, hatch: 2650, down: { x: 2600, z: -1350 } },
];

function sunnyVents(): Passage[] {
  const l = landmarkById.daycare;
  const ductY = EXT_Y + SUNNY_DUCT.h;
  const ductZ = (SUNNY_DUCT.z0 + SUNNY_DUCT.z1) / 2;
  const ventZ = -1480;
  // Along the duct is local x; facing along it in world terms depends on the building's turn.
  const alongDuct = (dir: 1 | -1) => l.rot + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
  return SUNNY_ROOMS.flatMap((r): Passage[] => [
    {
      id: `sunny-${r.id}-up`,
      kind: "vent",
      label: "Crawl up into the air vent",
      from: local("daycare", r.vent, ventZ, EXT_Y),
      to: local("daycare", r.up, ductZ, ductY),
      yaw: alongDuct(r.up < 0 ? 1 : -1),
      draw: true,
      toast: "Into the ceiling vents! Sneak along and drop into another room.",
    },
    {
      id: `sunny-${r.id}-down`,
      kind: "vent",
      label: `Drop down into ${r.room}`,
      from: local("daycare", r.hatch, ductZ, ductY),
      to: local("daycare", r.down.x, r.down.z, EXT_Y),
      yaw: l.rot + Math.PI,
      draw: false,
      reach: 90,
    },
  ]);
}

export const PASSAGES: Passage[] = [
  // Andy's room <-> attic
  { id: "andy-vent", kind: "vent", label: "Crawl into the air vent", from: { x: -420, y: UPPER_Y, z: 470 }, to: { x: -300, y: EAVE_Y, z: 200 }, yaw: Math.PI, draw: true },
  { id: "attic-vent", kind: "vent", label: "Drop back into Andy's room", from: { x: -420, y: EAVE_Y, z: 300 }, to: { x: -360, y: UPPER_Y, z: 420 }, yaw: 0, draw: true },

  // Toy Barn: vent into the locked storeroom, ladder up to the ceiling duct, and back down
  { id: "barn-vent", kind: "vent", label: "Squeeze through the vent", from: local("toybarn", 1800, -2420, EXT_Y), to: local("toybarn", 3000, -2780, EXT_Y), yaw: barn.rot - Math.PI / 2, draw: true },
  { id: "store-vent", kind: "vent", label: "Vent back to the shop floor", from: local("toybarn", 4300, -2680, EXT_Y), to: local("toybarn", 1800, -2330, EXT_Y), yaw: barn.rot, draw: true },
  { id: "store-ladder", kind: "ladder", label: "Climb into the ceiling duct", from: local("toybarn", 2150, -2780, EXT_Y), to: local("toybarn", 1650, -2800, BARN_DUCT_Y), yaw: barn.rot + Math.PI / 2, draw: true },
  { id: "duct-east", kind: "ladder", label: "Climb down to the storeroom", from: local("toybarn", 1820, -2800, BARN_DUCT_Y), to: local("toybarn", 2450, -2780, EXT_Y), yaw: barn.rot - Math.PI / 2, draw: false },
  { id: "duct-west", kind: "vent", label: "Drop down to the shop floor", from: local("toybarn", -4180, -2800, BARN_DUCT_Y), to: local("toybarn", -4150, -2330, EXT_Y), yaw: barn.rot, draw: true },

  // Sunnyside: floor vents in three rooms lead up into the ceiling duct along the back wall.
  ...sunnyVents(),

  // Andy's house: the front and back doors are closed; open them with E.
  {
    id: "front-in",
    kind: "door",
    label: "Open the front door",
    from: { x: SHORTCUTS.frontDoorX, y: GROUND_Y, z: HOUSE.z1 + 80 },
    to: { x: SHORTCUTS.mailX, y: GROUND_Y, z: HOUSE.z1 - 120 },
    yaw: FACE_N,
    draw: false,
    toast: "Inside Andy's house.",
    reach: 45,
  },
  {
    id: "front-out",
    kind: "door",
    label: "Open the front door",
    from: { x: SHORTCUTS.frontDoorX, y: GROUND_Y, z: HOUSE.z1 - 70 },
    to: { x: SHORTCUTS.mailX, y: GROUND_Y, z: HOUSE.z1 + 130 },
    yaw: FACE_S,
    draw: false,
    toast: "Out on the porch.",
    reach: 45,
  },
  {
    id: "back-in",
    kind: "door",
    label: "Slide open the back door",
    from: { x: SHORTCUTS.backDoorX, y: EXT_Y + 25, z: HOUSE.z0 - 80 },
    to: { x: SHORTCUTS.backDoorX, y: GROUND_Y, z: HOUSE.z0 + 120 },
    yaw: FACE_S,
    draw: false,
    toast: "Into the kitchen.",
  },
  {
    id: "back-out",
    kind: "door",
    label: "Slide open the back door",
    from: { x: SHORTCUTS.backDoorX, y: GROUND_Y, z: HOUSE.z0 + 70 },
    to: { x: SHORTCUTS.backDoorX, y: EXT_Y + 25, z: HOUSE.z0 - 130 },
    yaw: FACE_N,
    draw: false,
    toast: "Out on the patio.",
  },

  // Andy's house: toy-sized ways in and out.
  {
    id: "mail-in",
    kind: "slot",
    label: "Squeeze through the mail slot",
    from: { x: SHORTCUTS.mailX - 25, y: GROUND_Y, z: HOUSE.z1 + 80 },
    to: { x: SHORTCUTS.mailX, y: GROUND_Y, z: HOUSE.z1 - 110 },
    yaw: FACE_N,
    draw: false,
    toast: "Plop! Through the mail slot like a postcard.",
    reach: 45,
  },
  {
    id: "mail-out",
    kind: "slot",
    label: "Post yourself out the mail slot",
    from: { x: SHORTCUTS.mailX - 25, y: GROUND_Y, z: HOUSE.z1 - 70 },
    to: { x: SHORTCUTS.mailX, y: GROUND_Y, z: HOUSE.z1 + 120 },
    yaw: FACE_S,
    draw: false,
    toast: "Out on the porch.",
    reach: 45,
  },
  {
    id: "pet-in",
    kind: "petdoor",
    label: "Push through the pet door",
    from: { x: SHORTCUTS.petX, y: EXT_Y + 25, z: HOUSE.z0 - 80 },
    to: { x: SHORTCUTS.petX, y: GROUND_Y, z: HOUSE.z0 + 110 },
    yaw: FACE_S,
    draw: false,
    toast: "Flap! Into the kitchen.",
  },
  {
    id: "pet-out",
    kind: "petdoor",
    label: "Push out through the pet door",
    from: { x: SHORTCUTS.petX, y: GROUND_Y, z: HOUSE.z0 + 70 },
    to: { x: SHORTCUTS.petX, y: EXT_Y + 25, z: HOUSE.z0 - 120 },
    yaw: FACE_N,
    draw: false,
    toast: "Out on the patio.",
  },
  {
    id: "dryer-in",
    kind: "dryer",
    label: "Crawl into the dryer vent",
    from: { x: HOUSE.x1 + 80, y: EXT_Y, z: SHORTCUTS.dryerZ },
    to: { x: HOUSE.x1 - 110, y: GROUND_Y, z: SHORTCUTS.dryerZ },
    yaw: FACE_W,
    draw: false,
    toast: "Fluffy… you tumble out of the dryer vent covered in lint.",
  },
  {
    id: "dryer-out",
    kind: "dryer",
    label: "Wriggle out through the dryer vent",
    from: { x: HOUSE.x1 - 70, y: GROUND_Y, z: SHORTCUTS.dryerZ },
    to: { x: HOUSE.x1 + 120, y: EXT_Y, z: SHORTCUTS.dryerZ },
    yaw: FACE_E,
    draw: false,
    toast: "Out in the side yard.",
  },
  {
    id: "spout-up",
    kind: "gutter",
    label: "Shimmy up the drainpipe",
    from: { x: SHORTCUTS.spout.x + 40, y: EXT_Y, z: SHORTCUTS.spout.z + 40 },
    to: roof(HOUSE.x1 - 150, 10),
    yaw: FACE_W,
    draw: false,
    toast: "Up on Andy's roof!",
  },
  {
    id: "spout-down",
    kind: "gutter",
    label: "Slide down the drainpipe",
    from: roof(HOUSE.x1 - 30),
    to: { x: SHORTCUTS.spout.x + 70, y: EXT_Y, z: SHORTCUTS.spout.z + 70 },
    yaw: FACE_S,
    draw: false,
  },
  {
    id: "gutter-west",
    kind: "gutter",
    label: "Ride the rain gutter to the far corner",
    from: roof(HOUSE.x1 - 260),
    to: roof(HOUSE.x0 + 160, 10),
    yaw: FACE_E,
    draw: false,
    toast: "Wheee! Down the gutter.",
  },
  {
    id: "gutter-east",
    kind: "gutter",
    label: "Ride the rain gutter back",
    from: roof(HOUSE.x0 + 60),
    to: roof(HOUSE.x1 - 150, 10),
    yaw: FACE_W,
    draw: false,
    toast: "Wheee! Back along the gutter.",
  },

  // Sid's house: the dog flap in the back wall.
  {
    id: "sid-pet-in",
    kind: "petdoor",
    label: "Sneak in through the dog flap",
    from: local("sid", SHORTCUTS.sidPetX, -sid.d / 2 - 90, EXT_Y),
    to: local("sid", SHORTCUTS.sidPetX, -sid.d / 2 + 110, EXT_Y),
    yaw: sid.rot + Math.PI,
    draw: false,
    toast: "In through the dog flap… hope the dog's asleep.",
  },
  {
    id: "sid-pet-out",
    kind: "petdoor",
    label: "Escape through the dog flap",
    from: local("sid", SHORTCUTS.sidPetX, -sid.d / 2 + 80, EXT_Y),
    to: local("sid", SHORTCUTS.sidPetX, -sid.d / 2 - 120, EXT_Y),
    yaw: sid.rot,
    draw: false,
    toast: "Out in Sid's back yard.",
  },
];

export const PASSAGE_REACH = 70;
