"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { missionObjective } from "@/lib/town/missions";
import { ControlsHelp, Crosshair, DirectionsBanner, FadeOverlay, InteractionPrompt, InteriorHeader, MissionMessage, PointerHint, Speedometer, Toast, TouchControls } from "./Hud";
import { Icon } from "./Icon";
import { InfoPanel } from "./InfoPanel";
import { NavigationPanel } from "./NavigationPanel";
import { PlaceBadge, TownDirections, TownNavigation } from "./TownNavigation";
import { ArcadeCabinet } from "./ArcadeCabinet";
import { ArrowPicker } from "./ArrowPicker";
import { Cutscene } from "./Cutscene";
import { EventChip, ExploreStatus, LaunchCountdown, SunnysideChip } from "./ExploreHud";
import { Radar } from "./Radar";
import { HouseToolbar, RoomToolbar, ToyToolbar, WorldDock } from "./Toolbars";

const Experience = dynamic(() => import("@/components/three/Experience"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#d8cdbd]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/60 border-t-blue-600" />
      <p className="text-sm font-medium text-slate-700">Rolling out the rug…</p>
    </div>
  );
}

const GAME_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"]);

function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const s = useStore.getState();
      // Match the letter as well as the key position so E works on any keyboard layout.
      const isUse = e.code === "KeyE" || e.key === "e" || e.key === "E";
      if (isUse && !s.arcadeGame && !s.cutscene) {
        e.preventDefault();
        if (!e.repeat) s.interaction?.action();
        return;
      }
      if (s.arcadeGame) {
        if (GAME_KEYS.has(e.code) || e.code === "KeyE") e.preventDefault();
        if (e.code === "Escape" && !e.repeat) s.closeArcade();
        return;
      }
      if (s.cutscene) {
        if (GAME_KEYS.has(e.code) || e.code === "KeyE") e.preventDefault();
        if (!e.repeat && (e.code === "Space" || e.code === "Enter" || e.code === "Escape")) s.endCutscene();
        return;
      }
      if ((e.code === "Enter" || e.code === "NumpadEnter") && s.messages.length) {
        e.preventDefault();
        if (!e.repeat) s.dismissMessage();
        return;
      }
      const playing = s.mode === "walk" || s.mode === "drive" || s.mode === "interior" || s.mode === "toy" || s.mode === "room" || s.mode === "house" || s.mode === "overhead";
      if (playing && GAME_KEYS.has(e.code)) e.preventDefault();
      runtime.keys.add(e.code);
      if (e.repeat) return;

      switch (e.code) {
        case "KeyF":
          if (s.mode === "walk") s.setDrive();
          else if (s.mode === "drive") s.setWalk();
          break;
        case "KeyM":
          if (s.mode === "walk" || s.mode === "drive") s.setMapExpanded(!s.mapExpanded);
          break;
        case "KeyN":
          if (s.mode !== "interior" && s.mode !== "transition" && s.mode !== "house") s.setNavPanelOpen(!s.navPanelOpen);
          break;
        case "Escape":
          if (s.arrowPicker) s.setArrowPicker(null);
          else if (s.spawning) s.cancelSpawn();
          else if (s.mode === "walk") s.goOverhead();
          else if (s.mode === "drive") s.setWalk();
          else if (s.mode === "interior") s.exitInterior();
          else if (s.mode === "overhead") s.returnHome();
          else if (s.mode === "toy") s.exploreHere();
          else if (s.mode === "house") s.goToRoom();
          else if (s.mode === "room") s.select(null);
          break;
      }
    };
    const up = (e: KeyboardEvent) => runtime.keys.delete(e.code);
    const blur = () => runtime.keys.clear();
    // Capture phase, so nothing in the page can swallow the keys before the game sees them.
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

function Brand() {
  const mode = useStore((s) => s.mode);
  const toy = useStore((s) => s.toy);
  const missionId = useStore((s) => s.missionId);
  const objective = missionObjective(missionId, !!toy);
  const done = missionId === "done";
  const label: Record<string, string> = {
    room: "Room view",
    transition: "Travelling…",
    overhead: "Overhead map",
    walk: "Walking",
    drive: "Driving",
    interior: "Inside",
    house: "Outside Andy's house",
    toy: "Playing as a toy",
  };
  return (
    <div className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl bg-white/85 py-2 pl-2 pr-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-blue-600 text-white shadow-inner">
        <Icon name="layers" className="h-5 w-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-bold tracking-tight text-slate-900">Carpet World Explorer</div>
        <div className={`mt-0.5 text-[11px] font-semibold leading-snug ${done ? "text-emerald-700" : "text-amber-800"}`}>{objective}</div>
        <div className="mt-0.5 text-[10px] font-medium text-slate-500">{label[mode]}</div>
      </div>
    </div>
  );
}

function SpawnHint() {
  const spawning = useStore((s) => s.spawning);
  const cancel = useStore((s) => s.cancelSpawn);
  if (!spawning) return null;
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-blue-600 py-2 pl-4 pr-2 text-sm font-semibold text-white shadow-2xl shadow-blue-600/30 animate-[panelIn_.2s_ease-out]">
      Click anywhere to drop the {spawning === "ranger" ? "space ranger" : "cowboy"} in
      <button onClick={cancel} className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30">
        Cancel
      </button>
    </div>
  );
}

export function AppShell() {
  useKeyboard();
  useEffect(() => {
    useStore.getState().hydrateMission();
    useStore.getState().hydrateExplore();
  }, []);
  const mode = useStore((s) => s.mode);
  const inWorld = mode === "walk" || mode === "drive" || mode === "overhead" || mode === "interior";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#d8cdbd] text-slate-900">
      <div className="absolute inset-0">
        <Experience />
      </div>

      <Crosshair />

      {/* Top row */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <Brand />
        <div className="flex flex-col items-center gap-2">
          {mode === "interior" ? <InteriorHeader /> : mode === "toy" ? <TownDirections /> : <DirectionsBanner />}
          <PlaceBadge />
          <EventChip />
          <SunnysideChip />
          <Toast />
          <MissionMessage />
        </div>
        <div className="hidden sm:block">
          <ControlsHelp />
        </div>
      </div>

      {/* Left column: details & navigation */}
      <div className="pointer-events-none absolute left-3 top-24 flex flex-col gap-3 sm:left-4 sm:top-28">
        <Radar />
        <InfoPanel />
        {mode === "toy" ? <TownNavigation /> : mode !== "interior" && mode !== "transition" && mode !== "house" && <NavigationPanel />}
      </div>

      {/* Bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-3 sm:p-4">
        <ArrowPicker />
        <InteractionPrompt />
        <PointerHint />
        <SpawnHint />
        {mode === "toy" && (
          <>
            <p className="pointer-events-none hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur sm:block">
              W/S to walk · A/D to turn · double-tap Space to fly · hold Space while falling to glide · E to use · N for the map · T skips time
            </p>
            <ToyToolbar />
          </>
        )}
        {mode === "room" && (
          <>
            <p className="pointer-events-none hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur sm:block">
              WASD to pan this room · click a doorway arrow to change rooms
            </p>
            <RoomToolbar />
          </>
        )}
        {mode === "house" && (
          <>
            <p className="pointer-events-none hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur sm:block">
              WASD to pan · drag to look around · zoom in on Andy&apos;s room to see inside
            </p>
            <HouseToolbar />
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3 sm:bottom-4 sm:left-4">
        <ExploreStatus />
        <Speedometer />
        <TouchControls />
      </div>

      {inWorld && (
        <div className="pointer-events-none absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          <WorldDock />
        </div>
      )}

      <Cutscene />
      <LaunchCountdown />
      <FadeOverlay />
      <ArcadeCabinet />
    </main>
  );
}
