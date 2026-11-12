"use client";

import { EXT_Y } from "@/lib/house/layout";
import { useStore } from "@/lib/store";
import { landmarkById } from "@/lib/town/config";

/** Pin at the end of the route to the chosen town destination. */
export function TownRoute() {
  const points = useStore((s) => s.townRoute?.points);
  const destId = useStore((s) => s.townDestination);
  const dest = destId ? landmarkById[destId] : null;
  if (!points || points.length < 2 || !dest) return null;
  const end = points[points.length - 1];
  return (
    <group>
      <mesh position={[end.x, EXT_Y + 160, end.z]} rotation-x={Math.PI} raycast={() => null}>
        <coneGeometry args={[40, 90, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[end.x, EXT_Y + 40, end.z]} raycast={() => null}>
        <sphereGeometry args={[22, 12, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}
