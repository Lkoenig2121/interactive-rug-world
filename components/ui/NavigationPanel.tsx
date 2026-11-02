"use client";

import { useStore } from "@/lib/store";
import { buildingById, destinations, TYPE_COLORS, TYPE_LABELS } from "@/lib/world/buildings";
import { Icon, ManeuverIcon } from "./Icon";

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatEta(meters: number, mode: string) {
  const speed = mode === "drive" ? 14 : 6;
  const s = Math.round(meters / speed);
  return s < 60 ? `${Math.max(1, s)} s` : `${Math.round(s / 60)} min`;
}

/** Google-Maps style destination picker with route summary and step list. */
export function NavigationPanel() {
  const open = useStore((s) => s.navPanelOpen);
  const setOpen = useStore((s) => s.setNavPanelOpen);
  const destinationId = useStore((s) => s.destinationId);
  const route = useStore((s) => s.route);
  const mode = useStore((s) => s.mode);
  const navigating = useStore((s) => s.navigating);
  const autopilot = useStore((s) => s.autopilot);
  const setDestination = useStore((s) => s.setDestination);
  const startNavigation = useStore((s) => s.startNavigation);
  const setAutopilot = useStore((s) => s.setAutopilot);
  if (!open) return null;
  const dest = destinationId ? buildingById[destinationId] : null;
  const travelMode = mode === "drive" ? "drive" : "walk";

  return (
    <div className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/92 shadow-2xl shadow-slate-900/25 ring-1 ring-black/5 backdrop-blur-xl animate-[panelIn_.25s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="nav" className="h-4 w-4 text-blue-600" /> Navigation
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close navigation">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
          <span className="text-slate-600">Your location</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <Icon name="pin" className="h-4 w-4 text-red-500" />
          <span className={dest ? "font-semibold text-slate-900" : "text-slate-400"}>{dest ? dest.name : "Choose a destination"}</span>
        </div>
      </div>

      {route && dest ? (
        <div className="space-y-3 px-4 pb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{formatEta(route.length, travelMode)}</span>
            <span className="text-sm text-slate-500">({formatDistance(route.length)}) · via {route.maneuvers[0]?.text.split(" on ").pop()}</span>
          </div>
          <ol className="max-h-44 space-y-1 overflow-y-auto pr-1 text-sm">
            {route.maneuvers.map((m, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-slate-700 hover:bg-slate-50">
                <ManeuverIcon type={m.type} className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="flex-1">{m.text}</span>
                <span className="text-xs tabular-nums text-slate-400">{formatDistance(m.s)}</span>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            {!navigating ? (
              <button
                onClick={startNavigation}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                <Icon name="nav" className="h-4 w-4" /> Start
              </button>
            ) : (
              <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> Navigating
              </span>
            )}
            {mode === "drive" && (
              <button
                onClick={() => setAutopilot(!autopilot)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  autopilot ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon name="autopilot" className="h-4 w-4" /> Autopilot
              </button>
            )}
            <button onClick={() => setDestination(null)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {destinations.map((b) => (
            <button
              key={b.id}
              onClick={() => setDestination(b.id)}
              className="group flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left text-sm transition hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
            >
              <span className="h-7 w-7 shrink-0 rounded-lg shadow-inner" style={{ background: TYPE_COLORS[b.type] }} />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-800">{b.type === "home" ? "Home" : b.name.replace("Carpet ", "")}</span>
                <span className="block truncate text-[11px] text-slate-500">{TYPE_LABELS[b.type]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
