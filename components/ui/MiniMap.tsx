"use client";

import { useEffect, useMemo, useRef } from "react";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { buildings, doorPoint, footprint, TYPE_COLORS } from "@/lib/world/buildings";
import { parkingLots, parks, ponds } from "@/lib/world/features";
import { ROAD_WIDTH, roadEdges, ROUNDABOUT, RUG } from "@/lib/world/roads";
import type { Vec2 } from "@/lib/world/types";

const toPath = (pts: Vec2[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.z.toFixed(2)}`).join(" ");

/** Live 2D map of the rug: roads, buildings, route, destination and the traveller. */
export function MiniMap({ className = "" }: { className?: string }) {
  const route = useStore((s) => s.route);
  const destinationId = useStore((s) => s.destinationId);
  const setDestination = useStore((s) => s.setDestination);
  const player = useRef<SVGGElement>(null);
  const car = useRef<SVGGElement>(null);

  const roads = useMemo(() => roadEdges.map((e) => ({ id: e.id, d: toPath(e.points) })), []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const mode = useStore.getState().mode;
      const p = mode === "drive" ? runtime.car : runtime.player;
      player.current?.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.z.toFixed(2)}) rotate(${((-p.yaw * 180) / Math.PI).toFixed(1)})`);
      const c = runtime.car;
      car.current?.setAttribute("transform", `translate(${c.x.toFixed(2)} ${c.z.toFixed(2)}) rotate(${((-c.yaw * 180) / Math.PI).toFixed(1)})`);
      car.current?.setAttribute("opacity", mode === "drive" ? "0" : "1");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const dest = destinationId ? buildings.find((b) => b.id === destinationId) : null;
  const destPt = dest ? doorPoint(dest) : null;
  const hw = RUG.width / 2;
  const hd = RUG.depth / 2;

  return (
    <svg viewBox={`${-hw} ${-hd} ${RUG.width} ${RUG.depth}`} className={`block w-full select-none ${className}`} role="img" aria-label="Map of Carpet World">
      <rect x={-hw} y={-hd} width={RUG.width} height={RUG.depth} rx={3} fill="#284b8f" />
      <rect x={-hw + RUG.border} y={-hd + RUG.border} width={RUG.width - RUG.border * 2} height={RUG.depth - RUG.border * 2} fill="#8cc06f" />
      {parks.map((p) => (
        <ellipse key={p.id} cx={p.x} cy={p.z} rx={p.rx} ry={p.rz} fill={p.id === "playground" ? "#e8cf9a" : "#a6d68a"} />
      ))}
      {ponds.map((p) => (
        <ellipse key={p.id} cx={p.x} cy={p.z} rx={p.rx} ry={p.rz} fill="#6db7e8" />
      ))}
      {parkingLots.map((l) => (
        <rect key={l.id} x={l.rect.minX} y={l.rect.minZ} width={l.rect.maxX - l.rect.minX} height={l.rect.maxZ - l.rect.minZ} fill="#c4c7cc" />
      ))}
      {roads.map((r) => (
        <path key={r.id} d={r.d} stroke="#ffffff" strokeWidth={ROAD_WIDTH + 2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {roads.map((r) => (
        <path key={`a${r.id}`} d={r.d} stroke="#b9bec6" strokeWidth={ROAD_WIDTH} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <circle cx={ROUNDABOUT.x} cy={ROUNDABOUT.z} r={ROUNDABOUT.island} fill="#8cc06f" stroke="#ffffff" strokeWidth={0.8} />
      {buildings.map((b) => {
        const r = footprint(b);
        const isDest = b.id === destinationId;
        return (
          <rect
            key={b.id}
            x={r.minX}
            y={r.minZ}
            width={r.maxX - r.minX}
            height={r.maxZ - r.minZ}
            rx={1}
            fill={TYPE_COLORS[b.type]}
            stroke={isDest ? "#ea4335" : "#ffffff"}
            strokeWidth={isDest ? 1.6 : 0.6}
            opacity={b.type === "house" ? 0.75 : 0.95}
            className="cursor-pointer transition-opacity hover:opacity-70"
            onClick={() => setDestination(b.id)}
          >
            <title>{`${b.name} – click to navigate`}</title>
          </rect>
        );
      })}
      {route && (
        <>
          <path d={toPath(route.points)} stroke="#1e40af" strokeWidth={4.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={toPath(route.points)} stroke="#4f8ff7" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {destPt && (
        <g transform={`translate(${destPt.x} ${destPt.z})`} pointerEvents="none">
          <path d="M0 0 C -4 -5 -5 -7 -5 -9.5 A 5 5 0 1 1 5 -9.5 C 5 -7 4 -5 0 0 Z" fill="#ea4335" stroke="#ffffff" strokeWidth={0.8} />
          <circle cx={0} cy={-9.5} r={1.8} fill="#7f1d1d" />
        </g>
      )}
      <g ref={car} pointerEvents="none">
        <rect x={-1.6} y={-2.6} width={3.2} height={5.2} rx={0.8} fill="#e11d48" stroke="#ffffff" strokeWidth={0.6} />
      </g>
      <g ref={player} pointerEvents="none">
        <circle r={7} fill="#3b82f6" opacity={0.18} />
        <path d="M0 -6 L4 4 L0 2 L-4 4 Z" fill="#2563eb" stroke="#ffffff" strokeWidth={1} strokeLinejoin="round" />
      </g>
    </svg>
  );
}
