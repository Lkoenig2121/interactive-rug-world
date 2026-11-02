import { create } from "zustand";
import { EXT_Y } from "./house/layout";
import { groundHeight } from "./house/walkable";
import { currentOrigin, poseOnRoad, resetCar, resetPlayer, runtime, type Mount } from "./runtime";
import { landmarkById } from "./town/config";
import { planTownRoute, type TownRoute } from "./town/navigation";
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

  setHovered: (id: string | null) => void;
  select: (s: Selection) => void;
  cameraCmd: (kind: CameraCommand["kind"], lookAt?: { x: number; y: number; z: number }) => void;
  /** Jump the explore camera into a room (from the neighborhood view if needed). */
  lookRoom: (lookAt: { x: number; y: number; z: number }) => void;

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
  /** Fades out, moves the toy, and fades back in (doors, fast travel). */
  teleportToy: (p: { x: number; y: number; z: number }, yaw: number, toast?: string) => void;
}

/** Andy's front walk: where town routes start before a toy is out, and where one is dropped for navigation. */
const TOWN_HOME = { x: -800, z: 950 };

let flightId = 0;
let commandId = 0;
let toastId = 0;

function releasePointer() {
  if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
}

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
    setArrowPicker: (arrowPicker) => set({ arrowPicker }),
    openArcade: (arcadeGame) => set({ arcadeGame, townAutopilot: false, interaction: null }),
    closeArcade: () => set({ arcadeGame: null }),

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
      Object.assign(runtime.toy, { x: p.x, y: p.y, z: p.z, vy: 0, speed: 0, yaw: facing, camYaw: facing, mount: "none" });
      set({ toy: kind, spawning: null, mount: "none", travel: "walk" });
      get().recomputeTownRoute();
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
      if (get().interaction?.label === interaction?.label) return;
      set({ interaction });
    },
    showToast: (text) => set({ toast: { id: ++toastId, text } }),
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
  };
});
