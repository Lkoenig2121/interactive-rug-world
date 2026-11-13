"use client";

import { useEffect, useRef } from "react";
import { STARS } from "@/lib/explore/stars";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";

/** Radar radius in world units (30 m). */
const RANGE = 3000;
const SIZE = 168;
/** Stars more than this far above or below get a ▲ / ▼ marker. */
const LEVEL = 250;

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
      ctx.restore();

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
    </div>
  );
}
