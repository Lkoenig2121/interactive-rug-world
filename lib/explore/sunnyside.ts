import { create } from "zustand";
import { EXT_Y } from "../house/layout";
import { runtime } from "../runtime";
import { useStore, type Interaction } from "../store";
import { insideLandmark, landmarkById, toLocal, toWorld } from "../town/config";
import { SUNNY_DUCT, SUNNY_VENDING } from "../town/interiors";

/**
 * "Sunnyside showdown": the daycare's boss toys are original look-alikes — a strawberry-scented
 * pink bear, a giant baby doll and a vain fashion doll. Positions are daycare-local.
 */
export type SunnyStage = "meet" | "doll" | "outfits" | "confess" | "locket" | "baby" | "bear" | "chase" | "done";

export const CAST = {
  bear: { name: "Sir Snuggles", home: { x: -1400, z: -1400 }, reach: 260 },
  baby: { name: "Big Bubba", home: { x: -1800, z: -1250 }, reach: 240 },
  doll: { name: "Chad Dapper", home: { x: 1900, z: 1500 }, reach: 180 },
};

export const OUTFITS = [
  { id: "ascot", name: "silk ascot", where: "the Butterfly Room", x: -2350, z: -950, h: 0, color: "#e63946" },
  { id: "vest", name: "disco vest", where: "the ceiling vents", x: -1150, z: (SUNNY_DUCT.z0 + SUNNY_DUCT.z1) / 2, h: SUNNY_DUCT.h, color: "#c77dff" },
  { id: "legwarmers", name: "leg warmers", where: "the Caterpillar Room", x: 2650, z: -1150, h: 0, color: "#3ddc97" },
];

/** The heart locket the bear threw on top of the vending machine. */
export const LOCKET = { x: SUNNY_VENDING.x, z: SUNNY_VENDING.z, h: SUNNY_VENDING.h };
/** Where the bear can run during the chase (the open middle of the Butterfly Room). */
export const CHASE_AREA = { x0: -2450, x1: -1150, z0: -1050, z1: 450 };
export const DUMPSTER = { x: -2700, z: -2060, h: 130 };
export const TAGS = 3;
/** Seconds the baby takes to stomp over, and then to throw the bear into the dumpster. */
export const TOSS = { walk: 1.6, fly: 1.8 };

const STORAGE_KEY = "carpet-sunnyside-quest";
const STAGES: SunnyStage[] = ["meet", "doll", "outfits", "confess", "locket", "baby", "bear", "chase", "done"];

interface SunnyState {
  stage: SunnyStage;
  outfits: string[];
  hydrate: () => void;
  setStage: (stage: SunnyStage) => void;
  takeOutfit: (id: string) => void;
}

function save(stage: SunnyStage, outfits: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage: stage === "chase" ? "bear" : stage, outfits }));
  } catch {
    /* ignore */
  }
}

export const useSunny = create<SunnyState>((set, get) => ({
  stage: "meet",
  outfits: [],
  hydrate: () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { stage?: string; outfits?: unknown };
      const stage = STAGES.includes(p.stage as SunnyStage) ? (p.stage as SunnyStage) : "meet";
      const outfits = Array.isArray(p.outfits) ? p.outfits.filter((o): o is string => typeof o === "string") : [];
      set({ stage: stage === "chase" ? "bear" : stage, outfits });
    } catch {
      /* ignore */
    }
  },
  setStage: (stage) => {
    set({ stage });
    save(stage, get().outfits);
  },
  takeOutfit: (id) => {
    const outfits = get().outfits.includes(id) ? get().outfits : [...get().outfits, id];
    const stage = outfits.length >= OUTFITS.length ? "confess" : get().stage;
    set({ outfits, stage });
    save(stage, outfits);
  },
}));

/** Live chase state (daycare-local), driven by the Sunnyside actors each frame. */
export const chase = { x: CAST.bear.home.x, z: CAST.bear.home.z, yaw: 0, hits: 0, stunUntil: -1, tossAt: -1 };

/** One-line objective for the HUD, or null when there's nothing to do. */
export function sunnyObjective(stage: SunnyStage, outfits: string[]): string | null {
  switch (stage) {
    case "meet":
      return "Meet Sir Snuggles, the pink bear in the Butterfly Room";
    case "doll":
      return "Ask Chad Dapper in the hall what the bear is hiding";
    case "outfits": {
      const left = OUTFITS.filter((o) => !outfits.includes(o.id)).map((o) => o.where);
      return `Swipe Chad's outfits (${outfits.length}/${OUTFITS.length}): try ${left.join(", ")}`;
    }
    case "confess":
      return "Show Chad Dapper you've got his outfits";
    case "locket":
      return "Climb the junk pile to the top of the hall vending machine";
    case "baby":
      return "Show Big Bubba the heart locket";
    case "bear":
      return "Confront Sir Snuggles";
    case "chase":
      return `Tag Sir Snuggles! (${chase.hits}/${TAGS})`;
    default:
      return null;
  }
}

/** Where the current stage sends you, in world space (several spots while hunting outfits). */
export function sunnyTargets(stage: SunnyStage, outfits: string[]): { x: number; y: number; z: number }[] {
  const l = landmarkById.daycare;
  const at = (p: { x: number; z: number }, h = 0) => ({ ...toWorld(l, p.x, p.z), y: EXT_Y + h });
  switch (stage) {
    case "meet":
    case "bear":
      return [at(CAST.bear.home)];
    case "doll":
    case "confess":
      return [at(CAST.doll.home)];
    case "outfits":
      return OUTFITS.filter((o) => !outfits.includes(o.id)).map((o) => at(o, o.h));
    case "locket":
      return [at(LOCKET, LOCKET.h)];
    case "baby":
      return [at(CAST.baby.home)];
    case "chase":
      return [at(chase)];
    default:
      return [];
  }
}

const say = (text: string) => useStore.getState().showMessage(text);

/** E-prompts for the Sunnyside quest while the toy is in the daycare. */
export function sunnysideInteraction(t: { x: number; y: number; z: number }): Interaction | null {
  const l = landmarkById.daycare;
  if (!insideLandmark(l, t, 40)) return null;
  const q = toLocal(l, t);
  const h = t.y - EXT_Y;
  const near = (p: { x: number; z: number }, r: number, at = 0) => Math.hypot(q.x - p.x, q.z - p.z) < r && Math.abs(h - at) < 70;
  const s = useSunny.getState();

  switch (s.stage) {
    case "meet":
      if (!near(CAST.bear.home, CAST.bear.reach)) break;
      return {
        label: "Talk to Sir Snuggles",
        action: () => {
          say(
            "Sir Snuggles: “Well howdy, new friend! Welcome to Sunnyside. Nobody gets outgrown here… now run along to the Caterpillar Room.” He smells of strawberries… and something's off. Maybe Chad Dapper in the hall knows his secret.",
          );
          useSunny.getState().setStage("doll");
        },
      };
    case "doll":
      if (!near(CAST.doll.home, CAST.doll.reach)) break;
      return {
        label: "Talk to Chad Dapper",
        action: () => {
          say("Chad Dapper: “The bear's secret? My lips are sealed! Now shoo, I have 21 outfits to try on.” Swipe three of his outfits from around the daycare and he'll have to talk.");
          useSunny.getState().setStage("outfits");
        },
      };
    case "outfits": {
      for (const o of OUTFITS) {
        if (s.outfits.includes(o.id) || !near(o, 90, o.h)) continue;
        return {
          label: `Swipe Chad's ${o.name}`,
          action: () => {
            useSunny.getState().takeOutfit(o.id);
            const n = useSunny.getState().outfits.length;
            say(n >= OUTFITS.length ? `Got the ${o.name}! That's all three. Go dangle them in front of Chad Dapper.` : `Got the ${o.name}! (${n}/${OUTFITS.length})`);
          },
        };
      }
      if (near(CAST.doll.home, CAST.doll.reach)) return { label: "Talk to Chad Dapper", action: () => say("Chad Dapper: “Has anyone seen my clothes? This is a fashion emergency!”") };
      break;
    }
    case "confess":
      if (!near(CAST.doll.home, CAST.doll.reach)) break;
      return {
        label: "Show Chad his missing outfits",
        action: () => {
          say(
            "Chad Dapper: “Not the disco vest! OK, OK, I'll talk! The bear threw away Big Bubba's heart locket. It's on top of the vending machine in the hall!” Chad flops over, defeated.",
          );
          useSunny.getState().setStage("locket");
        },
      };
    case "locket":
      if (near(LOCKET, 90, LOCKET.h)) {
        return {
          label: "Grab the heart locket",
          action: () => {
            say("You got the heart locket! It says “I love you.” Take it to Big Bubba in the Butterfly Room.");
            useSunny.getState().setStage("baby");
          },
        };
      }
      if (near(LOCKET, 260)) return { label: "How do I get up there?", action: () => say("Hop up the wastebasket, the game boxes, the step stool and the cardboard box (Space to jump), then onto the machine.") };
      break;
    case "baby":
      if (!near(CAST.baby.home, CAST.baby.reach)) break;
      return {
        label: "Show Big Bubba the locket",
        action: () => {
          say("Big Bubba stares at the locket… then at Sir Snuggles. “Ma-ma?” His lip wobbles, then his face scrunches up. Big Bubba is on your side now!");
          useSunny.getState().setStage("bear");
        },
      };
    case "bear":
      if (!near(CAST.bear.home, CAST.bear.reach)) break;
      return {
        label: "Confront Sir Snuggles",
        action: () => {
          Object.assign(chase, { x: CAST.bear.home.x + 120, z: CAST.bear.home.z + 450, yaw: 0, hits: 0, stunUntil: -1, tossAt: -1 });
          say(`Sir Snuggles: “You'll never take Sunnyside from me!” He hops off his chair and runs. Tag him ${TAGS} times!`);
          useSunny.getState().setStage("chase");
        },
      };
    default:
      break;
  }
  return null;
}

/** Bear AI for the chase: runs from the toy, gets dizzy when tagged, and finally gets tossed. */
export function updateChase(now: number, dt: number) {
  if (useSunny.getState().stage !== "chase") return;
  const l = landmarkById.daycare;
  const t = runtime.toy;
  if (chase.tossAt >= 0) {
    if (now - chase.tossAt > TOSS.walk + TOSS.fly) {
      useSunny.getState().setStage("done");
      say("Big Bubba tosses Sir Snuggles into the dumpster! Sunnyside is free, and every toy in the daycare cheers for you!");
    }
    return;
  }
  const q = toLocal(l, t);
  const dx = chase.x - q.x;
  const dz = chase.z - q.z;
  const d = Math.hypot(dx, dz) || 1;
  const sameLevel = Math.abs(t.y - EXT_Y) < 60;
  if (now >= chase.stunUntil) {
    if (d < 55 && sameLevel) {
      chase.hits++;
      chase.stunUntil = now + 2.2;
      if (chase.hits >= TAGS) {
        chase.tossAt = now;
        say("Got him! Sir Snuggles is dizzy… and here comes Big Bubba, stomping over.");
      } else say(`Bonk! Sir Snuggles is seeing stars (${chase.hits}/${TAGS}).`);
      return;
    }
    // Flee, weaving a little; slower when you're far off so he stays in sight.
    const speed = d < 500 ? 330 : 120;
    const weave = Math.sin(now * 2.3) * 0.7;
    let vx = dx / d - (dz / d) * weave;
    let vz = dz / d + (dx / d) * weave;
    const vl = Math.hypot(vx, vz) || 1;
    vx /= vl;
    vz /= vl;
    const a = CHASE_AREA;
    chase.x = Math.min(a.x1, Math.max(a.x0, chase.x + vx * speed * dt));
    chase.z = Math.min(a.z1, Math.max(a.z0, chase.z + vz * speed * dt));
    chase.yaw = Math.atan2(vx, vz);
  }
}
