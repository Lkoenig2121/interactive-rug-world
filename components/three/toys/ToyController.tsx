"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { hopOff, TRAIN_DECK, trainWorld } from "@/lib/explore/interact";
import { puddleAt, windPush } from "@/lib/explore/living";
import { DOME, flightCeiling, RING_RADIUS, RINGS, STARS_FOR_SKY, UPDRAFT } from "@/lib/explore/sky";
import { HOME_PAD, LAUNCH_TIME, rocketRise, SPACE, SPACE_GRAVITY, SPACE_JUMP, SPACE_SPAWN, spaceGround } from "@/lib/explore/space";
import { STARS } from "@/lib/explore/stars";
import { TOY_INDOOR_ZOOM } from "@/lib/house/doors";
import { EAVE_Y, EXT_Y, GROUND_Y, HOUSE, inRect, STOREY, UPPER_Y } from "@/lib/house/layout";
import { groundHeight, onRug, resolveWalls, STEP_HEIGHT, wallsNear } from "@/lib/house/walkable";
import { FOV, toyCameraPose } from "@/lib/three/cameraPoses";
import { runtime, type Mount } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { landmarkById, toWorld } from "@/lib/town/config";
import { placeAt, townInteraction } from "@/lib/town/interact";
import { nearestOnRoute, remainingLength, streetForSegment } from "@/lib/town/navigation";
import { clamp, wrapAngle, yawToDir } from "@/lib/world/geometry";

const GRAVITY = 980;
const LOOK_SPEED = 0.005;
/** Two Space presses closer together than this (seconds) toggle flight. */
const DOUBLE_TAP = 0.32;
const BOOST_SPEED = 4200;
const BOOST_TIME = 0.9;
/** Fuel use per second while hovering, extra while climbing or cruising fast, and per boost burst. */
const FUEL_HOVER = 0.008;
const FUEL_CLIMB = 0.03;
const FUEL_FAST = 0.015;
const FUEL_BOOST = 0.06;
const FUEL_REFILL = 0.4;
const GLIDE_SINK = 150;

/** How each way of getting around moves (cm, cm/s, rad/s) and where the camera sits. */
const PACE: Record<Mount, { walk: number; run: number; back: number; turn: number; radius: number; jump: number; cam: number; lift: number; accel: number }> = {
  none: { walk: 150, run: 480, back: 90, turn: 2.6, radius: 7, jump: 280, cam: 110, lift: 0, accel: 8 },
  car: { walk: 1300, run: 2600, back: 450, turn: 1.8, radius: 22, jump: 150, cam: 230, lift: 6, accel: 2.2 },
  horse: { walk: 450, run: 1500, back: 150, turn: 2.2, radius: 18, jump: 380, cam: 220, lift: 40, accel: 3 },
  fly: { walk: 900, run: 2800, back: 300, turn: 2, radius: 16, jump: 0, cam: 420, lift: 0, accel: 3 },
  ride: { walk: 0, run: 0, back: 0, turn: 2.2, radius: 7, jump: 0, cam: 320, lift: 0, accel: 8 },
};
const BOAT = { walk: 260, run: 620, back: 120, accel: 1.4 };

/** Fraction of the way from `a` to `b` where the segment first crosses a wall at height `y`, or 1. */
function firstWallHit(a: THREE.Vector3, b: THREE.Vector3, y: number) {
  let best = 1;
  const rx = b.x - a.x;
  const rz = b.z - a.z;
  const near = wallsNear(a.x, a.z);
  const far = wallsNear(b.x, b.z);
  for (const w of far === near ? near : near.concat(far)) {
    if (y < w.y0 || y >= w.y1) continue;
    const sx = w.bx - w.ax;
    const sz = w.bz - w.az;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-6) continue;
    const t = ((w.ax - a.x) * sz - (w.az - a.z) * sx) / den;
    const u = ((w.ax - a.x) * rz - (w.az - a.z) * rx) / den;
    if (t > 0 && t < best && u >= 0 && u <= 1) best = t;
  }
  return best;
}

/** Turns the jetpack on or off (double-tap Space or F). */
function toggleFlight() {
  const s = useStore.getState();
  const t = runtime.toy;
  if (s.toy !== "ranger") {
    s.showToast("Only the space ranger has a jetpack. Hold Space while falling to glide on a paper plane.");
    return;
  }
  if (t.mount === "fly") {
    s.setMount("none");
    return;
  }
  if (t.fuel < 0.05) {
    s.showToast("Jetpack is empty. Land to refuel.");
    return;
  }
  if (t.mount === "ride") t.ride = null;
  s.setMount("fly");
  t.vy = 320;
  t.gliding = false;
  s.showToast("Wings out! Hold Space to climb, C to descend, Shift to boost. Double-tap Space to land.");
}

/** Fires a laser bolt along the toy's facing (space level). */
function fireLaser() {
  const t = runtime.toy;
  const sp = runtime.explore.space;
  if (sp.shots.filter((s) => !s.enemy).length > 8) return;
  const d = yawToDir(t.yaw);
  sp.shots.push({ x: t.x + d.x * 20, y: t.y + 30, z: t.z + d.z * 20, vx: d.x * 2400, vz: d.z * 2400, t: runtime.town.clock, enemy: false });
}

/**
 * Third-person control of the toy: W/S to walk, A/D to turn, Shift to run, Space to jump, drag to look.
 * Double-tap Space (or F) flies the space ranger, H rides a horse (cowboy), R hops in an RC car, N opens town navigation.
 */
export function ToyController() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const checkTimer = useRef(0);
  const navTimer = useRef(0);
  const camPos = useRef<THREE.Vector3 | null>(null);
  const dragging = useRef(false);
  const lastSpace = useRef(-9);
  const ceilingToast = useRef(-99);
  const entering = useRef(false);
  const fuelToast = useRef(false);
  const boatToast = useRef(-99);

  useEffect(() => {
    camera.fov = FOV.toy;
    camera.near = 0.5;
    camera.updateProjectionMatrix();
    return () => useStore.getState().setInteraction(null);
  }, [camera]);

  // Camera distance follows the mount.
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.mount !== prev.mount) runtime.toy.camDist = PACE[s.mount].cam;
        if (s.mount !== "ride" && prev.mount === "ride") runtime.toy.ride = null;
      }),
    [],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.repeat || (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))) return;
      const s = useStore.getState();
      if (s.arcadeGame || s.launching || s.cutscene) return;
      const t = runtime.toy;
      const m = t.mount;
      if (m === "ride" && t.ride === "train" && (e.code === "KeyF" || e.code === "KeyH" || e.code === "KeyR")) {
        s.showToast("Press E to hop off the train first.");
        return;
      }
      switch (e.code) {
        case "Space": {
          const now = performance.now() / 1000;
          if (m === "ride") {
            // On the train Space jumps along the roof (handled per frame); only E gets you off.
            if (t.ride === "train") break;
            if (t.ride === "hitch") {
              hopOff();
              lastSpace.current = -9;
              break;
            }
            s.setMount("none");
            t.vy = 320;
            lastSpace.current = -9;
            break;
          }
          if (m === "car" || m === "horse") break;
          if (now - lastSpace.current < DOUBLE_TAP) {
            lastSpace.current = -9;
            toggleFlight();
          } else lastSpace.current = now;
          break;
        }
        case "ShiftLeft":
        case "ShiftRight":
          if (m === "fly" && t.boost <= 0 && t.fuel > FUEL_BOOST) {
            t.boost = BOOST_TIME;
            t.fuel -= FUEL_BOOST;
            runtime.town.triggers.boost = runtime.town.clock;
          }
          break;
        case "KeyF":
          toggleFlight();
          break;
        case "KeyH":
          if (m === "horse") s.setMount("none");
          else if (s.toy !== "cowboy") s.showToast("Only the cowboy whistles for a horse. Anyone can saddle up at the Roundup corral (E).");
          else {
            s.setMount("horse");
            s.showToast("Giddy-up! Shift to gallop, H to hop off.");
          }
          break;
        case "KeyR":
          if (!s.inSpace) s.setMount(m === "car" ? "none" : "car");
          break;
        case "KeyQ":
          if (s.inSpace) fireLaser();
          break;
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const t = runtime.toy;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    const down = (e: PointerEvent) => {
      dragging.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = 0;
    };
    const up = () => {
      if (dragging.current && moved < 5 && useStore.getState().inSpace) fireLaser();
      dragging.current = false;
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      t.camYaw -= (e.clientX - lastX) * LOOK_SPEED;
      t.camPitch = clamp(t.camPitch + (e.clientY - lastY) * LOOK_SPEED, -0.25, 1.35);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const indoor = inRect(t, HOUSE, 20) && t.mount !== "fly" && !useStore.getState().inSpace;
      const maxCam = indoor ? TOY_INDOOR_ZOOM : t.mount === "none" ? 900 : 3000;
      t.camDist = clamp(t.camDist * Math.exp(e.deltaY * 0.0015), 40, maxCam);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = runtime.keys;
    const t = runtime.toy;
    const store = useStore.getState();
    const pace = PACE[t.mount];
    runtime.town.clock = clock.elapsedTime;
    const inSpace = store.inSpace;
    const groundAt = inSpace ? spaceGround : groundHeight;
    const frozen = !!store.arcadeGame || !!store.cutscene;

    t.wings += ((t.mount === "fly" ? 1 : 0) - t.wings) * Math.min(1, dt * 9);

    // Rocket countdown: the toy rides the rocket up, then the space level fades in.
    const launchAt = runtime.explore.launchAt;
    if (store.launching && launchAt !== null) {
      const age = clock.elapsedTime - launchAt;
      const l = landmarkById.pizza;
      const base = toWorld(l, -l.w / 2 - 900, l.d / 2 + 200);
      const front = toWorld(l, -l.w / 2 - 900, l.d / 2 + 200 + 330);
      t.x = front.x;
      t.z = front.z;
      t.y = EXT_Y + 1500 + rocketRise(age);
      t.yaw = l.rot;
      t.speed = 0;
      t.vy = 0;
      const target = new THREE.Vector3(base.x, t.y + 200, base.z);
      const orbit = 2600 + Math.min(age, LAUNCH_TIME) * 300;
      const a = l.rot + 0.9 + age * 0.08;
      camera.position.set(base.x + Math.sin(a) * orbit, EXT_Y + 1200 + rocketRise(age) * 0.6, base.z + Math.cos(a) * orbit);
      camera.lookAt(target);
      camPos.current = camera.position.clone();
      if (age > LAUNCH_TIME && !entering.current) {
        entering.current = true;
        store.enterSpace();
      }
      return;
    }
    entering.current = false;

    let fwd = frozen ? 0 : (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    let turn = frozen ? 0 : (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
    let running = !frozen && (k.has("ShiftLeft") || k.has("ShiftRight"));

    // Autopilot steers along the route until you touch the controls.
    const route = store.townRoute;
    if (!frozen && !inSpace && store.townAutopilot && route && route.points.length > 1 && t.mount !== "ride") {
      if (fwd !== 0 || turn !== 0) useStore.setState({ townAutopilot: false });
      else {
        const nav = runtime.town.nav;
        const target = route.points[Math.min(nav.routeIndex + 1, route.points.length - 1)];
        const dx = target.x - t.x;
        const dz = target.z - t.z;
        const d = Math.hypot(dx, dz);
        const reach = Math.max(60, pace.radius * 4, Math.abs(t.speed) * 0.25);
        if (d < reach && nav.routeIndex < route.points.length - 2) nav.routeIndex++;
        const diff = wrapAngle(Math.atan2(-dx, -dz) - t.yaw);
        turn = clamp(diff * 3, -1, 1);
        fwd = Math.abs(diff) < 1.1 ? 1 : 0.25;
        running = true;
        if (nav.routeIndex >= route.points.length - 2 && d < reach * 0.6) fwd = 0;
      }
    }

    if (t.mount === "ride" || frozen) t.boating = false;
    if (t.mount === "ride") {
      // Carried by the train, carousel, garbage truck or a car roof.
      const id = t.ride;
      const r = id ? runtime.explore.rides[id] : null;
      if (!r || (id === "truck" && !runtime.explore.rides.truck.active) || (id === "hitch" && runtime.explore.rides.hitch.car < 0)) store.setMount("none");
      else if (id === "train" && !frozen) {
        // Free movement on the carriage roofs, in the train's own frame, clamped so you can't fall off.
        const tr = runtime.explore.rides.train;
        const o = t.onTrain;
        const walk = PACE.none;
        o.relYaw = wrapAngle(o.relYaw + turn * walk.turn * dt);
        t.yaw = wrapAngle(tr.trainYaw + o.relYaw);
        t.turn = turn;
        const targetSpeed = fwd > 0 ? (running ? walk.run : walk.walk) * fwd : fwd < 0 ? -walk.back : 0;
        t.speed += (targetSpeed - t.speed) * Math.min(1, dt * walk.accel);
        const dir = yawToDir(t.yaw);
        const dx = dir.x * t.speed * dt;
        const dz = dir.z * t.speed * dt;
        o.u = clamp(o.u + tr.heading * dx, TRAIN_DECK.u0, TRAIN_DECK.u1);
        o.v = clamp(o.v - tr.heading * dz, -TRAIN_DECK.v, TRAIN_DECK.v);
        if (o.h <= 0 && o.vy <= 0) {
          o.h = 0;
          o.vy = k.has("Space") ? walk.jump : 0;
        }
        if (o.h > 0 || o.vy > 0) {
          o.vy -= GRAVITY * dt;
          o.h = Math.max(0, o.h + o.vy * dt);
          if (o.h === 0) o.vy = 0;
        }
        const p = trainWorld(o.u, o.v);
        t.x = p.x;
        t.z = p.z;
        t.y = tr.y + o.h;
        t.vy = o.vy;
        t.phase += dt * t.speed * 0.085;
        if (!dragging.current) {
          const rate = Math.abs(t.speed) > 5 || turn !== 0 ? 5 : 2;
          t.camYaw += wrapAngle(t.yaw - t.camYaw) * Math.min(1, dt * rate);
        }
      } else if (id === "train") {
        t.speed = 0;
        const p = trainWorld(t.onTrain.u, t.onTrain.v);
        t.x = p.x;
        t.z = p.z;
      } else {
        t.x = r.x;
        t.y = r.y;
        t.z = r.z;
        t.yaw = r.yaw;
        t.speed = 0;
        t.vy = 0;
        if (!dragging.current) t.camYaw += wrapAngle(t.yaw - t.camYaw) * Math.min(1, dt * 2);
      }
    } else if (frozen) {
      t.turn = 0;
      t.speed = 0;
      t.vy = 0;
    } else {
      const flying = t.mount === "fly";
      t.turn = turn;
      t.yaw = wrapAngle(t.yaw + turn * pace.turn * dt * (t.mount === "car" ? clamp(Math.abs(t.speed) / 600, 0.25, 1) * Math.sign(t.speed || 1) : 1));
      // A paper boat in a rain puddle: quicker, but it drifts and takes a moment to get going.
      const weather = runtime.explore.weather;
      const boat = !inSpace && t.mount === "none" && t.vy === 0 && !!puddleAt(t, weather.puddles) && t.y - groundAt(t.x, t.z, t.y) < 3;
      if (boat && !t.boating && clock.elapsedTime - boatToast.current > 25) {
        boatToast.current = clock.elapsedTime;
        store.showToast("Paper boat! Sail across the puddle. The wind fills the sail.");
      }
      t.boating = boat;
      const move = boat ? BOAT : pace;
      let targetSpeed = fwd > 0 ? (running ? move.run : move.walk) * fwd : fwd < 0 ? -move.back : 0;
      if (flying && t.boost > 0) {
        targetSpeed = BOOST_SPEED;
        t.boost -= dt;
      }
      if (t.gliding) targetSpeed = Math.max(targetSpeed, flying ? pace.walk * 0.7 : 420);
      t.speed += (targetSpeed - t.speed) * Math.min(1, dt * (flying && t.boost > 0 ? 6 : move.accel));

      // The camera swings back behind the toy unless you are dragging to look around.
      if (!dragging.current) {
        const rate = Math.abs(t.speed) > 5 || turn !== 0 ? 5 : 2;
        t.camYaw += wrapAngle(t.yaw - t.camYaw) * Math.min(1, dt * rate);
      }

      const dir = yawToDir(t.yaw);
      const step = t.speed * dt;
      const tryMove = (dx: number, dz: number) => {
        const p = { x: t.x + dx, z: t.z + dz };
        if (!inSpace) resolveWalls(p, pace.radius, t.y + 2);
        const g = groundAt(p.x, p.z, t.y);
        if (!flying && g > t.y + STEP_HEIGHT) return false;
        t.x = p.x;
        t.z = p.z;
        return true;
      };
      // Long steps (fast mounts) are split so walls can't be skipped.
      const sub = Math.max(1, Math.ceil(Math.abs(step) / (pace.radius * 0.8)));
      for (let i = 0; i < sub && Math.abs(step) > 0.001; i++) {
        const s = step / sub;
        if (!tryMove(dir.x * s, dir.z * s) && !tryMove(dir.x * s, 0)) tryMove(0, dir.z * s);
      }

      const ground = groundAt(t.x, t.z, t.y);
      if (flying) {
        let climb = (k.has("Space") ? 1 : 0) - (k.has("KeyC") || k.has("ControlLeft") ? 1 : 0);
        const autoClimb = store.townAutopilot ? clamp((ground + 500 - t.y) / 200, -1, 1) : 0;
        const fast = Math.abs(t.speed) > pace.walk * 1.2;
        t.fuel -= dt * (FUEL_HOVER + (climb > 0 ? FUEL_CLIMB : 0) + (fast ? FUEL_FAST : 0)) * (inSpace ? 0.5 : 1);
        const updraft = !inSpace && Math.hypot(t.x - UPDRAFT.x, t.z - UPDRAFT.z) < UPDRAFT.r && t.y < DOME.y - 40;
        if (updraft) t.fuel = Math.min(1, t.fuel + dt * 0.6);
        if (t.fuel <= 0) {
          t.fuel = 0;
          t.gliding = true;
          climb = Math.min(climb, 0);
          if (!fuelToast.current) {
            fuelToast.current = true;
            store.showToast("Out of fuel! Gliding down. Land to refuel.");
          }
        } else if (t.fuel > 0.1) {
          t.gliding = false;
          fuelToast.current = false;
        }
        const wantVy = updraft && climb >= 0 ? 1800 : t.gliding && !climb ? -GLIDE_SINK : (climb || autoClimb) * 700;
        t.vy += (wantVy - t.vy) * Math.min(1, dt * 4);
        const ceiling = inSpace ? SPACE.y + 2600 : flightCeiling(store.stars.length);
        if (t.y >= ceiling - 2 && climb > 0 && !inSpace && clock.elapsedTime - ceilingToast.current > 8) {
          ceilingToast.current = clock.elapsedTime;
          store.showToast(
            store.stars.length < STARS_FOR_SKY
              ? `Your jetpack can't climb higher yet. Find ${STARS_FOR_SKY} stars to upgrade it (${store.stars.length} so far).`
              : "That's as high as the jetpack goes.",
          );
        }
        t.y = clamp(t.y + t.vy * dt, ground, ceiling);
        if (t.y - ground < 2) {
          t.fuel = Math.min(1, t.fuel + dt * FUEL_REFILL * 0.5);
          if (t.fuel <= 0.02 || (t.gliding && t.vy <= 0)) {
            t.gliding = false;
            store.setMount("none");
            store.showToast("Touchdown. Refuelling…");
          }
        }
      } else {
        const gravity = inSpace ? SPACE_GRAVITY : GRAVITY;
        const jump = inSpace && t.mount === "none" ? SPACE_JUMP : pace.jump;
        const grounded = t.vy <= 0 && t.y - ground < 4;
        if (grounded) {
          t.y = Math.max(ground, t.y - 400 * dt);
          if (t.y - ground < 4) t.y = ground;
          t.vy = 0;
          t.gliding = false;
          t.fuel = Math.min(1, t.fuel + dt * FUEL_REFILL);
          if (k.has("Space") && jump > 0) t.vy = jump;
        }
        if (t.vy !== 0 || t.y > ground) {
          t.vy -= gravity * dt;
          // Paper glider: hold Space on the way down.
          const glide = t.mount === "none" && t.vy < 0 && k.has("Space") && t.y - ground > 60;
          t.gliding = glide;
          if (glide) t.vy = Math.max(t.vy, -GLIDE_SINK);
          t.y += t.vy * dt;
          if (t.y <= ground) {
            t.y = ground;
            t.vy = 0;
            t.gliding = false;
          }
        }
      }
      // Wind gusts blow gliders and paper boats sideways.
      if (!inSpace && (t.gliding || boat) && weather.wind > 0.05) {
        const push = windPush(weather, clock.elapsedTime);
        const k = boat ? 0.35 : 1;
        tryMove(push.x * k * dt, push.z * k * dt);
      }
      t.phase += dt * t.speed * (t.mount === "horse" ? 0.012 : t.mount === "none" && !boat ? 0.085 : 0.02);

      // Fell off the little planet.
      if (inSpace && t.y < SPACE.y - 1500) {
        Object.assign(t, { ...SPACE_SPAWN, vy: 0, speed: 0 });
        runtime.explore.space.hearts = Math.max(0, runtime.explore.space.hearts - 1);
        runtime.explore.space.hitAt = clock.elapsedTime;
        runtime.town.snapCamera = true;
        store.showToast("Whoops, floated off the planet!");
      }
    }

    if (!inSpace) collectNearby(t, store, clock.elapsedTime);

    if (!inSpace && inRect(t, HOUSE, 20) && t.mount !== "fly" && t.camDist > TOY_INDOOR_ZOOM) {
      t.camDist += (TOY_INDOOR_ZOOM - t.camDist) * Math.min(1, dt * 6);
    }

    // Follow camera, pulled in when a wall would come between it and the toy.
    const pose = toyCameraPose({ ...t, y: t.y + pace.lift });
    if (!inSpace) {
      const hit = firstWallHit(pose.target, pose.pos, Math.min(pose.pos.y, pose.target.y));
      if (hit < 1) pose.pos.lerpVectors(pose.target, pose.pos, Math.max(0.05, hit - 6 / t.camDist));
      if (inRect(t, HOUSE) && t.y < EAVE_Y - 30) {
        const floor = t.y > (GROUND_Y + UPPER_Y) / 2 ? UPPER_Y : GROUND_Y;
        pose.pos.y = Math.min(pose.pos.y, floor + STOREY - 12);
      }
    }
    pose.pos.y = Math.max(pose.pos.y, groundAt(pose.pos.x, pose.pos.z, pose.pos.y) + 6);
    if (!camPos.current || runtime.town.snapCamera) {
      camPos.current = pose.pos.clone();
      runtime.town.snapCamera = false;
    }
    camPos.current.lerp(pose.pos, Math.min(1, dt * 12));
    camera.position.copy(camPos.current);
    camera.lookAt(pose.target);

    // New-friend cutscene: swing round in front of the toy and its new friend.
    const cut = store.cutscene;
    if (cut) {
      const age = clock.elapsedTime - cut.start;
      const dir = { x: -Math.sin(t.yaw), z: -Math.cos(t.yaw) };
      const mid = new THREE.Vector3(t.x + dir.x * 22, t.y + 14, t.z + dir.z * 22);
      const a = t.yaw + 0.9 - Math.min(age, 4) * 0.35;
      const r = 170 - Math.min(age, 3) * 25;
      const shot = new THREE.Vector3(mid.x - Math.sin(a) * r, t.y + 40, mid.z - Math.cos(a) * r);
      shot.y = Math.max(shot.y, groundAt(shot.x, shot.z, shot.y) + 6);
      camPos.current.lerp(shot, Math.min(1, dt * (age < 0.3 ? 6 : 4)));
      camera.position.copy(camPos.current);
      camera.lookAt(mid);
    }
    const near = clamp(t.camDist * 0.004, 0.5, 8);
    if (Math.abs(camera.near - near) > 0.05) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }

    checkTimer.current -= dt;
    if (checkTimer.current <= 0) {
      checkTimer.current = 0.15;
      if (frozen) store.setInteraction(null);
      else {
        const onTheRug = !inSpace && onRug(t) && t.y > -2 && t.y < 40 && t.mount === "none";
        store.setInteraction(onTheRug ? { label: "Shrink into Carpet World", action: () => useStore.getState().enterWorld({ at: { x: t.x, z: t.z } }) } : townInteraction(t, store.toy));
      }
    }

    // Turn-by-turn progress, re-routing when you wander off, and arrival.
    navTimer.current -= dt;
    if (navTimer.current <= 0) {
      navTimer.current = 0.4;
      store.setPlace(inSpace ? { district: "Planet Zurbo", landmark: Math.hypot(t.x - HOME_PAD.x, t.z - HOME_PAD.z) < 900 ? "Launch pad" : null } : placeAt(t));
      if (!inSpace && store.townNavigating && route && store.townDestination && route.points.length > 1) {
        const nav = runtime.town.nav;
        const near = nearestOnRoute(route.points, t);
        if (!store.townAutopilot) nav.routeIndex = near.index;
        else nav.routeIndex = Math.max(nav.routeIndex, near.index);
        if (near.dist > 1500 && !store.townAutopilot) {
          store.recomputeTownRoute();
          nav.routeIndex = 0;
        }
        nav.remaining = remainingLength(route.points, t, nav.routeIndex);
        nav.street = streetForSegment(route.points, nav.routeIndex);
        const end = route.points[route.points.length - 1];
        if (Math.hypot(end.x - t.x, end.z - t.z) < Math.max(250, pace.radius * 6)) {
          store.showToast(`You have arrived at ${landmarkById[store.townDestination].name}!`);
          runtime.town.triggers.wave = clock.elapsedTime;
          useStore.setState({ townNavigating: false, townAutopilot: false });
          t.speed = 0;
        }
      }
    }
  });

  return null;
}

/** Star pickups and the sky-dome ring course. */
function collectNearby(t: typeof runtime.toy, store: ReturnType<typeof useStore.getState>, now: number) {
  const night = runtime.explore.night > 0.5;
  for (const s of STARS) {
    if (s.night && !night) continue;
    if (Math.abs(s.x - t.x) > 160 || Math.abs(s.z - t.z) > 160) continue;
    if (Math.abs(s.y - (t.y + 20)) > 120) continue;
    if (store.stars.includes(s.id)) continue;
    runtime.town.triggers[`star-${s.id}`] = now;
    store.collectStar(s.id);
  }

  const ring = runtime.explore.ring;
  if (Math.abs(t.y - DOME.y) > 3000 || Math.hypot(t.x - DOME.x, t.z - DOME.z) > DOME.r + 600) {
    if (ring.active) {
      ring.active = false;
      ring.next = 0;
      store.showToast("Left the dome: ring run cancelled.");
    }
    return;
  }
  if (ring.active && now - ring.start > 180) {
    ring.active = false;
    ring.next = 0;
    store.showToast("Ring run timed out. Fly through the first ring to try again.");
  }
  const r = RINGS[ring.next];
  if (Math.hypot(t.x - r.x, t.y + 20 - r.y, t.z - r.z) > RING_RADIUS) return;
  runtime.town.triggers[`ring-${ring.next}`] = now;
  if (ring.next === 0) {
    ring.start = now;
    ring.active = true;
    store.showToast("Ring run started! Follow the glowing rings up the spiral.");
  }
  ring.next++;
  if (ring.next === RINGS.length) {
    ring.next = 0;
    ring.active = false;
    store.finishRings(now - ring.start);
  }
}