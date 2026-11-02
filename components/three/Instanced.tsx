"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _o = new THREE.Vector3();

/**
 * Matrix for an instance placed at (x, y, z) with yaw `rot`, scale, and an
 * optional local offset that is rotated with the instance.
 */
export function placement(
  x: number,
  y: number,
  z: number,
  rot = 0,
  scale: number | [number, number, number] = 1,
  offset: [number, number, number] = [0, 0, 0],
  tilt: [number, number] = [0, 0],
): THREE.Matrix4 {
  _e.set(tilt[0], rot, tilt[1], "YXZ");
  _q.setFromEuler(_e);
  _o.set(offset[0], offset[1], offset[2]).applyQuaternion(_q);
  _p.set(x + _o.x, y + _o.y, z + _o.z);
  if (typeof scale === "number") _s.set(scale, scale, scale);
  else _s.set(scale[0], scale[1], scale[2]);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

interface Props {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  colors?: string[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function InstancedParts({ geometry, material, matrices, colors, castShadow = true, receiveShadow = true }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    if (colors) {
      const c = new THREE.Color();
      colors.forEach((col, i) => mesh.setColorAt(i, c.set(col)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [matrices, colors]);
  if (matrices.length === 0) return null;
  return (
    <instancedMesh
      key={matrices.length}
      ref={ref}
      args={[geometry, material, matrices.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
