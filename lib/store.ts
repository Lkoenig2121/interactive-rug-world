import { create } from "zustand";
import { currentOrigin, poseOnRoad, resetCar, resetPlayer, runtime } from "./runtime";
import { buildingById, poseInFrontOf } from "./world/buildings";
import { pointInsideAnyBox, worldColliders } from "./world/colliders";
import { dist, yawToRight } from "./world/geometry";
import { interiors } from "./world/interiors";
import { findRoute, projectToNetwork } from "./world/pathfinding";
import { ROAD_CLEARANCE } from "./world/roads";
import type { InteriorId, ManeuverType, Pose, Route, Vec2 } from "./world/types";

export type Mode = "room" | "transition" | "overhead" | "walk" | "drive" | "interior" | "house";
export type WorldMode = "walk" | "drive";

export type Selection =
  | { kind: "building"; id: string }
  | { kind: "road"; edgeId: string; point: Vec2 }
  | { kind: "location"; point: Vec2 }
  | null;

export type Flight =
  | { id: number; kind: "enter"; pose: Pose; next: WorldMode }
  | { id: number; kind: "room" }
  | { id: number; kind: "overhead" }
  | { id: number; kind: "house" };

export interface CameraCommand {
  id: number;
  kind: "zoomIn" | "zoomOut" | "reset";
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

  setHovered: (id: string | null) => void;
  select: (s: Selection) => void;
  cameraCmd: (kind: CameraCommand["kind"]) => void;

  enterWorld: (opts?: { buildingId?: string; at?: Vec2; mode?: WorldMode }) => void;
  completeFlight: () => void;
  goToRoom: () => void;
  goOverhead: () => void;
  /** Fly out of Andy's window to look at the house and neighborhood. */
  goOutside: () => void;
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
}

let flightId = 0;
let commandId = 0;
let toastId = 0;

function releasePointer() {
  if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
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

    setHovered: (id) => set({ hoveredId: id }),
    select: (selection) => set({ selection }),
    cameraCmd: (kind) => set({ cameraCommand: { id: ++commandId, kind } }),

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
        autopilot: false,
        interaction: null,
        interiorId: null,
        interiorBuildingId: null,
        hud: null,
      });
    },

    goOverhead: () => {
      releasePointer();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "overhead" },
        autopilot: false,
        interaction: null,
        interiorId: null,
        interiorBuildingId: null,
        selection: null,
      });
    },

    goOutside: () => {
      releasePointer();
      set({
        mode: "transition",
        flight: { id: ++flightId, kind: "house" },
        autopilot: false,
        interaction: null,
        selection: null,
        hoveredId: null,
        navPanelOpen: false,
      });
    },

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
      if (mode === "room" || mode === "overhead") get().enterWorld();
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
  };
});
