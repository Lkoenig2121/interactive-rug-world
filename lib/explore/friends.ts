import { EXT_Y } from "../house/layout";
import { landmarkById, toWorld } from "../town/config";
import type { WorldEventKind } from "./events";

/** Lost toys you can recruit; they follow you home and live on the shelf in Andy's room. */
export type FriendKind = "teddy" | "duck" | "dino" | "rocket" | "soldier" | "bunny" | "car" | "horse" | "robot" | "frog" | "bendy" | "ball";

export interface Friend {
  id: string;
  name: string;
  kind: FriendKind;
  color: string;
  accent: string;
  /** One line for the cutscene card. */
  line: string;
  /** Where it waits to be found (feet), unless it comes from a world event. */
  spot?: { x: number; y: number; z: number };
  event?: WorldEventKind;
}

const at = (id: string, lx: number, lz: number) => {
  const l = landmarkById[id];
  const p = toWorld(l, lx, lz);
  return { x: p.x, y: EXT_Y, z: p.z };
};

export const FRIENDS: Friend[] = [
  { id: "barnaby", name: "Barnaby", kind: "teddy", color: "#a0673c", accent: "#e63946", line: "A patched-up teddy left out in the back yard. He gives the best hugs.", spot: { x: -600, y: EXT_Y, z: -1300 } },
  { id: "quackers", name: "Quackers", kind: "duck", color: "#ffd166", accent: "#f77f00", line: "A squeaky bath duck who floated away from the park pond.", spot: { x: landmarkById.park.x + 2500, y: EXT_Y, z: landmarkById.park.z - 1500 } },
  { id: "dottie", name: "Dottie", kind: "dino", color: "#57cc99", accent: "#22577a", line: "A tiny dinosaur who wanted to see the big Dinoco sign.", spot: at("dino", 500, landmarkById.dino.d / 2 + 450) },
  { id: "zip", name: "Zip", kind: "rocket", color: "#e9ecef", accent: "#e63946", line: "A wind-up rocket that never made it to the launch pad.", spot: at("pizza", 900, landmarkById.pizza.d / 2 + 600) },
  { id: "sarge", name: "Sarge", kind: "soldier", color: "#4f772d", accent: "#31572c", line: "A little plastic soldier on a one-man scouting mission.", spot: at("toybarn", -1500, landmarkById.toybarn.d / 2 + 600) },
  { id: "clover", name: "Clover", kind: "bunny", color: "#f8edeb", accent: "#ffafcc", line: "A floppy-eared bunny who missed nap time at Sunnyside.", spot: at("daycare", 1200, landmarkById.daycare.d / 2 + 500) },
  { id: "vroom", name: "Vroom", kind: "car", color: "#3a86ff", accent: "#ffbe0b", line: "A pull-back racer who rolled all the way to the grocery store.", spot: at("grocery", 1200, landmarkById.grocery.d / 2 + 700) },
  { id: "pip", name: "Pip", kind: "horse", color: "#bc6c25", accent: "#fefae0", line: "A rocking horse who wandered off from the Roundup.", spot: at("western", 0, 3000) },
  { id: "bolt", name: "Bolt", kind: "robot", color: "#e76f51", accent: "#d9d9d9", line: "The wind-up robot that fell from the sky as a meteor!", event: "meteor" },
  { id: "hopper", name: "Hopper", kind: "frog", color: "#58b368", accent: "#ffffff", line: "A jumping frog who mailed himself across town by mistake.", event: "mail" },
  { id: "buddy", name: "Buddy", kind: "bendy", color: "#3a86ff", accent: "#ffd166", line: "A bendy figure, a little chewed, rescued from the neighbor's dog.", event: "dog" },
  { id: "bouncy", name: "Bouncy", kind: "ball", color: "#e63946", accent: "#ffd166", line: "A bouncy ball with a big grin who fell out of a bike basket.", event: "bikes" },
];

export const friendById = Object.fromEntries(FRIENDS.map((f) => [f.id, f])) as Record<string, Friend>;

/** Followers line up this far apart behind the toy. */
export const CONGA_GAP = 30;
