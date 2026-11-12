/** Planet Zurbo: a small low-gravity planet hub, far away from town in world space. */
export const SPACE = { x: 0, y: 0, z: -400000, r: 6000 };

/** Seconds from the start of the countdown to leaving the atmosphere. */
export const LAUNCH_TIME = 9;
/** How far the Pizza Planet rocket has climbed `age` seconds into the countdown. */
export const rocketRise = (age: number) => (age < 5 ? 0 : (age - 5) ** 2 * 300);

export const SPACE_GRAVITY = 260;
export const SPACE_JUMP = 520;

export const SPACE_SPAWN = { x: SPACE.x, y: SPACE.y, z: SPACE.z + 4600 };

/** Pad that flies you back to town. */
export const HOME_PAD = { x: SPACE.x + 3400, z: SPACE.z + 3400, r: 260 };

/** Boss arena: a raised disc on the far side of the planet. */
export const ARENA = { x: SPACE.x, z: SPACE.z - 3200, r: 1600, y: SPACE.y + 160 };
export const BOSS_HP = 12;

export interface Village {
  x: number;
  z: number;
  name: string;
  color: string;
  lines: string[];
}

export const VILLAGES: Village[] = [
  {
    x: SPACE.x - 3600,
    z: SPACE.z + 800,
    name: "Puffton",
    color: "#7bdff2",
    lines: ["Bloop! You came from the carpet planet?", "The Baron took our crystal lamps. It is very dark at night now.", "Jump! Gravity here is soft as a pillow."],
  },
  {
    x: SPACE.x + 3600,
    z: SPACE.z + 400,
    name: "Glimmerdell",
    color: "#f7aef8",
    lines: ["Ooh, a visitor! Want to see my rock collection? It is just one rock.", "The Baron's arena is past the big crater. Mind his sparks.", "Your laser goes pew. Ours just goes boop."],
  },
  {
    x: SPACE.x - 1200,
    z: SPACE.z + 2600,
    name: "Crater Hollow",
    color: "#b8f2a5",
    lines: ["We dug this crater ourselves. With spoons.", "If you beat the Baron, the whole planet throws a party.", "The pad by the antenna will send you home."],
  },
];

/** Floating rocks around the planet for low-gravity hopping. */
export const ROCKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const d = 1800 + (i % 3) * 900;
  return { x: SPACE.x + Math.sin(a) * d, z: SPACE.z + Math.cos(a) * d, y: SPACE.y + 220 + (i % 4) * 160, r: 140 + (i % 3) * 40 };
});

/** Walkable height on the planet at (x, z), for a toy currently at `y`. */
export function spaceGround(x: number, z: number, y: number) {
  let g = Math.hypot(x - SPACE.x, z - SPACE.z) <= SPACE.r ? SPACE.y : -Infinity;
  // The arena is a solid drum: its top counts as ground from any height, so you have to jump up onto it.
  if (Math.hypot(x - ARENA.x, z - ARENA.z) <= ARENA.r) g = Math.max(g, ARENA.y);
  for (const r of ROCKS) if (Math.hypot(x - r.x, z - r.z) <= r.r && y > r.y - 50) g = Math.max(g, r.y);
  return g;
}

/** Where the boss hovers at time t. */
export function bossPos(t: number) {
  return { x: ARENA.x + Math.sin(t * 0.5) * 700, y: ARENA.y + 260 + Math.sin(t * 1.3) * 60, z: ARENA.z + Math.cos(t * 0.37) * 500 };
}
