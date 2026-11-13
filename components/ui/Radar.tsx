"use client";

import { useEffect, useRef } from "react";
import { CAR_HALF, carLocal } from "@/lib/explore/living";
import { STARS } from "@/lib/explore/stars";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

/** Radar radius in world units (30 m). */
const RANGE = 3000;
const SIZE = 168;
/** Stars more than this far above or below get a ▲ / ▼ marker. */
const LEVEL = 250;
/** A car this close (and lined up with you) flashes red. */
const DANGER = 1500;

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** Heading-up radar of the 30 m around the toy, showing nearby stars (toy mode only). */
export function Radar() {
  const mode = useStore((s) => s.mode);
  const inSpace = useStore((s) => s.inSpace);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || mode !== "toy" || inSpace) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = SIZE * dpr;
    el.height = SIZE * dpr;
    ctx.scale(dpr, dpr);
    const c = SIZE / 2;
    const R = c - 6;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const t = runtime.toy;
      const collected = new Set(useStore.getState().stars);
      // Screen up is where the camera looks.
      const cy = runtime.toy.camYaw;
      const fwd = { x: -Math.sin(cy), z: -Math.cos(cy) };
      const right = { x: Math.cos(cy), z: -Math.sin(cy) };
      const toScreen = (x: number, z: number) => {
        const dx = x - t.x;
        const dz = z - t.z;
        return { sx: ((dx * right.x + dz * right.z) / RANGE) * R, sy: (-(dx * fwd.x + dz * fwd.z) / RANGE) * R };
      };

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fill();
      ctx.clip();

      // Range rings every 10 m and a faint cross.
      ctx.strokeStyle = "rgba(148, 211, 255, 0.22)";
      ctx.lineWidth = 1;
      for (const m of [1, 2, 3]) {
        ctx.beginPath();
        ctx.arc(c, c, (R * m) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(c - R, c);
      ctx.lineTo(c + R, c);
      ctx.moveTo(c, c - R);
      ctx.lineTo(c, c + R);
      ctx.stroke();

      // Sweep.
      const sweep = (performance.now() / 1000) * 1.6;
      const grad = ctx.createConicGradient(sweep - Math.PI / 3, c, c);
      grad.addColorStop(0, "rgba(94, 234, 212, 0)");
      grad.addColorStop(1 / 6, "rgba(94, 234, 212, 0.18)");
      grad.addColorStop(1 / 6 + 0.001, "rgba(94, 234, 212, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
      const now = performance.now() / 1000;

      // Traffic: small boxes pointing the way they drive; red and flashing when one is coming straight at you.
      const ex = runtime.explore;
      const riding = t.mount === "ride" && t.ride === "hitch" ? ex.rides.hitch.car : -1;
      const carL = ((CAR_HALF.l * 2) / RANGE) * R;
      const carW = Math.max(3, ((CAR_HALF.w * 2) / RANGE) * R);
      ex.traffic.forEach((car, i) => {
        if (Math.hypot(car.x - t.x, car.z - t.z) > RANGE + CAR_HALF.l) return;
        const p = toScreen(car.x, car.z);
        const f = { x: Math.sin(car.yaw), z: Math.cos(car.yaw) };
        const angle = Math.atan2(-(f.x * fwd.x + f.z * fwd.z), f.x * right.x + f.z * right.z);
        const q = carLocal(car, t);
        const danger = i !== riding && q.along > 0 && q.along < DANGER && Math.abs(q.across) < CAR_HALF.w + 160;
        ctx.save();
        ctx.translate(c + p.sx, c + p.sy);
        ctx.rotate(angle);
        ctx.fillStyle = i === riding ? "#5eead4" : danger ? (Math.sin(now * 14) > 0 ? "#f87171" : "#fecaca") : "rgba(226, 232, 240, 0.85)";
        ctx.fillRect(-carL / 2, -carW / 2, carL, carW);
        // Windscreen notch at the front.
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.fillRect(carL / 2 - 3, -carW / 2 + 1, 2, carW - 2);
        ctx.restore();
      });

      // Neighbors: people in blue, the kids' bikes in green, the dog in brown.
      const dots: [{ x: number; z: number } | null, string, number][] = [
        [ex.people.mail, "#60a5fa", 3.5],
        [ex.people.walker, "#60a5fa", 3.5],
        [ex.people.kids, "#4ade80", 3.5],
        [ex.people.dog, "#d4a373", 2.5],
      ];
      for (const [pos, color, r] of dots) {
        if (!pos || Math.hypot(pos.x - t.x, pos.z - t.z) > RANGE) continue;
        const p = toScreen(pos.x, pos.z);
        ctx.beginPath();
        ctx.arc(c + p.sx, c + p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Stars inside the range: gold if still to find, dim outline once collected.
      for (const s of STARS) {
        if (Math.hypot(s.x - t.x, s.z - t.z) > RANGE) continue;
        const p = toScreen(s.x, s.z);
        const x = c + p.sx;
        const y = c + p.sy;
        const got = collected.has(s.id);
        starPath(ctx, x, y, got ? 5 : 7);
        if (got) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = "#fcd34d";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        const dy = s.y - t.y;
        if (Math.abs(dy) > LEVEL) {
          ctx.fillStyle = "#fde68a";
          ctx.font = "bold 8px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(dy > 0 ? "▲" : "▼", x, y - 9);
        }
      }

      // World event: a pulsing orange dot when it's in range.
      const e = useStore.getState().worldEvent;
      const eDist = e ? Math.hypot(e.x - t.x, e.z - t.z) : Infinity;
      const pulse = 0.5 + 0.5 * Math.sin(now * 5);
      if (e && eDist <= RANGE) {
        const p = toScreen(e.x, e.z);
        ctx.beginPath();
        ctx.arc(c + p.sx, c + p.sy, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 140, 66, ${0.25 + 0.2 * (1 - pulse)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c + p.sx, c + p.sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff8c42";
        ctx.fill();
        ctx.strokeStyle = "#fff7ed";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Out of range: an arrow on the rim pointing toward the event, with its distance.
      if (e && eDist > RANGE) {
        const p = toScreen(e.x, e.z);
        const a = Math.atan2(p.sy, p.sx);
        const rim = R - 4;
        ctx.save();
        ctx.translate(c + Math.cos(a) * rim, c + Math.sin(a) * rim);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fillStyle = "#ff8c42";
        ctx.globalAlpha = 0.7 + 0.3 * pulse;
        ctx.fill();
        ctx.restore();
        const lx = c + Math.cos(a) * (rim - 16);
        const ly = c + Math.sin(a) * (rim - 16);
        ctx.font = "bold 9px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
        const label = `${Math.round(eDist / 100)} m`;
        ctx.strokeText(label, lx, ly);
        ctx.fillStyle = "#fed7aa";
        ctx.fillText(label, lx, ly);
      }

      // North marker on the rim.
      const n = toScreen(t.x, t.z - RANGE);
      const nl = Math.hypot(n.sx, n.sy) || 1;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", c + (n.sx / nl) * (R - 9), c + (n.sy / nl) * (R - 9));

      // The toy, pointing where it faces relative to the camera.
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(cy - t.yaw);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fillStyle = "#5eead4";
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [mode, inSpace]);

  if (mode !== "toy" || inSpace) return null;
  return (
    <div className="pointer-events-none flex flex-col items-center gap-1">
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} />
      <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold text-white/80">Radar · 30 m</span>
      <span className="flex gap-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[9px] font-semibold text-white/75">
        <span className="text-amber-300">★ star</span>
        <span className="text-slate-200">▬ car</span>
        <span className="text-sky-400">● people</span>
        <span className="text-orange-400">● event</span>
      </span>
    </div>
  );
}
