import { landmarkById, toWorld } from "./config";
import { landmarkFloor } from "./colliders";

/** Beats of the rescue: Sid's yard, then the film landmarks, then home. */
export type MissionId = "idle" | "sid-rescue" | "pizza-token" | "dino-charm" | "barn-badge" | "home" | "done";

export interface MissionStep {
  id: Exclude<MissionId, "idle" | "done">;
  /** Shown under Carpet World Explorer. */
  objective: string;
  landmark: string;
  /** Local to the landmark, or Andy's room if `space` is `"room"`. */
  local: { x: number; z: number };
  space?: "room";
  r: number;
  label: string;
  doneToast: string;
}

export const MISSION_STEPS: MissionStep[] = [
  {
    id: "sid-rescue",
    objective: "Rescue the captured toy from the neighbor's backyard",
    landmark: "sid",
    local: { x: 80, z: -1250 },
    r: 340,
    label: "Free Squeak",
    doneToast: "Squeak wriggles free! He lost his treasures all over town…",
  },
  {
    id: "pizza-token",
    objective: "Find Squeak's gold token inside Pizza Planet",
    landmark: "pizza",
    local: { x: -1400, z: 400 },
    r: 300,
    label: "Pick up the token",
    doneToast: "A gold Pizza Planet token. Next: the dinosaur station.",
  },
  {
    id: "dino-charm",
    objective: "Grab Squeak's dinosaur charm at Dinoco",
    landmark: "dino",
    local: { x: 450, z: -200 },
    r: 280,
    label: "Take the Dinoco charm",
    doneToast: "Charm pocketed. One sheriff badge left, at the toy barn.",
  },
  {
    id: "barn-badge",
    objective: "Recover Squeak's sheriff badge at the toy barn",
    landmark: "toybarn",
    local: { x: 0, z: -1700 },
    r: 420,
    label: "Take the sheriff badge",
    doneToast: "Badge pinned. Get Squeak home to Andy's room.",
  },
  {
    id: "home",
    objective: "Bring Squeak home to Andy's room",
    landmark: "andy",
    local: { x: 0, z: 175 },
    space: "room",
    r: 240,
    label: "Tuck Squeak in",
    doneToast: "Home safe. Squeak is back on the shelf.",
  },
];

export const MISSION_ORDER: MissionId[] = ["idle", ...MISSION_STEPS.map((s) => s.id), "done"];

const NEXT: Record<Exclude<MissionId, "done">, MissionId> = {
  idle: "sid-rescue",
  "sid-rescue": "pizza-token",
  "pizza-token": "dino-charm",
  "dino-charm": "barn-badge",
  "barn-badge": "home",
  home: "done",
};

export const missionStep = (id: MissionId) => MISSION_STEPS.find((s) => s.id === id) ?? null;

export function isMissionId(v: string): v is MissionId {
  return (MISSION_ORDER as string[]).includes(v);
}

export function nextMission(id: MissionId): MissionId {
  if (id === "done") return "done";
  return NEXT[id];
}

export function missionObjective(id: MissionId, hasToy: boolean) {
  if (id === "done") return "Squeak is home safe. Nice work!";
  if (!hasToy || id === "idle") return "Drop a toy to begin the rescue";
  return missionStep(id)?.objective ?? "Drop a toy to begin the rescue";
}

/** World-space pickup for the current beat (Andy's room uses house coordinates). */
export function pickupPose(step: MissionStep) {
  if (step.space === "room") return { x: step.local.x, y: 0, z: step.local.z };
  const l = landmarkById[step.landmark];
  const p = toWorld(l, step.local.x, step.local.z);
  return { x: p.x, y: landmarkFloor(l), z: p.z };
}

export const MISSION_STORAGE_KEY = "carpet-squeak-mission";
