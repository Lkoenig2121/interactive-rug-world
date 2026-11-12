import { EAVE_Y, EXT_Y, HOUSE, ROOF_TOP_Y } from "../house/layout";
import { BARN_DUCT, BARN_DUCT_Y, districtAt, landmarkById, SID_UPSTAIRS_Y, toWorld, type DistrictId } from "../town/config";
import { DOME, TOWER_TOP } from "./sky";

/** Gold star tokens hidden up high, in secret rooms and (some) only at night. */
export interface StarSpot {
  id: string;
  label: string;
  district: DistrictId;
  x: number;
  y: number;
  z: number;
  /** Only visible and collectible at night. */
  night?: boolean;
  /** In the sky dome (counted separately from districts). */
  sky?: boolean;
}

/** Star on landmark `id` at local (lx, lz), `h` above the lawn. */
function on(id: string, label: string, lx: number, lz: number, h: number, extra: Partial<StarSpot> = {}): StarSpot {
  const l = landmarkById[id];
  const p = toWorld(l, lx, lz);
  return { id: `${id}-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`, label, district: l.district, x: p.x, y: EXT_Y + h, z: p.z, ...extra };
}

const pizza = landmarkById.pizza;
const barn = landmarkById.toybarn;
const term = landmarkById.terminal;
const dino = landmarkById.dino;
const daycare = landmarkById.daycare;
const hx = (HOUSE.x0 + HOUSE.x1) / 2;
const hz = (HOUSE.z0 + HOUSE.z1) / 2;

export const STARS: StarSpot[] = [
  // Andy's neighborhood
  { id: "andy-roof", label: "Andy's roof ridge", district: "andy", x: hx, y: ROOF_TOP_Y + 40, z: hz },
  { id: "andy-attic", label: "Andy's attic", district: "andy", x: HOUSE.x0 + 260, y: EAVE_Y + 30, z: HOUSE.z0 + 260 },
  on("sid", "Sid's chimney", -landmarkById.sid.w / 2 + 120, -100, landmarkById.sid.h + 540),
  { ...on("sid", "Sid's upstairs", 450, -350, 0), y: SID_UPSTAIRS_Y + 30 },
  on("sid", "Sid's yard at night", -500, -1700, 40, { night: true }),

  // Pizza Planet district
  on("pizza", "Rocket nose cone", -pizza.w / 2 - 900, pizza.d / 2 + 200, 3260),
  on("pizza", "Rocket gantry", -pizza.w / 2 - 1420, pizza.d / 2 + 200, 2440),
  on("pizza", "Saucer roof", 0, 0, pizza.h + 900),
  on("pizza", "Planet sign", pizza.w / 2 - 550, pizza.d / 2 + 3600, 2720),
  on("museum", "Museum roof", 0, 0, landmarkById.museum.h + 700),

  // Toy Barn district
  on("toybarn", "Silo dome", barn.w / 2 + 900, -barn.d / 2 + 1400, 3050),
  on("toybarn", "Barn cupola", 0, 0, 2920),
  { ...on("toybarn", "Ceiling duct", (BARN_DUCT.x0 + BARN_DUCT.x1) / 2, (BARN_DUCT.z0 + BARN_DUCT.z1) / 2, 0), y: BARN_DUCT_Y + 30 },
  on("toybarn", "Back storeroom", 3800, -2800, 40),
  on("warehouse", "Warehouse roof", 0, 0, landmarkById.warehouse.h + 300),

  // Commercial district
  on("cinema", "Cinema marquee", 0, landmarkById.cinema.d / 2 + 160, 600),
  on("dino", "Dinosaur sign", dino.w / 2 + 600, dino.d / 2 + 1400, 1780),
  on("cityhall", "City Hall dome", 0, 0, landmarkById.cityhall.h + 1340),
  on("hospital", "Helipad", landmarkById.hospital.w / 4, 0, landmarkById.hospital.h + 50),
  on("bowling", "Giant pin", 0, 0, landmarkById.bowling.h + 650),
  on("mall", "Mall skylight", 0, 0, landmarkById.mall.h + 360),
  on("grocery", "Grocery roof", 600, 0, landmarkById.grocery.h + 110),

  // Sunnyside
  on("daycare", "Rooftop sun", -daycare.w / 2 + 400, daycare.d / 2 - 400, daycare.h + 800),
  on("school", "Bell tower", 0, landmarkById.school.d / 2 - 250, landmarkById.school.h + 1200),
  on("library", "Library roof", 0, 0, landmarkById.library.h + 760),
  on("bonnie", "Bonnie's roof", 0, 0, landmarkById.bonnie.h + 560),
  on("park", "Duck pond at night", 2000, 1200, 40, { night: true }),
  on("daycare", "Playground at night", 1900, -daycare.d / 2 - 1300, 40, { night: true }),

  // Woody's Roundup
  on("western", "Water tower", 4200, -3300, 1580),
  on("western", "Windmill", -9000, -3200, 1000),
  on("saloon", "Saloon false front", 0, landmarkById.saloon.d / 2, 1100),

  // Airport and industrial
  on("terminal", "Control tower", -term.w / 2 - 1500, -500, 3760),
  on("terminal", "Terminal roof wave", 0, 0, term.h + 480),
  on("recycling", "Smokestack", -landmarkById.recycling.w / 2 + 400, -landmarkById.recycling.d / 2 + 400, 2520),
  on("landfill", "Landfill at night", 0, 0, 60, { night: true }),

  // Sky dome
  { id: "sky-tower", label: "Top of the dome tower", district: "andy", x: TOWER_TOP.x, y: TOWER_TOP.y + 30, z: TOWER_TOP.z, sky: true },
  { id: "sky-rim", label: "Dome rim", district: "andy", x: DOME.x + DOME.r - 200, y: DOME.y + 30, z: DOME.z, sky: true },
];

export const starById = Object.fromEntries(STARS.map((s) => [s.id, s])) as Record<string, StarSpot>;

/** Stars counted toward each district's exploration (dome stars excluded). */
export function districtProgress(district: DistrictId | null, collected: Set<string>) {
  if (!district) return null;
  const all = STARS.filter((s) => !s.sky && s.district === district);
  if (!all.length) return null;
  return { got: all.filter((s) => collected.has(s.id)).length, total: all.length };
}

export const districtIdAt = (p: { x: number; z: number }) => districtAt(p)?.id ?? null;
