"use client";

import { useEffect, useState } from "react";
import { BOSS_HP, LAUNCH_TIME } from "@/lib/explore/space";
import { STARS_FOR_SKY, STARS_FOR_SPACE } from "@/lib/explore/sky";
import { STARS } from "@/lib/explore/stars";
import { hopOff } from "@/lib/explore/interact";
import { EXT_Y } from "@/lib/house/layout";
import { groundHeight } from "@/lib/house/walkable";
import { runtime } from "@/lib/runtime";
import { spaceUnlocked, useStore } from "@/lib/store";
import { chase, sunnyObjective, useSunny } from "@/lib/explore/sunnyside";
import { insideLandmark, landmarkById } from "@/lib/town/config";

/** Re-renders `ms` times a second with a snapshot of the mutable runtime state. */
function useRuntime<T>(read: () => T, ms = 100) {
  const [v, setV] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => setV(read()), ms);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return v;
}

const WEATHER_ICON: Partial<Record<string, string>> = { rain: "☂", wind: "༄", snow: "❄" };

function clockLabel(dayTime: number) {
  const h = ((dayTime + 0.5) % 1) * 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Stars, jetpack fuel, time of day and the ring-course timer, for toy mode. */
export function ExploreStatus() {
  const mode = useStore((s) => s.mode);
  const toy = useStore((s) => s.toy);
  const stars = useStore((s) => s.stars);
  const missionId = useStore((s) => s.missionId);
  const inSpace = useStore((s) => s.inSpace);
  const isNight = useStore((s) => s.isNight);
  const snap = useRuntime(() => ({
    fuel: runtime.toy.fuel,
    flying: runtime.toy.mount === "fly",
    gliding: runtime.toy.gliding,
    day: runtime.explore.dayTime,
    weather: runtime.explore.weather.kind,
    boating: runtime.toy.boating,
    ring: runtime.explore.ring.active ? { next: runtime.explore.ring.next, t: runtime.town.clock - runtime.explore.ring.start } : null,
    hearts: runtime.explore.space.hearts,
    boss: runtime.explore.space.bossHp,
  }));
  if (mode !== "toy") return null;
  const n = stars.length;
  const nextGoal = n < STARS_FOR_SKY ? `${STARS_FOR_SKY - n} more for the sky-dome jetpack` : !spaceUnlocked({ missionId, stars }) ? `${STARS_FOR_SPACE - n} more to fuel the rocket` : "Rocket ready at Pizza Planet";

  return (
    <div className="pointer-events-none flex w-60 flex-col gap-2 rounded-2xl bg-slate-900/70 p-3 text-white shadow-xl backdrop-blur">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>
          <span className="text-amber-300">★</span> {n} / {STARS.length} stars
        </span>
        {!inSpace && (
          <span className="text-xs font-semibold text-white/80">
            {WEATHER_ICON[snap.weather] ?? (isNight ? "☾" : "☀")} {clockLabel(snap.day)}
          </span>
        )}
      </div>
      <div className="text-[11px] leading-snug text-white/70">{nextGoal}</div>
      {toy === "ranger" && (
        <div>
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-white/80">
            <span>Jetpack {snap.flying ? (snap.gliding ? "· gliding" : "· flying") : ""}</span>
            <span>{Math.round(snap.fuel * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${snap.fuel < 0.2 ? "bg-red-400" : snap.fuel < 0.5 ? "bg-amber-300" : "bg-emerald-400"}`}
              style={{ width: `${Math.max(0, snap.fuel) * 100}%` }}
            />
          </div>
        </div>
      )}
      {toy !== "ranger" && snap.gliding && <div className="text-[11px] font-semibold text-sky-200">Paper glider out!</div>}
      {snap.boating && <div className="text-[11px] font-semibold text-sky-200">Sailing a paper boat!</div>}
      {snap.ring && (
        <div className="rounded-lg bg-sky-500/30 px-2 py-1 text-xs font-bold">
          Rings {snap.ring.next}/12 · {snap.ring.t.toFixed(1)} s
        </div>
      )}
      {inSpace && (
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={i < snap.hearts ? "text-rose-400" : "text-white/20"}>
                ♥
              </span>
            ))}
          </div>
          {snap.boss > 0 && !useStore.getState().bossDefeated && (
            <div>
              <div className="mb-1 text-[11px] font-semibold text-fuchsia-200">Baron Voltrix</div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-fuchsia-400" style={{ width: `${(snap.boss / BOSS_HP) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Current world event with a button that teleports the toy there. */
export function EventChip() {
  const mode = useStore((s) => s.mode);
  const e = useStore((s) => s.worldEvent);
  const inSpace = useStore((s) => s.inSpace);
  const left = useRuntime(() => {
    const ev = useStore.getState().worldEvent;
    return ev ? Math.max(0, Math.ceil(ev.start + ev.duration - runtime.town.clock)) : 0;
  }, 250);
  // Once the timer runs out the event is over, even if the scene hasn't caught up yet.
  useEffect(() => {
    const s = useStore.getState();
    if (mode !== "toy" || !e || left > 0 || s.worldEvent !== e || runtime.town.clock < e.start + e.duration) return;
    s.setWorldEvent(null);
  }, [mode, e, left]);
  const secs = e ? Math.ceil(e.start + e.duration - runtime.town.clock) : 0;
  if (mode !== "toy" || !e || inSpace || secs <= 0) return null;
  const go = () => {
    const s = useStore.getState();
    const t = runtime.toy;
    if (t.mount === "ride") hopOff();
    // Land beside the beacon (behind the truck for garbage day) rather than on top of it.
    const truck = runtime.explore.rides.truck;
    const spot = e.kind === "garbage" && truck.active ? { x: truck.x - Math.sin(truck.yaw) * 250, z: truck.z - Math.cos(truck.yaw) * 250 } : { x: e.x + 260, z: e.z + 260 };
    const yaw = Math.atan2(spot.x - e.x, spot.z - e.z);
    s.teleportToy({ x: spot.x, y: groundHeight(spot.x, spot.z, EXT_Y + 10), z: spot.z }, yaw, e.title);
  };
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-orange-500 py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white shadow-xl shadow-orange-500/30">
      <span>
        {e.title} <span className="text-white/75">· {secs}s</span>
      </span>
      <button onClick={go} className="rounded-full bg-white/25 px-3 py-1 text-xs hover:bg-white/35">
        Go
      </button>
    </div>
  );
}

/** Sunnyside quest objective, shown while the toy is in the daycare (or chasing the bear). */
export function SunnysideChip() {
  const mode = useStore((s) => s.mode);
  const stage = useSunny((s) => s.stage);
  const outfits = useSunny((s) => s.outfits);
  const inside = useRuntime(() => insideLandmark(landmarkById.daycare, runtime.toy, 200), 400);
  const hits = useRuntime(() => chase.hits, 200);
  if (mode !== "toy" || (!inside && stage !== "chase")) return null;
  const text = sunnyObjective(stage, outfits);
  if (!text) return <div className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-xl">Sunnyside is free! ★</div>;
  return (
    <div className="flex max-w-md items-center gap-2 rounded-full bg-fuchsia-600 py-1.5 pl-3 pr-4 text-sm font-semibold text-white shadow-xl shadow-fuchsia-600/30" data-hits={hits}>
      <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] uppercase tracking-wider">Sunnyside</span>
      <span className="leading-tight">{text}</span>
    </div>
  );
}

/** Big countdown while the rocket lifts off. */
export function LaunchCountdown() {
  const launching = useStore((s) => s.launching);
  const age = useRuntime(() => (runtime.explore.launchAt === null ? -1 : runtime.town.clock - runtime.explore.launchAt), 100);
  if (!launching || age < 0) return null;
  const count = Math.ceil(5 - age);
  const label = count > 0 ? String(count) : age < LAUNCH_TIME ? "LIFTOFF!" : "";
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">{label}</div>
    </div>
  );
}
