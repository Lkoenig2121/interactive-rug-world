import * as THREE from "three";
import { EXT_Y } from "../house/layout";

export const FOV = { room: 42, overhead: 40, walk: 72, drive: 62, interior: 72, house: 45, toy: 55 } as const;

/** Height of the point the follow camera looks at, above the toy's feet. */
export const TOY_LOOK_HEIGHT = 26;

/** Third-person camera behind and above the toy. */
export function toyCameraPose(t: { x: number; y: number; z: number; camYaw: number; camPitch: number; camDist: number }) {
  const target = new THREE.Vector3(t.x, t.y + TOY_LOOK_HEIGHT, t.z);
  const flat = Math.cos(t.camPitch) * t.camDist;
  const pos = new THREE.Vector3(t.x + Math.sin(t.camYaw) * flat, target.y + Math.sin(t.camPitch) * t.camDist, t.z + Math.cos(t.camYaw) * flat);
  return { pos, target };
}
export const EYE_HEIGHT = 1.7;

/** Ground-level height the outside-view controls orbit around. */
export const HOUSE_TARGET_Y = EXT_Y + 300;

/** Street-side view of Andy's house in its neighborhood. */
export function housePose(aspect: number) {
  const target = new THREE.Vector3(-650, HOUSE_TARGET_Y, -150);
  const base = new THREE.Vector3(2300, EXT_Y + 1500, 3900);
  const k = THREE.MathUtils.clamp(1.6 / aspect, 1, 2);
  const pos = target.clone().add(base.sub(target).multiplyScalar(k));
  return { pos, target };
}

/** Photo-like view of the rug from the front of the room, looking toward the windows. */
export function roomCameraPose(aspect: number) {
  const target = new THREE.Vector3(0, 0, -22);
  const base = new THREE.Vector3(0, 232, 292);
  const k = THREE.MathUtils.clamp(1.55 / aspect, 1, 2.6);
  const pos = target.clone().add(base.sub(target).multiplyScalar(k));
  return { pos, target };
}

/** Near top-down "map" view over the whole rug. */
export function overheadPose(aspect: number) {
  const vfov = THREE.MathUtils.degToRad(FOV.overhead);
  const t = Math.tan(vfov / 2) * 2;
  const dist = Math.max(235 / t, 335 / (t * aspect));
  const target = new THREE.Vector3(0, 0, 4);
  const pos = new THREE.Vector3(0, dist * 0.97, dist * 0.24 + 4);
  return { pos, target };
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (t: number) => t * t * (3 - 2 * t);
