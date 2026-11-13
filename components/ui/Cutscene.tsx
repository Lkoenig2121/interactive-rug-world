"use client";

import { useEffect } from "react";
import { FRIENDS, friendById } from "@/lib/explore/friends";
import { useStore } from "@/lib/store";

const LENGTH_MS = 4200;

/** Letterbox and name card shown while the camera circles a newly found toy friend. */
export function Cutscene() {
  const cutscene = useStore((s) => s.cutscene);
  const found = useStore((s) => s.friends.length);
  const end = useStore((s) => s.endCutscene);

  useEffect(() => {
    if (!cutscene) return;
    const id = window.setTimeout(() => useStore.getState().endCutscene(), LENGTH_MS);
    return () => window.clearTimeout(id);
  }, [cutscene]);

  const friend = cutscene ? friendById[cutscene.friendId] : null;
  const open = !!friend;
  return (
    <div className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} aria-hidden={!open}>
      <div className={`absolute inset-x-0 top-0 h-[11vh] bg-black transition-transform duration-500 ${open ? "translate-y-0" : "-translate-y-full"}`} />
      <div className={`absolute inset-x-0 bottom-0 h-[11vh] bg-black transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-full"}`} />
      {friend && (
        <button
          onClick={end}
          className="pointer-events-auto absolute bottom-[13vh] left-1/2 w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl bg-white/90 px-5 py-4 text-center shadow-2xl ring-2 ring-emerald-400/70 backdrop-blur-xl animate-[panelIn_.35s_ease-out]"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">New friend!</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{friend.name}</div>
          <p className="mt-1 text-sm leading-snug text-slate-600">{friend.line}</p>
          <div className="mt-3 text-[11px] font-semibold text-slate-500">
            Friends found {found}/{FRIENDS.length} · bring them home to Andy&apos;s room
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Click or press Space to continue</div>
        </button>
      )}
    </div>
  );
}
