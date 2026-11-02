"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { ControlsHelp, Crosshair, DirectionsBanner, FadeOverlay, InteractionPrompt, InteriorHeader, PointerHint, Speedometer, Toast, TouchControls } from "./Hud";
import { Icon } from "./Icon";
import { InfoPanel } from "./InfoPanel";
import { NavigationPanel } from "./NavigationPanel";
import { HouseToolbar, RoomToolbar, WorldDock } from "./Toolbars";

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

const GAME_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const s = useStore.getState();
      const playing = s.mode === "walk" || s.mode === "drive" || s.mode === "interior";
      if (playing && GAME_KEYS.has(e.code)) e.preventDefault();
      runtime.keys.add(e.code);
      if (e.repeat) return;

      switch (e.code) {
        case "KeyE":
          s.interaction?.action();
          break;
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
          if (s.mode === "walk") s.goOverhead();
          else if (s.mode === "drive") s.setWalk();
          else if (s.mode === "interior") s.exitInterior();
          else if (s.mode === "overhead" || s.mode === "house") s.goToRoom();
          else if (s.mode === "room") s.select(null);
          break;
      }
    };
    const up = (e: KeyboardEvent) => runtime.keys.delete(e.code);
    const blur = () => runtime.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

function Brand() {
  const mode = useStore((s) => s.mode);
  const label: Record<string, string> = {
    room: "Room view",
    transition: "Travelling…",
    overhead: "Overhead map",
    walk: "Walking",
    drive: "Driving",
    interior: "Inside",
    house: "Outside Andy's house",
  };
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/85 py-2 pl-2 pr-4 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-inner">
        <Icon name="layers" className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight text-slate-900">Carpet World Explorer</div>
        <div className="text-[11px] font-medium text-slate-500">{label[mode]}</div>
      </div>
    </div>
  );
}

export function AppShell() {
  useKeyboard();
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
          {mode === "interior" ? <InteriorHeader /> : <DirectionsBanner />}
          <Toast />
        </div>
        <div className="hidden sm:block">
          <ControlsHelp />
        </div>
      </div>

      {/* Left column: details & navigation */}
      <div className="pointer-events-none absolute left-3 top-20 flex flex-col gap-3 sm:left-4 sm:top-24">
        <InfoPanel />
        {mode !== "interior" && mode !== "transition" && mode !== "house" && <NavigationPanel />}
      </div>

      {/* Bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-3 sm:p-4">
        <InteractionPrompt />
        <PointerHint />
        {mode === "room" && (
          <>
            <p className="pointer-events-none hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur sm:block">
              Click a building to inspect it · double-click the rug to jump in
            </p>
            <RoomToolbar />
          </>
        )}
        {mode === "house" && (
          <>
            <p className="pointer-events-none hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur sm:block">
              Drag to pan · right-drag to orbit · scroll to zoom · Esc to go back inside
            </p>
            <HouseToolbar />
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3 sm:bottom-4 sm:left-4">
        <Speedometer />
        <TouchControls />
      </div>

      {inWorld && (
        <div className="pointer-events-none absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          <WorldDock />
        </div>
      )}

      <FadeOverlay />
    </main>
  );
}
