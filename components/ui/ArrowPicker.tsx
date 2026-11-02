"use client";

import { PORTALS } from "@/lib/house/doors";
import { travelPortal } from "@/lib/house/travel";
import { useStore } from "@/lib/store";

/** Choose among stacked doorway arrows. */
export function ArrowPicker() {
  const ids = useStore((s) => s.arrowPicker);
  if (!ids?.length) return null;
  const items = ids.map((id) => PORTALS.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const close = () => useStore.getState().setArrowPicker(null);

  return (
    <div className="pointer-events-auto w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/95 shadow-2xl shadow-slate-900/25 ring-1 ring-black/10 backdrop-blur-xl animate-[panelIn_.15s_ease-out]">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-900">Choose a doorway</span>
        <button onClick={close} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="flex flex-col p-2">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              travelPortal(p);
              close();
            }}
            className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-amber-50"
          >
            <span className="mr-2 inline-block text-amber-500">➤</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
