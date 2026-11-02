"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { EXT_Y } from "@/lib/house/layout";
import { WORLD_LIMITS } from "@/lib/house/walkable";
import { insideLandmark, LANDMARKS, ROAD_EDGES, ROAD_NODES, ROAD_WIDTH, type Landmark } from "@/lib/town/config";
import { seededRandom } from "@/lib/world/geometry";
import { InstancedParts, placement } from "../Instanced";
import { Airport } from "./landmarks/Airport";
import { BigBarnToys } from "./landmarks/BigBarnToys";
import { BonnieHouse } from "./landmarks/BonnieHouse";
import { Daycare } from "./landmarks/Daycare";
import { DinoGas } from "./landmarks/DinoGas";
import { GenericBuilding } from "./landmarks/GenericBuilding";
import { Landfill } from "./landmarks/Landfill";
import { OpenAreas } from "./landmarks/OpenAreas";
import { PizzaOrbit } from "./landmarks/PizzaOrbit";
import { SidHouse } from "./landmarks/SidHouse";
import { Western } from "./landmarks/Western";
import { TownRoads } from "./TownRoads";

function LandmarkView({ l }: { l: Landmark }) {
  switch (l.kind) {
    case "andy":
      return null;
    case "sid":
      return <SidHouse l={l} />;
    case "bonnie":
      return <BonnieHouse l={l} />;
    case "pizza":
      return <PizzaOrbit l={l} />;
    case "toybarn":
      return <BigBarnToys l={l} />;
    case "dino":
      return <DinoGas l={l} />;
    case "daycare":
      return <Daycare l={l} />;
    case "western":
      return <Western l={l} />;
    case "landfill":
      return <Landfill l={l} />;
    case "terminal":
      return <Airport l={l} />;
    case "plane":
    case "corral":
      return null;
    case "park":
    case "playground":
    case "construction":
      return <OpenAreas l={l} />;
    default:
      return <GenericBuilding l={l} />;
  }
}

const SUBDIVISION = { x0: -19700, x1: 19700, z0: -2800, z1: 37200 };

function distToSegment(px: number, pz: number, a: { x: number; z: number }, b: { x: number; z: number }) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - a.x - dx * t, pz - a.z - dz * t);
}

/** Trees filling the open country between the districts. */
function CountryTrees() {
  const parts = useMemo(() => {
    const rand = seededRandom(1995);
    const trunks: THREE.Matrix4[] = [];
    const crowns: THREE.Matrix4[] = [];
    const crownColors: string[] = [];
    const greens = ["#356b2b", "#2c5d25", "#3f7a34", "#4a7f2f", "#2f6a3a", "#5a8a3a"];
    let tries = 0;
    while (trunks.length < 1100 && tries++ < 20000) {
      const x = WORLD_LIMITS.x0 + rand() * (WORLD_LIMITS.x1 - WORLD_LIMITS.x0);
      const z = -2400 + rand() * (WORLD_LIMITS.z1 + 2400);
      if (x > SUBDIVISION.x0 && x < SUBDIVISION.x1 && z > SUBDIVISION.z0 && z < SUBDIVISION.z1) continue;
      if (x < -46000 || (x > 63000 && z < 4000) || z > 50000) continue;
      if (LANDMARKS.some((l) => insideLandmark(l, { x, z }, l.kind === "park" ? -400 : 1600))) continue;
      if (ROAD_EDGES.some((e) => distToSegment(x, z, ROAD_NODES[e.a], ROAD_NODES[e.b]) < ROAD_WIDTH[e.kind] / 2 + 700)) continue;
      const s = 0.8 + rand() * 0.9;
      trunks.push(placement(x, EXT_Y + 220 * s, z, 0, [24 * s, 440 * s, 24 * s]));
      for (let i = 0; i < 2; i++) {
        crowns.push(placement(x + (rand() - 0.5) * 160 * s, EXT_Y + (520 + rand() * 160) * s, z + (rand() - 0.5) * 160 * s, rand() * 3, [(200 + rand() * 80) * s, (170 + rand() * 60) * s, (200 + rand() * 80) * s]));
        crownColors.push(greens[Math.floor(rand() * greens.length)]);
      }
    }
    return { trunks, crowns, crownColors };
  }, []);
  const mats = useMemo(
    () => ({
      trunk: new THREE.MeshStandardMaterial({ color: "#5b4330", roughness: 0.95 }),
      leaves: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
      sphere: new THREE.SphereGeometry(1, 12, 8),
    }),
    [],
  );
  return (
    <group>
      <InstancedParts geometry={mats.cyl} material={mats.trunk} matrices={parts.trunks} castShadow={false} />
      <InstancedParts geometry={mats.sphere} material={mats.leaves} matrices={parts.crowns} colors={parts.crownColors} castShadow={false} />
    </group>
  );
}

/** Everything beyond Andy's subdivision: roads, districts and landmarks. */
export function ToyStoryTown() {
  return (
    <group>
      <TownRoads />
      <CountryTrees />
      {LANDMARKS.map((l) => (
        <LandmarkView key={l.id} l={l} />
      ))}
    </group>
  );
}
