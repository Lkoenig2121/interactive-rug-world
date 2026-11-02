"use client";

import { Html } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { buildingHeight, destinations, TYPE_COLORS } from "@/lib/world/buildings";
import { ponds } from "@/lib/world/features";

/** Google-Maps style landmark labels, shown on the overhead map. */
export function MapLabels() {
  const mode = useStore((s) => s.mode);
  const destinationId = useStore((s) => s.destinationId);
  if (mode !== "overhead") return null;
  return (
    <group>
      {destinations
        .filter((b) => b.id !== destinationId)
        .map((b) => (
          <Html key={b.id} position={[b.x, buildingHeight(b) + 3, b.z]} center zIndexRange={[10, 0]}>
            <button
              onClick={() => useStore.getState().select({ kind: "building", id: b.id })}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 py-0.5 pl-1 pr-2.5 text-[11px] font-semibold text-slate-800 shadow-md ring-1 ring-black/5 transition hover:scale-105"
            >
              <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: TYPE_COLORS[b.type] }} />
              {b.name}
            </button>
          </Html>
        ))}
      {ponds.map((p) => (
        <Html key={p.id} position={[p.x, 1, p.z]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap text-[11px] font-medium italic text-sky-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">{p.name}</span>
        </Html>
      ))}
    </group>
  );
}
