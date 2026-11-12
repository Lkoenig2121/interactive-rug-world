import { DOME, TOWER_STEP_SIZE, TOWER_STEPS } from "../explore/sky";
import { EXT_Y, STREET, STREET_SPACING } from "../house/layout";
import type { Vec2 } from "../world/types";

/**
 * The town around Andy's house, at house scale (1 unit = 1 cm, toys are ~35 cm tall).
 * Andy's subdivision sits in the middle; the other districts surround it and are joined by a road network.
 * Display names live here so they can be renamed in one place.
 */

export type DistrictId = "andy" | "commercial" | "pizza" | "toystore" | "sunnyside" | "western" | "airport" | "industrial";

export interface Box2 {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface District {
  id: DistrictId;
  name: string;
  color: string;
  areas: Box2[];
}

export const DISTRICTS: District[] = [
  { id: "andy", name: "Andy's Neighborhood", color: "#8cc97a", areas: [{ x0: -19600, z0: -2700, x1: 19600, z1: 37100 }] },
  {
    id: "commercial",
    name: "Commercial District",
    color: "#f6b98a",
    areas: [
      { x0: 21200, z0: 2600, x1: 40400, z1: 17000 },
      { x0: -22000, z0: 41300, x1: 8000, z1: 47000 },
    ],
  },
  { id: "pizza", name: "Pizza Planet District", color: "#a7aef7", areas: [{ x0: 21200, z0: 18200, x1: 40400, z1: 32600 }] },
  { id: "toystore", name: "Toy Barn District", color: "#f39a92", areas: [{ x0: 41600, z0: 2600, x1: 61400, z1: 17000 }] },
  { id: "sunnyside", name: "Sunnyside District", color: "#ffdc73", areas: [{ x0: -40400, z0: 2600, x1: -21200, z1: 32600 }] },
  { id: "western", name: "Woody's Roundup", color: "#e3bd7e", areas: [{ x0: -76000, z0: 2000, x1: -44000, z1: 34000 }] },
  { id: "airport", name: "Airport District", color: "#a9cbe9", areas: [{ x0: 12000, z0: 42200, x1: 76000, z1: 76000 }] },
  {
    id: "industrial",
    name: "Industrial District",
    color: "#b9b1a5",
    areas: [
      { x0: 41600, z0: 18200, x1: 61400, z1: 32600 },
      { x0: 63500, z0: -16000, x1: 79000, z1: 9000 },
    ],
  },
];

export const districtById = Object.fromEntries(DISTRICTS.map((d) => [d.id, d])) as Record<DistrictId, District>;

export function districtAt(p: Vec2): District | null {
  for (const d of DISTRICTS) for (const a of d.areas) if (p.x >= a.x0 && p.x <= a.x1 && p.z >= a.z0 && p.z <= a.z1) return d;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------------------------

export const ROAD_Y = EXT_Y + 1.5;
/** Street centers of Andy's subdivision, west to east they run from x = -18850 to 18850. */
const RES_HALF = 18850;
const zs = (n: number) => (STREET.z0 + STREET.z1) / 2 + n * STREET_SPACING;
export const BOULEVARD_Z = 40500;

export type RoadKind = "residential" | "avenue" | "street" | "boulevard" | "dirt" | "service";

export interface RoadEdge {
  a: string;
  b: string;
  kind: RoadKind;
  name: string;
  /** False for the subdivision streets, which are already drawn by the neighborhood. */
  draw?: boolean;
}

export const ROAD_WIDTH: Record<RoadKind, number> = { residential: 800, avenue: 1200, street: 1000, boulevard: 1400, dirt: 900, service: 900 };

const nodes: Record<string, Vec2> = {};
const edges: RoadEdge[] = [];
const node = (id: string, x: number, z: number) => (nodes[id] = { x, z });
const edge = (a: string, b: string, kind: RoadKind, name: string, draw = true) => edges.push({ a, b, kind, name, draw });

const STREET_NAMES = ["Elm Street", "Maple Lane", "Oak Drive", "Birch Road", "Cedar Court"];
for (let n = 0; n < 5; n++) {
  node(`RW${n}`, -RES_HALF, zs(n));
  node(`RE${n}`, RES_HALF, zs(n));
  node(`W${n}`, -20600, zs(n));
  node(`E${n}`, 20600, zs(n));
  edge(`W${n}`, `RW${n}`, "residential", STREET_NAMES[n]);
  edge(`RW${n}`, `RE${n}`, "residential", STREET_NAMES[n], false);
  edge(`RE${n}`, `E${n}`, "residential", STREET_NAMES[n]);
  if (n > 0) {
    edge(`W${n - 1}`, `W${n}`, "avenue", "West Avenue");
    edge(`E${n - 1}`, `E${n}`, "avenue", "East Avenue");
  }
}
node("SW", -20600, BOULEVARD_Z);
node("SE", 20600, BOULEVARD_Z);
edge("W4", "SW", "avenue", "West Avenue");
edge("E4", "SE", "avenue", "East Avenue");

// East grid: commercial, pizza, toy store and industrial blocks.
for (const [id, x] of [
  ["C", 41000],
  ["D", 62000],
] as const) {
  node(`${id}0`, x, zs(0));
  node(`${id}2`, x, zs(2));
  node(`${id}4`, x, zs(4));
  node(`${id}S`, x, BOULEVARD_Z);
  edge(`${id}0`, `${id}2`, "street", id === "C" ? "Market Street" : "Depot Road");
  edge(`${id}2`, `${id}4`, "street", id === "C" ? "Market Street" : "Depot Road");
  edge(`${id}4`, `${id}S`, "street", id === "C" ? "Market Street" : "Depot Road");
}
edge("E0", "C0", "street", "Elm Street");
edge("C0", "D0", "street", "Elm Street");
edge("E2", "C2", "street", "Oak Drive");
edge("C2", "D2", "street", "Oak Drive");
edge("E4", "C4", "street", "Cedar Court");
edge("C4", "D4", "street", "Cedar Court");

// West grid: Sunny Days district and the park.
node("V0", -41000, zs(0));
node("V2", -41000, zs(2));
node("V4", -41000, zs(4));
node("VS", -41000, BOULEVARD_Z);
edge("W0", "V0", "street", "Elm Street");
edge("W2", "V2", "street", "Oak Drive");
edge("W4", "V4", "street", "Cedar Court");
edge("V0", "V2", "street", "Sunny Lane");
edge("V2", "V4", "street", "Sunny Lane");
edge("V4", "VS", "street", "Sunny Lane");

// The boulevard along the south edge of town.
edge("VS", "SW", "boulevard", "Tri-County Boulevard");
edge("SW", "SE", "boulevard", "Tri-County Boulevard");
edge("SE", "CS", "boulevard", "Tri-County Boulevard");
edge("CS", "DS", "boulevard", "Tri-County Boulevard");

// Out to the Western district, the landfill and the airport.
node("T1", -46000, zs(2));
node("T2", -74000, zs(2));
edge("V2", "T1", "street", "Oak Drive");
edge("T1", "T2", "dirt", "Old Trail");
node("L1", 66500, zs(0));
edge("D0", "L1", "service", "Landfill Road");
node("A1", 41000, 45300);
edge("CS", "A1", "avenue", "Airport Way");

export const ROAD_NODES = nodes;
export const ROAD_EDGES = edges;

// ---------------------------------------------------------------------------------------------
// Landmarks
// ---------------------------------------------------------------------------------------------

export type LandmarkKind =
  | "andy"
  | "sid"
  | "bonnie"
  | "pizza"
  | "toybarn"
  | "dino"
  | "daycare"
  | "grocery"
  | "cinema"
  | "mall"
  | "bowling"
  | "museum"
  | "warehouse"
  | "construction"
  | "recycling"
  | "landfill"
  | "cityhall"
  | "police"
  | "fire"
  | "hospital"
  | "school"
  | "library"
  | "park"
  | "playground"
  | "sheriff"
  | "saloon"
  | "general"
  | "station"
  | "corral"
  | "western"
  | "terminal"
  | "plane";

export interface Landmark {
  id: string;
  name: string;
  district: DistrictId;
  kind: LandmarkKind;
  /** Center of the footprint. */
  x: number;
  z: number;
  /** Yaw; the front (with the door) faces local +z. */
  rot: number;
  w: number;
  d: number;
  h: number;
  /** Door in the front wall: offset along local x and width. */
  door?: { offset: number; width: number };
  /** Optional second door in the back wall. */
  backDoor?: { offset: number; width: number };
  /** Has walls you can walk in through and an interior. */
  enterable: boolean;
  /** Has walls at all (parks and yards don't). */
  solid: boolean;
  /** Listed as a navigation destination. */
  destination: boolean;
  blurb: string;
}

const R0 = 0;
const R90 = Math.PI / 2;
const R180 = Math.PI;
const R270 = -Math.PI / 2;

type Def = Omit<Landmark, "enterable" | "solid" | "destination"> & Partial<Pick<Landmark, "enterable" | "solid" | "destination">>;
const L = (d: Def): Landmark => ({ enterable: !!d.door, solid: true, destination: true, ...d });
const area = (d: Def): Landmark => ({ enterable: false, solid: false, destination: true, ...d });

export const LANDMARKS: Landmark[] = [
  L({ id: "andy", name: "Andy's House", district: "andy", kind: "andy", x: -400, z: -100, rot: R0, w: 1700, d: 1240, h: 1100, enterable: false, solid: false, blurb: "Home of the Carpet World rug, upstairs in Andy's room." }),
  L({ id: "sid", name: "Sid's House", district: "andy", kind: "sid", x: 2150, z: -80, rot: R0, w: 1500, d: 1150, h: 900, door: { offset: -50, width: 120 }, backDoor: { offset: 0, width: 120 }, blurb: "The neighbor's house. Peek over the fence at the strange toys out back." }),
  L({ id: "pizza", name: "Pizza Planet", district: "pizza", kind: "pizza", x: 31000, z: 25500, rot: R180, w: 5000, d: 3800, h: 900, door: { offset: 0, width: 420 }, blurb: "Space-themed pizza restaurant and arcade, with a rocket out front." }),
  L({ id: "toybarn", name: "Al's Toy Barn", district: "toystore", kind: "toybarn", x: 51500, z: 11000, rot: R180, w: 9000, d: 6000, h: 1250, door: { offset: 0, width: 600 }, blurb: "The biggest toy store in Tri-County, inside a giant red barn." }),
  L({ id: "dino", name: "Dinoco", district: "commercial", kind: "dino", x: 28000, z: 5400, rot: R180, w: 1500, d: 1000, h: 430, door: { offset: 300, width: 150 }, blurb: "Classic 1950s gas station with a friendly dinosaur sign." }),
  L({ id: "daycare", name: "Sunnyside Daycare", district: "sunnyside", kind: "daycare", x: -30500, z: 7500, rot: R180, w: 6000, d: 3600, h: 620, door: { offset: 0, width: 320 }, blurb: "Colorful daycare with a big playground and the Caterpillar Room." }),
  L({ id: "bonnie", name: "Bonnie's House", district: "sunnyside", kind: "bonnie", x: -25000, z: 19700, rot: R180, w: 1800, d: 1300, h: 760, door: { offset: 350, width: 120 }, blurb: "A cheerful yellow house with a toy room full of friends." }),
  area({ id: "western", name: "Woody's Roundup", district: "western", kind: "western", x: -60000, z: 18000, rot: R0, w: 28000, d: 10000, h: 0, blurb: "A dusty Western town with a corral, saloon and train station." }),
  L({ id: "terminal", name: "Tri-County Airport", district: "airport", kind: "terminal", x: 41000, z: 48500, rot: R180, w: 12000, d: 4000, h: 1100, door: { offset: 0, width: 700 }, backDoor: { offset: 0, width: 500 }, blurb: "Terminal, runway and a jet you can walk aboard." }),
  area({ id: "landfill", name: "Tri-County Landfill", district: "industrial", kind: "landfill", x: 71000, z: -6000, rot: R0, w: 14000, d: 18000, h: 0, blurb: "Mountains of trash, a giant crane and a roaring furnace." }),

  // Commercial district
  L({ id: "grocery", name: "Fresh Mart Grocery", district: "commercial", kind: "grocery", x: 35800, z: 5800, rot: R180, w: 4400, d: 2400, h: 650, door: { offset: -800, width: 320 }, blurb: "Groceries, produce and a row of checkouts." }),
  L({ id: "cinema", name: "Galaxy Cinema", district: "commercial", kind: "cinema", x: 23300, z: 11600, rot: R270, w: 3000, d: 2600, h: 900, door: { offset: 0, width: 400 }, blurb: "Movie palace with a marquee of light bulbs." }),
  L({ id: "mall", name: "Tri-County Mall", district: "commercial", kind: "mall", x: 32200, z: 11400, rot: R0, w: 9000, d: 3600, h: 1000, door: { offset: 0, width: 600 }, blurb: "Shops, a fountain and a food court." }),
  L({ id: "bowling", name: "Strike Zone Lanes", district: "commercial", kind: "bowling", x: 38900, z: 11400, rot: R90, w: 3200, d: 2400, h: 700, door: { offset: 0, width: 300 }, blurb: "Bowling alley with a giant pin on the roof." }),
  L({ id: "cityhall", name: "City Hall", district: "commercial", kind: "cityhall", x: -6000, z: 44000, rot: R180, w: 4400, d: 3000, h: 1100, door: { offset: 0, width: 400 }, blurb: "Columns, a clock tower and the town council chamber." }),
  L({ id: "police", name: "Police Station", district: "commercial", kind: "police", x: -13000, z: 43700, rot: R180, w: 3000, d: 2400, h: 700, door: { offset: 0, width: 260 }, blurb: "Tri-County's finest keep the peace from here." }),
  L({ id: "fire", name: "Fire Station No. 1", district: "commercial", kind: "fire", x: -19000, z: 43900, rot: R180, w: 3400, d: 2800, h: 800, door: { offset: 1200, width: 240 }, blurb: "Red fire trucks behind big bay doors." }),
  L({ id: "hospital", name: "Tri-County Hospital", district: "commercial", kind: "hospital", x: 3500, z: 44700, rot: R180, w: 5000, d: 3600, h: 1500, door: { offset: 0, width: 400 }, blurb: "Reception, waiting room and patient wards." }),

  // Pizza Orbit district
  L({ id: "museum", name: "Toy Museum", district: "pizza", kind: "museum", x: 24500, z: 29600, rot: R270, w: 3600, d: 2600, h: 900, door: { offset: 0, width: 360 }, blurb: "Vintage toys and collectibles behind glass." }),

  // Toy store and industrial districts
  L({ id: "warehouse", name: "Toy Warehouse", district: "toystore", kind: "warehouse", x: 44000, z: 14500, rot: R270, w: 4000, d: 3600, h: 900, door: { offset: 0, width: 500 }, blurb: "Pallets of toys waiting to be shelved next door." }),
  area({ id: "construction", name: "Construction Site", district: "industrial", kind: "construction", x: 47500, z: 25000, rot: R180, w: 7000, d: 6000, h: 0, blurb: "A new building going up, with a tower crane you can operate." }),
  L({ id: "depot", name: "Shipping Depot", district: "industrial", kind: "warehouse", x: 56500, z: 21800, rot: R180, w: 5600, d: 3800, h: 900, door: { offset: 0, width: 500 }, blurb: "Trucks, forklifts and towers of crates." }),
  L({ id: "recycling", name: "Recycling Plant", district: "industrial", kind: "recycling", x: 71000, z: 5500, rot: R270, w: 5000, d: 4000, h: 1300, door: { offset: 0, width: 600 }, blurb: "Conveyor belts sorting the town's recycling." }),

  // Sunny Days district
  L({ id: "school", name: "Tri-County Elementary", district: "sunnyside", kind: "school", x: -25200, z: 11500, rot: R90, w: 4000, d: 2800, h: 700, door: { offset: 0, width: 300 }, blurb: "Classrooms, a bell tower and a flagpole." }),
  L({ id: "library", name: "Public Library", district: "sunnyside", kind: "library", x: -37800, z: 13500, rot: R270, w: 3000, d: 2400, h: 800, door: { offset: 0, width: 260 }, blurb: "Quiet reading rooms and tall bookshelves." }),
  area({ id: "park", name: "City Park", district: "sunnyside", kind: "park", x: -31000, z: 28400, rot: R0, w: 18000, d: 7600, h: 0, blurb: "Lawns, a duck pond, a bandstand and shady trees." }),
  area({ id: "playground", name: "Rocket Playground", district: "sunnyside", kind: "playground", x: -25300, z: 27300, rot: R0, w: 3000, d: 2400, h: 0, blurb: "Slides, swings and a rocket climbing frame." }),

  // Western district
  L({ id: "sheriff", name: "Sheriff's Office", district: "western", kind: "sheriff", x: -54000, z: 15000, rot: R0, w: 1800, d: 1400, h: 620, door: { offset: 0, width: 150 }, destination: false, blurb: "Wanted posters and a jail cell." }),
  L({ id: "saloon", name: "Prospector Saloon", district: "western", kind: "saloon", x: -58500, z: 14900, rot: R0, w: 2400, d: 1800, h: 820, door: { offset: 0, width: 200 }, destination: false, blurb: "Swinging doors and a long wooden bar." }),
  L({ id: "general", name: "General Store", district: "western", kind: "general", x: -63000, z: 15000, rot: R0, w: 2000, d: 1400, h: 660, door: { offset: 0, width: 160 }, destination: false, blurb: "Barrels, sacks and supplies." }),
  L({ id: "station", name: "Roundup Station", district: "western", kind: "station", x: -60000, z: 20300, rot: R180, w: 3200, d: 1400, h: 600, door: { offset: 0, width: 260 }, destination: false, blurb: "The train stops here." }),
  area({ id: "corral", name: "Horse Corral", district: "western", kind: "corral", x: -53000, z: 21300, rot: R0, w: 3200, d: 2400, h: 0, destination: false, blurb: "Saddle up and ride." }),

  // Airport
  L({ id: "plane", name: "Flight 2 to Tokyo", district: "airport", kind: "plane", x: 41000, z: 55600, rot: R180, w: 3800, d: 400, h: 420, door: { offset: 1200, width: 110 }, destination: false, blurb: "Walk up the air stairs and find a seat." }),
];

export const landmarkById = Object.fromEntries(LANDMARKS.map((l) => [l.id, l])) as Record<string, Landmark>;

/** Local footprint coordinates (x across the front, z toward the front) to world. */
export function toWorld(l: { x: number; z: number; rot: number }, lx: number, lz: number): Vec2 {
  const c = Math.cos(l.rot);
  const s = Math.sin(l.rot);
  return { x: l.x + lx * c + lz * s, z: l.z - lx * s + lz * c };
}

export function toLocal(l: { x: number; z: number; rot: number }, p: Vec2): Vec2 {
  const dx = p.x - l.x;
  const dz = p.z - l.z;
  const c = Math.cos(l.rot);
  const s = Math.sin(l.rot);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

export function insideLandmark(l: Landmark, p: Vec2, margin = 0) {
  const q = toLocal(l, p);
  return Math.abs(q.x) <= l.w / 2 + margin && Math.abs(q.z) <= l.d / 2 + margin;
}

/** A spot outside the front door, `out` units from the wall. */
export function doorOutside(l: Landmark, out = 220): Vec2 {
  return toWorld(l, l.door?.offset ?? 0, l.d / 2 + out);
}

/** A spot just inside the front door. */
export function doorInside(l: Landmark, inset = 220): Vec2 {
  return toWorld(l, l.door?.offset ?? 0, l.d / 2 - inset);
}

/** Facing yaw that looks out of the front door (yawToDir convention). */
export const facingOut = (l: Landmark) => l.rot + Math.PI;

/** Raised floors (inside the jet) and ramps (its air stairs), so toys can climb aboard. */
export interface Surface {
  rect: Box2;
  y: number;
  ramp?: { axis: "x" | "z"; from: number; to: number; y0: number };
  /** Round floors: only the part of `rect` within this circle counts. */
  round?: { x: number; z: number; r: number };
}

/** Axis-aligned world rect covering a landmark-local rect. */
export function localRect(l: Landmark, x0: number, z0: number, x1: number, z1: number): Box2 {
  const pts = [toWorld(l, x0, z0), toWorld(l, x1, z0), toWorld(l, x0, z1), toWorld(l, x1, z1)];
  return { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), z0: Math.min(...pts.map((p) => p.z)), z1: Math.max(...pts.map((p) => p.z)) };
}

/** Sid's upstairs bedroom floor and the Toy Barn's ceiling duct, reached through vents. */
export const SID_UPSTAIRS_Y = EXT_Y + 430;
export const BARN_DUCT_Y = EXT_Y + 1000;
export const BARN_DUCT = { x0: -4300, x1: 1900, z0: -2900, z1: -2700 };
/** Sid's attic loft over the back half of the house. */
export const SID_LOFT = { x0: -740, x1: 740, z0: -565, z1: -100 };

const plane = landmarkById.plane;
export const PLANE_FLOOR = EXT_Y + 160;
const planeDoor = toWorld(plane, plane.door!.offset, plane.d / 2);
export const SURFACES: Surface[] = [
  { rect: { x0: plane.x - plane.w / 2 + 120, x1: plane.x + plane.w / 2 - 120, z0: plane.z - plane.d / 2, z1: plane.z + plane.d / 2 }, y: PLANE_FLOOR },
  {
    rect: { x0: planeDoor.x - 70, x1: planeDoor.x + 70, z0: planeDoor.z - 480, z1: planeDoor.z },
    y: PLANE_FLOOR,
    ramp: { axis: "z", from: planeDoor.z - 480, to: planeDoor.z, y0: EXT_Y },
  },
  { rect: localRect(landmarkById.sid, SID_LOFT.x0, SID_LOFT.z0, SID_LOFT.x1, SID_LOFT.z1), y: SID_UPSTAIRS_Y },
  { rect: localRect(landmarkById.toybarn, BARN_DUCT.x0, BARN_DUCT.z0, BARN_DUCT.x1, BARN_DUCT.z1), y: BARN_DUCT_Y },
  {
    rect: { x0: DOME.x - DOME.r, x1: DOME.x + DOME.r, z0: DOME.z - DOME.r, z1: DOME.z + DOME.r },
    y: DOME.y,
    round: { x: DOME.x, z: DOME.z, r: DOME.r },
  },
  ...TOWER_STEPS.map((s) => ({
    rect: { x0: s.x - TOWER_STEP_SIZE / 2, x1: s.x + TOWER_STEP_SIZE / 2, z0: s.z - TOWER_STEP_SIZE / 2, z1: s.z + TOWER_STEP_SIZE / 2 },
    y: s.y,
  })),
];
