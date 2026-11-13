import { EXT_Y } from "../house/layout";
import { runtime, type RideId } from "../runtime";
import { launchPad, spaceUnlocked, useStore, type Interaction } from "../store";
import { STARS_FOR_SPACE } from "./sky";
import { PASSAGE_REACH, PASSAGES } from "./routes";
import { HOME_PAD, SPACE, VILLAGES } from "./space";

type Toy = typeof runtime.toy;

const flat = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

const RIDES: { id: RideId; label: string; reach: number }[] = [
  { id: "train", label: "Hop on the train", reach: 0 },
  { id: "carousel", label: "Ride the baggage carousel", reach: 220 },
  { id: "truck", label: "Hop on the garbage truck", reach: 420 },
];

/** Walkable carriage roofs in train space (u along the train, + toward the engine; v across). */
export const TRAIN_DECK = { u0: -2330, u1: -470, v: 140 };
/** Whole train, engine included, for the boarding check. */
const TRAIN_SPAN = { u0: -2350, u1: 560 };
/** How far from the side or ends of the train E still boards it. */
const TRAIN_REACH = 450;

/** A world point in the moving train's own frame. */
export function trainLocal(p: { x: number; z: number }) {
  const r = runtime.explore.rides.train;
  return { u: r.heading * (p.x - r.cx), v: -r.heading * (p.z - r.cz) };
}

/** World position of a point on the train roof frame. */
export function trainWorld(u: number, v: number) {
  const r = runtime.explore.rides.train;
  return { x: r.cx + r.heading * u, z: r.cz - r.heading * v };
}

function nearTrain(t: Toy) {
  const { u, v } = trainLocal(t);
  const du = Math.max(0, TRAIN_SPAN.u0 - u, u - TRAIN_SPAN.u1);
  return Math.hypot(du, v) < TRAIN_REACH;
}

export function board(id: RideId) {
  const s = useStore.getState();
  const t = runtime.toy;
  if (id === "train") {
    const r = runtime.explore.rides.train;
    const { u, v } = trainLocal(t);
    Object.assign(t.onTrain, {
      u: Math.min(TRAIN_DECK.u1, Math.max(TRAIN_DECK.u0, u)),
      v: Math.min(TRAIN_DECK.v, Math.max(-TRAIN_DECK.v, v)),
      h: 0,
      vy: 0,
      relYaw: t.yaw - r.trainYaw,
    });
  }
  t.ride = id;
  t.gliding = false;
  s.setMount("ride");
  s.showToast(id === "train" ? "All aboard! Run and jump along the roof. E to hop off." : id === "truck" ? "Holding on to the back of the truck. Space to jump off." : "Round and round. Space to hop off.");
}

/** Gets off the current ride; off the train you land beside the track rather than on it. */
export function hopOff() {
  const t = runtime.toy;
  if (t.ride === "train") {
    const side = t.onTrain.v < 0 ? -1 : 1;
    const p = trainWorld(t.onTrain.u, side * 320);
    t.x = p.x;
    t.z = p.z;
    t.y = EXT_Y;
  }
  t.vy = 0;
  useStore.getState().setMount("none");
}

/** Exploration interactions (secret passages, rides, the rocket, world events), checked before the town ones. */
export function exploreInteraction(t: Toy): Interaction | null {
  const s = useStore.getState();

  if (s.inSpace) return spaceInteraction(t);
  if (s.launching) return null;

  if (t.mount === "ride") return { label: t.ride === "train" ? "Hop off the train" : "Hop off", action: () => hopOff() };

  for (const p of PASSAGES) {
    if (flat(t, p.from) < (p.reach ?? PASSAGE_REACH) && Math.abs(t.y - p.from.y) < 60) {
      return { label: p.label, action: () => useStore.getState().teleportToy(p.to, p.yaw, p.toast) };
    }
  }

  const nearGround = t.y < EXT_Y + 120 && t.y > EXT_Y - 40;
  if (nearGround && t.mount !== "car") {
    for (const r of RIDES) {
      const pose = runtime.explore.rides[r.id];
      if (r.id === "truck" && !runtime.explore.rides.truck.active) continue;
      const close = r.id === "train" ? nearTrain(t) : flat(t, pose) < r.reach;
      if (close) return { label: r.label, action: () => board(r.id) };
    }
  }

  const pad = launchPad();
  if (nearGround && flat(t, pad) < 520) {
    if (spaceUnlocked(s)) return { label: "Launch the rocket to space", action: () => useStore.getState().launchRocket() };
    return {
      label: "Rocket (locked)",
      action: () => useStore.getState().showToast(`The rocket needs fuel: finish the rescue mission or find ${STARS_FOR_SPACE} stars (${s.stars.length} so far).`),
    };
  }

  const e = s.worldEvent;
  if (e && nearGround && (e.kind === "meteor" || e.kind === "sale") && flat(t, e) < 380) {
    return e.kind === "meteor"
      ? { label: "Return the lost toy", action: () => useStore.getState().completeEvent("The lost toy is safe! It waves a tiny thank-you.") }
      : { label: "Grab a sale bargain", action: () => useStore.getState().completeEvent("Bargain found: a shiny sticker for your collection!") };
  }
  return null;
}

let villageLine = 0;

function spaceInteraction(t: Toy): Interaction | null {
  if (flat(t, HOME_PAD) < HOME_PAD.r + 60 && Math.abs(t.y - SPACE.y) < 80) return { label: "Fly home to Pizza Planet", action: () => useStore.getState().exitSpace() };
  for (const v of VILLAGES) {
    if (flat(t, v) < 520) {
      return {
        label: `Talk to the ${v.name} critters`,
        action: () => {
          const s = useStore.getState();
          const line = s.bossDefeated ? "You beat the Baron! Party all night!" : v.lines[villageLine++ % v.lines.length];
          s.showToast(`${v.name}: “${line}”`);
        },
      };
    }
  }
  return null;
}
