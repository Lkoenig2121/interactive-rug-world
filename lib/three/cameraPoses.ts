import * as THREE from "three";

export const FOV = { room: 42, overhead: 40, walk: 72, drive: 62, interior: 72 } as const;
export const EYE_HEIGHT = 1.7;

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
