"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, type IconName } from "./Icon";
import { MiniMap } from "./MiniMap";

function ToolButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  showLabel,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-40 ${
        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-700 hover:bg-slate-900/5"
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {showLabel && <span className="hidden whitespace-nowrap md:inline">{label}</span>}
    </button>
  );
}

function useFullscreen() {
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  return [fs, toggle] as const;
}

/** Minimal toolbar for the room view. */
export function RoomToolbar() {
  const enterWorld = useStore((s) => s.enterWorld);
  const cameraCmd = useStore((s) => s.cameraCmd);
  const setNavPanelOpen = useStore((s) => s.setNavPanelOpen);
  const navOpen = useStore((s) => s.navPanelOpen);
  const goOutside = useStore((s) => s.goOutside);
  const [fs, toggleFs] = useFullscreen();
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/85 p-1.5 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 backdrop-blur-xl">
      <button
        onClick={() => enterWorld()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-400 hover:to-blue-500 active:scale-95"
      >
        <Icon name="enter" className="h-5 w-5" />
        <span className="whitespace-nowrap">Enter Carpet World</span>
      </button>
      <span className="mx-1 h-6 w-px bg-slate-300/70" />
      <ToolButton icon="plus" label="Zoom in" onClick={() => cameraCmd("zoomIn")} />
      <ToolButton icon="minus" label="Zoom out" onClick={() => cameraCmd("zoomOut")} />
      <ToolButton icon="reset" label="Reset camera" onClick={() => cameraCmd("reset")} />
      <ToolButton icon="nav" label="Directions" active={navOpen} onClick={() => setNavPanelOpen(!navOpen)} />
      <ToolButton icon="home" label="Outside" showLabel onClick={goOutside} />
      <ToolButton icon={fs ? "shrink" : "expand"} label="Toggle fullscreen" onClick={toggleFs} />
    </div>
  );
}

/** Toolbar for the outside view of the house and neighborhood. */
export function HouseToolbar() {
  const goToRoom = useStore((s) => s.goToRoom);
  const cameraCmd = useStore((s) => s.cameraCmd);
  const [fs, toggleFs] = useFullscreen();
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/85 p-1.5 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 backdrop-blur-xl">
      <button
        onClick={goToRoom}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-400 hover:to-blue-500 active:scale-95"
      >
        <Icon name="room" className="h-5 w-5" />
        <span className="whitespace-nowrap">Back to Andy&apos;s room</span>
      </button>
      <span className="mx-1 h-6 w-px bg-slate-300/70" />
      <ToolButton icon="plus" label="Zoom in" onClick={() => cameraCmd("zoomIn")} />
      <ToolButton icon="minus" label="Zoom out" onClick={() => cameraCmd("zoomOut")} />
      <ToolButton icon="reset" label="Reset camera" onClick={() => cameraCmd("reset")} />
      <ToolButton icon={fs ? "shrink" : "expand"} label="Toggle fullscreen" onClick={toggleFs} />
    </div>
  );
}

/** Corner dock inside Carpet World: minimap plus mode switches. */
export function WorldDock() {
  const mode = useStore((s) => s.mode);
  const goToRoom = useStore((s) => s.goToRoom);
  const goOverhead = useStore((s) => s.goOverhead);
  const setWalk = useStore((s) => s.setWalk);
  const setDrive = useStore((s) => s.setDrive);
  const resetPosition = useStore((s) => s.resetPosition);
  const navOpen = useStore((s) => s.navPanelOpen);
  const setNavPanelOpen = useStore((s) => s.setNavPanelOpen);
  const expanded = useStore((s) => s.mapExpanded);
  const setExpanded = useStore((s) => s.setMapExpanded);
  const cameraCmd = useStore((s) => s.cameraCmd);
  const [fs, toggleFs] = useFullscreen();
  const inInterior = mode === "interior";

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-2xl bg-white/88 shadow-2xl shadow-slate-900/25 ring-1 ring-black/5 backdrop-blur-xl transition-[width] duration-300 ${
        expanded ? "w-[min(560px,calc(100vw-2rem))]" : "w-[min(300px,calc(100vw-2rem))]"
      }`}
    >
      {!inInterior && mode !== "overhead" && (
        <div className="relative p-1.5 pb-0">
          <div className="overflow-hidden rounded-xl ring-1 ring-black/10">
            <MiniMap />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute right-3 top-3 rounded-lg bg-white/85 p-1 text-slate-600 shadow ring-1 ring-black/5 hover:text-slate-900"
            aria-label={expanded ? "Shrink map" : "Expand map"}
          >
            <Icon name={expanded ? "shrink" : "expand"} className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-0.5 p-1.5">
        <ToolButton icon="room" label="Room View" onClick={goToRoom} />
        <ToolButton icon="map" label="Overhead Map" onClick={goOverhead} active={mode === "overhead"} />
        <ToolButton icon="walk" label="Walking Mode" onClick={setWalk} active={mode === "walk"} disabled={inInterior} />
        <ToolButton icon="car" label="Driving Mode" onClick={setDrive} active={mode === "drive"} disabled={inInterior} />
        <ToolButton icon="nav" label="Navigation" onClick={() => setNavPanelOpen(!navOpen)} active={navOpen} disabled={inInterior} />
        <ToolButton icon="target" label="Reset Position" onClick={resetPosition} />
        {mode === "overhead" && (
          <>
            <ToolButton icon="plus" label="Zoom in" onClick={() => cameraCmd("zoomIn")} />
            <ToolButton icon="minus" label="Zoom out" onClick={() => cameraCmd("zoomOut")} />
          </>
        )}
        <ToolButton icon={fs ? "shrink" : "expand"} label="Toggle fullscreen" onClick={toggleFs} />
      </div>
    </div>
  );
}
