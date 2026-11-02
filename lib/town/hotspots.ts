import { landmarkById, toWorld } from "./config";

/** Something in the town you can use with E, in its landmark's local space. */
export interface Hotspot {
  id: string;
  landmark: string;
  x: number;
  z: number;
  r: number;
  label: string;
  toast?: string;
}

export const HOTSPOTS: Hotspot[] = [
  { id: "arcade-w", landmark: "pizza", x: -2100, z: -650, r: 380, label: "Play Space Blasters", toast: "BLAM! New high score: 99,950." },
  { id: "arcade-e", landmark: "pizza", x: 2100, z: -650, r: 380, label: "Play Alien Invaders", toast: "Wave cleared! The aliens are impressed." },
  { id: "claw", landmark: "pizza", x: 1900, z: 680, r: 260, label: "Try the claw machine", toast: "The claw has chosen! Ooooh." },
  { id: "pizza-order", landmark: "pizza", x: 0, z: -1200, r: 400, label: "Order a pizza", toast: "One extra-large pepperoni, coming right up." },
  { id: "collectibles", landmark: "toybarn", x: 0, z: -1300, r: 520, label: "Admire the Roundup collection", toast: "A complete Roundup set: cowboy, cowgirl, prospector and horse. Rare!" },
  { id: "checkout", landmark: "toybarn", x: 0, z: 1800, r: 600, label: "Ring the checkout bell", toast: "Ding! Thanks for shopping at Al's Toy Barn." },
  { id: "pump", landmark: "dino", x: 0, z: 1300, r: 500, label: "Fill 'er up", toast: "Glug glug glug. Full tank!" },
  { id: "lift", landmark: "dino", x: -350, z: 0, r: 330, label: "Raise the car lift" },
  { id: "bell", landmark: "daycare", x: 0, z: 1200, r: 400, label: "Ring the recess bell", toast: "Riiiing! Recess time in the Caterpillar Room." },
  { id: "crane", landmark: "landfill", x: -1500, z: 3500, r: 800, label: "Operate the claw crane" },
  { id: "conveyor", landmark: "landfill", x: 3500, z: 2500, r: 800, label: "Start the conveyor belt" },
  { id: "towercrane", landmark: "construction", x: -1500, z: 1500, r: 700, label: "Operate the tower crane" },
  { id: "train", landmark: "station", x: 0, z: -1100, r: 700, label: "Blow the train whistle", toast: "Toot toot! All aboard for Roundup Ranch." },
  { id: "carousel", landmark: "terminal", x: 2600, z: 600, r: 500, label: "Start the baggage carousel" },
];

export const hotspotWorld = (h: Hotspot) => toWorld(landmarkById[h.landmark], h.x, h.z);
