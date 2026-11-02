"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BACK_FENCE_Z, EXT_Y, HEDGE, LOT, STREET, STREET_SPACING, STREETS } from "@/lib/house/layout";
import { asphaltTexture, concreteTexture, facadeTexture, fenceTexture, garageDoorTexture, grassTexture, hedgeTexture, shingleTexture, sidingTexture } from "@/lib/three/textures";
import { seededRandom } from "@/lib/world/geometry";
import { InstancedParts, placement } from "../Instanced";
import { gableEnds, gableSlopes } from "./kit";

const LOTS_EACH_SIDE = 6;
const X_EXTENT = LOT.width * (LOTS_EACH_SIDE + 0.5);
const STREET_CENTER0 = (STREET.z0 + STREET.z1) / 2;
const FRONT_SETBACK = STREET_CENTER0 - 520;

const SIDING_COLORS = ["#efe2c4", "#e9dcc0", "#ddd2bd", "#f2ead8", "#d9cbb0", "#e6dfd1", "#cfc6b3", "#efe6cf", "#d8d2c4"];
const ROOF_COLORS = ["#4a4642", "#3f3b38", "#55504a", "#463f3a", "#5b544c"];
const DOOR_COLORS = ["#8c2f2f", "#1f3a5f", "#2f4b3a", "#4b3621", "#f8f6f0"];

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const unitSphere = new THREE.SphereGeometry(1, 14, 10);
const unitCone = new THREE.ConeGeometry(1, 1, 10);
const slopes = gableSlopes(1, 1, 1);
const ends = gableEnds(1, 1, 1);

function repeated(tex: THREE.Texture, rx: number, ry: number) {
  const t = tex.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

interface HouseSpec {
  x: number;
  zFront: number;
  facing: 1 | -1;
  w: number;
  d: number;
  garageSide: 1 | -1;
  siding: string;
  roof: string;
  door: string;
  chimney: boolean;
  crossGable: boolean;
  pool: boolean;
  seed: number;
}

/** Every neighbor house in the subdivision (Andy's lot is skipped). */
function useHouses() {
  return useMemo(() => {
    const rand = seededRandom(2006);
    const out: HouseSpec[] = [];
    for (let n = 0; n < STREETS; n++) {
      const zs = STREET_CENTER0 + n * STREET_SPACING;
      for (const facing of [1, -1] as const) {
        const zFront = facing === 1 ? zs - FRONT_SETBACK : zs + FRONT_SETBACK - 20;
        for (let k = -LOTS_EACH_SIDE; k <= LOTS_EACH_SIDE; k++) {
          // Andy's lot, and Sid's next door (drawn by the town).
          if (n === 0 && facing === 1 && (k === 0 || k === 1)) continue;
          out.push({
            x: LOT.centerX + k * LOT.width + (rand() - 0.5) * 120,
            zFront,
            facing,
            w: 1450 + rand() * 300,
            d: 1150 + rand() * 150,
            garageSide: rand() > 0.5 ? 1 : -1,
            siding: SIDING_COLORS[Math.floor(rand() * SIDING_COLORS.length)],
            roof: ROOF_COLORS[Math.floor(rand() * ROOF_COLORS.length)],
            door: DOOR_COLORS[Math.floor(rand() * DOOR_COLORS.length)],
            chimney: rand() > 0.45,
            crossGable: rand() > 0.4,
            pool: rand() > 0.55,
            seed: Math.floor(rand() * 1e6),
          });
        }
      }
    }
    return out;
  }, []);
}

const HOUSE_H = 720;
const ROOF_RISE = 360;
const GARAGE = { w: 650, h: 300, d: 700, rise: 170 };

function NeighborHouses() {
  const houses = useHouses();
  const parts = useMemo(() => {
    const bodies: THREE.Matrix4[] = [];
    const bodyColors: string[] = [];
    const roofs: THREE.Matrix4[] = [];
    const roofColors: string[] = [];
    const gables: THREE.Matrix4[] = [];
    const gableColors: string[] = [];
    const garages: THREE.Matrix4[] = [];
    const garageColors: string[] = [];
    const garageDoors: THREE.Matrix4[] = [];
    const doors: THREE.Matrix4[] = [];
    const doorColors: string[] = [];
    const chimneys: THREE.Matrix4[] = [];
    const trims: THREE.Matrix4[] = [];
    const driveways: THREE.Matrix4[] = [];
    const walks: THREE.Matrix4[] = [];
    const poolCoping: THREE.Matrix4[] = [];
    const poolWater: THREE.Matrix4[] = [];
    const shrubs: THREE.Matrix4[] = [];

    for (const h of houses) {
      const rot = h.facing === 1 ? 0 : Math.PI;
      const cz = h.zFront - (h.facing * h.d) / 2;
      const bodyX = h.x - h.garageSide * (GARAGE.w / 2);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const at = (lx: number, y: number, lz: number, scale: [number, number, number], r = 0) =>
        placement(bodyX + lx * cos + lz * sin, y, cz - lx * sin + lz * cos, rot + r, scale);
      bodies.push(at(0, EXT_Y + HOUSE_H / 2, 0, [h.w, HOUSE_H, h.d]));
      bodyColors.push(h.siding);
      roofs.push(at(0, EXT_Y + HOUSE_H, 0, [h.w + 100, ROOF_RISE, h.d + 100]));
      roofColors.push(h.roof);
      gables.push(at(0, EXT_Y + HOUSE_H, 0, [h.w, ROOF_RISE, h.d]));
      gableColors.push(h.siding);
      trims.push(at(0, EXT_Y + 20, 0, [h.w + 12, 40, h.d + 12]));
      trims.push(at(0, EXT_Y + HOUSE_H / 2 + 20, h.d / 2 + 2, [h.w + 6, 12, 4]));
      if (h.crossGable) {
        const cw = h.w * 0.38;
        const cx = -h.garageSide * h.w * 0.22;
        roofs.push(at(cx, EXT_Y + HOUSE_H, h.d / 2 - 180 + 30, [400, 260, cw + 80], Math.PI / 2));
        roofColors.push(h.roof);
        gables.push(at(cx, EXT_Y + HOUSE_H, h.d / 2 - 180, [360, 260, cw], Math.PI / 2));
        gableColors.push(h.siding);
      }
      // Garage beside the house, stepped forward a little
      const gx = h.garageSide * (h.w / 2 + GARAGE.w / 2);
      const gz = h.d / 2 - GARAGE.d / 2 + 60;
      garages.push(at(gx, EXT_Y + GARAGE.h / 2, gz, [GARAGE.w, GARAGE.h, GARAGE.d]));
      garageColors.push(h.siding);
      roofs.push(at(gx, EXT_Y + GARAGE.h, gz, [GARAGE.w + 80, GARAGE.rise, GARAGE.d + 80]));
      roofColors.push(h.roof);
      gables.push(at(gx, EXT_Y + GARAGE.h, gz, [GARAGE.w, GARAGE.rise, GARAGE.d]));
      gableColors.push(h.siding);
      garageDoors.push(at(gx, EXT_Y + 118, gz + GARAGE.d / 2 + 2, [520, 230, 3]));
      // Front door in the gap of the facade texture
      doors.push(at(-h.w * 0.11, EXT_Y + 40 + 110, h.d / 2 + 2, [100, 215, 4]));
      doorColors.push(h.door);
      if (h.chimney) chimneys.push(at(-h.garageSide * (h.w / 2 + 40), EXT_Y + (HOUSE_H + ROOF_RISE + 80) / 2, -h.d * 0.1, [90, HOUSE_H + ROOF_RISE + 80, 130]));
      // Driveway from the garage to the street, and the front walk
      const driveLen = FRONT_SETBACK - 400 - (gz + GARAGE.d / 2) + h.d / 2;
      driveways.push(at(gx, EXT_Y + 2, gz + GARAGE.d / 2 + driveLen / 2, [540, 4, driveLen]));
      const walkLen = FRONT_SETBACK - 416 - STREET.sidewalk;
      walks.push(at(-h.w * 0.11, EXT_Y + 1.5, h.d / 2 + walkLen / 2, [100, 3, walkLen]));
      // Foundation shrubs
      for (let i = 0; i < 5; i++) {
        const sx = -h.w / 2 + 80 + (i * (h.w - 160)) / 4;
        if (Math.abs(sx + h.w * 0.11) < 90) continue;
        shrubs.push(at(sx, EXT_Y + 25, h.d / 2 + 50, [45, 40, 45]));
      }
      if (h.pool) {
        const px = (((h.seed % 100) / 100) - 0.5) * 600;
        const pz = -h.d / 2 - 700 - (h.seed % 300);
        poolCoping.push(at(px, EXT_Y + 4, pz, [330, 8, 190]));
        poolWater.push(at(px, EXT_Y + 5, pz, [300, 10, 165]));
      }
    }
    return { bodies, bodyColors, roofs, roofColors, gables, gableColors, garages, garageColors, garageDoors, doors, doorColors, chimneys, trims, driveways, walks, poolCoping, poolWater, shrubs };
  }, [houses]);

  const materials = useMemo(
    () => ({
      facade: new THREE.MeshStandardMaterial({ map: facadeTexture(), roughness: 0.85 }),
      siding: new THREE.MeshStandardMaterial({ map: repeated(sidingTexture(), 3, 1.5), roughness: 0.85 }),
      roof: new THREE.MeshStandardMaterial({ map: repeated(shingleTexture(), 6, 3), roughness: 0.9, side: THREE.DoubleSide }),
      gable: new THREE.MeshStandardMaterial({ map: repeated(sidingTexture(), 3, 1.5), roughness: 0.85, side: THREE.DoubleSide }),
      garageDoor: new THREE.MeshStandardMaterial({ map: garageDoorTexture(), roughness: 0.6 }),
      paint: new THREE.MeshStandardMaterial({ roughness: 0.5 }),
      trim: new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.7 }),
      brick: new THREE.MeshStandardMaterial({ color: "#a65a42", roughness: 0.9 }),
      concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(), color: "#e0dbd0", roughness: 0.9 }),
      coping: new THREE.MeshStandardMaterial({ color: "#f3f0e8", roughness: 0.6 }),
      water: new THREE.MeshStandardMaterial({ color: "#3db7e8", emissive: "#2a9fd6", emissiveIntensity: 0.2, roughness: 0.05 }),
      shrub: new THREE.MeshStandardMaterial({ color: "#3f7a34", roughness: 0.95 }),
    }),
    [],
  );

  return (
    <group>
      <InstancedParts geometry={unitBox} material={materials.facade} matrices={parts.bodies} colors={parts.bodyColors} castShadow={false} />
      <InstancedParts geometry={slopes} material={materials.roof} matrices={parts.roofs} colors={parts.roofColors} castShadow={false} />
      <InstancedParts geometry={ends} material={materials.gable} matrices={parts.gables} colors={parts.gableColors} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.siding} matrices={parts.garages} colors={parts.garageColors} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.garageDoor} matrices={parts.garageDoors} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.paint} matrices={parts.doors} colors={parts.doorColors} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.brick} matrices={parts.chimneys} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.trim} matrices={parts.trims} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.concrete} matrices={parts.driveways} castShadow={false} />
      <InstancedParts geometry={unitBox} material={materials.concrete} matrices={parts.walks} castShadow={false} />
      <InstancedParts geometry={unitCyl} material={materials.coping} matrices={parts.poolCoping} castShadow={false} />
      <InstancedParts geometry={unitCyl} material={materials.water} matrices={parts.poolWater} castShadow={false} />
      <InstancedParts geometry={unitSphere} material={materials.shrub} matrices={parts.shrubs} castShadow={false} />
    </group>
  );
}

/** Streets with curbs and sidewalks, plus the fences between back yards. */
function StreetsAndFences() {
  const len = X_EXTENT * 2;
  const mats = useMemo(
    () => ({
      asphalt: new THREE.MeshStandardMaterial({ map: repeated(asphaltTexture(), len / 600, 800 / 600), color: "#8a8d93", roughness: 0.95 }),
      walk: new THREE.MeshStandardMaterial({ map: repeated(concreteTexture(), len / 150, 1), color: "#e4e0d6", roughness: 0.9 }),
      curb: new THREE.MeshStandardMaterial({ color: "#d4d0c6", roughness: 0.8 }),
      fenceLong: new THREE.MeshStandardMaterial({ map: repeated(fenceTexture(), len / 250, 1), roughness: 0.85 }),
      fenceSide: new THREE.MeshStandardMaterial({ map: repeated(fenceTexture(), 7, 1), roughness: 0.85 }),
    }),
    [len],
  );
  const sideFences = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let n = 0; n < STREETS; n++) {
      const zs = STREET_CENTER0 + n * STREET_SPACING;
      const spans: [number, number][] = [[n === 0 ? BACK_FENCE_Z : zs - STREET_SPACING / 2, zs - FRONT_SETBACK - 1150]];
      spans.push([zs + FRONT_SETBACK + 1150, zs + STREET_SPACING / 2]);
      for (const [a, b] of spans) {
        for (let k = -LOTS_EACH_SIDE - 1; k <= LOTS_EACH_SIDE; k++) {
          const x = LOT.centerX + (k + 0.5) * LOT.width;
          out.push(placement(x, EXT_Y + 90, (a + b) / 2, 0, [6, 180, Math.abs(b - a)]));
        }
      }
    }
    return out;
  }, []);
  const halfStreet = (STREET.z1 - STREET.z0) / 2;
  return (
    <group>
      {Array.from({ length: STREETS }, (_, n) => {
        const zs = STREET_CENTER0 + n * STREET_SPACING;
        return (
          <group key={n}>
            <mesh position={[0, EXT_Y + 3, zs]} rotation-x={-Math.PI / 2} material={mats.asphalt}>
              <planeGeometry args={[len, halfStreet * 2]} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh position={[0, EXT_Y + 6, zs + s * (halfStreet + 8)]} material={mats.curb}>
                  <boxGeometry args={[len, 12, 16]} />
                </mesh>
                <mesh position={[0, EXT_Y + 6, zs + s * (halfStreet + 16 + STREET.sidewalk / 2)]} rotation-x={-Math.PI / 2} material={mats.walk}>
                  <planeGeometry args={[len, STREET.sidewalk]} />
                </mesh>
              </group>
            ))}
            {/* Back fence line behind this street's far row */}
            <mesh position={[0, EXT_Y + 90, zs + STREET_SPACING / 2]} material={mats.fenceLong}>
              <boxGeometry args={[len, 180, 6]} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, EXT_Y + 90, BACK_FENCE_Z]} material={mats.fenceLong}>
        <boxGeometry args={[len, 180, 6]} />
      </mesh>
      <InstancedParts geometry={unitBox} material={mats.fenceSide} matrices={sideFences} castShadow={false} />
    </group>
  );
}

/** Trees in the yards and the forest beyond the hedge. */
function Trees() {
  const { trunks, crowns, crownColors, pines, pineColors } = useMemo(() => {
    const rand = seededRandom(4242);
    const trunks: THREE.Matrix4[] = [];
    const crowns: THREE.Matrix4[] = [];
    const crownColors: string[] = [];
    const pines: THREE.Matrix4[] = [];
    const pineColors: string[] = [];
    const greens = ["#356b2b", "#2c5d25", "#3f7a34", "#4a7f2f", "#2f6a3a"];
    const broadleaf = (x: number, z: number, s: number) => {
      trunks.push(placement(x, EXT_Y + 250 * s, z, 0, [26 * s, 500 * s, 26 * s]));
      for (let i = 0; i < 3; i++) {
        crowns.push(placement(x + (rand() - 0.5) * 200 * s, EXT_Y + (560 + rand() * 180) * s, z + (rand() - 0.5) * 200 * s, rand() * 3, [(200 + rand() * 80) * s, (170 + rand() * 60) * s, (200 + rand() * 80) * s]));
        crownColors.push(greens[Math.floor(rand() * greens.length)]);
      }
    };
    // Street trees and back-yard trees
    for (let n = 0; n < STREETS; n++) {
      const zs = STREET_CENTER0 + n * STREET_SPACING;
      for (let k = -LOTS_EACH_SIDE; k <= LOTS_EACH_SIDE; k++) {
        const x = LOT.centerX + k * LOT.width;
        if (n === 0 && (k === 0 || k === 1)) continue;
        for (const side of [-1, 1]) {
          if (rand() > 0.3) broadleaf(x + (rand() - 0.5) * 1800, zs + side * (halfStreetGap() + 250 + rand() * 300), 0.8 + rand() * 0.5);
          if (rand() > 0.4) broadleaf(x + (rand() - 0.5) * 2200, zs + side * (FRONT_SETBACK + 1400 + rand() * 900), 0.9 + rand() * 0.6);
        }
      }
    }
    // Forest behind the hedge
    for (let i = 0; i < 1400; i++) {
      const x = (rand() - 0.5) * 70000;
      const z = HEDGE.z - 500 - Math.pow(rand(), 0.7) * 26000;
      const s = 1 + rand() * 1.2;
      if (rand() > 0.45) {
        pines.push(placement(x, EXT_Y + 600 * s, z, 0, [230 * s, 1100 * s, 230 * s]));
        pineColors.push(["#24492a", "#2b5532", "#1f3f25"][Math.floor(rand() * 3)]);
        trunks.push(placement(x, EXT_Y + 60 * s, z, 0, [30 * s, 120 * s, 30 * s]));
      } else broadleaf(x, z, s);
    }
    return { trunks, crowns, crownColors, pines, pineColors };
  }, []);
  const mats = useMemo(
    () => ({
      trunk: new THREE.MeshStandardMaterial({ color: "#5b4330", roughness: 0.95 }),
      leaves: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    }),
    [],
  );
  return (
    <group>
      <InstancedParts geometry={unitCyl} material={mats.trunk} matrices={trunks} castShadow={false} />
      <InstancedParts geometry={unitSphere} material={mats.leaves} matrices={crowns} colors={crownColors} castShadow={false} />
      <InstancedParts geometry={unitCone} material={mats.leaves} matrices={pines} colors={pineColors} castShadow={false} />
    </group>
  );
}

function halfStreetGap() {
  return (STREET.z1 - STREET.z0) / 2 + 40;
}

/** The enormous hedge that separates the suburb from the woods. */
function Hedge() {
  const len = 80000;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: repeated(hedgeTexture(), len / 300, HEDGE.height / 300), roughness: 1 }), []);
  const bumpMat = useMemo(() => new THREE.MeshStandardMaterial({ map: repeated(hedgeTexture(), 2, 2), roughness: 1 }), []);
  const bumps = useMemo(() => {
    const rand = seededRandom(99);
    const out: THREE.Matrix4[] = [];
    for (let x = -len / 2; x < len / 2; x += 220) {
      const s = 150 + rand() * 90;
      out.push(placement(x, EXT_Y + HEDGE.height - 30 + rand() * 40, HEDGE.z + (rand() - 0.5) * 120, rand() * 3, [s, s * 0.7, s]));
      if (Math.abs(x) < 25000) {
        const f = 110 + rand() * 70;
        out.push(placement(x + 100, EXT_Y + 80 + rand() * (HEDGE.height - 160), HEDGE.z + HEDGE.depth / 2 - 20, rand() * 3, [f, f, f * 0.5]));
      }
    }
    return out;
  }, []);
  return (
    <group>
      <mesh position={[0, EXT_Y + HEDGE.height / 2, HEDGE.z]} material={mat}>
        <boxGeometry args={[len, HEDGE.height, HEDGE.depth]} />
      </mesh>
      <InstancedParts geometry={unitSphere} material={bumpMat} matrices={bumps} castShadow={false} />
    </group>
  );
}

function Ground() {
  const size = 160000;
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: repeated(grassTexture(), size / 600, size / 600),
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: 4,
        polygonOffsetUnits: 4,
      }),
    [],
  );
  return (
    <mesh position={[0, EXT_Y, 0]} rotation-x={-Math.PI / 2} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

function Hills() {
  const hills = useMemo(() => {
    const rand = seededRandom(7);
    return Array.from({ length: 9 }, (_, i) => ({
      p: [(i - 4) * 9000 + (rand() - 0.5) * 4000, EXT_Y - 1500, -30000 - rand() * 6000] as [number, number, number],
      s: [6000 + rand() * 5000, 3500 + rand() * 2500, 4000] as [number, number, number],
    }));
  }, []);
  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={h.p} scale={h.s}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color="#56794a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Gradient sky dome; drawn behind everything and ignores fog. */
export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#4f8fd6") },
          horizon: { value: new THREE.Color("#d9e9f3") },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 horizon;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[100000, 32, 16]} />
    </mesh>
  );
}

/** The cookie-cutter subdivision around Andy's house. */
export function Neighborhood() {
  return (
    <group>
      <Ground />
      <StreetsAndFences />
      <NeighborHouses />
      <Trees />
      <Hedge />
      <Hills />
    </group>
  );
}
