"use client";

import { districtProgress } from "@/lib/explore/stars";
import { useStore } from "@/lib/store";
import { DISTRICTS, landmarkById } from "@/lib/town/config";
import { missionStep } from "@/lib/town/missions";
import { DESTINATIONS } from "@/lib/town/navigation";
import { Icon } from "./Icon";
import { formatDistance } from "./NavigationPanel";

const HIGHLIGHT = new Set(["andy", "sid", "pizza", "toybarn", "dino", "daycare", "bonnie", "western", "terminal", "landfill"]);

function eta(cm: number, travel: "walk" | "drive") {
  const speed = travel === "drive" ? 1800 : 150;
  const s = Math.max(1, Math.round(cm / speed));
  return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
}

/** Destination picker for walking the town as a toy. */
export function TownNavigation() {
  const open = useStore((s) => s.navPanelOpen);
  const setOpen = useStore((s) => s.setNavPanelOpen);
  const destId = useStore((s) => s.townDestination);
  const route = useStore((s) => s.townRoute);
  const navigating = useStore((s) => s.townNavigating);
  const travel = useStore((s) => s.travel);
  const setDest = useStore((s) => s.setTownDestination);
  const start = useStore((s) => s.startTownNavigation);
  const stop = useStore((s) => s.stopTownNavigation);
  const setTravel = useStore((s) => s.setTravel);
  const missionLandmark = missionStep(useStore((s) => s.missionId))?.landmark;
  if (!open) return null;
  const dest = destId ? landmarkById[destId] : null;
  const picks = DESTINATIONS.filter((l) => HIGHLIGHT.has(l.id));
  const rest = DESTINATIONS.filter((l) => !HIGHLIGHT.has(l.id));

  return (
    <div className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/92 shadow-2xl shadow-slate-900/25 ring-1 ring-black/5 backdrop-blur-xl animate-[panelIn_.25s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="nav" className="h-4 w-4 text-blue-600" /> Town map
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close navigation">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3">
        {(["walk", "drive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTravel(t)}
            className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${travel === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {t === "walk" ? "Walk" : "RC car"}
          </button>
        ))}
      </div>

      {route && dest ? (
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <Icon name="pin" className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-slate-900">{dest.name}</span>
          </div>
          <p className="text-xs text-slate-500">{dest.blurb}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{eta(route.length, travel)}</span>
            <span className="text-sm text-slate-500">
              ({formatDistance(route.length / 100)}) · via {route.streets[0] ?? "the lawn"}
            </span>
          </div>
          <ol className="max-h-36 space-y-1 overflow-y-auto pr-1 text-sm">
            {route.streets.map((name, i) => (
              <li key={`${name}-${i}`} className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {name}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            {!navigating ? (
              <>
                <button
                  onClick={() => start(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                >
                  <Icon name="nav" className="h-4 w-4" /> Start
                </button>
                <button onClick={() => start(true)} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
                  Auto
                </button>
              </>
            ) : (
              <button onClick={stop} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
                Stop
              </button>
            )}
            <button onClick={() => setDest(null)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Landmarks</p>
          <div className="grid grid-cols-1 gap-1.5">
            {picks.map((l) => (
              <button
                key={l.id}
                onClick={() => setDest(l.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 ${l.id === missionLandmark ? "bg-amber-50 ring-1 ring-amber-300" : "bg-slate-50"}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.district === "andy" ? "#8cc97a" : "#3b82f6" }} />
                <span>
                  <span className="block font-semibold text-slate-800">
                    {l.name}
                    {l.id === missionLandmark ? <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">Rescue</span> : null}
                  </span>
                  <span className="block text-[11px] text-slate-500">{l.blurb}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="pt-1 text-xs font-medium text-slate-500">More places</p>
          <div className="grid grid-cols-2 gap-1.5">
            {rest.map((l) => (
              <button key={l.id} onClick={() => setDest(l.id)} className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50">
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact turn-by-turn strip while following a town route. */
export function TownDirections() {
  const destId = useStore((s) => s.townDestination);
  const route = useStore((s) => s.townRoute);
  const navigating = useStore((s) => s.townNavigating);
  const travel = useStore((s) => s.travel);
  const start = useStore((s) => s.startTownNavigation);
  const stop = useStore((s) => s.stopTownNavigation);
  const setDest = useStore((s) => s.setTownDestination);
  if (!route || !destId) return null;
  const dest = landmarkById[destId];
  if (!dest) return null;
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/92 py-2 pl-4 pr-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
      <Icon name="pin" className="h-5 w-5 text-red-500" />
      <div className="text-sm">
        <div className="font-semibold text-slate-900">{dest.name}</div>
        <div className="text-slate-500">
          {eta(route.length, travel)} · {formatDistance(route.length / 100)}
        </div>
      </div>
      {!navigating ? (
        <button onClick={() => start(false)} className="ml-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          Start
        </button>
      ) : (
        <button onClick={stop} className="ml-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">
          End
        </button>
      )}
      <button onClick={() => setDest(null)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200">
        Clear
      </button>
    </div>
  );
}

export function PlaceBadge() {
  const place = useStore((s) => s.place);
  const mode = useStore((s) => s.mode);
  const stars = useStore((s) => s.stars);
  if (mode !== "toy" || !place?.district) return null;
  const district = DISTRICTS.find((d) => d.name === place.district);
  const progress = district ? districtProgress(district.id, new Set(stars)) : null;
  return (
    <div className="pointer-events-none rounded-full bg-slate-900/55 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
      {place.landmark ? `${place.landmark} · ${place.district}` : place.district}
      {progress && (
        <span className={`ml-2 font-bold ${progress.got === progress.total ? "text-emerald-300" : "text-amber-300"}`}>
          ★ {progress.got}/{progress.total} explored
        </span>
      )}
    </div>
  );
}
