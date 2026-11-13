"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EXT_Y } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { landmarkById, toWorld } from "@/lib/town/config";
import { SKY_COLORS } from "../house/Neighborhood";

/** Seconds for a full day in toy mode. */
const DAY_LENGTH = 360;

const DAY = { bg: new THREE.Color("#cfe3f0"), fog: new THREE.Color("#d9e9f3"), top: new THREE.Color("#4f8fd6"), horizon: new THREE.Color("#d9e9f3") };
const DUSK = { horizon: new THREE.Color("#f4a261") };
const NIGHT = { bg: new THREE.Color("#0b1430"), fog: new THREE.Color("#101a38"), top: new THREE.Color("#050a1c"), horizon: new THREE.Color("#1b2a55") };
const SPACE_BG = new THREE.Color("#02030a");
const STORM = new THREE.Color("#8d99a6");

type Lit = THREE.Light & { userData: { base?: number } };

/** How dark it is for a time of day (0 = noon, 0.5 = midnight). */
export function darkness(dayTime: number) {
  const sun = Math.cos(dayTime * Math.PI * 2);
  return THREE.MathUtils.clamp((0.25 - sun) / 0.55, 0, 1);
}

/**
 * Runs the day/night cycle while you play as a toy: tints the sky, fog and background, dims the
 * sun and sky lights, and tells the rest of the game when it's night. T skips ahead a few hours.
 */
function Cycle() {
  const scene = useThree((s) => s.scene);
  const lights = useRef<Lit[]>([]);
  const scanTimer = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "KeyT" || e.repeat) return;
      const s = useStore.getState();
      if (s.mode !== "toy" || s.inSpace) return;
      runtime.explore.dayTime = (runtime.explore.dayTime + 0.125) % 1;
      const hour = Math.round(((runtime.explore.dayTime + 0.5) % 1) * 24);
      s.showToast(`Time skips ahead: about ${hour}:00`);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useFrame((_, dt) => {
    const s = useStore.getState();
    const ex = runtime.explore;
    const outdoors = s.mode === "toy" || s.mode === "house";
    if (s.mode === "toy" && !s.inSpace) ex.dayTime = (ex.dayTime + Math.min(dt, 0.1) / DAY_LENGTH) % 1;
    const n = outdoors ? darkness(ex.dayTime) : 0;
    ex.night = n;
    s.setNight(n > 0.5);
    const w = ex.weather;
    const gloom = outdoors ? Math.max(w.rain, w.snow * 0.6) : 0;

    const bg = scene.background instanceof THREE.Color ? scene.background : null;
    if (s.inSpace) {
      bg?.copy(SPACE_BG);
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(SPACE_BG);
        scene.fog.far = 400000;
      }
    } else {
      bg?.copy(DAY.bg).lerp(NIGHT.bg, n).lerp(STORM, gloom * (1 - n * 0.7));
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(DAY.fog).lerp(NIGHT.fog, n).lerp(STORM, gloom * (1 - n * 0.7));
        scene.fog.far = 90000 * (1 - 0.6 * w.rain - 0.45 * w.snow);
      }
    }
    const dusk = Math.max(0, 1 - Math.abs(n - 0.45) / 0.3);
    SKY_COLORS.top.copy(DAY.top).lerp(NIGHT.top, n);
    SKY_COLORS.horizon.copy(DAY.horizon).lerp(DUSK.horizon, dusk * 0.7).lerp(NIGHT.horizon, Math.max(0, n - dusk * 0.3));
    scene.environmentIntensity = 1 - 0.75 * (s.inSpace ? 0.6 : n);

    scanTimer.current -= dt;
    if (scanTimer.current <= 0) {
      scanTimer.current = 2;
      const found: Lit[] = [];
      scene.traverse((o) => {
        const l = o as Lit;
        if ((l as THREE.DirectionalLight).isDirectionalLight || (l as THREE.HemisphereLight).isHemisphereLight || (l as THREE.AmbientLight).isAmbientLight) {
          if (l.userData.base === undefined) l.userData.base = l.intensity;
          found.push(l);
        }
      });
      lights.current = found;
    }
    const dim = s.mode === "interior" ? 1 : (1 - 0.78 * (s.inSpace ? 0.5 : n)) * (s.inSpace ? 1 : 1 - 0.35 * gloom);
    for (const l of lights.current) l.intensity = (l.userData.base ?? l.intensity) * dim;
  });
  return null;
}

/** Night-sky stars and a moon, far away and ignoring fog. */
function NightSky() {
  const ref = useRef<THREE.Group>(null);
  const pts = useRef<THREE.PointsMaterial>(null);
  const moon = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(() => {
    const n = 1500;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 95000;
      const y = Math.abs(u) * 0.95 + 0.05;
      const h = Math.sqrt(1 - y * y);
      arr.set([Math.cos(a) * h * r, y * r, Math.sin(a) * h * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame(() => {
    const n = runtime.explore.night;
    if (ref.current) ref.current.visible = n > 0.05 && !useStore.getState().inSpace;
    if (pts.current) pts.current.opacity = n;
    if (moon.current) moon.current.opacity = n;
  });
  return (
    <group ref={ref} visible={false}>
      <points geometry={geo} raycast={() => null} frustumCulled={false}>
        <pointsMaterial ref={pts} color="#ffffff" size={160} sizeAttenuation transparent opacity={0} fog={false} depthWrite={false} />
      </points>
      <mesh position={[30000, 52000, -60000]} raycast={() => null}>
        <sphereGeometry args={[2600, 24, 16]} />
        <meshBasicMaterial ref={moon} color="#f4f1de" transparent opacity={0} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Sid's floodlight, glowing eyes in his yard, and runway lights that come on after dark. */
function NightLights() {
  const flood = useRef<THREE.SpotLight>(null);
  const floodTarget = useMemo(() => new THREE.Object3D(), []);
  const cone = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.Mesh>(null);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff3b30", transparent: true, opacity: 0, toneMapped: false }), []);
  const runway = useRef<THREE.MeshBasicMaterial>(null);
  const eyeGroup = useRef<THREE.Group>(null);
  const sid = landmarkById.sid;
  const hd = sid.d / 2;
  const hw = sid.w / 2;
  const lamp = toWorld(sid, hw - 100, -hd - 30);
  const aim = toWorld(sid, -200, -hd - 1400);
  const beamLen = Math.hypot(aim.x - lamp.x, 480, aim.z - lamp.z);
  floodTarget.position.set(aim.x, EXT_Y, aim.z);

  // Point the light cone from the lamp down at the yard (narrow end at the lamp).
  useEffect(() => {
    const m = beam.current;
    if (!m) return;
    m.position.set((lamp.x + aim.x) / 2, EXT_Y + 240, (lamp.z + aim.z) / 2);
    m.lookAt(aim.x, EXT_Y, aim.z);
    m.rotateX(-Math.PI / 2);
  }, [lamp.x, lamp.z, aim.x, aim.z]);

  const eyePairs = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const p = toWorld(sid, -900 + (i % 3) * 800 + ((i * 37) % 200), -hd - 700 - Math.floor(i / 3) * 500);
        return { x: p.x, z: p.z, y: EXT_Y + 20 + (i % 4) * 25, ry: (i * 1.3) % (Math.PI * 2) };
      }),
    [sid, hd],
  );

  const runwayLights = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = 18000; x <= 72000; x += 1200) for (const dz of [-1200, 1200]) out.push([x, 59500 + dz]);
    return out;
  }, []);
  const runwayMesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = runwayMesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    runwayLights.forEach(([x, z], i) => {
      o.position.set(x, EXT_Y + 12, z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [runwayLights]);

  useFrame(({ clock }) => {
    const n = runtime.explore.night;
    const t = clock.elapsedTime;
    if (flood.current) flood.current.intensity = n * 4e6;
    if (cone.current) cone.current.opacity = n * 0.14;
    eyeMat.opacity = n > 0.4 ? (n - 0.4) / 0.6 : 0;
    if (eyeGroup.current) {
      eyeGroup.current.visible = n > 0.4;
      eyeGroup.current.children.forEach((c, i) => {
        // Eyes blink now and then.
        c.scale.y = Math.sin(t * 0.7 + i * 2.1) > 0.97 ? 0.1 : 1;
      });
    }
    if (runway.current) runway.current.opacity = 0.15 + n * 0.85 * (0.75 + 0.25 * Math.sin(t * 4));
  });

  return (
    <group>
      <primitive object={floodTarget} />
      <spotLight ref={flood} position={[lamp.x, EXT_Y + 480, lamp.z]} target={floodTarget} angle={0.55} penumbra={0.4} distance={4500} decay={2} color="#e9f5ff" intensity={0} />
      <mesh position={[lamp.x, EXT_Y + 480, lamp.z]} raycast={() => null}>
        <sphereGeometry args={[22, 12, 10]} />
        <meshBasicMaterial color="#f8fbff" toneMapped={false} />
      </mesh>
      <mesh ref={beam} raycast={() => null}>
        <cylinderGeometry args={[30, 600, beamLen, 16, 1, true]} />
        <meshBasicMaterial ref={cone} color="#e9f5ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={eyeGroup} visible={false}>
        {eyePairs.map((e, i) => (
          <group key={i} position={[e.x, e.y, e.z]} rotation-y={e.ry}>
            {[-4, 4].map((x) => (
              <mesh key={x} position={[x, 0, 0]} material={eyeMat} raycast={() => null}>
                <sphereGeometry args={[2.4, 8, 6]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <instancedMesh ref={runwayMesh} args={[undefined, undefined, runwayLights.length]} raycast={() => null}>
        <sphereGeometry args={[30, 8, 6]} />
        <meshBasicMaterial ref={runway} color="#ffd166" transparent opacity={0.15} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export function DayNight() {
  return (
    <>
      <Cycle />
      <NightSky />
      <NightLights />
    </>
  );
}
