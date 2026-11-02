/**
 * Furniture you can't walk through inside the town's buildings, in each building's local space
 * (x across the front, z toward the front door). Shared by the interiors and the toy's collisions.
 */

export interface PropBox {
  x: number;
  z: number;
  /** Size along local x and z. */
  w: number;
  d: number;
  h: number;
  /** What it is, so interiors know what to draw. */
  kind: string;
  label?: string;
}

/** Interior walls as local-space segments with doorway gaps already cut. */
export interface Partition {
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

const row = (xs: number[], z: number, w: number, d: number, h: number, kind: string, labels?: string[]): PropBox[] =>
  xs.map((x, i) => ({ x, z, w, d, h, kind, label: labels?.[i] }));

export const TOY_AISLES = ["Action Figures", "Toy Cars", "Space Toys", "Cowboy Toys", "Dinosaurs", "Board Games"];

export const INTERIOR_SOLIDS: Record<string, PropBox[]> = {
  toybarn: [
    ...row([-3900, -2700, -1500, 1500, 2700, 3900], -700, 180, 3600, 380, "toyshelf", TOY_AISLES),
    ...row([-3200, -2200, 2200, 3200], 2000, 520, 130, 100, "checkout"),
    { x: 0, z: -1700, w: 900, d: 500, h: 230, kind: "collectibles", label: "Collectibles" },
  ],
  grocery: [
    ...row([-1500, -900, -300, 300, 900], -450, 130, 1300, 210, "groceryshelf"),
    ...row([1700], -350, 300, 1300, 90, "produce"),
    ...row([-1450, -950], 650, 360, 110, 100, "checkout"),
  ],
  library: [...row([-500, 300], -800, 1800, 110, 260, "bookshelf"), ...row([-500, 300], -250, 1800, 110, 260, "bookshelf"), { x: -1300, z: 700, w: 120, d: 700, h: 110, kind: "desk" }],
  warehouse: [...row([-1400, -500, 400, 1300], -300, 200, 2400, 620, "rack")],
  depot: [...row([-2200, -1200, -200, 800, 1800], -350, 200, 2500, 620, "rack")],
  pizza: [
    { x: 0, z: -1450, w: 2600, d: 160, h: 110, kind: "pizzacounter" },
    ...[-1100, -800, -500, -200].flatMap((z) => [
      { x: -2330, z, w: 110, d: 170, h: 190, kind: "arcade", label: "west" },
      { x: 2330, z, w: 110, d: 170, h: 190, kind: "arcade", label: "east" },
    ]),
    { x: 1900, z: 900, w: 240, d: 240, h: 230, kind: "claw" },
    { x: -1950, z: 900, w: 500, d: 140, h: 120, kind: "prizes" },
  ],
  cinema: [{ x: 0, z: -1100, w: 2400, d: 80, h: 300, kind: "screen" }, { x: 0, z: 950, w: 900, d: 130, h: 110, kind: "concession" }],
  bowling: [...row([-1050, -350, 350, 1050], -400, 260, 2000, 6, "lane")],
  museum: [...row([-1200, 0, 1200], -700, 500, 300, 160, "case"), ...row([-1200, 1200], 300, 400, 300, 160, "case")],
  mall: [{ x: 0, z: -200, w: 900, d: 900, h: 70, kind: "fountain" }],
  hospital: [{ x: 0, z: 900, w: 1400, d: 160, h: 110, kind: "reception" }],
  police: [{ x: 0, z: 500, w: 1000, d: 140, h: 110, kind: "reception" }],
  cityhall: [{ x: 0, z: -700, w: 1600, d: 300, h: 100, kind: "dais" }],
  fire: [{ x: -500, z: -100, w: 900, d: 2200, h: 300, kind: "firetruck" }],
  school: [{ x: 0, z: -1150, w: 1600, d: 60, h: 160, kind: "chalkboard" }],
  recycling: [{ x: 0, z: -400, w: 3800, d: 300, h: 160, kind: "conveyor" }],
  terminal: [
    ...row([-4000, -2000], -300, 1600, 140, 110, "checkin"),
    { x: 2600, z: 0, w: 1600, d: 700, h: 60, kind: "carousel" },
    ...row([-3500, -1500, 1500, 3500], -1400, 1000, 140, 50, "seats"),
  ],
  plane: [
    { x: -200, z: 115, w: 2200, d: 120, h: 110, kind: "seatbank" },
    { x: 0, z: -115, w: 2600, d: 120, h: 110, kind: "seatbank" },
  ],
  saloon: [{ x: 0, z: -600, w: 1600, d: 120, h: 110, kind: "bar" }],
  sheriff: [{ x: 500, z: -350, w: 600, d: 500, h: 250, kind: "cell" }],
  general: [{ x: 0, z: -500, w: 1400, d: 100, h: 200, kind: "storeshelf" }],
  station: [{ x: 1100, z: 300, w: 500, d: 120, h: 110, kind: "ticket" }],
  bonnie: [{ x: -650, z: -500, w: 400, d: 150, h: 160, kind: "toybox" }],
  daycare: [{ x: -2700, z: -1200, w: 220, d: 900, h: 140, kind: "cubbies" }],
};

export const PARTITIONS: Record<string, Partition[]> = {
  // Butterfly Room (west), storage (middle back), Caterpillar Room (east), a hall along the front.
  daycare: [
    { ax: -3000, az: 600, bx: -2080, bz: 600 },
    { ax: -1920, az: 600, bx: -1000, bz: 600 },
    { ax: 1000, az: 600, bx: 1920, bz: 600 },
    { ax: 2080, az: 600, bx: 3000, bz: 600 },
    { ax: -1000, az: -1800, bx: -1000, bz: 600 },
    { ax: 1000, az: -1800, bx: 1000, bz: 600 },
    { ax: -1000, az: -600, bx: -80, bz: -600 },
    { ax: 80, az: -600, bx: 1000, bz: -600 },
  ],
  // Toy room on the left, living room on the right.
  bonnie: [
    { ax: 100, az: -650, bx: 100, bz: -90 },
    { ax: 100, az: 90, bx: 100, bz: 650 },
  ],
};
