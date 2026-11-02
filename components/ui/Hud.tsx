"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { buildingById } from "@/lib/world/buildings";
import { interiors } from "@/lib/world/interiors";
import { Icon, ManeuverIcon } from "./Icon";
import { formatDistance, formatEta } from "./NavigationPanel";

export function DirectionsBanner() {
  const hud = useStore((s) => s.hud);
  const route = useStore((s) => s.route);
  const mode = useStore((s) => s.mode);
  const navigating = useStore((s) => s.navigating);
  const autopilot = useStore((s) => s.autopilot);
  const setDestination = useStore((s) => s.setDestination);
  const enterInterior = useStore((s) => s.enterInterior);
  const startNavigation = useStore((s) => s.startNavigation);
  if (!route || (mode !== "walk" && mode !== "drive")) return null;
  const dest = buildingById[route.destinationId];

  if (!navigating && !hud?.arrived) {
    return (
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/92 py-2 pl-4 pr-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
        <Icon name="pin" className="h-5 w-5 text-red-500" />
        <div className="text-sm">
          <div className="font-semibold text-slate-900">{dest?.name}</div>
          <div className="text-slate-500">
            {formatEta(route.length, mode)} · {formatDistance(route.length)}
          </div>
        </div>
        <button onClick={startNavigation} className="ml-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500">
          Start
        </button>
      </div>
    );
  }

  if (!hud) return null;
  return (
    <div className="pointer-events-auto w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/30 ring-1 ring-black/10 animate-[panelIn_.25s_ease-out]">
      <div className={`flex items-center gap-4 px-4 py-3 text-white ${hud.arrived ? "bg-emerald-600" : "bg-[#0f6e4f]"}`}>
        <ManeuverIcon type={hud.maneuver} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          {!hud.arrived && <div className="text-2xl font-bold tabular-nums leading-none">{formatDistance(hud.distanceToManeuver)}</div>}
          <div className="mt-1 truncate text-sm font-medium text-white/90">{hud.instruction}</div>
        </div>
        {autopilot && (
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <Icon name="autopilot" className="h-3.5 w-3.5" /> Auto
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-white/95 px-4 py-2 text-sm backdrop-blur-xl">
        {hud.arrived ? (
          <span className="font-semibold text-emerald-700">You&apos;ve arrived</span>
        ) : (
          <span>
            <span className="font-semibold text-emerald-700">{formatEta(hud.remaining, mode)}</span>
            <span className="text-slate-500"> · {formatDistance(hud.remaining)} to {dest?.name}</span>
          </span>
        )}
        <div className="flex gap-1.5">
          {hud.arrived && dest?.interior && (
            <button onClick={() => enterInterior(dest.id)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500">
              Go inside
            </button>
          )}
          <button onClick={() => setDestination(null)} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            {hud.arrived ? "Done" : "End"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Speedometer() {
  const speed = useStore((s) => s.speed);
  const mode = useStore((s) => s.mode);
  if (mode !== "drive") return null;
  return (
    <div className="pointer-events-none flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-900/75 text-white shadow-2xl ring-4 ring-white/10 backdrop-blur-xl">
      <span className="text-3xl font-bold tabular-nums leading-none">{speed}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">km/h</span>
    </div>
  );
}

export function InteractionPrompt() {
  const interaction = useStore((s) => s.interaction);
  const arcade = useStore((s) => s.arcadeGame);
  if (!interaction || arcade) return null;
  return (
    <button
      onClick={() => interaction.action()}
      className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900/80 py-2 pl-2 pr-5 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-slate-900 animate-[panelIn_.2s_ease-out]"
    >
      <kbd className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">E</kbd>
      {interaction.label}
    </button>
  );
}

export function Crosshair() {
  const mode = useStore((s) => s.mode);
  if (mode !== "walk" && mode !== "interior") return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_0_2px_rgba(15,23,42,0.35)]" />
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  const [dismissedId, setDismissedId] = useState(-1);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setDismissedId(toast.id), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);
  const visible = toast && toast.id !== dismissedId ? toast : null;
  if (!visible) return null;
  return (
    <div key={visible.id} className="pointer-events-none rounded-2xl bg-white/95 px-5 py-3 text-sm font-medium text-slate-800 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl animate-[panelIn_.25s_ease-out]">
      {visible.text}
    </div>
  );
}

export function FadeOverlay() {
  const fading = useStore((s) => s.fading);
  return <div className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-300 ${fading ? "opacity-100" : "opacity-0"}`} />;
}

const HELP: Record<string, [string, string][]> = {
  room: [
    ["W A S D / arrows", "Pan inside this room"],
    ["Drag", "Rotate & tilt"],
    ["Scroll", "Zoom (stays inside the house)"],
    ["Door arrows", "The only way to another room"],
    ["Click", "Inspect buildings & roads"],
    ["Double-click", "Drop into the rug there"],
  ],
  overhead: [
    ["W A S D / arrows", "Pan the map"],
    ["Drag", "Rotate & tilt"],
    ["Click", "Pick a place"],
    ["Esc", "Back to the room"],
  ],
  walk: [
    ["W A S D", "Walk"],
    ["Mouse", "Look around (click to capture)"],
    ["Shift", "Run"],
    ["Space", "Jump"],
    ["E", "Interact / enter"],
    ["F", "Drive the car"],
    ["Esc", "Exit walking mode"],
  ],
  drive: [
    ["W / ↑", "Accelerate"],
    ["S / ↓", "Brake / reverse"],
    ["A D / ← →", "Steer"],
    ["Space", "Handbrake"],
    ["E", "Park & go inside"],
    ["Esc", "Exit driving mode"],
  ],
  toy: [
    ["W / S", "Walk forward / back"],
    ["A / D", "Turn"],
    ["Shift", "Run"],
    ["Space", "Jump / climb while flying"],
    ["F / H / R", "Fly / ride / RC car"],
    ["N", "Town map & directions"],
    ["E", "Enter a doorway or building"],
    ["Click the rug", "Shrink into Carpet World"],
  ],
  house: [
    ["W A S D / arrows", "Pan the neighborhood"],
    ["Drag", "Rotate & tilt"],
    ["Scroll", "Zoom (into Andy's room too)"],
    ["Double-click", "Drop into the rug there"],
    ["Esc", "Back to Andy's room"],
  ],
  interior: [
    ["W A S D", "Walk"],
    ["Mouse", "Look around"],
    ["E", "Interact"],
    ["Esc", "Leave the building"],
  ],
};

export function ControlsHelp() {
  const mode = useStore((s) => s.mode);
  const show = useStore((s) => s.showHelp);
  const setShow = useStore((s) => s.setShowHelp);
  const rows = HELP[mode];
  if (!rows) return null;
  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="pointer-events-auto rounded-full bg-white/85 p-2 text-slate-600 shadow-lg ring-1 ring-black/5 backdrop-blur hover:text-slate-900" aria-label="Show controls">
        <Icon name="help" className="h-5 w-5" />
      </button>
    );
  }
  return (
    <div className="pointer-events-auto hidden w-56 rounded-2xl bg-slate-900/70 p-3 text-xs text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl sm:block">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wider text-white/60">Controls</span>
        <button onClick={() => setShow(false)} className="text-white/50 hover:text-white" aria-label="Hide controls">
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold">{k}</kbd>
            <span className="text-right text-white/80">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PointerHint() {
  const mode = useStore((s) => s.mode);
  const locked = useStore((s) => s.pointerLocked);
  if (mode !== "walk" && mode !== "interior") return null;
  return (
    <div className="pointer-events-none rounded-full bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
      {locked ? "Esc releases the mouse · Esc again exits" : "Click the scene to look around with the mouse"}
    </div>
  );
}

export function InteriorHeader() {
  const id = useStore((s) => s.interiorId);
  const exit = useStore((s) => s.exitInterior);
  const goToRoom = useStore((s) => s.returnHome);
  if (!id) return null;
  const def = interiors[id];
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/92 py-2 pl-4 pr-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <span className="h-8 w-1.5 rounded-full" style={{ background: def.accent }} />
      <div>
        <div className="text-sm font-bold text-slate-900">{def.title}</div>
        <div className="text-xs text-slate-500">{def.subtitle}</div>
      </div>
      <button onClick={exit} className="ml-2 flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
        <Icon name="door" className="h-4 w-4" /> Exit
      </button>
      <button onClick={goToRoom} className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
        <Icon name="room" className="h-4 w-4" /> Room
      </button>
    </div>
  );
}

function HoldButton({ code, label }: { code: string; label: string }) {
  const press = (on: boolean) => (on ? runtime.keys.add(code) : runtime.keys.delete(code));
  return (
    <button
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        press(true);
      }}
      onPointerUp={() => press(false)}
      onPointerCancel={() => press(false)}
      className="flex h-12 w-12 select-none items-center justify-center rounded-xl bg-white/80 text-lg font-bold text-slate-700 shadow-lg ring-1 ring-black/5 backdrop-blur active:bg-blue-100"
    >
      {label}
    </button>
  );
}

/** On-screen controls for touch devices. */
export function TouchControls() {
  const mode = useStore((s) => s.mode);
  const touch = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  if (!touch || (mode !== "walk" && mode !== "drive" && mode !== "interior" && mode !== "toy" && mode !== "room" && mode !== "house" && mode !== "overhead")) return null;
  return (
    <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
      <span />
      <HoldButton code="KeyW" label="▲" />
      <span />
      <HoldButton code={mode === "drive" ? "KeyA" : "ArrowLeft"} label="◀" />
      <HoldButton code="KeyS" label="▼" />
      <HoldButton code={mode === "drive" ? "KeyD" : "ArrowRight"} label="▶" />
    </div>
  );
}
