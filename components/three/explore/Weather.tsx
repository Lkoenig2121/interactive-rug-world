"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PUDDLE_Y, PUDDLES, SNOW_AREA, SNOW_Y, underRoof, WEATHER_TOAST, windPush, type WeatherKind } from "@/lib/explore/living";
import { EXT_Y, HOUSE, inRect } from "@/lib/house/layout";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

const ORDER: WeatherKind[] = ["clear", "rain", "wind", "snow"];

function setWeather(kind: WeatherKind, now: number, toast = true) {
  const w = runtime.explore.weather;
  const changed = w.kind !== kind;
  w.kind = kind;
  w.until = now + 50 + Math.random() * 60;
  if (changed && toast) useStore.getState().showToast(WEATHER_TOAST[kind]);
}

/** Picks the weather on the day/night clock (snow only after dark) and eases rain, wind, puddles and snow cover. Y changes it. */
function Clock() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "KeyY" || e.repeat) return;
      const s = useStore.getState();
      if (s.mode !== "toy" || s.inSpace) return;
      const w = runtime.explore.weather;
      let next = ORDER[(ORDER.indexOf(w.kind) + 1) % ORDER.length];
      if (next === "snow" && runtime.explore.night < 0.5) {
        s.showToast("Snow only falls at night. Press T to skip ahead to evening.");
        next = "clear";
      }
      setWeather(next, runtime.town.clock);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = useStore.getState();
    const w = runtime.explore.weather;
    const now = clock.elapsedTime;
    const night = runtime.explore.night;
    if (s.mode === "toy" && !s.inSpace) {
      if (w.kind === "snow" && night < 0.3) setWeather("clear", now);
      else if (now > w.until) {
        const r = Math.random();
        setWeather(night > 0.5 ? (r < 0.6 ? "snow" : "clear") : r < 0.35 ? "rain" : r < 0.65 ? "wind" : "clear", now);
      }
    }
    const ease = (v: number, on: boolean) => v + ((on ? 1 : 0) - v) * Math.min(1, dt * 0.35);
    w.rain = ease(w.rain, w.kind === "rain");
    w.wind = ease(w.wind, w.kind === "wind");
    w.snow = ease(w.snow, w.kind === "snow");
    w.windAngle += Math.sin(now * 0.05) * dt * 0.06;
    w.puddles = THREE.MathUtils.clamp(w.puddles + (w.rain > 0.5 ? dt / 25 : -dt / 90), 0, 1);
    w.cover = THREE.MathUtils.clamp(w.cover + (w.snow > 0.5 ? dt / 45 : night < 0.3 ? -dt / 40 : -dt / 400), 0, 1);
  });
  return null;
}

const BOX = { r: 1400, up: 1100, down: 500 };
const RAIN_N = 1400;
const SNOW_N = 1800;
const LEAF_N = 160;
const LEAF_COLORS = ["#d9822b", "#c0392b", "#e9c46a", "#6a994e"].map((c) => new THREE.Color(c));

function scatter(n: number) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([(Math.random() * 2 - 1) * BOX.r, Math.random() * (BOX.up + BOX.down) - BOX.down, (Math.random() * 2 - 1) * BOX.r], i * 3);
  return a;
}

/** Keeps a particle inside the box around the camera, wrapping it to the far side. */
function wrap(a: Float32Array, i: number, c: THREE.Vector3) {
  const j = i * 3;
  if (a[j + 1] < c.y - BOX.down) a[j + 1] += BOX.up + BOX.down;
  else if (a[j + 1] > c.y + BOX.up) a[j + 1] -= BOX.up + BOX.down;
  for (const k of [0, 2]) {
    const d = a[j + k] - (k ? c.z : c.x);
    if (d > BOX.r) a[j + k] -= BOX.r * 2;
    else if (d < -BOX.r) a[j + k] += BOX.r * 2;
  }
}

/** Rain streaks, snowflakes and blowing leaves in a box that follows the camera. */
function Precipitation() {
  const camera = useThree((s) => s.camera);
  const sim = useMemo(() => ({ rain: scatter(RAIN_N), snow: scatter(SNOW_N), leaves: scatter(LEAF_N), primed: false }), []);
  const geos = useMemo(() => {
    const rain = new THREE.BufferGeometry();
    rain.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RAIN_N * 6), 3));
    const snow = new THREE.BufferGeometry();
    snow.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SNOW_N * 3), 3));
    const leaves = new THREE.BufferGeometry();
    leaves.setAttribute("position", new THREE.BufferAttribute(new Float32Array(LEAF_N * 3), 3));
    const col = new Float32Array(LEAF_N * 3);
    for (let i = 0; i < LEAF_N; i++) LEAF_COLORS[i % LEAF_COLORS.length].toArray(col, i * 3);
    leaves.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { rain, snow, leaves };
  }, []);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  const rainRef = useRef<THREE.LineSegments>(null);
  const snowRef = useRef<THREE.Points>(null);
  const leafRef = useRef<THREE.Points>(null);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = useStore.getState();
    const w = runtime.explore.weather;
    const now = clock.elapsedTime;
    const c = camera.position;
    const hidden = s.inSpace || s.mode === "interior" || underRoof(runtime.toy);
    if (!sim.primed) {
      // Start the particles around the camera rather than the origin.
      for (const a of [sim.rain, sim.snow, sim.leaves]) {
        for (let i = 0; i < a.length; i += 3) {
          a[i] += c.x;
          a[i + 1] += c.y;
          a[i + 2] += c.z;
        }
      }
      sim.primed = true;
    }
    const push = windPush(w, now);

    const nRain = hidden ? 0 : Math.floor(RAIN_N * w.rain);
    if (rainRef.current) rainRef.current.visible = nRain > 0;
    if (nRain > 0) {
      const out = geos.rain.attributes.position.array as Float32Array;
      const a = sim.rain;
      for (let i = 0; i < nRain; i++) {
        const j = i * 3;
        a[j] += push.x * dt;
        a[j + 1] -= 2600 * dt;
        a[j + 2] += push.z * dt;
        wrap(a, i, c);
        const k = i * 6;
        out[k] = a[j];
        out[k + 1] = a[j + 1];
        out[k + 2] = a[j + 2];
        out[k + 3] = a[j] - push.x * 0.015;
        out[k + 4] = a[j + 1] + 38;
        out[k + 5] = a[j + 2] - push.z * 0.015;
      }
      geos.rain.setDrawRange(0, nRain * 2);
      geos.rain.attributes.position.needsUpdate = true;
    }

    const nSnow = hidden ? 0 : Math.floor(SNOW_N * w.snow);
    if (snowRef.current) snowRef.current.visible = nSnow > 0;
    if (nSnow > 0) {
      const out = geos.snow.attributes.position.array as Float32Array;
      const a = sim.snow;
      for (let i = 0; i < nSnow; i++) {
        const j = i * 3;
        a[j] += (Math.sin(now * 0.9 + i) * 25 + push.x * 0.4) * dt;
        a[j + 1] -= (60 + (i % 7) * 6) * dt;
        a[j + 2] += (Math.cos(now * 0.7 + i * 1.3) * 25 + push.z * 0.4) * dt;
        wrap(a, i, c);
        out[j] = a[j];
        out[j + 1] = a[j + 1];
        out[j + 2] = a[j + 2];
      }
      geos.snow.setDrawRange(0, nSnow);
      geos.snow.attributes.position.needsUpdate = true;
    }

    const nLeaf = hidden ? 0 : Math.floor(LEAF_N * w.wind);
    if (leafRef.current) leafRef.current.visible = nLeaf > 0;
    if (nLeaf > 0) {
      const out = geos.leaves.attributes.position.array as Float32Array;
      const a = sim.leaves;
      for (let i = 0; i < nLeaf; i++) {
        const j = i * 3;
        a[j] += push.x * 3 * dt;
        a[j + 1] += Math.sin(now * 3 + i) * 90 * dt - 15 * dt;
        a[j + 2] += push.z * 3 * dt;
        if (a[j + 1] < EXT_Y + 3) a[j + 1] = EXT_Y + 3;
        wrap(a, i, c);
        out[j] = a[j];
        out[j + 1] = a[j + 1];
        out[j + 2] = a[j + 2];
      }
      geos.leaves.setDrawRange(0, nLeaf);
      geos.leaves.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <lineSegments ref={rainRef} geometry={geos.rain} frustumCulled={false} raycast={() => null} visible={false}>
        <lineBasicMaterial color="#b8cde6" transparent opacity={0.45} depthWrite={false} />
      </lineSegments>
      <points ref={snowRef} geometry={geos.snow} frustumCulled={false} raycast={() => null} visible={false}>
        <pointsMaterial color="#ffffff" size={3.2} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <points ref={leafRef} geometry={geos.leaves} frustumCulled={false} raycast={() => null} visible={false}>
        <pointsMaterial vertexColors size={6} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
      </points>
    </group>
  );
}

/** Rain puddles that grow while it rains and dry up afterwards; big enough ones float a paper boat. */
function Puddles() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const water = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6f8fb5", roughness: 0.05, metalness: 0.55, transparent: true, opacity: 0, depthWrite: false }), []);
  useEffect(() => () => water.dispose(), [water]);
  useFrame(({ clock }) => {
    const level = runtime.explore.weather.puddles;
    water.opacity = Math.min(1, level * 1.6) * 0.8;
    const s = 0.3 + 0.7 * level;
    groups.current.forEach((g, i) => {
      if (!g) return;
      g.visible = level > 0.02;
      // A faint shimmer while rain lands on them.
      const ripple = 1 + Math.sin(clock.elapsedTime * 4 + i) * 0.015 * runtime.explore.weather.rain;
      g.scale.set(s * ripple, 1, s * ripple);
    });
  });
  return (
    <group>
      {PUDDLES.map((p, i) => (
        <group
          key={i}
          position={[p.x, PUDDLE_Y, p.z]}
          visible={false}
          ref={(g) => {
            groups.current[i] = g;
          }}
        >
          <mesh rotation-x={-Math.PI / 2} material={water} raycast={() => null} receiveShadow>
            <circleGeometry args={[p.r, 28]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[p.r * 0.45, 0.05, p.r * 0.25]} material={water} raycast={() => null}>
            <circleGeometry args={[p.r * 0.6, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const PRINTS = 260;

/** A blanket of snow over the subdivision, and the trail of prints the toy leaves in it. */
function SnowCover() {
  const cover = useRef<THREE.MeshStandardMaterial>(null);
  const plane = useRef<THREE.Mesh>(null);
  const prints = useRef<THREE.InstancedMesh>(null);
  const printMat = useRef<THREE.MeshBasicMaterial>(null);
  const state = useRef({ next: 0, used: 0, last: { x: 0, z: 0 }, left: false });
  const geo = useMemo(() => new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const m = prints.current;
    if (!m) return;
    o.scale.set(0, 0, 0);
    o.updateMatrix();
    for (let i = 0; i < PRINTS; i++) m.setMatrixAt(i, o.matrix);
    m.instanceMatrix.needsUpdate = true;
  }, [o]);

  useFrame(() => {
    const w = runtime.explore.weather;
    const t = runtime.toy;
    const st = state.current;
    if (cover.current) cover.current.opacity = Math.min(1, w.cover * 1.3) * 0.95;
    if (plane.current) plane.current.visible = w.cover > 0.01;
    if (printMat.current) printMat.current.opacity = Math.min(1, w.cover * 1.4) * 0.5;
    const m = prints.current;
    if (!m) return;
    m.visible = w.cover > 0.08;
    if (w.cover < 0.08) {
      if (st.used) {
        o.scale.set(0, 0, 0);
        o.updateMatrix();
        for (let i = 0; i < PRINTS; i++) m.setMatrixAt(i, o.matrix);
        m.instanceMatrix.needsUpdate = true;
        st.used = 0;
      }
      return;
    }
    const walker = t.mount === "none" || t.mount === "horse" || t.mount === "car";
    const inArea = t.x > SNOW_AREA.x0 && t.x < SNOW_AREA.x1 && t.z > SNOW_AREA.z0 && t.z < SNOW_AREA.z1 && !inRect(t, HOUSE, 10);
    const onSnow = walker && inArea && t.vy === 0 && Math.abs(t.y - EXT_Y) < 12 && !t.boating;
    if (!onSnow) {
      st.last = { x: t.x, z: t.z };
      return;
    }
    const stride = t.mount === "horse" ? 40 : t.mount === "car" ? 14 : 13;
    if (Math.hypot(t.x - st.last.x, t.z - st.last.z) < stride) return;
    st.last = { x: t.x, z: t.z };
    const side = { x: Math.cos(t.yaw), z: -Math.sin(t.yaw) };
    // Feet alternate; horse hooves are round; the RC car leaves two tyre tracks.
    const marks = t.mount === "car" ? [-9, 9] : [(st.left ? -1 : 1) * (t.mount === "horse" ? 7 : 3.2)];
    st.left = !st.left;
    for (const off of marks) {
      o.position.set(t.x + side.x * off, SNOW_Y + 0.4, t.z + side.z * off);
      o.rotation.set(0, t.yaw, 0);
      if (t.mount === "horse") o.scale.set(3.6, 1, 3.6);
      else if (t.mount === "car") o.scale.set(2.2, 1, 8);
      else o.scale.set(2.4, 1, 4.2);
      o.updateMatrix();
      m.setMatrixAt(st.next, o.matrix);
      st.next = (st.next + 1) % PRINTS;
      st.used = Math.min(PRINTS, st.used + 1);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh
        ref={plane}
        rotation-x={-Math.PI / 2}
        position={[(SNOW_AREA.x0 + SNOW_AREA.x1) / 2, SNOW_Y, (SNOW_AREA.z0 + SNOW_AREA.z1) / 2]}
        visible={false}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[SNOW_AREA.x1 - SNOW_AREA.x0, SNOW_AREA.z1 - SNOW_AREA.z0]} />
        <meshStandardMaterial ref={cover} color="#f4f8fc" roughness={0.95} transparent opacity={0} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <instancedMesh ref={prints} args={[geo, undefined, PRINTS]} frustumCulled={false} raycast={() => null} visible={false}>
        <meshBasicMaterial ref={printMat} color="#8394ad" transparent opacity={0} depthWrite={false} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
      </instancedMesh>
    </group>
  );
}

export function Weather() {
  return (
    <group>
      <Clock />
      <Precipitation />
      <Puddles />
      <SnowCover />
    </group>
  );
}
