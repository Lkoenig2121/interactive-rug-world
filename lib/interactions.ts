import { runtime } from "./runtime";
import { useStore, type Interaction } from "./store";
import { buildings, doorPoint } from "./world/buildings";
import { dist } from "./world/geometry";
import { interiors } from "./world/interiors";
import type { InteriorId, Vec2 } from "./world/types";

/** What the walker can do at their current spot in the city. */
export function worldWalkInteraction(p: Vec2): Interaction | null {
  const s = useStore.getState();
  for (const b of buildings) {
    if (!b.interior) continue;
    if (dist(p, doorPoint(b)) < (b.type === "gas" ? 0 : 4.5)) {
      return { label: `Enter ${b.name}`, action: () => s.enterInterior(b.id) };
    }
  }
  if (dist(p, runtime.car) < 4) return { label: "Get in the car", action: () => s.setDrive() };
  return null;
}

/** Parking near an enterable building lets the driver walk straight in. */
export function worldDriveInteraction(p: Vec2, speed: number): Interaction | null {
  if (Math.abs(speed) > 1.5) return null;
  const s = useStore.getState();
  for (const b of buildings) {
    if (!b.interior) continue;
    if (dist(p, doorPoint(b)) < 13) {
      return { label: `Park & enter ${b.name}`, action: () => s.enterInterior(b.id) };
    }
  }
  return null;
}

export function interiorInteraction(id: InteriorId, p: Vec2): Interaction | null {
  const def = interiors[id];
  const s = useStore.getState();
  const exit = { x: def.doorX, z: def.size.d / 2 };
  if (dist(p, exit) < 2) return { label: `Leave ${def.title}`, action: () => s.exitInterior() };
  for (const h of def.hotspots) {
    if (dist(p, h) < 1.9) {
      return {
        label: h.toggles && s.interiorToggles[h.id] ? `Undo: ${h.label}` : h.label[0].toUpperCase() + h.label.slice(1),
        action: () => {
          const st = useStore.getState();
          if (h.toggles) {
            const on = !st.interiorToggles[h.id];
            st.toggleInterior(h.id);
            st.setInteraction(null);
            if (on) st.showToast(h.message);
          } else st.showToast(h.message);
        },
      };
    }
  }
  return null;
}
