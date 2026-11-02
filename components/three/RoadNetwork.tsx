"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ribbonGeometry } from "@/lib/three/ribbon";
import { asphaltTexture, concreteTexture } from "@/lib/three/textures";
import { rugPickable, useStore } from "@/lib/store";
import { pointAtDistance } from "@/lib/world/geometry";
import {
  nodeById,
  nodeDegree,
  ROAD_WIDTH,
  ROAD_Y,
  roadEdges,
  roadNodes,
  SIDEWALK_WIDTH,
  SIDEWALK_Y,
} from "@/lib/world/roads";

const ASPHALT_UV = 14;

function discGeometry(x: number, z: number, r: number, y: number, uvScale: number) {
  const g = new THREE.CircleGeometry(r, 28);
  g.rotateX(-Math.PI / 2);
  g.translate(x, y, z);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / uvScale, pos.getZ(i) / uvScale);
  return g;
}

interface Mark {
  x: number;
  z: number;
  angle: number;
}

function useInstanceMatrices(ref: React.RefObject<THREE.InstancedMesh | null>, marks: Mark[], y: number) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    marks.forEach((mk, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), mk.angle);
      m.compose(new THREE.Vector3(mk.x, y, mk.z), q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, marks, y]);
}

function LaneMarkings() {
  const { dashes, stripes } = useMemo(() => {
    const dashes: Mark[] = [];
    const stripes: Mark[] = [];
    for (const e of roadEdges) {
      const skipA = nodeById[e.a].roundabout ? (e.kind === "roundabout" ? 4 : 7) : 13;
      const skipB = nodeById[e.b].roundabout ? (e.kind === "roundabout" ? 4 : 7) : 13;
      for (let s = skipA; s < e.length - skipB; s += 5) {
        const { point, dir } = pointAtDistance(e.points, s + 1.1);
        dashes.push({ x: point.x, z: point.z, angle: Math.atan2(dir.x, dir.z) });
      }
      if (e.kind === "roundabout") continue;
      for (const end of ["a", "b"] as const) {
        const node = nodeById[end === "a" ? e.a : e.b];
        if ((nodeDegree[node.id] ?? 0) < 3) continue;
        const off = node.roundabout ? 11 : 9.6;
        if (e.length < off * 2 + 2) continue;
        const { point, dir } = pointAtDistance(e.points, end === "a" ? off : e.length - off);
        const n = { x: -dir.z, z: dir.x };
        for (let k = 0; k < 6; k++) {
          const o = -3.75 + k * 1.5;
          stripes.push({ x: point.x + n.x * o, z: point.z + n.z * o, angle: Math.atan2(dir.x, dir.z) });
        }
      }
    }
    return { dashes, stripes };
  }, []);

  const dashGeo = useMemo(() => new THREE.PlaneGeometry(0.32, 2.2).rotateX(-Math.PI / 2), []);
  const stripeGeo = useMemo(() => new THREE.PlaneGeometry(0.8, 2.8).rotateX(-Math.PI / 2), []);
  const dashRef = useRef<THREE.InstancedMesh>(null);
  const stripeRef = useRef<THREE.InstancedMesh>(null);
  useInstanceMatrices(dashRef, dashes, ROAD_Y + 0.012);
  useInstanceMatrices(stripeRef, stripes, ROAD_Y + 0.012);

  return (
    <group>
      <instancedMesh ref={dashRef} args={[dashGeo, undefined, dashes.length]} receiveShadow>
        <meshStandardMaterial color="#f8f8f2" roughness={0.6} polygonOffset polygonOffsetFactor={-2} />
      </instancedMesh>
      <instancedMesh ref={stripeRef} args={[stripeGeo, undefined, stripes.length]} receiveShadow>
        <meshStandardMaterial color="#f5f5ef" roughness={0.6} polygonOffset polygonOffsetFactor={-2} />
      </instancedMesh>
    </group>
  );
}

export function RoadNetwork() {
  const asphalt = asphaltTexture();
  const concrete = concreteTexture();
  const select = useStore((s) => s.select);

  const { roads, sidewalk, curb, junctions } = useMemo(() => {
    const roads = roadEdges.map((e) => ({
      edge: e,
      geometry: ribbonGeometry(e.points, ROAD_WIDTH, ROAD_Y, { worldUV: ASPHALT_UV }),
    }));
    const sidewalk = mergeGeometries(
      roadEdges.map((e) => ribbonGeometry(e.points, ROAD_WIDTH + SIDEWALK_WIDTH * 2, SIDEWALK_Y, { worldUV: 9 })),
    );
    const curb = mergeGeometries(
      roadEdges.map((e) => ribbonGeometry(e.points, ROAD_WIDTH + 0.7, (SIDEWALK_Y + ROAD_Y) / 2, { worldUV: 9 })),
    );
    const junctionNodes = roadNodes.filter((n) => !n.roundabout && (nodeDegree[n.id] ?? 0) >= 3);
    const junctions = mergeGeometries(junctionNodes.map((n) => discGeometry(n.x, n.z, ROAD_WIDTH / 2, ROAD_Y, ASPHALT_UV)));
    return { roads, sidewalk, curb, junctions };
  }, []);

  const onRoadClick = (e: ThreeEvent<MouseEvent>, edgeId: string) => {
    if (!rugPickable() || e.delta > 5) return;
    e.stopPropagation();
    const point = { x: e.point.x, z: e.point.z };
    if (useStore.getState().mode === "toy") useStore.getState().enterWorld({ at: point });
    else select({ kind: "road", edgeId, point });
  };

  return (
    <group>
      <mesh geometry={sidewalk} receiveShadow>
        <meshStandardMaterial map={concrete} color="#d6d1c7" roughness={0.9} />
      </mesh>
      <mesh geometry={curb} receiveShadow>
        <meshStandardMaterial color="#a8a298" roughness={0.9} />
      </mesh>
      {roads.map(({ edge, geometry }) => (
        <mesh key={edge.id} geometry={geometry} receiveShadow onClick={(e) => onRoadClick(e, edge.id)}>
          <meshStandardMaterial map={asphalt} color="#7a7e86" roughness={0.88} />
        </mesh>
      ))}
      <mesh geometry={junctions} receiveShadow>
        <meshStandardMaterial map={asphalt} color="#7a7e86" roughness={0.88} />
      </mesh>
      <LaneMarkings />
    </group>
  );
}
