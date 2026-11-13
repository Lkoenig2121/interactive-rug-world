import { create } from "zustand";
import type { WorldEvent } from "./explore/events";
import { FRIENDS, friendById } from "./explore/friends";
import { loadProgress, saveProgress } from "./explore/progress";
import { STARS_FOR_SKY, STARS_FOR_SPACE } from "./explore/sky";
import { SPACE_SPAWN } from "./explore/space";
import { starById, STARS } from "./explore/stars";
import { EXPLORE_EYE, houseFloorAt, placeById, placeCenter } from "./house/doors";
import { EXT_Y, GROUND_Y } from "./house/layout";
import { groundHeight } from "./house/walkable";
import { currentOrigin, poseOnRoad, resetCar, resetPlayer, runtime, type Mount } from "./runtime";
import { doorInside, landmarkById, toWorld } from "./town/config";
import { landmarkFloor } from "./town/colliders";
import { isMissionId, MISSION_STORAGE_KEY, missionStep, nextMission, type MissionId } from "./town/missions";
import { landmarkContaining, planTownRoute, type TownRoute } from "./town/navigation";
import { buildingById, poseInFrontOf } from "./world/buildings";
import { pointInsideAnyBox, worldColliders } from "./world/colliders";
import { dist, yawToRight } from "./world/geometry";
import { interiors } from "./world/interiors";
import { findRoute, projectToNetwork } from "./world/pathfinding";
import { ROAD_CLEARANCE } from "./world/roads";
import type { InteriorId, ManeuverType, Pose, Route, Vec2 } from "./world/types";

export type Mode = "room" | "transition" | "overhead" | "walk" | "drive" | "interior" | "house" | "toy";
export type WorldMode = "walk" | "drive";
export type ToyKind = "ranger" | "cowboy";
export type ArcadeGame = "invaders" | "blasters";
export type { MissionId };

export type Selection =
  | { kind: "building"; id: string }
  | { kind: "road"; edgeId: string; point: Vec2 }
  | { kind: "location"; point: Vec2 }
  | null;

export type Flight =
  | { id: number; kind: "enter"; pose: Pose; next: WorldMode }
  | { id: number; kind: "room" }
  | { id: number; kind: "overhead" }
  | { id: number; kind: "house" }
  | { id: number; kind: "toy" };

export interface CameraCommand {
  id: number;
  kind: "zoomIn" | "zoomOut" | "reset" | "look";
  lookAt?: { x: number; y: number; z: number };
  lookFrom?: { x: number; y: number; z: number };
}

export interface Hud {
  instruction: string;
  maneuver: ManeuverType;
  distanceToManeuver: number;
  remaining: number;
  arrived: boolean;
  speed: number;
}

export interface Interaction {
  label: string;
  action: () => void;
}

interface State {
  mode: Mode;
  flight: Flight | null;
  cameraCommand: CameraCommand | null;
  hoveredId: string | null;
  selection: Selection;
  destinationId: string | null;
  route: Route | null;
  navigating: boolean;
  autopilot: boolean;
  interiorId: InteriorId | null;
  interiorBuildingId: string | null;
  interiorToggles: Record<string, boolean>;
  fading: boolean;
  interaction: Interaction | null;
  toast: { id: number; text: string } | null;
  /** Mission and story messages waiting to be read; each stays up until Enter (or a click). */
  messages: { id: number; text: string }[];
  hud: Hud | null;
  speed: number;
  pointerLocked: boolean;
  navPanelOpen: boolean;
  mapExpanded: boolean;
  showHelp: boolean;
  /** The toy you play as once it has been dropped somewhere. */
  toy: ToyKind | null;
  /** A toy waiting for you to click where it should be dropped. */
  spawning: ToyKind | null;
  /** Town navigation (house scale): chosen landmark, its road route, and whether we're following it. */
  townDestination: string | null;
  townRoute: TownRoute | null;
  townNavigating: boolean;
  townAutopilot: boolean;
  /** How the toy gets around town: on foot or in its RC car. */
  travel: "walk" | "drive";
  mount: Mount;
  /** District and nearby landmark around the toy, for the location badge. */
  place: { district: string | null; landmark: string | null } | null;
  townMapOpen: boolean;
  /** Stacked doorway arrows the player must pick from. */
  arrowPicker: string[] | null;
  /** Pizza Planet cabinet currently filling the screen. */
  arcadeGame: ArcadeGame | null;
  /** Rescue quest: Sid's backyard, then the film landmarks, then home. */
  missionId: MissionId;
  /** Whether Squeak (the yellow rubber dino companion) is drawn. */
  showSqueak: boolean;
  setShowSqueak: (show: boolean) => void;
  /** Exploration: collected star ids, ring-course best, boss beaten, events finished. */
  stars: string[];
  ringBest: number | null;
  bossDefeated: boolean;
  eventsDone: number;
  /** Toy friends found, and those already delivered to the shelf in Andy's room (the rest follow you). */
  friends: string[];
  friendsHome: string[];
  /** "You found a friend" cutscene in progress (clock time it started). */
  cutscene: { friendId: string; start: number } | null;
  worldEvent: WorldEvent | null;
  isNight: boolean;
  /** Rocket countdown in progress, and whether the toy is on the space level. */
  launching: boolean;
  inSpace: boolean;

  setHovered: (id: string | null) => void;
  select: (s: Selection) => void;
  cameraCmd: (kind: CameraCommand["kind"], lookAt?: { x: number; y: number; z: number }) => void;
  /** Jump the explore camera into a room (from the neighborhood view if needed). */
  lookRoom: (lookAt: { x: number; y: number; z: number }) => void;
  /** Click-to-enter a neighborhood building (Andy, Sid, Pizza Planet, etc.). */
  enterLandmark: (id: string) => void;

  enterWorld: (opts?: { buildingId?: string; at?: Vec2; mode?: WorldMode }) => void;
  completeFlight: () => void;
  goToRoom: () => void;
  goOverhead: () => void;
  /** Fly out of Andy's window to look at the house and neighborhood. */
  goOutside: () => void;
  startSpawn: (kind: ToyKind) => void;
  cancelSpawn: () => void;
  /** Drops the chosen toy at a point in the house or neighborhood and flies to it. */
  spawnToy: (p: { x: number; y: number; z: number }, facing: number) => void;
  goToToy: () => void;
  /** Leaves toy mode for the free explore camera, framed on wherever the toy is right now. */
  exploreHere: () => void;
  /** Back from Carpet World: to the toy if one is out, otherwise the room view. */
  returnHome: () => void;
  setWalk: () => void;
  setDrive: () => void;
  resetPosition: () => void;

  setDestination: (id: string | null) => void;
  recomputeRoute: () => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  setAutopilot: (on: boolean) => void;
  setHud: (hud: Hud | null) => void;
  setSpeed: (s: number) => void;

  enterInterior: (buildingId: string) => void;
  exitInterior: () => void;
  toggleInterior: (id: string) => void;

  setInteraction: (i: Interaction | null) => void;
  showToast: (text: string) => void;
  showMessage: (text: string) => void;
  dismissMessage: () => void;
  setPointerLocked: (v: boolean) => void;
  setNavPanelOpen: (v: boolean) => void;
  setMapExpanded: (v: boolean) => void;
  setShowHelp: (v: boolean) => void;

  setTownDestination: (id: string | null) => void;
  recomputeTownRoute: () => void;
  /** Starts following the route; drops a toy at Andy's front door first if none is out. */
  startTownNavigation: (autopilot: boolean) => void;
  stopTownNavigation: () => void;
  setTravel: (t: "walk" | "drive") => void;
  setMount: (m: Mount) => void;
  setPlace: (p: State["place"]) => void;
  setTownMapOpen: (v: boolean) => void;
  setArrowPicker: (ids: string[] | null) => void;
  openArcade: (game: ArcadeGame) => void;
  closeArcade: () => void;
  beginMission: () => void;
  completeMissionStep: () => void;
  hydrateMission: () => void;
  /** Fades out, moves the toy, and fades back in (doors, fast travel). */
  teleportToy: (p: { x: number; y: number; z: number }, yaw: number, toast?: string) => void;

  hydrateExplore: () => void;
  collectStar: (id: string) => void;
  finishRings: (seconds: number) => void;
  setWorldEvent: (e: WorldEvent | null) => void;
  completeEvent: (toast: string) => void;
  /** Recruits a lost toy: it joins your conga line and a short cutscene plays. */
  findFriend: (id: string) => void;
  endCutscene: () => void;
  /** Followers hop onto the shelf once you bring them into Andy's room. */
  deliverFriends: () => void;
  setNight: (night: boolean) => void;
  /** Starts the rocket countdown at Pizza Planet (once space is unlocked). */
  launchRocket: () => void;
  enterSpace: () => void;
  /** Back from space to the Pizza Planet launch pad. */
  exitSpace: () => void;
  defeatBoss: () => void;
}

/** Space opens after the rescue, or for anyone who has found enough stars. */
export const spaceUnlocked = (s: { missionId: MissionId; stars: string[] }) => s.missionId === "done" || s.stars.length >= STARS_FOR_SPACE;

/** Where the toy lands back from space: beside the Pizza Planet rocket pad. */
export function launchPad() {
  const l = landmarkById.pizza;
  return toWorld(l, -l.w / 2 - 900, l.d / 2 + 700);
}

/** Andy's front walk: where town routes start before a toy is out, and where one is dropped for navigation. */
const TOWN_HOME = { x: -800, z: 950 };

let flightId = 0;
let commandId = 0;
let toastId = 0;

function releasePointer() {
  if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
}

function loadMission(): MissionId {
  if (typeof window === "undefined") return "idle";
  try {
    const raw = window.localStorage.getItem(MISSION_STORAGE_KEY);
    if (raw && isMissionId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "idle";
}

function persistMission(id: MissionId) {
  try {
    window.localStorage.setItem(MISSION_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

const SQUEAK_STORAGE_KEY = "carpet-show-squeak";

/** Whether rug buildings, roads and the rug itself respond to hover, clicks and double-clicks. */
export function rugPickable() {
  const { mode, spawning } = useStore.getState();
  if (mode === "overhead") return true;
  return (mode === "room" || mode === "house" || mode === "toy") && !spawning && !runtime.houseShellVisible;
}

/** A walkable spot for an arbitrary clicked rug position. */
function walkablePoseNear(p: Vec2): Pose {
  const pr = projectToNetwork(p);
  const free = pr.dist > ROAD_CLEARANCE + 0.5 && !pointInsideAnyBox(p, worldColliders, 1);
  if (free) {
    const toRoad = { x: pr.point.x - p.x, z: pr.point.z - p.z };
    return { x: p.x, z: p.z, yaw: Math.atan2(-toRoad.x, -toRoad.z) };
  }
  const road = poseOnRoad(p, undefined, 0);
  const right = yawToRight(road.yaw);
  const side = (p.x - pr.point.x) * right.x + (p.z - pr.point.z) * right.z >= 0 ? 1 : -1;
  return { x: pr.point.x + right.x * 6.2 * side, z: pr.point.z + right.z * 6.2 * side, yaw: road.yaw };
}

export const useStore = create<State>((set, get) => {
  const fade = (fn: () => void) => {
    set({ fading: true });
    window.setTimeout(() => {
      fn();
      window.setTimeout(() => set({ fading: false }), 120);
    }, 380);
  };
  /** Leaving toy mode from space puts the toy back on the launch pad. */
  const dropSpace = () => {
    runtime.explore.launchAt = null;
    if (!get().inSpace && !get().launching) return;
    if (get().inSpace) {
      const p = launchPad();
      Object.assign(runtime.toy, { x: p.x, y: EXT_Y, z: p.z, vy: 0, speed: 0, mount: "none" });
    }
    set({ inSpace: false, launching: false, mount: "none" });
  };
  const persist = () => {
    const s = get();
    saveProgress({ stars: s.stars, ringBest: s.ringBest, bossDefeated: s.bossDefeated, eventsDone: s.eventsDone, friends: s.friends, friendsHome: s.friendsHome });
  };

  return {
    mode: "room",
    flight: null,
    cameraCommand: null,
    hoveredId: null,
    selection: null,
    destinationId: null,
    route: null,
    navigating: false,
    autopilot: false,
    interiorId: null,
    interiorBuildingId: null,
    interiorToggles: {},
    fading: false,
    interaction: null,
    toast: null,
    messages: [],
    hud: null,
    speed: 0,
    pointerLocked: false,
    navPanelOpen: false,
    mapExpanded: false,
    showHelp: true,
    toy: null,
    spawning: null,
    townDestination: null,
    townRoute: null,
    townNavigating: false,
    townAutopilot: false,
    travel: "walk",
    mount: "none",
    place: null,
    townMapOpen: false,
    arrowPicker: null,
    arcadeGame: null,
    missionId: "idle",
    showSqueak: true,
    stars: [],
    ringBest: null,
    bossDefeated: false,
    eventsDone: 0,
    friends: [],
    friendsHome: [],
    cutscene: null,
    worldEvent: null,
    isNight: false,
    launching: false,
    inSpace: false,

    setHovered: (id) => set({ hoveredId: id }),
    select: (selection) => set({ selection }),
    cameraCmd: (kind, lookAt) => set({ cameraCommand: { id: ++commandId, kind, lookAt } }),
    lookRoom: (lookAt) => {
      const fromOutside = get().mode === "house" || get().mode === "transition";
      set({
        mode: fromOutside ? "room" : get().mode,
        flight: fromOutside ? null : get().flight,
        cameraCommand: { id: ++commandId, kind: "look", lookAt },
        arrowPicker: null,
      });
    },
    enterLandmark: (id) => {
      if (id === "andy") {
        if (get().mode === "toy") {
          get().teleportToy({ x: -800, y: groundHeight(-800, 400, GROUND_Y), z: 400 }, 0, "Inside Andy's house");
          return;
        }
        const foyer = placeById("foyer");
        if (foyer) get().lookRoom(placeCenter(foyer));
        return;
      }
      const l = landmarkById[id];
      if (!l) return;
      if (get().mode === "toy") {
        const p = doorInside(l, Math.min(280, l.d * 0.35));
        get().teleportToy({ x: p.x, y: landmarkFloor(l), z: p.z }, l.rot, `Inside ${l.name}`);
        return;
      }
      const from = doorInside(l, Math.min(420, l.d * 0.28));
      const at = toWorld(l, l.door?.offset ?? 0, -Math.min(l.d * 0.2, 400));
      const y = landmarkFloor(l) + EXPLORE_EYE;
      set({
        mode: "house",
        flight: null,
        arrowPicker: null,
        cameraCommand: {
          id: ++commandId,
          kind: "look",
          lookAt: { x: at.x, y, z: at.z },
          lookFrom: { x: from.x, y, z: from.z },
        },
      });
    },
    setArrowPicker: (arrowPicker) => set({ arrowPicker }),
    openArcade: (arcadeGame) => set({ arcadeGame, townAutopilot: false, interaction: null }),
    closeArcade: () => set({ arcadeGame: null }),

    hydrateMission: () => {
      const id = loadMission();
      if (id !== get().missionId) set({ missionId: id });
      try {
        if (window.localStorage.getItem(SQUEAK_STORAGE_KEY) === "hidden") set({ showSqueak: false });
      } catch {
        /* ignore */
      }
    },
    setShowSqueak: (show) => {
      set({ showSqueak: show });
      try {
        window.localStorage.setItem(SQUEAK_STORAGE_KEY, show ? "shown" : "hidden");
      } catch {
        /* ignore */
      }
      get().showToast(show ? "Squeak is back by your side!" : "Squeak is hiding for now.");
    },
    beginMission: () => {
      if (get().missionId !== "idle" && get().missionId !== "done") return;
      persistMission("sid-rescue");
      set({ missionId: "sid-rescue" });
      get().setTownDestination("sid");
      get().showMessage("A toy is trapped next door. Check the neighbor's backyard.");
    },
    completeMissionStep: () => {
      const cur = get().missionId;
      const step = missionStep(cur);
      const next = nextMission(cur);
      persistMission(next);
      set({ missionId: next });
      if (step) get().showMessage(step.doneToast);
      if (next !== "done") {
        const nxt = missionStep(next);
        if (nxt) get().setTownDestination(nxt.landmark);
      }
    },

    enterWorld: (opts = {}) => {
      const next: WorldMode = opts.mode ?? runtime.lastWorldMode;
      let pose: Pose = { x: runtime.player.x, z: runtime.player.z, yaw: runtime.player.yaw };
      if (opts.buildingId && buildingById[opts.buildingId]) pose = poseInFrontOf(buildingById[opts.buildingId]);
      else if (opts.at) pose = walkablePoseNear(opts.at);
      Object.assign(runtime.player, pose, { pitch: 0 });

      if (next === "drive") {
        const carPose = poseOnRoad(pose, pose.yaw);
        Object.assign(runtime.car, carPose, { speed: 0, steer: 0 });
        pose = carPose;
      }
      runtime.lastWorldMode = next;
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "enter", pose, next },
        spawning: null,
        selection: null,
        hoveredId: null,
        interaction: null,
      });
      if (get().destinationId) get().recomputeRoute();
    },

    completeFlight: () => {
      const f = get().flight;
      if (!f) return;
      set({ mode: f.kind === "enter" ? f.next : f.kind, flight: null });
    },

    goToRoom: () => {
      releasePointer();
      dropSpace();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "room" },
        cameraCommand: null,
        arrowPicker: null,
        spawning: null,
        autopilot: false,
        interaction: null,
        interiorId: null,
        interiorBuildingId: null,
        hud: null,
        arcadeGame: null,
      });
    },

    goOverhead: () => {
      releasePointer();
      dropSpace();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "overhead" },
        spawning: null,
        autopilot: false,
        interaction: null,
        interiorId: null,
        interiorBuildingId: null,
        selection: null,
        arcadeGame: null,
      });
    },

    goOutside: () => {
      releasePointer();
      dropSpace();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "house" },
        cameraCommand: null,
        arrowPicker: null,
        spawning: null,
        autopilot: false,
        interaction: null,
        selection: null,
        hoveredId: null,
        navPanelOpen: false,
        arcadeGame: null,
      });
    },

    startSpawn: (kind) => set({ spawning: kind, selection: null, hoveredId: null, navPanelOpen: false }),
    cancelSpawn: () => set({ spawning: null }),

    spawnToy: (p, facing) => {
      const kind = get().spawning;
      if (!kind) return;
      get().hydrateMission();
      get().hydrateExplore();
      Object.assign(runtime.toy, { x: p.x, y: p.y, z: p.z, vy: 0, speed: 0, yaw: facing, camYaw: facing, mount: "none", fuel: 1, gliding: false, ride: null });
      set({ toy: kind, spawning: null, mount: "none", travel: "walk" });
      get().recomputeTownRoute();
      const mission = get().missionId;
      if (mission === "idle") get().beginMission();
      else if (mission !== "done") {
        const step = missionStep(mission);
        if (step) get().setTownDestination(step.landmark);
      }
      get().goToToy();
    },

    goToToy: () => {
      if (!get().toy) return;
      releasePointer();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "toy" },
        autopilot: false,
        interaction: null,
        interiorId: null,
        interiorBuildingId: null,
        selection: null,
        hoveredId: null,
        navPanelOpen: false,
        hud: null,
      });
    },

    exploreHere: () => {
      const t = runtime.toy;
      if (!get().toy || get().inSpace || get().launching) {
        get().goToRoom();
        return;
      }
      releasePointer();
      if (t.mount === "ride") get().setMount("none");
      const common = { flight: null, arrowPicker: null, spawning: null, townAutopilot: false, interaction: null, selection: null, hoveredId: null, arcadeGame: null };
      // Inside Andy's house: the room view, locked to whichever room the toy is in.
      if (houseFloorAt(t) !== null) {
        set({ ...common, mode: "room", cameraCommand: { id: ++commandId, kind: "look", lookAt: { x: t.x, y: t.y + EXPLORE_EYE, z: t.z } } });
        return;
      }
      // Inside a town building: stand at eye height a little behind the toy, like clicking to enter.
      const inside = landmarkContaining(t);
      const back = { x: Math.sin(t.camYaw), z: Math.cos(t.camYaw) };
      if (inside) {
        const y = landmarkFloor(inside) + EXPLORE_EYE;
        set({
          ...common,
          mode: "house",
          cameraCommand: { id: ++commandId, kind: "look", lookAt: { x: t.x, y, z: t.z }, lookFrom: { x: t.x + back.x * 350, y, z: t.z + back.z * 350 } },
        });
        return;
      }
      // Outdoors: orbit view looking down at the toy from behind.
      const pitch = Math.max(0.5, t.camPitch);
      const dist = 1400;
      set({
        ...common,
        mode: "house",
        cameraCommand: {
          id: ++commandId,
          kind: "look",
          lookAt: { x: t.x, y: t.y, z: t.z },
          lookFrom: { x: t.x + back.x * Math.cos(pitch) * dist, y: t.y + Math.sin(pitch) * dist, z: t.z + back.z * Math.cos(pitch) * dist },
        },
      });
    },

    returnHome: () => (get().toy ? get().goToToy() : get().goToRoom()),

    setWalk: () => {
      const { mode } = get();
      if (mode === "walk") return;
      if (mode === "drive") {
        fade(() => {
          const c = runtime.car;
          const right = yawToRight(c.yaw);
          const spot = { x: c.x + right.x * 3.4, z: c.z + right.z * 3.4 };
          Object.assign(runtime.player, spot, { yaw: c.yaw, pitch: 0 });
          c.speed = 0;
          runtime.lastWorldMode = "walk";
          set({ mode: "walk", autopilot: false });
          get().recomputeRoute();
        });
        return;
      }
      if (mode === "interior") return;
      get().enterWorld({ mode: "walk" });
    },

    setDrive: () => {
      const { mode } = get();
      if (mode === "drive") return;
      if (mode === "walk") {
        releasePointer();
        fade(() => {
          const p = runtime.player;
          if (dist(p, runtime.car) > 14) {
            Object.assign(runtime.car, poseOnRoad(p, p.yaw), { speed: 0, steer: 0 });
          }
          runtime.lastWorldMode = "drive";
          set({ mode: "drive", interaction: null });
          get().recomputeRoute();
        });
        return;
      }
      if (mode === "interior") return;
      get().enterWorld({ mode: "drive" });
    },

    resetPosition: () => {
      const { mode } = get();
      const apply = () => {
        resetPlayer();
        resetCar();
        get().recomputeRoute();
      };
      if (mode === "walk" || mode === "drive") fade(apply);
      else if (mode === "interior") {
        fade(() => {
          apply();
          set({ mode: "walk", interiorId: null, interiorBuildingId: null, interaction: null });
        });
      } else apply();
    },

    setDestination: (id) => {
      if (!id) {
        set({ destinationId: null, route: null, navigating: false, autopilot: false, hud: null });
        return;
      }
      const route = findRoute(currentOrigin(get().mode), id);
      set({ destinationId: id, route, navigating: false, hud: null });
    },

    recomputeRoute: () => {
      const id = get().destinationId;
      if (!id) return;
      const route = findRoute(currentOrigin(get().mode), id);
      set({ route });
    },

    startNavigation: () => {
      const { mode, destinationId } = get();
      if (!destinationId) return;
      set({ navigating: true, navPanelOpen: false });
      if (mode === "room" || mode === "overhead" || mode === "house" || mode === "toy") get().enterWorld();
    },

    stopNavigation: () => set({ navigating: false, autopilot: false }),
    setAutopilot: (on) => set({ autopilot: on, navigating: on ? true : get().navigating }),
    setHud: (hud) => set({ hud }),
    setSpeed: (speed) => set({ speed }),

    enterInterior: (buildingId) => {
      const b = buildingById[buildingId];
      if (!b?.interior) return;
      releasePointer();
      const def = interiors[b.interior];
      fade(() => {
        Object.assign(runtime.interiorPlayer, { x: def.doorX, z: def.size.d / 2 - 1.5, yaw: 0, pitch: 0 });
        set({
          mode: "interior",
          interiorId: b.interior!,
          interiorBuildingId: buildingId,
          interiorToggles: {},
          interaction: null,
          navigating: false,
          autopilot: false,
        });
        if (get().destinationId === buildingId) set({ destinationId: null, route: null, hud: null });
      });
    },

    exitInterior: () => {
      const id = get().interiorBuildingId;
      releasePointer();
      fade(() => {
        if (id) Object.assign(runtime.player, poseInFrontOf(buildingById[id], 4), { pitch: 0 });
        runtime.player.yaw += Math.PI;
        runtime.lastWorldMode = "walk";
        set({ mode: "walk", interiorId: null, interiorBuildingId: null, interaction: null });
      });
    },

    toggleInterior: (id) => set((s) => ({ interiorToggles: { ...s.interiorToggles, [id]: !s.interiorToggles[id] } })),

    setInteraction: (interaction) => {
      const current = get().interaction;
      if (current && interaction && current.label === interaction.label) {
        // Same prompt: keep the object (no re-render) but always run the latest action.
        current.action = interaction.action;
        return;
      }
      if (current === interaction) return;
      set({ interaction });
    },
    showToast: (text) => set({ toast: { id: ++toastId, text } }),
    showMessage: (text) => {
      const queue = get().messages;
      if (queue.some((m) => m.text === text)) return;
      set({ messages: [...queue, { id: ++toastId, text }].slice(-5) });
    },
    dismissMessage: () => set({ messages: get().messages.slice(1) }),
    setPointerLocked: (pointerLocked) => set({ pointerLocked }),
    setNavPanelOpen: (navPanelOpen) => set({ navPanelOpen }),
    setMapExpanded: (mapExpanded) => set({ mapExpanded }),
    setShowHelp: (showHelp) => set({ showHelp }),

    setTownDestination: (id) => {
      if (!id || !landmarkById[id]) {
        set({ townDestination: null, townRoute: null, townNavigating: false, townAutopilot: false });
        return;
      }
      const from = get().toy ? runtime.toy : TOWN_HOME;
      set({ townDestination: id, townRoute: planTownRoute(from, landmarkById[id]), townNavigating: false, townAutopilot: false });
    },

    recomputeTownRoute: () => {
      const id = get().townDestination;
      if (!id) return;
      runtime.town.nav.routeIndex = 0;
      set({ townRoute: planTownRoute(get().toy ? runtime.toy : TOWN_HOME, landmarkById[id]) });
    },

    startTownNavigation: (autopilot) => {
      const s = get();
      if (!s.townDestination) return;
      if (!s.toy) {
        Object.assign(runtime.toy, { x: TOWN_HOME.x, y: groundHeight(TOWN_HOME.x, TOWN_HOME.z, EXT_Y), z: TOWN_HOME.z, vy: 0, speed: 0, yaw: Math.PI, camYaw: Math.PI });
        set({ toy: "cowboy" });
      }
      if (s.travel === "drive" && runtime.toy.mount === "none") get().setMount("car");
      get().recomputeTownRoute();
      set({ townNavigating: true, townAutopilot: autopilot, navPanelOpen: false });
      if (get().mode !== "toy") get().goToToy();
    },

    stopTownNavigation: () => set({ townNavigating: false, townAutopilot: false }),

    setTravel: (travel) => {
      set({ travel });
      if (get().mode === "toy") {
        if (travel === "drive" && runtime.toy.mount !== "car") get().setMount("car");
        if (travel === "walk" && runtime.toy.mount === "car") get().setMount("none");
      }
    },

    setMount: (mount) => {
      runtime.toy.mount = mount;
      if (mount === "fly") runtime.toy.vy = 0;
      set({ mount, travel: mount === "car" ? "drive" : mount === "none" ? "walk" : get().travel });
    },

    setPlace: (place) => {
      const cur = get().place;
      if (cur?.district === place?.district && cur?.landmark === place?.landmark) return;
      set({ place });
    },
    setTownMapOpen: (townMapOpen) => set({ townMapOpen }),

    teleportToy: (p, yaw, toast) => {
      fade(() => {
        Object.assign(runtime.toy, { x: p.x, y: p.y, z: p.z, vy: 0, speed: 0, yaw, camYaw: yaw });
        runtime.town.snapCamera = true;
        if (toast) get().showToast(toast);
        if (get().townDestination) get().recomputeTownRoute();
      });
    },

    hydrateExplore: () => {
      const p = loadProgress();
      set({ stars: p.stars, ringBest: p.ringBest, bossDefeated: p.bossDefeated, eventsDone: p.eventsDone, friends: p.friends, friendsHome: p.friendsHome });
    },
    collectStar: (id) => {
      const s = get();
      if (s.stars.includes(id)) return;
      const stars = [...s.stars, id];
      set({ stars });
      persist();
      const n = stars.length;
      if (n === STARS_FOR_SKY) get().showMessage(`Star ${n}! Jetpack upgraded: fly high enough to reach the sky dome.`);
      else if (n === STARS_FOR_SPACE && s.missionId !== "done") get().showMessage(`Star ${n}! The Pizza Planet rocket is ready for launch.`);
      else get().showToast(`Star collected: ${starById[id]?.label ?? id} (${n}/${STARS.length})`);
    },
    finishRings: (seconds) => {
      const best = get().ringBest;
      const record = best === null || seconds < best;
      if (record) set({ ringBest: seconds });
      persist();
      get().showToast(record ? `New ring record: ${seconds.toFixed(1)} s!` : `Ring course: ${seconds.toFixed(1)} s (best ${best!.toFixed(1)} s)`);
    },
    setWorldEvent: (worldEvent) => set({ worldEvent }),
    completeEvent: (toast) => {
      const kind = get().worldEvent?.kind;
      set({ worldEvent: null, eventsDone: get().eventsDone + 1 });
      persist();
      get().showMessage(toast);
      const friend = FRIENDS.find((f) => f.event === kind);
      if (friend) get().findFriend(friend.id);
    },
    findFriend: (id) => {
      const s = get();
      if (s.friends.includes(id) || !friendById[id]) return;
      set({ friends: [...s.friends, id], cutscene: { friendId: id, start: runtime.town.clock }, interaction: null, townAutopilot: false });
      runtime.town.triggers.wave = runtime.town.clock;
      persist();
    },
    endCutscene: () => {
      const c = get().cutscene;
      if (!c) return;
      set({ cutscene: null });
      const following = get().friends.length - get().friendsHome.length;
      get().showMessage(`${friendById[c.friendId]?.name ?? "Your new friend"} is following you${following > 1 ? ` (with ${following - 1} other${following > 2 ? "s" : ""})` : ""}. Bring them home to Andy's room!`);
    },
    deliverFriends: () => {
      const s = get();
      const arriving = s.friends.filter((f) => !s.friendsHome.includes(f));
      if (!arriving.length) return;
      const friendsHome = [...s.friendsHome, ...arriving];
      set({ friendsHome });
      persist();
      const names = arriving.map((f) => friendById[f]?.name ?? f);
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      s.showMessage(`${list} hopped onto the shelf in Andy's room! (${friendsHome.length}/${FRIENDS.length} friends home)`);
    },
    setNight: (isNight) => {
      if (get().isNight !== isNight) set({ isNight });
    },
    launchRocket: () => {
      if (get().launching || get().inSpace) return;
      runtime.explore.launchAt = runtime.town.clock;
      set({ launching: true, interaction: null, townAutopilot: false, townNavigating: false });
      get().showToast("Countdown started. Hold on tight!");
    },
    enterSpace: () => {
      fade(() => {
        Object.assign(runtime.explore.space, { hearts: 3, bossHp: get().bossDefeated ? 0 : 12, hitAt: -99, bossHitAt: -99, shots: [] });
        Object.assign(runtime.toy, { ...SPACE_SPAWN, vy: 0, speed: 0, yaw: Math.PI, camYaw: Math.PI, mount: "none", fuel: 1, gliding: false, ride: null });
        runtime.explore.launchAt = null;
        runtime.town.snapCamera = true;
        set({ inSpace: true, launching: false, mount: "none" });
        get().showMessage("Welcome to Planet Zurbo! Low gravity: jump high. Q or click fires your laser.");
      });
    },
    exitSpace: () => {
      fade(() => {
        const p = launchPad();
        Object.assign(runtime.toy, { x: p.x, y: EXT_Y, z: p.z, vy: 0, speed: 0, yaw: 0, camYaw: 0, mount: "none", gliding: false, ride: null });
        runtime.explore.launchAt = null;
        runtime.town.snapCamera = true;
        set({ inSpace: false, launching: false, mount: "none" });
        get().showToast("Splashdown at Pizza Planet!");
      });
    },
    defeatBoss: () => {
      if (get().bossDefeated) return;
      set({ bossDefeated: true });
      persist();
      get().showMessage("Baron Voltrix is beaten! The planet's critters are free.");
    },
  };
});
