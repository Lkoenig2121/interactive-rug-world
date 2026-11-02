"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { buildingById, TYPE_COLORS, TYPE_LABELS } from "@/lib/world/buildings";
import { edgeById, roadEdges } from "@/lib/world/roads";
import { Icon } from "./Icon";

const BuildingPreview = dynamic(() => import("./BuildingPreview").then((m) => m.BuildingPreview), { ssr: false });

function Card({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="pointer-events-auto relative w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/90 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 backdrop-blur-xl animate-[panelIn_.25s_ease-out]">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 shadow ring-1 ring-black/5 transition hover:text-slate-900"
        aria-label="Close"
      >
        <Icon name="x" className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

function PrimaryButton({ onClick, children, icon }: { onClick: () => void; children: React.ReactNode; icon: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[.98]"
    >
      <Icon name={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children, icon }: { onClick: () => void; children: React.ReactNode; icon: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[.98]"
    >
      <Icon name={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

/** Details for the selected building, road or location in the room / overhead views. */
export function InfoPanel() {
  const selection = useStore((s) => s.selection);
  const mode = useStore((s) => s.mode);
  const select = useStore((s) => s.select);
  const enterWorld = useStore((s) => s.enterWorld);
  const setDestination = useStore((s) => s.setDestination);
  const startNavigation = useStore((s) => s.startNavigation);
  if (!selection || (mode !== "room" && mode !== "overhead")) return null;
  const close = () => select(null);

  if (selection.kind === "building") {
    const b = buildingById[selection.id];
    if (!b) return null;
    const navigate = () => {
      setDestination(b.id);
      select(null);
      if (mode === "overhead") useStore.getState().setNavPanelOpen(true);
    };
    return (
      <Card onClose={close}>
        <div className="h-40 w-full bg-slate-100">
          <BuildingPreview b={b} />
        </div>
        <div className="space-y-3 p-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[b.type] }} />
              {TYPE_LABELS[b.type]}
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{b.name}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
              <Icon name="pin" className="h-3.5 w-3.5" /> {b.district}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{b.description}</p>
          {b.interior && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
              <Icon name="door" className="h-3.5 w-3.5" /> Interior you can walk around in
            </p>
          )}
          <div className="flex gap-2">
            <PrimaryButton icon="enter" onClick={() => enterWorld({ buildingId: b.id })}>
              <span className="truncate">Enter {b.name}</span>
            </PrimaryButton>
          </div>
          <div className="flex gap-2">
            <SecondaryButton icon="nav" onClick={navigate}>
              Directions
            </SecondaryButton>
            {mode === "overhead" && (
              <SecondaryButton
                icon="walk"
                onClick={() => {
                  setDestination(b.id);
                  startNavigation();
                }}
              >
                Go now
              </SecondaryButton>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (selection.kind === "road") {
    const e = edgeById[selection.edgeId];
    const total = roadEdges.filter((r) => r.name === e.name).reduce((a, r) => a + r.length, 0);
    return (
      <Card onClose={close}>
        <div className="space-y-3 p-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Icon name="road" className="h-3.5 w-3.5" /> {e.kind === "roundabout" ? "Roundabout" : "Road"}
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{e.name}</h2>
            <p className="text-sm text-slate-500">
              {Math.round(total)} m of two-lane road · {e.kind === "ring" ? "Ring road" : e.kind === "avenue" ? "Main avenue" : "Local street"}
            </p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton icon="walk" onClick={() => enterWorld({ at: selection.point, mode: "walk" })}>
              Walk here
            </PrimaryButton>
            <SecondaryButton icon="car" onClick={() => enterWorld({ at: selection.point, mode: "drive" })}>
              Drive here
            </SecondaryButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card onClose={close}>
      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Icon name="pin" className="h-3.5 w-3.5" /> Dropped pin
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Carpet World</h2>
          <p className="font-mono text-xs text-slate-500">
            {selection.point.x.toFixed(1)}, {selection.point.z.toFixed(1)}
          </p>
        </div>
        <p className="text-sm text-slate-600">Jump into the miniature city at this spot. Tip: double-click anywhere on the rug to enter instantly.</p>
        <div className="flex gap-2">
          <PrimaryButton icon="enter" onClick={() => enterWorld({ at: selection.point })}>
            Enter here
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}
