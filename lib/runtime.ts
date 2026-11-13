import { dirToYaw, yawToDir, yawToRight } from "./world/geometry";
import { projectToNetwork } from "./world/pathfinding";
import type { Pose, Vec2 } from "./world/types";

/** What the toy is riding: nothing, flying (space ranger), a horse, an RC car, or a moving ride (train, carousel, truck). */
export type Mount = "none" | "fly" | "horse" | "car" | "ride";
export type RideId = "train" | "carousel" | "truck" | "hitch";

export const PLAYER_SPAWN: Pose = { x: 6.2, z: 36, yaw: 0 };
export const CAR_SPAWN: Pose = { x: 30, z: 2.5, yaw: -Math.PI / 2 };

/**
 * Per-frame mutable state that should not trigger React renders
 * (player/car transforms, pressed keys). Read by the minimap and HUD on their own clocks.
 */
export const runtime = {
  player: { ...PLAYER_SPAWN, pitch: 0 },
  interiorPlayer: { x: 0, z: 0, yaw: 0, pitch: 0 },
  car: { ...CAR_SPAWN, speed: 0, steer: 0 },
  keys: new Set<string>(),
  lastWorldMode: "walk" as "walk" | "drive",
  /** The toy you play as, at house scale: feet position, facing, walk cycle and its follow camera. */
  toy: {
    x: 0,
    y: 0,
    z: 140,
    yaw: 0,
    vy: 0,
    speed: 0,
    phase: 0,
    camYaw: 0,
    camPitch: 0.3,
    camDist: 110,
    turn: 0,
    mount: "none" as Mount,
    /** Jetpack fuel, 0..1; refills on the ground. */
    fuel: 1,
    /** Seconds of Shift boost left in the current burst. */
    boost: 0,
    /** Gliding down (paper glider, or a ranger out of fuel). */
    gliding: false,
    /** Wing / fin spread for the animation, 0..1. */
    wings: 0,
    ride: null as RideId | null,
    /** Position on the train roof in train space: u along the train, v across, h above the roof, and facing relative to the train. */
    onTrain: { u: 0, v: 0, h: 0, vy: 0, relYaw: 0 },
    /** Sailing a paper boat across a rain puddle. */
    boating: false,
  },
  explore: {
    /** 0 = midday, 0.5 = midnight; wraps at 1. */
    dayTime: 0.08,
    /** How dark it is right now, 0..1 (derived from dayTime). */
    night: 0,
    /** Ring course: next ring to fly through and when the run started. */
    ring: { next: 0, start: 0, active: false },
    /** World poses of the moving rides, written by the ride components. */
    rides: {
      /** Rider spot plus the train's own center, heading (+1 east, -1 west) and model yaw. */
      train: { x: 0, y: 0, z: 0, yaw: 0, cx: 0, cz: 0, heading: 1, trainYaw: Math.PI / 2 },
      carousel: { x: 0, y: 0, z: 0, yaw: 0 },
      truck: { x: 0, y: 0, z: 0, yaw: 0, active: false },
      /** Roof of the traffic car you hitched a ride on (`car` is its index, -1 for none). */
      hitch: { x: 0, y: 0, z: 0, yaw: 0, car: -1 },
    },
    /** Live poses of the traffic cars (model yaw, +z forward). */
    traffic: [] as { x: number; z: number; yaw: number }[],
    /** Where the neighbors (and the dog) are right now, or null while they're at home; for the radar. */
    people: {
      mail: null as { x: number; z: number } | null,
      walker: null as { x: number; z: number } | null,
      dog: null as { x: number; z: number } | null,
      kids: null as { x: number; z: number } | null,
    },
    /** Weather: what is scheduled, and how much rain, wind and falling snow there is right now (0..1). */
    weather: {
      kind: "clear" as "clear" | "rain" | "wind" | "snow",
      until: 30,
      rain: 0,
      wind: 0,
      snow: 0,
      windAngle: 0.6,
      /** How full the puddles are and how much snow lies on the ground, 0..1. */
      puddles: 0,
      cover: 0,
    },
    /** Rocket launch: clock time the countdown started (or null). */
    launchAt: null as number | null,
    /** Space level combat state. */
    space: { hearts: 3, bossHp: 12, hitAt: -99, bossHitAt: -99, shots: [] as { x: number; y: number; z: number; vx: number; vz: number; t: number; enemy: boolean }[] },
  },
  town: {
    /** Clock time each town hotspot was last used, so props can animate. */
    triggers: {} as Record<string, number>,
    /** Snap the follow camera to the toy on the next frame (after teleports). */
    snapCamera: false,
    /** Current clock time, for code outside the render loop. */
    clock: 0,
    /** Live turn-by-turn info while navigating the town. */
    nav: { remaining: 0, street: null as string | null, routeIndex: 0 },
  },
  /** Whether the outside walls and roof are drawn; the rug can only be picked while they are hidden. */
  houseShellVisible: false,
};

export function resetPlayer() {
  Object.assign(runtime.player, PLAYER_SPAWN, { pitch: 0 });
}

export function resetCar() {
  Object.assign(runtime.car, CAR_SPAWN, { speed: 0, steer: 0 });
}

/** Snap a position onto the nearest road's right-hand lane, heading along the road. */
export function poseOnRoad(p: Vec2, preferYaw?: number, laneOffset = 2.4): Pose {
  const pr = projectToNetwork(p);
  let yaw = dirToYaw(pr.dir);
  if (preferYaw !== undefined) {
    const f = yawToDir(preferYaw);
    if (f.x * pr.dir.x + f.z * pr.dir.z < 0) yaw += Math.PI;
  }
  const right = yawToRight(yaw);
  return { x: pr.point.x + right.x * laneOffset, z: pr.point.z + right.z * laneOffset, yaw };
}

export function currentOrigin(mode: string): Vec2 {
  return mode === "drive" ? { x: runtime.car.x, z: runtime.car.z } : { x: runtime.player.x, z: runtime.player.z };
}
