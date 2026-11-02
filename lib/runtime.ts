import { dirToYaw, yawToDir, yawToRight } from "./world/geometry";
import { projectToNetwork } from "./world/pathfinding";
import type { Pose, Vec2 } from "./world/types";

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
  toy: { x: 0, y: 0, z: 140, yaw: 0, vy: 0, speed: 0, phase: 0, camYaw: 0, camPitch: 0.3, camDist: 110 },
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
