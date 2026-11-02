import { EXT_Y } from "../house/layout";
import { groundHeight } from "../house/walkable";
import { runtime } from "../runtime";
import { useStore, type Interaction, type ToyKind } from "../store";
import { landmarkFloor } from "./colliders";
import { districtAt, doorInside, doorOutside, facingOut, insideLandmark, landmarkById, LANDMARKS, type Landmark } from "./config";
import { HOTSPOTS, hotspotWorld } from "./hotspots";

type Toy = typeof runtime.toy;

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/** Andy's front door, outside and in the upstairs bedroom (next to the rug). */
const ANDY_DOOR = { x: -800, z: 640 };
const ANDY_ROOM_SPOT = { x: 0, z: 175 };

function enter(l: Landmark) {
  const p = doorInside(l, 260);
  useStore.getState().teleportToy({ x: p.x, y: landmarkFloor(l), z: p.z }, l.rot, `Welcome to ${l.name}`);
}

function exit(l: Landmark) {
  const p = doorOutside(l, l.kind === "plane" ? 720 : 260);
  useStore.getState().teleportToy({ x: p.x, y: groundHeight(p.x, p.z, EXT_Y + 10), z: p.z }, facingOut(l));
}

function trigger(id: string, toast?: string) {
  runtime.town.triggers[id] = runtime.town.clock;
  runtime.town.triggers.wave = runtime.town.clock;
  if (toast) useStore.getState().showToast(toast);
}

/** What pressing E would do for the toy right now, if anything. */
export function townInteraction(t: Toy, kind: ToyKind | null): Interaction | null {
  const nearGround = t.y < EXT_Y + 80 && t.y > EXT_Y - 40;

  if (nearGround && dist(t, ANDY_DOOR) < 160) {
    return {
      label: "Go up to Andy's room",
      action: () => useStore.getState().teleportToy({ x: ANDY_ROOM_SPOT.x, y: groundHeight(ANDY_ROOM_SPOT.x, ANDY_ROOM_SPOT.z, 0), z: ANDY_ROOM_SPOT.z }, 0, "Back in Andy's room"),
    };
  }

  for (const l of LANDMARKS) {
    if (!l.enterable || !l.door) continue;
    const reachOut = Math.max(l.w, l.d) / 2 + 1000;
    if (Math.abs(t.x - l.x) > reachOut || Math.abs(t.z - l.z) > reachOut) continue;
    const floor = landmarkFloor(l);
    const reach = Math.max(170, l.door.width / 2 + 70);
    const inside = insideLandmark(l, t, -2);
    if (inside && Math.abs(t.y - floor) < 60 && dist(t, doorInside(l, 120)) < reach) return { label: `Exit ${l.name}`, action: () => exit(l) };
    const outsideSpot = l.kind === "plane" ? doorOutside(l, 560) : doorOutside(l, 120);
    if (!inside && dist(t, outsideSpot) < reach && t.y < floor + 60) return { label: `Enter ${l.name}`, action: () => enter(l) };
  }

  for (const h of HOTSPOTS) {
    const l = landmarkById[h.landmark];
    const p = hotspotWorld(h);
    if (dist(t, p) > h.r || Math.abs(t.y - landmarkFloor(l)) > 120) continue;
    if (h.game) {
      return {
        label: h.label,
        action: () => {
          trigger(h.id);
          useStore.getState().openArcade(h.game!);
        },
      };
    }
    return { label: h.label, action: () => trigger(h.id, h.toast) };
  }

  const corral = landmarkById.corral;
  if (kind === "cowboy" && t.mount !== "horse" && insideLandmark(corral, t, 600)) {
    return {
      label: "Saddle up the horse",
      action: () => {
        useStore.getState().setMount("horse");
        useStore.getState().showToast("Giddy-up! Shift to gallop, H to hop off.");
      },
    };
  }
  return null;
}

/** District and the closest landmark around a point, for the location badge. */
export function placeAt(p: { x: number; z: number }) {
  const district = districtAt(p)?.name ?? null;
  let landmark: string | null = null;
  let best = Infinity;
  for (const l of LANDMARKS) {
    if (l.kind === "plane" || l.kind === "corral") continue;
    if (!insideLandmark(l, p, l.solid ? 900 : 200)) continue;
    const d = dist(p, l);
    if (d < best) {
      best = d;
      landmark = l.name;
    }
  }
  return { district, landmark };
}
