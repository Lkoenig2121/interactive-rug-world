"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { groundHeight, resolveWalls } from "@/lib/house/walkable";
import { useStore } from "@/lib/store";
import { dirToYaw } from "@/lib/world/geometry";

/** Only things actually on screen can be picked; the toy itself is skipped so it can be re-dropped. */
function pickable(o: THREE.Object3D | null) {
  for (let p = o; p; p = p.parent) if (!p.visible || p.userData.noPick) return false;
  return true;
}

/** While a toy is waiting to be dropped, a click anywhere in the scene places it there. */
export function SpawnPicker() {
  const spawning = useStore((s) => s.spawning);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    if (!spawning) return;
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    let sx = 0;
    let sy = 0;
    const down = (e: PointerEvent) => {
      sx = e.clientX;
      sy = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.button !== 0 || Math.hypot(e.clientX - sx, e.clientY - sy) > 5) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(scene.children, true).find((h) => pickable(h.object));
      if (!hit) return;
      const ray = raycaster.ray.direction;
      const p = hit.point.clone();
      const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
      // Clicking a wall drops the toy just in front of it, on the camera's side.
      if (normal.y < 0.5) p.addScaledVector(new THREE.Vector3(ray.x, 0, ray.z).normalize(), -15);
      const flat = { x: p.x, z: p.z };
      resolveWalls(flat, 7, p.y);
      const y = Math.max(p.y, groundHeight(flat.x, flat.z, p.y)) + 25;
      useStore.getState().spawnToy({ x: flat.x, y, z: flat.z }, dirToYaw({ x: ray.x, z: ray.z }));
    };
    el.style.cursor = "crosshair";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.style.cursor = "";
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [spawning, gl, camera, scene]);

  return null;
}
